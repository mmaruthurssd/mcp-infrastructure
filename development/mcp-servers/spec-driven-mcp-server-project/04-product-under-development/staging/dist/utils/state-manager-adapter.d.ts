/**
 * State Manager Adapter
 * Adapts workflow-orchestrator StateManager for spec-driven workflows
 * Maintains backward compatibility with existing StateManager API
 */
import { Scenario, WorkflowStep } from '../types-extended.js';
import { WorkflowState as LegacyWorkflowState } from '../types.js';
/**
 * Adapter class that provides the same interface as the original StateManager
 * but uses workflow-orchestrator types under the hood
 */
export declare class StateManager {
    private stateDir;
    constructor(baseDir?: string);
    private ensureStateDir;
    private getStateFilePath;
    /**
     * Convert SpecDrivenWorkflowState to legacy WorkflowState
     */
    private toLegacyState;
    /**
     * Convert legacy WorkflowState to SpecDrivenWorkflowState structure
     */
    private fromLegacyState;
    /**
     * Map workflow step to phase
     */
    private getPhaseFromStep;
    /**
     * Save workflow state to disk
     */
    save(state: LegacyWorkflowState): void;
    /**
     * Load workflow state from disk
     */
    load(projectPath: string): LegacyWorkflowState | null;
    /**
     * Check if state exists for a project
     */
    exists(projectPath: string): boolean;
    /**
     * Delete workflow state
     */
    delete(projectPath: string): boolean;
    /**
     * List all active workflows
     */
    listWorkflows(): Array<{
        projectPath: string;
        state: LegacyWorkflowState;
    }>;
    /**
     * Create a new workflow state
     */
    createNew(projectPath: string, scenario: Scenario): LegacyWorkflowState;
    /**
     * Update state answers
     */
    updateAnswer(state: LegacyWorkflowState, questionId: string, answer: any): LegacyWorkflowState;
    /**
     * Advance to next step
     */
    advanceStep(state: LegacyWorkflowState, nextStep: WorkflowStep): LegacyWorkflowState;
}
//# sourceMappingURL=state-manager-adapter.d.ts.map