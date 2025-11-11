/**
 * Workflow Manager V2 - Refactored to use workflow-orchestrator
 * Preserves all task-specific logic while using unified state management
 */
import { Task, CreateWorkflowInput, VerificationReport, WorkflowState as LegacyWorkflowState } from '../types.js';
export declare class WorkflowManager {
    /**
     * Get workflow directory path (PRESERVED - temp/archive pattern)
     */
    private static getWorkflowPath;
    /**
     * Get state file path
     */
    private static getStateFilePath;
    /**
     * Convert workflow-orchestrator state to legacy state format for backward compatibility
     */
    private static toLegacyState;
    /**
     * Convert legacy state to workflow-orchestrator format
     */
    private static fromLegacyState;
    /**
     * Create a new workflow (PRESERVES ALL TASK-SPECIFIC LOGIC)
     */
    static create(input: CreateWorkflowInput): {
        success: boolean;
        workflowPath?: string;
        workflow?: any;
        error?: string;
        summary?: any;
    };
    /**
     * Load workflow state
     */
    static loadState(projectPath: string, workflowName: string, archived?: boolean): LegacyWorkflowState | null;
    /**
     * Save workflow state
     */
    private static saveState;
    /**
     * Complete a task (PRESERVES ALL TASK-SPECIFIC LOGIC)
     * Enhanced with optional automated validation (build, test checks)
     */
    static completeTask(projectPath: string, workflowName: string, taskId: string, notes?: string, skipVerification?: boolean, runValidation?: boolean): Promise<{
        success: boolean;
        task?: Task;
        progress?: any;
        verification?: VerificationReport;
        error?: string;
    }>;
    /**
     * Basic verification (ENHANCED with automated validation)
     * Optionally runs build, test, and security checks via TaskValidation
     */
    private static performBasicVerification;
    /**
     * Get workflow status
     */
    static getStatus(projectPath: string, workflowName: string): any;
    /**
     * Archive workflow (PRESERVES TEMP→ARCHIVE LIFECYCLE)
     * Enhanced with optional deployment readiness checking
     */
    static archive(projectPath: string, workflowName: string, force?: boolean, checkDeploymentReadiness?: boolean): Promise<any>;
    /**
     * Detect existing documentation in project (PRESERVED)
     */
    private static detectDocumentation;
    /**
     * Get constraints status (PRESERVED)
     */
    private static getConstraintsStatus;
    /**
     * Generate plan.md file (PRESERVED)
     */
    private static generatePlan;
    /**
     * Get task status symbol (PRESERVED)
     */
    private static getTaskSymbol;
}
//# sourceMappingURL=workflow-manager-v2.d.ts.map