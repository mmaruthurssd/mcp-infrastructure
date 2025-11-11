/**
 * State Manager Adapter
 * Adapts workflow-orchestrator StateManager for spec-driven workflows
 * Maintains backward compatibility with existing StateManager API
 */

import * as fs from 'fs';
import * as path from 'path';
import { SpecDrivenWorkflowState, SpecDrivenWorkflowData, Scenario, WorkflowStep } from '../types-extended.js';
import { WorkflowState as LegacyWorkflowState } from '../types.js';

/**
 * Adapter class that provides the same interface as the original StateManager
 * but uses workflow-orchestrator types under the hood
 */
export class StateManager {
  private stateDir: string;

  constructor(baseDir?: string) {
    // Use ~/.sdd-mcp-data/workflows/ by default (same as original)
    this.stateDir = baseDir || path.join(process.env.HOME || process.env.USERPROFILE || '', '.sdd-mcp-data', 'workflows');
    this.ensureStateDir();
  }

  private ensureStateDir(): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  private getStateFilePath(projectPath: string): string {
    // Create a safe filename from project path
    const safeName = projectPath.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(this.stateDir, `${safeName}.json`);
  }

  /**
   * Convert SpecDrivenWorkflowState to legacy WorkflowState
   */
  private toLegacyState(state: SpecDrivenWorkflowState): LegacyWorkflowState {
    return {
      projectPath: state.name,
      scenario: state.customData.scenario,
      currentStep: state.customData.currentStep,
      currentQuestionIndex: state.customData.currentQuestionIndex,
      featureName: state.customData.featureName,
      featureId: state.customData.featureId,
      projectType: state.customData.projectType,
      answers: state.customData.answers,
      templateContext: state.customData.templateContext,
      createdAt: new Date(state.created),
      lastUpdated: new Date(state.lastUpdated)
    };
  }

  /**
   * Convert legacy WorkflowState to SpecDrivenWorkflowState structure
   */
  private fromLegacyState(legacyState: LegacyWorkflowState): SpecDrivenWorkflowState {
    const now = new Date();
    const createdAt = legacyState.createdAt || now;
    const lastUpdated = legacyState.lastUpdated || now;

    return {
      version: '1.0',
      workflowType: 'spec-driven',
      name: legacyState.projectPath,
      created: createdAt.toISOString(),
      lastUpdated: lastUpdated.toISOString(),
      currentPhase: this.getPhaseFromStep(legacyState.currentStep),
      currentStep: legacyState.currentStep,
      phases: {
        'initialization': {
          status: legacyState.currentStep === 'complete' ? 'complete' : 'in-progress',
          startedAt: createdAt.toISOString(),
          completedAt: legacyState.currentStep === 'complete' ? now.toISOString() : undefined,
          steps: []
        }
      },
      customData: {
        scenario: legacyState.scenario,
        currentStep: legacyState.currentStep,
        currentQuestionIndex: legacyState.currentQuestionIndex,
        featureName: legacyState.featureName,
        featureId: legacyState.featureId,
        projectType: legacyState.projectType,
        answers: legacyState.answers,
        templateContext: legacyState.templateContext
      }
    };
  }

  /**
   * Map workflow step to phase
   */
  private getPhaseFromStep(step: WorkflowStep): string {
    const phaseMap: Record<WorkflowStep, string> = {
      'setup': 'initialization',
      'constitution': 'planning',
      'specification': 'planning',
      'planning': 'planning',
      'tasks': 'execution',
      'complete': 'completion'
    };
    return phaseMap[step] || 'initialization';
  }

  /**
   * Save workflow state to disk
   */
  save(state: LegacyWorkflowState): void {
    const filePath = this.getStateFilePath(state.projectPath);
    const woState = this.fromLegacyState(state);

    // Serialize Map to array for JSON
    const serialized = {
      ...woState,
      customData: {
        ...woState.customData,
        answers: Array.from(woState.customData.answers.entries())
      },
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), 'utf-8');
  }

  /**
   * Load workflow state from disk
   */
  load(projectPath: string): LegacyWorkflowState | null {
    const filePath = this.getStateFilePath(projectPath);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Deserialize answers array back to Map
      if (data.customData && data.customData.answers) {
        data.customData.answers = new Map(data.customData.answers);
      }

      // Data already has ISO string dates from disk, no conversion needed
      const woState = data as SpecDrivenWorkflowState;
      return this.toLegacyState(woState);
    } catch (error) {
      console.error(`Failed to load state for ${projectPath}:`, error);
      return null;
    }
  }

  /**
   * Check if state exists for a project
   */
  exists(projectPath: string): boolean {
    const filePath = this.getStateFilePath(projectPath);
    return fs.existsSync(filePath);
  }

  /**
   * Delete workflow state
   */
  delete(projectPath: string): boolean {
    const filePath = this.getStateFilePath(projectPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  }

  /**
   * List all active workflows
   */
  listWorkflows(): Array<{ projectPath: string; state: LegacyWorkflowState }> {
    if (!fs.existsSync(this.stateDir)) {
      return [];
    }

    const files = fs.readdirSync(this.stateDir).filter(f => f.endsWith('.json'));
    const workflows: Array<{ projectPath: string; state: LegacyWorkflowState }> = [];

    for (const file of files) {
      const filePath = path.join(this.stateDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        // Deserialize answers array back to Map
        if (data.customData && data.customData.answers) {
          data.customData.answers = new Map(data.customData.answers);
        }

        // Data already has ISO string dates from disk, no conversion needed
        const woState = data as SpecDrivenWorkflowState;
        const legacyState = this.toLegacyState(woState);
        workflows.push({ projectPath: legacyState.projectPath, state: legacyState });
      } catch (error) {
        console.error(`Failed to load workflow from ${file}:`, error);
      }
    }

    return workflows;
  }

  /**
   * Create a new workflow state
   */
  createNew(projectPath: string, scenario: Scenario): LegacyWorkflowState {
    return {
      projectPath,
      scenario,
      currentStep: 'setup',
      currentQuestionIndex: 0,
      answers: new Map(),
      templateContext: {},
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Update state answers
   */
  updateAnswer(state: LegacyWorkflowState, questionId: string, answer: any): LegacyWorkflowState {
    state.answers.set(questionId, answer);
    state.lastUpdated = new Date();
    return state;
  }

  /**
   * Advance to next step
   */
  advanceStep(state: LegacyWorkflowState, nextStep: WorkflowStep): LegacyWorkflowState {
    state.currentStep = nextStep;
    state.currentQuestionIndex = 0;
    state.lastUpdated = new Date();
    return state;
  }
}
