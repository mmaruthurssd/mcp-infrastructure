/**
 * Generic Workflow State Interface
 *
 * Defines the common structure for all workflow orchestration state.
 * The generic type T allows for workflow-specific custom data.
 */
export interface WorkflowState<T = any> {
    version: string;
    workflowType: string;
    name: string;
    created: string;
    lastUpdated: string;
    currentPhase: string;
    currentStep: string;
    phases: Record<string, PhaseInfo>;
    customData: T;
}
export type PhaseStatus = 'pending' | 'in-progress' | 'complete';
export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'skipped';
export interface PhaseInfo {
    status: PhaseStatus;
    startedAt?: string;
    completedAt?: string;
    steps: StepInfo[];
}
export interface StepInfo {
    name: string;
    status: StepStatus;
    completedAt?: string;
}
/**
 * Workflow Definition Schema
 *
 * Defines the structure and phases for a workflow type.
 */
export interface WorkflowDefinition {
    type: string;
    version: string;
    phases: PhaseDefinition[];
}
export interface PhaseDefinition {
    name: string;
    steps: string[];
}
/**
 * Create a new WorkflowState with default values
 */
export declare function createDefaultWorkflowState<T>(workflowType: string, name: string, phases: Record<string, PhaseDefinition>, initialCustomData: T): WorkflowState<T>;
//# sourceMappingURL=workflow-state.d.ts.map