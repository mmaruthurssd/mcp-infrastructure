/**
 * Prepare Task Executor Handoff Tool
 *
 * Prepares task workflow for Task Executor MCP with ready-to-execute tool call
 */

import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { ParallelizationAnalyzer } from 'workflow-orchestrator-mcp-server/dist/core/parallelization-analyzer.js';

export interface PrepareTaskExecutorHandoffInput {
  projectPath: string;
  goalId: string;
}

export interface TaskSuggestion {
  description: string;
  estimatedHours?: number;
}

export interface AgentAssignment {
  taskIndex: number;
  taskDescription: string;
  recommendedAgent: string;
  reasoning: string;
  alternatives?: Array<{
    agent: string;
    score: number;
    reason: string;
  }>;
}

export interface PrepareTaskExecutorHandoffResult {
  success: boolean;
  goalName: string;
  workflowName: string;
  tasks: TaskSuggestion[];
  agentAssignments?: AgentAssignment[];
  parallelizationAnalysis?: {
    shouldParallelize: boolean;
    estimatedSpeedup: number;
    mode: 'parallel' | 'sequential';
    reasoning: string;
  };
  suggestedToolCall: {
    tool: string;
    params: any;
  };
  message: string;
}

export class PrepareTaskExecutorHandoffTool {
  static async execute(input: PrepareTaskExecutorHandoffInput): Promise<PrepareTaskExecutorHandoffResult> {
    const { projectPath, goalId } = input;

    // Read state
    const state = StateManager.read(projectPath);
    if (!state) {
      return {
        success: false,
        goalName: '',
        workflowName: '',
        tasks: [],
        suggestedToolCall: {
          tool: '',
          params: {},
        },
        message: 'No orchestration state found',
      };
    }

    // Try multiple paths for SELECTED-GOALS.md
    const possiblePaths = [
      path.join(projectPath, 'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md'),
      path.join(projectPath, '02-goals-and-roadmap/selected-goals/SELECTED-GOALS.md'),
      path.join(projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md'),
    ];

    let selectedGoalsFile: string | undefined;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        selectedGoalsFile = filePath;
        break;
      }
    }

    if (!selectedGoalsFile) {
      return {
        success: false,
        goalName: '',
        workflowName: '',
        tasks: [],
        suggestedToolCall: {
          tool: '',
          params: {},
        },
        message: 'No SELECTED-GOALS.md file found',
      };
    }

    // Parse the SELECTED-GOALS.md file
    const goalData = this.parseGoalFromMarkdown(selectedGoalsFile, goalId);
    if (!goalData) {
      return {
        success: false,
        goalName: '',
        workflowName: '',
        tasks: [],
        suggestedToolCall: {
          tool: '',
          params: {},
        },
        message: `No goal found matching ID: ${goalId}`,
      };
    }

    const goalFolder = `goal-${goalId}`;
    const goalName = goalData.name;

    // Check if specification exists
    const specDir = path.dirname(selectedGoalsFile!);
    const specPath = path.join(specDir, `goal-${goalId}`, 'spec/specification.md');
    const hasSpec = fs.existsSync(specPath);

    // Extract tasks from specification or create generic tasks
    const tasks = hasSpec
      ? this.extractTasksFromSpec(specPath)
      : this.createGenericTasks(goalFolder);

    // Generate workflow name
    const workflowName = `${goalFolder}-implementation`;

    // Analyze parallelization opportunity
    const analyzer = new ParallelizationAnalyzer({
      enabled: true,
      minSpeedupThreshold: 1.5,
      maxParallelAgents: 3,
      executionStrategy: 'conservative',
      autoExecute: false,
    });

    // Convert tasks to format expected by analyzer
    const analysisTasks = tasks.map((t, index) => ({
      id: `task-${index + 1}`,
      description: t.description,
      estimatedMinutes: (t.estimatedHours || 1) * 60,
    }));

    // Run parallelization analysis (using fallback heuristic since MCP tools not available in tool context)
    const analysis = analyzer['fallbackHeuristic'](analysisTasks);

