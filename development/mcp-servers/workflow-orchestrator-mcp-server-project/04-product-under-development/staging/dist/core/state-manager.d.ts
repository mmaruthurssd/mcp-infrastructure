/**
 * Generic State Manager for Workflow Orchestration
 *
 * Handles reading, writing, and validating workflow state files.
 * Supports both generic WorkflowState<T> and backwards-compatible ProjectState.
 */
import { WorkflowState } from '../types/workflow-state.js';
import { ProjectState } from '../types/project-state.js';
export declare class StateManager {
    /**
     * Read generic workflow state from disk
     */
    static readWorkflow<T = any>(projectPath: string): WorkflowState<T> | null;
    /**
     * Write generic workflow state to disk
     */
    static writeWorkflow<T = any>(projectPath: string, state: WorkflowState<T>): boolean;
    /**
     * Get the full path to the state file
     */
    static getStatePath(projectPath: string): string;
    /**
     * Get the state directory path
     */
    static getStateDir(projectPath: string): string;
    /**
     * Check if state file exists
     */
    static exists(projectPath: string): boolean;
    /**
     * Read project state
     * Returns null if state doesn't exist or is invalid
     */
    static read(projectPath: string): ProjectState | null;
    /**
     * Write project state
     */
    static write(projectPath: string, state: ProjectState): boolean;
    /**
     * Initialize state with default values
     */
    static initialize(projectPath: string, projectName: string): ProjectState;
    /**
     * Get or initialize state
     * Returns existing state or creates new one if it doesn't exist
     */
    static getOrInitialize(projectPath: string, projectName?: string): ProjectState;
    /**
     * Update a field in the state
     */
    static update(projectPath: string, updater: (state: ProjectState) => ProjectState): ProjectState | null;
    /**
     * Validate state structure
     */
    private static validate;
    /**
     * Reset state to default
     */
    static reset(projectPath: string): ProjectState;
    /**
     * Delete state file
     */
    static delete(projectPath: string): boolean;
    /**
     * Create a backup of the state file
     */
    static backup(projectPath: string): string | null;
}
//# sourceMappingURL=state-manager.d.ts.map