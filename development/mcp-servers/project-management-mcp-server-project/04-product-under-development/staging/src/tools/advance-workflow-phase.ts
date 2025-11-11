/**
 * Advance Workflow Phase Tool
 *
 * Move project to the next workflow phase after validating prerequisites
 */

import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { WorkflowPhase } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';

export interface AdvanceWorkflowPhaseInput {
  projectPath: string;
  targetPhase?: WorkflowPhase; // Optional - auto-advance to next if not specified
  skipValidation?: boolean; // Allow override (default: false)
}

export interface AdvanceWorkflowPhaseResult {
  success: boolean;
  previousPhase: string;
  currentPhase: string;
  message: string;
  validationsPassed: string[];
  warnings: string[];
}

export class AdvanceWorkflowPhaseTool {
  private static readonly PHASE_ORDER: WorkflowPhase[] = [
    'initialization',
    'goal-development',
    'execution',
    'completion',
  ];

  static execute(input: AdvanceWorkflowPhaseInput): AdvanceWorkflowPhaseResult {
    const { projectPath, targetPhase, skipValidation = false } = input;

    // Read current state
    const state = StateManager.read(projectPath);
    if (!state) {
      return {
        success: false,
        previousPhase: 'unknown',
        currentPhase: 'unknown',
        message: 'No orchestration state found. Run initialize_project_orchestration first.',
        validationsPassed: [],
        warnings: [],
      };
    }

    const previousPhase = state.currentPhase;

    // Determine target phase
    let nextPhase: WorkflowPhase;
    if (targetPhase) {
      nextPhase = targetPhase;
    } else {
      // Auto-advance to next phase
      const currentIndex = this.PHASE_ORDER.indexOf(state.currentPhase);
      if (currentIndex === this.PHASE_ORDER.length - 1) {
        return {
          success: false,
          previousPhase,
          currentPhase: previousPhase,
          message: 'Already at final phase (completion). Use wrap_up_project to finalize.',
          validationsPassed: [],
          warnings: [],
        };
      }
      nextPhase = this.PHASE_ORDER[currentIndex + 1];
    }

    // Validate prerequisites (unless skipped)
    if (!skipValidation) {
      const validationResult = this.validatePhaseTransition(state, nextPhase);
      if (!validationResult.valid) {
        return {
          success: false,
          previousPhase,
          currentPhase: previousPhase,
          message: `Cannot advance to ${nextPhase}: ${validationResult.reason}`,
          validationsPassed: validationResult.passed,
          warnings: validationResult.warnings,
        };
      }
    }

    // Mark current phase as complete
    state.phases[previousPhase].status = 'complete';
    state.phases[previousPhase].completedAt = new Date().toISOString();

    // Start new phase
    state.currentPhase = nextPhase;
    state.phases[nextPhase].status = 'in-progress';
    state.phases[nextPhase].startedAt = new Date().toISOString();

    // Set first step of new phase as current
    const firstStep = state.phases[nextPhase].steps[0];
    if (firstStep) {
      state.currentStep = firstStep.name;
      firstStep.status = 'in-progress';
    }

    // Save updated state
    StateManager.write(projectPath, state);

    return {
      success: true,
      previousPhase,
      currentPhase: nextPhase,
      message: `Successfully advanced from ${previousPhase} to ${nextPhase}`,
      validationsPassed: skipValidation ? ['Validation skipped by user'] : ['All prerequisites met'],
      warnings: [],
    };
  }

  /**
   * Validate phase transition
   */
  private static validatePhaseTransition(
    state: any,
    targetPhase: WorkflowPhase
  ): { valid: boolean; reason?: string; passed: string[]; warnings: string[] } {
    const passed: string[] = [];
    const warnings: string[] = [];

    // Check current phase is complete
    const currentPhase = state.phases[state.currentPhase];
    const completedSteps = currentPhase.steps.filter((s: any) => s.status === 'complete').length;
    const totalSteps = currentPhase.steps.length;

    if (completedSteps < totalSteps) {
      return {
        valid: false,
        reason: `Current phase not complete (${completedSteps}/${totalSteps} steps done)`,
        passed,
        warnings,
      };
    }
    passed.push(`Current phase complete (${totalSteps}/${totalSteps} steps)`);

    // Phase-specific validations
    if (targetPhase === 'goal-development') {
      // Check constitution exists
      if (!state.phases.initialization.completedAt) {
        return {
          valid: false,
          reason: 'Initialization phase not completed',
          passed,
          warnings,
        };
      }
      passed.push('Initialization phase completed');
    }

    if (targetPhase === 'execution') {
      // Check at least one selected goal exists
      if (state.goals.selected.length === 0) {
        return {
          valid: false,
          reason: 'No selected goals. Promote at least one goal before execution.',
          passed,
          warnings,
        };
      }
      passed.push(`${state.goals.selected.length} selected goal(s) ready for execution`);
    }

    if (targetPhase === 'completion') {
      // Check goals are addressed
      if (state.goals.selected.length > 0) {
        warnings.push(`${state.goals.selected.length} goal(s) still in selected - consider completing or archiving`);
      }
      passed.push('Ready to validate completion criteria');
    }

    return { valid: true, passed, warnings };
  }

  static formatResult(result: AdvanceWorkflowPhaseResult): string {
    let output = '='.repeat(70) + '\n';
    output += '  ADVANCE WORKFLOW PHASE\n';
    output += '='.repeat(70) + '\n\n';

    if (!result.success) {
      output += `❌ ${result.message}\n\n`;

      if (result.validationsPassed.length > 0) {
        output += '✅ Validations Passed:\n';
        result.validationsPassed.forEach(v => {
          output += `   - ${v}\n`;
        });
        output += '\n';
      }

      if (result.warnings.length > 0) {
        output += '⚠️  Warnings:\n';
        result.warnings.forEach(w => {
          output += `   - ${w}\n`;
        });
        output += '\n';
      }

      output += 'Use skipValidation: true to override if needed.\n';
    } else {
      output += `✅ ${result.message}\n\n`;
      output += `📍 Previous Phase: ${result.previousPhase}\n`;
      output += `📍 Current Phase: ${result.currentPhase}\n\n`;

      if (result.validationsPassed.length > 0) {
        output += '✅ Validations:\n';
        result.validationsPassed.forEach(v => {
          output += `   - ${v}\n`;
        });
        output += '\n';
      }

      if (result.warnings.length > 0) {
        output += '⚠️  Warnings:\n';
        result.warnings.forEach(w => {
          output += `   - ${w}\n`;
        });
        output += '\n';
      }

      output += '💡 Use get_next_steps to see suggested actions for this phase.\n';
    }

    output += '\n' + '='.repeat(70) + '\n';

    return output;
  }

  static getToolDefinition() {
    return {
      name: 'advance_workflow_phase',
      description: 'Advance project to the next workflow phase after validating prerequisites. Automatically transitions from initialization → goal-development → execution → completion.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          targetPhase: {
            type: 'string',
            enum: ['initialization', 'goal-development', 'execution', 'completion'],
            description: 'Optional target phase (auto-advances to next if not specified)',
          },
          skipValidation: {
            type: 'boolean',
            description: 'Skip prerequisite validation (default: false)',
          },
        },
        required: ['projectPath'],
      },
    };
  }
}
