/**
 * Workflow Manager - Core logic for managing task execution workflows
 */
import { WorkflowState, Task, CreateWorkflowInput, VerificationReport } from '../types.js';
export declare class WorkflowManager {
    /**
     * Get workflow directory path
     */
    private static getWorkflowPath;
    /**
     * Get state file path
     */
    private static getStateFilePath;
    /**
     * Create a new workflow
     */
    static create(input: CreateWorkflowInput): {
        success: boolean;
        workflowPath?: string;
        error?: string;
        summary?: any;
    };
    /**
     * Load workflow state
     */
    static loadState(projectPath: string, workflowName: string, archived?: boolean): WorkflowState | null;
    /**
     * Save workflow state
     */
    private static saveState;
    /**
     * Complete a task
     */
    static completeTask(projectPath: string, workflowName: string, taskId: string, notes?: string, skipVerification?: boolean): {
        success: boolean;
        task?: Task;
        progress?: any;
        verification?: VerificationReport;
        error?: string;
    };
    /**
     * Basic verification (will be enhanced with agent integration)
     */
    private static performBasicVerification;
    /**
     * Get workflow status
     */
    static getStatus(projectPath: string, workflowName: string): any;
    /**
     * Archive workflow
     */
    static archive(projectPath: string, workflowName: string, force?: boolean): any;
    /**
     * Detect existing documentation in project
     */
    private static detectDocumentation;
    /**
     * Get constraints status
     */
    private static getConstraintsStatus;
    /**
     * Generate plan.md file
     */
    private static generatePlan;
    /**
     * Get task status symbol
     */
    private static getTaskSymbol;
}
//# sourceMappingURL=workflow-manager.d.ts.map