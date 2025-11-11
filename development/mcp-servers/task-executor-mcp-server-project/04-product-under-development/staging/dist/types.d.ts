/**
 * Core type definitions for Task Executor MCP Server
 */
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'verified';
export type WorkflowStatus = 'active' | 'completed' | 'archived';
export type VerificationStatus = 'passed' | 'verified' | 'partial' | 'failed';
export interface TaskInput {
    description: string;
    estimatedHours?: number;
}
export interface Task {
    id: string;
    description: string;
    status: TaskStatus;
    complexity?: {
        score: number;
        level: string;
        emoji: string;
    };
    estimatedHours?: number;
    startedAt?: Date;
    completedAt?: Date;
    verifiedAt?: Date;
    notes?: string;
    verification?: {
        status: VerificationStatus;
        evidence: string[];
        concerns: string[];
        recommendations: string[];
    };
}
export interface WorkflowContext {
    phiHandling?: boolean;
    category?: string;
    estimatedHours?: number;
}
export interface WorkflowDocumentation {
    existing: string[];
    needsUpdate: string[];
    updated: string[];
}
export interface WorkflowMetadata {
    totalTasks: number;
    completedTasks: number;
    verifiedTasks: number;
    percentComplete: number;
    lastUpdated: Date;
}
export interface WorkflowState {
    name: string;
    created: Date;
    projectPath: string;
    status: WorkflowStatus;
    tasks: Task[];
    constraints: string[];
    context: WorkflowContext;
    documentation: WorkflowDocumentation;
    metadata: WorkflowMetadata;
}
export interface CreateWorkflowInput {
    name: string;
    projectPath: string;
    tasks: TaskInput[];
    constraints?: string[];
    context?: WorkflowContext;
}
export interface CreateWorkflowOutput {
    success: boolean;
    workflowPath?: string;
    summary?: {
        totalTasks: number;
        estimatedHours: number;
        complexityScores: number[];
    };
    error?: string;
}
export interface CompleteTaskInput {
    projectPath: string;
    workflowName: string;
    taskId: string;
    notes?: string;
    skipVerification?: boolean;
    runValidation?: boolean;
}
export interface CompleteTaskOutput {
    success: boolean;
    verification?: {
        status: VerificationStatus;
        evidence: string[];
        concerns: string[];
        recommendations: string[];
    };
    progress?: {
        completed: number;
        total: number;
        percentComplete: number;
    };
    error?: string;
}
export interface GetWorkflowStatusInput {
    projectPath: string;
    workflowName: string;
}
export interface GetWorkflowStatusOutput {
    success: boolean;
    workflow?: {
        name: string;
        created: Date;
        status: WorkflowStatus;
        progress: string;
        nextTask?: string;
        constraintsStatus: string;
    };
    tasks?: Array<{
        id: string;
        description: string;
        status: TaskStatus;
        complexity?: {
            score: number;
            level: string;
            emoji: string;
        };
    }>;
    documentation?: WorkflowDocumentation;
    error?: string;
}
export interface ArchiveWorkflowInput {
    projectPath: string;
    workflowName: string;
    force?: boolean;
    checkDeploymentReadiness?: boolean;
}
export interface ArchiveWorkflowOutput {
    success: boolean;
    validation?: {
        allTasksComplete: boolean;
        allConstraintsMet: boolean;
        documentationUpdated: boolean;
        noTempFiles: boolean;
    };
    archivePath?: string;
    deploymentReadiness?: {
        ready: boolean;
        checks: {
            build?: {
                passed: boolean;
                output?: string;
                error?: string;
            };
            tests?: {
                passed: boolean;
                output?: string;
                error?: string;
            };
            health?: {
                passed: boolean;
                details?: string[];
            };
        };
        recommendations: string[];
        deploymentEligible: boolean;
    };
    error?: string;
}
export interface VerificationReport {
    status: VerificationStatus;
    evidence: string[];
    concerns: string[];
    recommendations: string[];
}
//# sourceMappingURL=types.d.ts.map