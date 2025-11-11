/**
 * State Manager - Persists workflow state to disk
 */
import { WorkflowState, Scenario, WorkflowStep } from '../types.js';
export declare class StateManager {
    private stateDir;
    constructor(baseDir?: string);
    private ensureStateDir;
    private getStateFilePath;
    /**
     * Save workflow state to disk
     */
    save(state: WorkflowState): void;
    /**
     * Load workflow state from disk
     */
    load(projectPath: string): WorkflowState | null;
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
        state: WorkflowState;
    }>;
    /**
     * Create a new workflow state
     */
    createNew(projectPath: string, scenario: Scenario): WorkflowState;
    /**
     * Update state answers
     */
    updateAnswer(state: WorkflowState, questionId: string, answer: any): WorkflowState;
    /**
     * Advance to next step
     */
    advanceStep(state: WorkflowState, nextStep: WorkflowStep): WorkflowState;
}
//# sourceMappingURL=state-manager.d.ts.map