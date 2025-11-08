/**
 * Project State Type Definitions
 *
 * Defines the structure of .ai-planning/project-state.json
 */
export interface ProjectState {
    version: string;
    projectName: string;
    created: string;
    lastUpdated: string;
    currentPhase: WorkflowPhase;
    currentStep: string;
    phases: PhaseStatuses;
    goals: GoalTracking;
    integrations: IntegrationTracking;
}
export type WorkflowPhase = 'initialization' | 'goal-development' | 'execution' | 'completion';
export type PhaseStatus = 'pending' | 'in-progress' | 'complete';
export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'skipped';
export interface PhaseStatuses {
    initialization: PhaseInfo;
    'goal-development': PhaseInfo;
    execution: PhaseInfo;
    completion: PhaseInfo;
}
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
export interface GoalTracking {
    potential: string[];
    selected: string[];
    completed: string[];
}
export interface IntegrationTracking {
    specDriven: {
        used: boolean;
        lastHandoff: string | null;
        goalsWithSpecs: string[];
    };
    taskExecutor: {
        activeWorkflows: string[];
        lastCreated: string | null;
        totalWorkflowsCreated: number;
    };
}
/**
 * Default phase definitions with step sequences
 */
export declare const PHASE_DEFINITIONS: Record<WorkflowPhase, {
    steps: string[];
}>;
/**
 * Create a new ProjectState with default values
 */
export declare function createDefaultState(projectName: string): ProjectState;
//# sourceMappingURL=project-state%202.d.ts.map