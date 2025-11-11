/**
 * Get Project Status Tool
 *
 * High-level project overview with phase status, goals, and health indicators
 */

import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';

export interface GetProjectStatusInput {
  projectPath: string;
}

export interface PhaseStatus {
  name: string;
  status: string;
  statusEmoji: string;
  progress: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GetProjectStatusResult {
  success: boolean;
  projectName: string;
  currentPhase: string;
  currentStep: string;
  overallProgress: string;
  phases: PhaseStatus[];
  goals: {
    potential: number;
    selected: number;
    completed: number;
  };
  integrations: {
    specDrivenUsed: boolean;
    activeWorkflows: number;
  };
  health: 'Good' | 'Warning' | 'Blocked';
  healthIndicators: string[];
  message?: string;
}

export class GetProjectStatusTool {
  static execute(input: GetProjectStatusInput): GetProjectStatusResult {
    const { projectPath } = input;

    // Read project state
    const state = StateManager.read(projectPath);
    if (!state) {
      return {
        success: false,
        projectName: 'Unknown',
        currentPhase: 'unknown',
        currentStep: 'unknown',
        overallProgress: '0%',
        phases: [],
        goals: { potential: 0, selected: 0, completed: 0 },
        integrations: { specDrivenUsed: false, activeWorkflows: 0 },
        health: 'Blocked',
        healthIndicators: ['No orchestration state found'],
        message: 'Project orchestration not initialized. Run initialize_project_orchestration first.',
      };
    }

    // Build phase status
    const phases: PhaseStatus[] = [
      this.buildPhaseStatus('initialization', state.phases.initialization),
      this.buildPhaseStatus('goal-development', state.phases['goal-development']),
      this.buildPhaseStatus('execution', state.phases.execution),
      this.buildPhaseStatus('completion', state.phases.completion),
    ];

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(state);

    // Assess project health
    const { health, healthIndicators } = this.assessHealth(state);

    return {
      success: true,
      projectName: state.projectName,
      currentPhase: state.currentPhase,
      currentStep: state.currentStep,
      overallProgress,
      phases,
      goals: {
        potential: state.goals.potential.length,
        selected: state.goals.selected.length,
        completed: state.goals.completed.length,
      },
      integrations: {
        specDrivenUsed: state.integrations.specDriven.used,
        activeWorkflows: state.integrations.taskExecutor.activeWorkflows.length,
      },
      health,
      healthIndicators,
    };
  }

  /**
   * Build status for a single phase
   */
  private static buildPhaseStatus(name: string, phaseInfo: any): PhaseStatus {
    const totalSteps = phaseInfo.steps.length;
    const completedSteps = phaseInfo.steps.filter((s: any) => s.status === 'complete').length;

    let statusEmoji: string;
    let statusText: string;
    if (phaseInfo.status === 'complete') {
      statusEmoji = '✅';
      statusText = 'Complete';
    } else if (phaseInfo.status === 'in-progress') {
      statusEmoji = '🔄';
      statusText = `In Progress (${completedSteps}/${totalSteps} steps)`;
    } else {
      statusEmoji = '⏳';
      statusText = 'Pending';
    }

    return {
      name,
      status: phaseInfo.status,
      statusEmoji,
      progress: `${completedSteps}/${totalSteps} steps`,
      startedAt: phaseInfo.startedAt,
      completedAt: phaseInfo.completedAt,
    };
  }

  /**
   * Calculate overall project progress
   */
  private static calculateOverallProgress(state: any): string {
    const phases = ['initialization', 'goal-development', 'execution', 'completion'];
    let totalProgress = 0;

    phases.forEach(phase => {
      const phaseInfo = state.phases[phase];
      const totalSteps = phaseInfo.steps.length;
      const completedSteps = phaseInfo.steps.filter((s: any) => s.status === 'complete').length;

      // Each phase worth 25% of total
      const phaseWeight = 100 / phases.length;
      const phaseProgress = (completedSteps / totalSteps) * phaseWeight;
      totalProgress += phaseProgress;
    });

    return `${Math.round(totalProgress)}%`;
  }