    // Suggest agents for each task
    const agentAssignments = await this.suggestAgentsForTasks(tasks);

    // Build suggested tool call
    const suggestedToolCall = {
      tool: 'mcp__task-executor__create_workflow',
      params: {
        name: workflowName,
        projectPath: projectPath,
        tasks: tasks.map(t => ({
          description: t.description,
          estimatedHours: t.estimatedHours,
        })),
        context: {
          category: 'feature',
          phiHandling: false,
        },
      },
    };

    // Update integration tracking
    if (!state.integrations.taskExecutor.activeWorkflows.includes(workflowName)) {
      state.integrations.taskExecutor.activeWorkflows.push(workflowName);
      state.integrations.taskExecutor.lastCreated = new Date().toISOString();
      state.integrations.taskExecutor.totalWorkflowsCreated =
        (state.integrations.taskExecutor.totalWorkflowsCreated || 0) + 1;
      StateManager.write(projectPath, state);
    }

    return {
      success: true,
      goalName: goalFolder,
      workflowName,
      tasks,
      agentAssignments: agentAssignments.length > 0 ? agentAssignments : undefined,
      parallelizationAnalysis: {
        shouldParallelize: analysis.shouldParallelize,
        estimatedSpeedup: analysis.estimatedSpeedup,
        mode: analysis.mode,
        reasoning: analysis.reasoning,
      },
      suggestedToolCall,
      message: `Task Executor handoff prepared for goal: ${goalFolder}${
        analysis.shouldParallelize ? ` (parallelization possible: ${analysis.estimatedSpeedup.toFixed(1)}x speedup)` : ''
      }${agentAssignments.length > 0 ? ` with ${agentAssignments.length} agent suggestions` : ''}`,
    };
  }

  /**
   * Extract tasks from specification file
   */
  private static extractTasksFromSpec(specPath: string): TaskSuggestion[] {
    const content = fs.readFileSync(specPath, 'utf8');
    const tasks: TaskSuggestion[] = [];

    // Look for task sections (common patterns in specs)
    const taskPatterns = [
      /## Implementation Tasks[\s\S]*?(?=##|$)/i,
      /## Tasks[\s\S]*?(?=##|$)/i,
      /## Implementation Plan[\s\S]*?(?=##|$)/i,
      /## Development Steps[\s\S]*?(?=##|$)/i,
    ];

    let taskSection = '';
    for (const pattern of taskPatterns) {
      const match = content.match(pattern);
      if (match) {
        taskSection = match[0];
        break;
      }
    }

    if (taskSection) {
      // Extract numbered or bulleted tasks
      const taskLines = taskSection.split('\n').filter(line => {
        return /^\s*[-*\d]+[.)]\s+/.test(line);
      });

      taskLines.forEach(line => {
        const cleaned = line.replace(/^\s*[-*\d]+[.)]\s+/, '').trim();
        if (cleaned.length > 10) {
          tasks.push({ description: cleaned });
        }
      });
    }

    // If no tasks found in spec, create generic implementation tasks
    if (tasks.length === 0) {
      return this.createGenericTasks('goal');
    }

    return tasks.slice(0, 20); // Limit to 20 tasks
  }

  /**
   * Create generic implementation tasks
   */
  private static createGenericTasks(goalName: string): TaskSuggestion[] {
    return [
      { description: `Review ${goalName} specification and requirements`, estimatedHours: 1 },
      { description: 'Design implementation approach', estimatedHours: 2 },
      { description: 'Create data models and types', estimatedHours: 3 },
      { description: 'Implement core functionality', estimatedHours: 8 },
      { description: 'Add error handling and validation', estimatedHours: 2 },
      { description: 'Write unit tests', estimatedHours: 3 },
      { description: 'Integration testing', estimatedHours: 2 },
      { description: 'Update documentation', estimatedHours: 1 },
      { description: 'Code review and refinement', estimatedHours: 2 },
      { description: 'Deploy and verify', estimatedHours: 1 },
    ];
  }

  /**
   * Suggest agents for tasks using agent-coordinator logic
   * Implements graceful degradation if agent-coordinator is not available
   */
  private static async suggestAgentsForTasks(tasks: TaskSuggestion[]): Promise<AgentAssignment[]> {
    const assignments: AgentAssignment[] = [];

    try {
      // Try to load agent registry (same logic as agent-coordinator)
      const registryPath = this.findAgentRegistry();
      if (!registryPath) {
        // Graceful degradation: return empty array
        return assignments;
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

      // Process each task
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const suggestion = this.suggestAgentForTask(task.description, registry);

        assignments.push({
          taskIndex: i,
          taskDescription: task.description,
          recommendedAgent: suggestion.recommended_agent,
          reasoning: suggestion.reasoning,
          alternatives: suggestion.alternatives,
        });
      }

      return assignments;
    } catch (error) {
      // Graceful degradation: log error and return empty array
      console.warn('Agent suggestion unavailable:', error instanceof Error ? error.message : String(error));
      return assignments;
    }
  }

  /**
   * Find agent registry file
   * Searches in standard locations
   */
  private static findAgentRegistry(): string | null {
    const possiblePaths = [
      // Current dev instance
      path.join(__dirname, '../../agents.json'),
      // Agent coordinator dev instance
      '/Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/agent-coordinator-mcp-server-project/04-product-under-development/dev-instance/agents.json',
      // Agent coordinator local instance
      '/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/agent-coordinator-mcp-server/agents.json',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  /**
   * Parse goal from SELECTED-GOALS.md markdown file
   */
  private static parseGoalFromMarkdown(
    filePath: string,
    goalId: string
  ): { name: string; description: string } | null {
    const content = fs.readFileSync(filePath, 'utf8');

    // Match goal sections with "Goal XX:" pattern
    const goalPattern = new RegExp(
      `### Goal ${goalId}:?\\s*([^\\n]+)[\\s\\S]*?` + // Goal title
      `(?:\\*\\*Description:\\*\\*\\s*([^\\n]+(?:\\n(?!\\*\\*)[^\\n]+)*))?`, // Description (optional multiline)
      'i'
    );

    const match = content.match(goalPattern);
    if (!match) {
      return null;
    }

    const [, name, description] = match;

    return {
      name: name ? name.trim() : `Goal ${goalId}`,
      description: description ? description.trim() : name ? name.trim() : `Goal ${goalId}`,
    };
  }

  /**
   * Suggest best agent for a task (adapted from agent-coordinator)
   * Uses keyword-based scoring algorithm
   */
  private static suggestAgentForTask(
    taskDescription: string,
    registry: Record<string, any>
  ): {
    recommended_agent: string;
    reasoning: string;
    alternatives?: Array<{ agent: string; score: number; reason: string }>;
  } {
    const taskLower = taskDescription.toLowerCase();

    // Score each agent based on keyword matching
    const scores: Array<{ agent: string; score: number; reason: string }> = [];

    for (const [agentName, definition] of Object.entries(registry)) {
      let score = 0;
      const reasons: string[] = [];

      // Check task description against agent description
      const descWords = (definition as any).description.toLowerCase().split(/\s+/);
      for (const word of descWords) {
        if (word.length > 3 && taskLower.includes(word)) {
          score += 5;
          reasons.push(`description contains '${word}'`);
        }
      }

      // Keyword-based scoring
      const keywords: Record<string, string[]> = {
        'backend-code': ['api', 'endpoint', 'server', 'database', 'backend', 'business logic', 'service'],
        'frontend-code': ['ui', 'component', 'react', 'vue', 'frontend', 'interface', 'page', 'form'],
        'testing': ['test', 'coverage', 'qa', 'quality', 'validation', 'e2e', 'integration'],
        'research': ['research', 'document', 'find', 'search', 'investigate', 'explore'],
        'design': ['design', 'architecture', 'spec', 'specification', 'prd', 'interface'],
        'review': ['review', 'audit', 'check', 'security', 'style', 'lint'],
        'documentation': ['document', 'readme', 'guide', 'docs', 'changelog', 'adr'],
      };

      const specialization = (definition as any).specialization;
      const specKeywords = keywords[specialization] || [];
      for (const keyword of specKeywords) {
        if (taskLower.includes(keyword)) {
          score += 10;
          reasons.push(`task mentions '${keyword}'`);
        }
      }

      scores.push({
        agent: agentName,
        score,
        reason: reasons.slice(0, 3).join('; ') || 'no strong match',
      });
    }

    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      return {
        recommended_agent: 'general-agent',
        reasoning: 'No agents found in registry',
        alternatives: [],
      };
    }

    const topAgent = scores[0];

    if (topAgent.score === 0) {
      return {
        recommended_agent: topAgent.agent,
        reasoning: `No strong match found. Defaulting to '${topAgent.agent}' as fallback.`,
        alternatives: scores.slice(1, 4),
      };
    }

    return {
      recommended_agent: topAgent.agent,
      reasoning: `Best match: ${topAgent.reason} (score: ${topAgent.score})`,
      alternatives: scores.slice(1, 4),
    };
  }

  static formatResult(result: PrepareTaskExecutorHandoffResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  TASK EXECUTOR MCP HANDOFF\n';
    output += '='.repeat(70) + '\n\n';

    if (!result.success) {
      output += `❌ ${result.message}\n`;
      return output;
    }

    output += `✅ ${result.message}\n\n`;
    output += `🎯 Goal: ${result.goalName}\n`;
    output += `📋 Workflow: ${result.workflowName}\n`;
    output += `📊 Tasks: ${result.tasks.length} tasks identified\n`;

    // Add parallelization analysis if available
    if (result.parallelizationAnalysis) {
      const pa = result.parallelizationAnalysis;
      output += `\n⚡ PARALLELIZATION ANALYSIS\n`;
      output += `   Mode: ${pa.mode.toUpperCase()}\n`;
      output += `   Speedup: ${pa.estimatedSpeedup.toFixed(1)}x\n`;
      output += `   Recommendation: ${pa.shouldParallelize ? '✅ Parallelize' : '❌ Sequential'}\n`;
      output += `   Reasoning: ${pa.reasoning}\n`;
    }

    output += '\n' + '─'.repeat(70) + '\n\n';

    output += '📝 TASK BREAKDOWN\n\n';
    result.tasks.forEach((task, index) => {
      output += `   ${index + 1}. ${task.description}`;
      if (task.estimatedHours) {
        output += ` (${task.estimatedHours}h)`;
      }

      // Add agent suggestion if available
      if (result.agentAssignments) {
        const assignment = result.agentAssignments.find(a => a.taskIndex === index);
        if (assignment) {
          output += `\n      Agent: ${assignment.recommendedAgent}`;
          output += `\n      Reasoning: ${assignment.reasoning}`;
        }
      }

      output += '\n';
    });
    output += '\n';

    output += '─'.repeat(70) + '\n\n';
    output += '🔧 SUGGESTED TOOL CALL\n\n';
    output += `Tool: ${result.suggestedToolCall.tool}\n\n`;
    output += 'Parameters:\n';
    output += JSON.stringify(result.suggestedToolCall.params, null, 2);
    output += '\n\n';

    output += '─'.repeat(70) + '\n\n';
    output += '💡 NEXT STEPS\n\n';
    output += '   1. Review task breakdown above\n';
    output += '   2. Adjust tasks if needed\n';
    output += '   3. Execute suggested tool call to create workflow\n';
    output += '   4. Use complete_task as you work through tasks\n';
    output += '\n';

    output += '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'prepare_task_executor_handoff',
      description: 'Prepare task workflow for Task Executor MCP integration. Extracts tasks from specification or creates generic implementation tasks. Provides ready-to-execute tool call for create_workflow. Tracks integration in state.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          goalId: {
            type: 'string',
            description: 'Goal ID (e.g., "01", "02") or partial name match',
          },
        },
        required: ['projectPath', 'goalId'],
      },
    };
  }
}
