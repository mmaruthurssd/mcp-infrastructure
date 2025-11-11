/**
 * Workflow Manager V2 - Refactored to use workflow-orchestrator
 * Preserves all task-specific logic while using unified state management
 */

import * as fs from 'fs';
import * as path from 'path';
import { TaskExecutorWorkflowState, TaskExecutorWorkflowData } from '../types-extended.js';
import {
  Task,
  TaskInput,
  CreateWorkflowInput,
  WorkflowContext,
  WorkflowDocumentation,
  VerificationReport,
  VerificationStatus,
  WorkflowState as LegacyWorkflowState
} from '../types.js';
import { ComplexityAnalyzer } from './complexity-analyzer.js';
import { ParallelizationAnalyzer } from 'workflow-orchestrator-mcp-server/dist/core/parallelization-analyzer.js';
import { TaskValidation } from './task-validation.js';
import { TaskDeployment } from './task-deployment.js';
import { standardsValidator } from '../standards-validator-client.js';

export class WorkflowManager {
  /**
   * Get workflow directory path (PRESERVED - temp/archive pattern)
   */
  private static getWorkflowPath(projectPath: string, workflowName: string, archived = false): string {
    const baseDir = archived ? 'archive' : 'temp';
    let timestamp = '';
    if (archived) {
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      timestamp = `${date}-${time}-`;
    }
    return path.join(projectPath, baseDir, 'workflows', timestamp + workflowName);
  }

  /**
   * Get state file path
   */
  private static getStateFilePath(projectPath: string, workflowName: string, archived = false): string {
    const workflowPath = this.getWorkflowPath(projectPath, workflowName, archived);
    return path.join(workflowPath, 'state.json');
  }

  /**
   * Convert workflow-orchestrator state to legacy state format for backward compatibility
   */
  private static toLegacyState(woState: TaskExecutorWorkflowState): LegacyWorkflowState {
    return {
      name: woState.name,
      created: new Date(woState.created),
      projectPath: woState.name, // Use name as projectPath for compatibility
      status: woState.currentPhase === 'completion' ? 'archived' : 'active',
      tasks: woState.customData.tasks,
      constraints: woState.customData.constraints,
      context: woState.customData.context,
      documentation: woState.customData.documentation,
      metadata: woState.customData.metadata
    };
  }

  /**
   * Convert legacy state to workflow-orchestrator format
   */
  private static fromLegacyState(legacyState: LegacyWorkflowState, name: string): TaskExecutorWorkflowState {
    const now = new Date();
    const created = legacyState.created || now;
    const lastUpdated = legacyState.metadata.lastUpdated || now;

    return {
      version: '1.0',
      workflowType: 'task-executor',
      name: name,
      created: created.toISOString(),
      lastUpdated: lastUpdated.toISOString(),
      currentPhase: legacyState.status === 'archived' ? 'completion' : 'execution',
      currentStep: 'task-execution',
      phases: {
        'execution': {
          status: legacyState.status === 'archived' ? 'complete' : 'in-progress',
          startedAt: created.toISOString(),
          completedAt: legacyState.status === 'archived' ? lastUpdated.toISOString() : undefined,
          steps: []
        }
      },
      customData: {
        tasks: legacyState.tasks,
        constraints: legacyState.constraints,
        context: legacyState.context,
        documentation: legacyState.documentation,
        metadata: legacyState.metadata
      }
    };
  }