  /**
   * Assess project health
   */
  private static assessHealth(state: any): {
    health: 'Good' | 'Warning' | 'Blocked';
    healthIndicators: string[];
  } {
    const indicators: string[] = [];
    let warningCount = 0;
    let blockerCount = 0;

    // Check for selected goals with no active workflows
    if (state.goals.selected.length > 0 && state.integrations.taskExecutor.activeWorkflows.length === 0) {
      if (state.currentPhase === 'execution') {
        indicators.push('⚠️  Selected goals but no active workflows');
        warningCount++;
      }
    }

    // Check for stale state (no updates in 30 days - simplified check)
    const lastUpdated = new Date(state.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30) {
      indicators.push(`⚠️  No updates in ${Math.round(daysSinceUpdate)} days`);
      warningCount++;
    }

    // Check for phase mismatch
    if (state.currentPhase === 'initialization' && state.goals.selected.length > 0) {
      indicators.push('⚠️  Phase mismatch: selected goals exist in initialization phase');
      warningCount++;
    }

    // Check completion phase
    if (state.currentPhase === 'completion') {
      indicators.push('✅ Project in completion phase');
    }

    // Determine overall health
    let health: 'Good' | 'Warning' | 'Blocked';
    if (blockerCount > 0) {
      health = 'Blocked';
    } else if (warningCount > 0) {
      health = 'Warning';
    } else {
      health = 'Good';
      if (indicators.length === 0) {
        indicators.push('✅ Project progressing normally');
      }
    }

    return { health, healthIndicators: indicators };
  }

  static formatResult(result: GetProjectStatusResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  PROJECT STATUS OVERVIEW\n';
    output += '='.repeat(70) + '\n\n';

    if (!result.success) {
      output += `❌ Error: ${result.message}\n`;
      return output;
    }

    // Header
    output += `📋 Project: ${result.projectName}\n`;
    output += `📊 Overall Progress: ${result.overallProgress}\n`;
    output += `📍 Current Phase: ${result.currentPhase}\n`;
    output += `📌 Current Step: ${result.currentStep}\n`;
    output += `💚 Health: ${result.health}`;
    if (result.health === 'Warning') {
      output += ' ⚠️';
    } else if (result.health === 'Blocked') {
      output += ' 🚫';
    }
    output += '\n';
    output += '\n' + '─'.repeat(70) + '\n\n';

    // Phases
    output += '📅 WORKFLOW PHASES\n\n';
    result.phases.forEach(phase => {
      output += `${phase.statusEmoji} ${phase.name}\n`;
      output += `   Status: ${phase.status} (${phase.progress})\n`;
      if (phase.startedAt) {
        output += `   Started: ${new Date(phase.startedAt).toLocaleString()}\n`;
      }
      if (phase.completedAt) {
        output += `   Completed: ${new Date(phase.completedAt).toLocaleString()}\n`;
      }
      output += '\n';
    });

    output += '─'.repeat(70) + '\n\n';

    // Goals
    output += '🎯 GOALS SUMMARY\n\n';
    output += `   Potential: ${result.goals.potential}\n`;
    output += `   Selected: ${result.goals.selected}\n`;
    output += `   Completed: ${result.goals.completed}\n`;
    output += `   Total: ${result.goals.potential + result.goals.selected + result.goals.completed}\n`;
    output += '\n';

    output += '─'.repeat(70) + '\n\n';

    // Integrations
    output += '🔗 MCP INTEGRATIONS\n\n';
    output += `   Spec-Driven: ${result.integrations.specDrivenUsed ? '✅ Used' : '⏳ Not yet used'}\n`;
    output += `   Task Executor: ${result.integrations.activeWorkflows} active workflow(s)\n`;
    output += '\n';

    // Health Indicators
    if (result.healthIndicators.length > 0) {
      output += '─'.repeat(70) + '\n\n';
      output += '📊 HEALTH INDICATORS\n\n';
      result.healthIndicators.forEach(indicator => {
        output += `   ${indicator}\n`;
      });
      output += '\n';
    }

    output += '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'get_project_status',
      description: 'Get high-level project overview including phase progress, goals summary, integrations, and health indicators.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
