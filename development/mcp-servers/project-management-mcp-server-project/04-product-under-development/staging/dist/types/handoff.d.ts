/**
 * MCP Handoff Protocol Types
 * Version 1.0
 *
 * Defines the structure for inter-MCP communication
 */
export type HandoffType = 'goal_to_spec' | 'spec_to_tasks' | 'task_completion' | 'progress_update' | 'subgoal_completion';
export type HandoffStatus = 'pending' | 'sent' | 'received' | 'completed' | 'failed' | 'rolled_back';
export interface HandoffMetadata {
    version: string;
    handoffId: string;
    handoffType: HandoffType;
    timestamp: string;
    sourceMcp: string;
    targetMcp: string;
    sourceProjectPath: string;
    targetProjectPath?: string;
    retryCount: number;
    status: HandoffStatus;
}
export interface GoalToSpecHandoff {
    goalId: string;
    goalName: string;
    goalDescription: string;
    goalContext: {
        impact: string;
        effort: string;
        tier: string;
        reasoning?: string;
    };
    autonomous?: {
        confidence: number;
        autonomyLevel: string;
        baseType: string;
    };
}
export interface SpecToTasksHandoff {
    specificationPath: string;
    goalId: string;
    goalName: string;
    tasks: Array<{
        description: string;
        estimatedHours?: number;
        dependencies?: string[];
    }>;
    parallelizationAnalysis?: {
        shouldParallelize: boolean;
        estimatedSpeedup: number;
        mode: 'parallel' | 'sequential';
        reasoning: string;
    };
}
export interface TaskCompletionHandoff {
    workflowName: string;
    goalId: string;
    completedTasks: number;
    totalTasks: number;
    completionPercentage: number;
    remainingWork?: string[];
    blockers?: string[];
}
export interface ProgressUpdateHandoff {
    goalId: string;
    phase: string;
    progressPercentage: number;
    milestones: Array<{
        name: string;
        status: 'completed' | 'in-progress' | 'pending';
        completedDate?: string;
    }>;
}
export interface Handoff<T = any> {
    metadata: HandoffMetadata;
    data: T;
    validation?: {
        schema: string;
        validated: boolean;
        validatedAt?: string;
    };
}
export interface HandoffResponse {
    handoffId: string;
    success: boolean;
    receivedAt: string;
    processedAt?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    result?: any;
}
export interface HandoffAuditEntry {
    handoffId: string;
    timestamp: string;
    action: 'created' | 'sent' | 'received' | 'completed' | 'failed' | 'retried' | 'rolled_back';
    metadata: HandoffMetadata;
    details?: string;
    error?: any;
}
//# sourceMappingURL=handoff.d.ts.map