  /**
   * Create a new workflow (PRESERVES ALL TASK-SPECIFIC LOGIC)
   */
  static create(input: CreateWorkflowInput): { success: boolean; workflowPath?: string; workflow?: any; error?: string; summary?: any } {
    try {
      const { name, projectPath, tasks: taskInputs, constraints = [], context = {} } = input;

      // Create workflow directory
      const workflowPath = this.getWorkflowPath(projectPath, name);
      if (fs.existsSync(workflowPath)) {
        return {
          success: false,
          error: `Workflow "${name}" already exists in temp/workflows/`
        };
      }

      fs.mkdirSync(workflowPath, { recursive: true });
      fs.mkdirSync(path.join(workflowPath, 'artifacts'), { recursive: true });

      // Create tasks with complexity analysis (PRESERVED)
      const tasks: Task[] = taskInputs.map((taskInput, index) => {
        const factors = ComplexityAnalyzer.estimateFromDescription(taskInput.description, context);
        if (taskInput.estimatedHours) {
          factors.estimatedHours = taskInput.estimatedHours;
        }

        const complexityResult = ComplexityAnalyzer.analyze(factors);

        return {
          id: String(index + 1),
          description: taskInput.description,
          status: 'pending',
          complexity: {
            score: complexityResult.score,
            level: complexityResult.level,
            emoji: ComplexityAnalyzer.getComplexityEmoji(complexityResult.level)
          },
          estimatedHours: taskInput.estimatedHours
        };
      });

      // Calculate total estimated hours
      const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

      // Analyze parallelization opportunity
      const analyzer = new ParallelizationAnalyzer({
        enabled: true,
        minSpeedupThreshold: 1.5,
        maxParallelAgents: 3,
        executionStrategy: 'conservative',
        autoExecute: false,
      });

      // Convert tasks for analysis
      const analysisTasks = tasks.map(t => ({
        id: t.id,
        description: t.description,
        estimatedMinutes: (t.estimatedHours || 1) * 60,
      }));

      // Run analysis (using fallback heuristic)
      const parallelizationAnalysis = analyzer['fallbackHeuristic'](analysisTasks);

      // Detect existing documentation (PRESERVED)
      const documentation = this.detectDocumentation(projectPath);

      // Create workflow state using workflow-orchestrator pattern
      const now = new Date();
      const state: TaskExecutorWorkflowState = {
        version: '1.0',
        workflowType: 'task-executor',
        name: name,
        created: now.toISOString(),
        lastUpdated: now.toISOString(),
        currentPhase: 'execution',
        currentStep: 'task-execution',
        phases: {
          'execution': {
            status: 'in-progress',
            startedAt: now.toISOString(),
            completedAt: undefined,
            steps: []
          }
        },
        customData: {
          tasks,
          constraints,
          context: {
            ...context,
            estimatedHours
          },
          documentation,
          parallelizationAnalysis: {
            shouldParallelize: parallelizationAnalysis.shouldParallelize,
            estimatedSpeedup: parallelizationAnalysis.estimatedSpeedup,
            mode: parallelizationAnalysis.mode,
            reasoning: parallelizationAnalysis.reasoning,
          },
          metadata: {
            totalTasks: tasks.length,
            completedTasks: 0,
            verifiedTasks: 0,
            percentComplete: 0,
            lastUpdated: now
          }
        }
      };

      // Save state to workflow-specific location
      const stateFilePath = this.getStateFilePath(projectPath, name);
      // Add phase field for backward compatibility with tests
      const stateWithPhase = { ...state, phase: state.currentPhase };
      fs.writeFileSync(stateFilePath, JSON.stringify(stateWithPhase, null, 2), 'utf-8');

      // Generate plan.md (PRESERVED)
      this.generatePlan(state, workflowPath);

      return {
        success: true,
        workflowPath,
        workflow: {
          name,
          tasks,
          constraints,
          context: { ...context, estimatedHours },
          documentation,
          parallelizationAnalysis: {
            shouldParallelize: parallelizationAnalysis.shouldParallelize,
            estimatedSpeedup: parallelizationAnalysis.estimatedSpeedup,
            mode: parallelizationAnalysis.mode,
            reasoning: parallelizationAnalysis.reasoning,
          }
        },
        summary: {
          totalTasks: tasks.length,
          estimatedHours,
          complexityScores: tasks.map(t => t.complexity?.score || 0),
          parallelization: {
            recommended: parallelizationAnalysis.shouldParallelize,
            speedup: parallelizationAnalysis.estimatedSpeedup,
            mode: parallelizationAnalysis.mode
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Load workflow state
   */
  static loadState(projectPath: string, workflowName: string, archived = false): LegacyWorkflowState | null {
    try {
      const stateFilePath = this.getStateFilePath(projectPath, workflowName, archived);

      if (!fs.existsSync(stateFilePath)) {
        return null;
      }

      const content = fs.readFileSync(stateFilePath, 'utf-8');
      const data = JSON.parse(content);

      // Parse dates in tasks
      if (data.customData && data.customData.tasks) {
        data.customData.tasks.forEach((task: Task) => {
          if (task.startedAt) task.startedAt = new Date(task.startedAt);
          if (task.completedAt) task.completedAt = new Date(task.completedAt);
          if (task.verifiedAt) task.verifiedAt = new Date(task.verifiedAt);
        });
      }

      // Parse metadata date
      if (data.customData && data.customData.metadata && data.customData.metadata.lastUpdated) {
        data.customData.metadata.lastUpdated = new Date(data.customData.metadata.lastUpdated);
      }

      const woState = data as TaskExecutorWorkflowState;
      return this.toLegacyState(woState);
    } catch (error) {
      console.error('Error loading workflow state:', error);
      return null;
    }
  }

  /**
   * Save workflow state
   */
  private static saveState(state: LegacyWorkflowState, projectPath: string, workflowName: string, archived = false): void {
    const woState = this.fromLegacyState(state, workflowName);
    const stateFilePath = this.getStateFilePath(projectPath, workflowName, archived);
    fs.writeFileSync(stateFilePath, JSON.stringify(woState, null, 2), 'utf-8');
  }

  /**
   * Complete a task (PRESERVES ALL TASK-SPECIFIC LOGIC)
   * Enhanced with optional automated validation (build, test checks)
   */
  static async completeTask(
    projectPath: string,
    workflowName: string,
    taskId: string,
    notes?: string,
    skipVerification = false,
    runValidation = false
  ): Promise<{ success: boolean; task?: Task; progress?: any; verification?: VerificationReport; error?: string }> {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      const task = state.tasks.find(t => t.id === taskId);

      if (!task) {
        return {
          success: false,
          error: `Task ${taskId} not found in workflow`
        };
      }

      // Update task
      if (task.status === 'pending') {
        task.startedAt = new Date();
        task.status = 'in-progress';
      }

      task.completedAt = new Date();
      task.status = 'completed';
      if (notes) {
        task.notes = notes;
      }

      // Verification (ENHANCED with automated validation)
      let verification: VerificationReport | undefined;
      if (!skipVerification) {
        verification = await this.performBasicVerification(task, state, projectPath, runValidation);
        task.verification = verification;

        if (verification.status === 'passed') {
          task.status = 'verified';
          task.verifiedAt = new Date();
        }
      }

      // Update metadata
      state.metadata.completedTasks = state.tasks.filter(
        t => t.status === 'completed' || t.status === 'verified'
      ).length;
      state.metadata.verifiedTasks = state.tasks.filter(
        t => t.status === 'verified'
      ).length;
      state.metadata.percentComplete = Math.round(
        (state.metadata.completedTasks / state.metadata.totalTasks) * 100
      );
      state.metadata.lastUpdated = new Date();

      // Save
      this.saveState(state, projectPath, workflowName);

      // Regenerate plan
      const workflowPath = this.getWorkflowPath(projectPath, workflowName);
      this.generatePlan(this.fromLegacyState(state, workflowName), workflowPath);

      return {
        success: true,
        task,
        verification,
        progress: {
          completed: state.metadata.completedTasks,
          total: state.metadata.totalTasks,
          percentComplete: state.metadata.percentComplete
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Basic verification (ENHANCED with automated validation)
   * Optionally runs build, test, and security checks via TaskValidation
   */
  private static async performBasicVerification(
    task: Task,
    state: LegacyWorkflowState,
    projectPath: string,
    runValidation = false
  ): Promise<VerificationReport> {
    const evidence: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Basic checks
    if (task.notes) {
      evidence.push(`Task notes provided: ${task.notes.substring(0, 100)}...`);
    } else {
      concerns.push('No completion notes provided');
      recommendations.push('Add notes explaining how the task was completed');
    }

    if (task.completedAt) {
      evidence.push(`Task marked complete at ${task.completedAt.toISOString()}`);
    }

    // Automated validation (FRAMEWORK INTEGRATION)
    if (runValidation) {
      try {
        const validationResult = await TaskValidation.validate({
          projectPath,
          taskDescription: task.description,
          runBuild: true,  // Auto-detect based on task description
          runTests: true,  // Auto-detect based on task description
          runSecurityScan: false  // Disabled by default
        });

        // Merge validation results
        evidence.push(...validationResult.evidence);
        concerns.push(...validationResult.concerns);

        // Add validation-specific recommendations
        if (validationResult.buildCheck && !validationResult.buildCheck.passed) {
          recommendations.push('Fix build errors before marking task as complete');
        }

        if (validationResult.testCheck && !validationResult.testCheck.passed) {
          recommendations.push('Fix failing tests before marking task as complete');
        }
      } catch (error) {
        // Validation errors don't fail the task, just note them
        concerns.push(`Automated validation encountered an error: ${String(error)}`);
        recommendations.push('Manually verify task completion');
      }
    }

    // Determine status
    let status: VerificationStatus = 'passed';
    if (concerns.length > 0) {
      status = 'partial';
    }

    return {
      status,
      evidence,
      concerns,
      recommendations
    };
  }

  /**
   * Get workflow status
   */
  static getStatus(projectPath: string, workflowName: string): any {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      // Re-detect documentation (in case files were added since workflow creation)
      state.documentation = this.detectDocumentation(projectPath);

      // Find next pending task
      const nextTask = state.tasks.find(t => t.status === 'pending');

      return {
        success: true,
        workflow: {
          name: state.name,
          created: state.created,
          status: state.status,
          progress: `${state.metadata.completedTasks}/${state.metadata.totalTasks} tasks complete (${state.metadata.percentComplete}%)`,
          nextTask: nextTask ? `${nextTask.id}. ${nextTask.description}` : 'All tasks completed!',
          constraintsStatus: this.getConstraintsStatus(state)
        },
        tasks: state.tasks.map(t => ({
          id: t.id,
          description: t.description,
          status: t.status,
          complexity: t.complexity
        })),
        documentation: state.documentation
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Archive workflow (PRESERVES TEMP→ARCHIVE LIFECYCLE)
   * Enhanced with optional deployment readiness checking
   */
  static async archive(projectPath: string, workflowName: string, force = false, checkDeploymentReadiness = false): Promise<any> {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      // Validation
      const validation = {
        allTasksComplete: state.metadata.completedTasks === state.metadata.totalTasks,
        allConstraintsMet: true, // TODO: Implement constraint checking
        documentationUpdated: state.documentation.updated.length === state.documentation.needsUpdate.length,
        noTempFiles: true // TODO: Implement temp file detection
      };

      // Collect warnings for force archive
      const warnings: string[] = [];

      if (!force) {
        if (!validation.allTasksComplete) {
          return {
            success: false,
            error: `Cannot archive: not all tasks are completed (${state.metadata.totalTasks - state.metadata.completedTasks} tasks remaining)`,
            validation
          };
        }
      } else {
        // Force mode - collect warnings
        if (!validation.allTasksComplete) {
          warnings.push(`Not all tasks completed: ${state.metadata.totalTasks - state.metadata.completedTasks} tasks remaining`);
        }
        if (!validation.documentationUpdated) {
          warnings.push('Documentation may not be fully updated');
        }
      }

      // ============================================
      // STANDARDS COMPLIANCE CHECK
      // ============================================
      let standardsCheck: any = null;

      try {
        // Extract MCP name from project path or workflow name
        // Pattern: /path/to/mcp-servers/my-mcp or my-mcp-project
        const mcpNameMatch = projectPath.match(/mcp-servers\/([^/]+)/) ||
                            workflowName.match(/([^/]+?)(-project)?$/);

        if (mcpNameMatch) {
          const mcpName = mcpNameMatch[1].replace(/-project$/, '');

          console.log(`\n🔍 Running standards compliance check for '${mcpName}'...`);

          const validationResult = await standardsValidator.validateMcpCompliance({
            mcpName,
            categories: ['security', 'documentation', 'configuration'],
            failFast: false,
            includeWarnings: true,
          });

          const { summary } = validationResult;

          // Add standards check to result
          standardsCheck = {
            compliant: validationResult.compliant,
            score: summary.complianceScore,
            critical_violations: summary.criticalViolations,
            warnings: summary.warningViolations,
          };

          // Add warnings if critical violations found
          if (summary.criticalViolations > 0) {
            warnings.push(
              `⚠️  ${summary.criticalViolations} critical standards violation(s) detected (Score: ${summary.complianceScore}/100)`
            );
            warnings.push(
              `💡 Fix violations with: validate_mcp_compliance({mcpName: "${mcpName}"})`
            );
          } else if (!validationResult.compliant) {
            // Has warnings but no critical violations
            warnings.push(
              `ℹ️  Standards compliance score: ${summary.complianceScore}/100 (${summary.warningViolations} warnings)`
            );
          } else {
            console.log(`✅ Standards compliance check passed (Score: ${summary.complianceScore}/100)`);
          }
        }
      } catch (error: any) {
        // Log error but don't block archive
        console.warn(`⚠️  Standards compliance check failed: ${error.message}`);
        console.warn(`Proceeding with workflow archive...`);
      }

      // Move from temp to archive
      const tempPath = this.getWorkflowPath(projectPath, workflowName, false);
      const archivePath = this.getWorkflowPath(projectPath, workflowName, true);

      // Create archive directory
      fs.mkdirSync(path.dirname(archivePath), { recursive: true });

      // Move directory
      fs.renameSync(tempPath, archivePath);

      // Update state
      state.status = 'archived';
      state.metadata.lastUpdated = new Date();

      // Save in archive location
      this.saveState(state, projectPath, workflowName, true);

      const result: any = {
        success: true,
        message: `Workflow "${workflowName}" archived to ${archivePath}`,
        validation,
        archivePath
      };

      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      // Add standards check result if available
      if (standardsCheck) {
        result.standards_check = standardsCheck;
      }

      // Deployment readiness check (FRAMEWORK INTEGRATION)
      if (checkDeploymentReadiness) {
        try {
          const deploymentReadiness = await TaskDeployment.checkReadiness({
            projectPath,
            workflowName,
            checkBuild: true,
            checkTests: true,
            checkHealth: true
          });

          result.deploymentReadiness = deploymentReadiness;

          if (!deploymentReadiness.ready) {
            result.warnings = result.warnings || [];
            result.warnings.push('Component is not ready for deployment - see deploymentReadiness for details');
          }
        } catch (error) {
          // Deployment readiness check errors don't fail the archive
          result.deploymentReadiness = {
            ready: false,
            checks: {},
            recommendations: [`Deployment readiness check error: ${String(error)}`],
            deploymentEligible: false
          };
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  // ===== PRESERVE ALL HELPER METHODS =====

  /**
   * Detect existing documentation in project (PRESERVED)
   */
  private static detectDocumentation(projectPath: string): WorkflowDocumentation {
    const existing: string[] = [];
    const commonDocs = ['README.md', 'CHANGELOG.md', 'API.md', 'CONTRIBUTING.md', 'docs/'];

    commonDocs.forEach(doc => {
      const docPath = path.join(projectPath, doc);
      if (fs.existsSync(docPath)) {
        existing.push(doc);
      }
    });

    return {
      existing,
      needsUpdate: [],
      updated: []
    };
  }

  /**
   * Get constraints status (PRESERVED)
   */
  private static getConstraintsStatus(state: LegacyWorkflowState): string {
    if (state.constraints.length === 0) {
      return 'No constraints defined';
    }

    return `${state.constraints.length} constraints to maintain`;
  }

  /**
   * Generate plan.md file (PRESERVED)
   */
  private static generatePlan(state: TaskExecutorWorkflowState, workflowPath: string): void {
    const created = new Date(state.created);
    const status = state.currentPhase === 'completion' ? 'archived' : 'active';

    let content = `# Workflow: ${state.name}\n\n`;
    content += `**Created**: ${created.toISOString().split('T')[0]}\n`;
    content += `**Status**: ${status}\n`;
    content += `**Progress**: ${state.customData.metadata.percentComplete}% (${state.customData.metadata.completedTasks}/${state.customData.metadata.totalTasks} tasks)\n`;
    content += `**Location**: \`${workflowPath.split('/').slice(-3).join('/')}\`\n\n`;

    // Constraints
    if (state.customData.constraints.length > 0) {
      content += `## Constraints\n\n`;
      state.customData.constraints.forEach(constraint => {
        content += `- ${constraint}\n`;
      });
      content += `\n`;
    }

    // Tasks
    content += `## Tasks\n\n`;
    state.customData.tasks.forEach(task => {
      const symbol = this.getTaskSymbol(task.status);
      const complexityBadge = task.complexity ? ` ${task.complexity.emoji} (${task.complexity.score}/10)` : '';
      content += `${symbol} ${task.id}. ${task.description}${complexityBadge}\n`;

      if (task.estimatedHours) {
        content += `   - Estimated: ${task.estimatedHours} hours\n`;
      }

      if (task.notes) {
        content += `   - Notes: ${task.notes}\n`;
      }

      if (task.verification) {
        content += `   - Verification: ${task.verification.status}\n`;
      }
    });
    content += `\n`;

    // Documentation
    if (state.customData.documentation.existing.length > 0) {
      content += `## Documentation\n\n`;

      if (state.customData.documentation.existing.length > 0) {
        content += `**Existing documentation**:\n`;
        state.customData.documentation.existing.forEach(doc => {
          content += `- ${doc}\n`;
        });
        content += `\n`;
      }

      if (state.customData.documentation.needsUpdate.length > 0) {
        content += `**Needs updating**:\n`;
        state.customData.documentation.needsUpdate.forEach(doc => {
          const updated = state.customData.documentation.updated.includes(doc);
          const symbol = updated ? '[x]' : '[ ]';
          content += `${symbol} ${doc}\n`;
        });
        content += `\n`;
      }
    }

    // Verification Checklist
    content += `## Verification Checklist\n\n`;
    const allTasksComplete = state.customData.metadata.completedTasks === state.customData.metadata.totalTasks;
    const allDocsUpdated = state.customData.documentation.updated.length === state.customData.documentation.needsUpdate.length;

    content += `${allTasksComplete ? '[x]' : '[ ]'} All tasks completed\n`;
    content += `[ ] All constraints satisfied\n`;
    content += `${allDocsUpdated ? '[x]' : '[ ]'} Documentation updated\n`;
    content += `[ ] No temporary files left\n`;
    content += `[ ] Ready to archive\n`;

    fs.writeFileSync(path.join(workflowPath, 'plan.md'), content, 'utf-8');
  }

  /**
   * Get task status symbol (PRESERVED)
   */
  private static getTaskSymbol(status: string): string {
    switch (status) {
      case 'pending': return '[ ]';
      case 'in-progress': return '[~]';
      case 'completed': return '[x]';
      case 'verified': return '[✓]';
      default: return '[ ]';
    }
  }
}
