/**
 * MCP Handoff Protocol v1.0 - Type Definitions
 *
 * Defines JSON schemas for all inter-MCP communication between:
 * - Project Management MCP
 * - Spec-Driven MCP
 * - Task Executor MCP
 *
 * Protocol Version: 1.0.0
 * Created: 2025-10-27
 */
import { Priority, GoalTier, ImpactLevel, EffortLevel, GoalStatus, ProgressInfo, Risk, GoalDependency } from './hierarchical-entities';
/**
 * Base handoff structure - all handoffs extend this
 */
export interface BaseHandoff<TPayload = unknown> {
    version: string;
    handoffId: string;
    timestamp: string;
    sourceMCP: MCPIdentifier;
    targetMCP: MCPIdentifier;
    handoffType: HandoffType;
    context: HandoffContext;
    payload: TPayload;
    retryAttempt?: number;
    maxRetries?: number;
    previousHandoffId?: string;
}
export type MCPIdentifier = 'ai-planning' | 'spec-driven' | 'task-executor';
export type HandoffType = 'goal-to-spec' | 'spec-to-tasks' | 'task-completion' | 'subgoal-completion' | 'progress-update';
/**
 * Hierarchical context for handoffs
 */
export interface HandoffContext {
    projectPath: string;
    projectId: string;
    componentId: string;
    componentName: string;
    majorGoalId?: string;
    majorGoalName?: string;
    subGoalId?: string;
    workflowId?: string;
}
/**
 * Handoff from Project Management MCP to Spec-Driven MCP
 *
 * Triggered when: User promotes a major goal and wants to decompose it into sub-goals
 * Purpose: Provide Spec-Driven MCP with all context needed to create specifications
 */
export interface GoalToSpecHandoff extends BaseHandoff<GoalToSpecPayload> {
    handoffType: 'goal-to-spec';
    sourceMCP: 'ai-planning';
    targetMCP: 'spec-driven';
}
export interface GoalToSpecPayload {
    majorGoal: {
        id: string;
        name: string;
        description: string;
        priority: Priority;
        tier: GoalTier;
        impact: ImpactLevel;
        effort: EffortLevel;
    };
    details: {
        problem: string;
        expectedValue: string;
        successCriteria: string[];
        acceptanceCriteria?: string[];
        technicalConstraints?: string[];
    };
    dependencies: GoalDependency[];
    risks: Risk[];
    componentContext: {
        componentId: string;
        componentName: string;
        componentPurpose: string;
        subAreaId?: string;
        subAreaName?: string;
    };
    timeframe: {
        estimate: string;
        targetDate?: string;
    };
    targetPaths: {
        subGoalsFolder: string;
        specsFolder?: string;
    };
    preferences?: {
        numberOfSubGoals?: number;
        decompositionStrategy?: 'sequential' | 'parallel' | 'mixed';
        specificationDepth?: 'light' | 'medium' | 'comprehensive';
    };
}
/**
 * Handoff from Spec-Driven MCP to Task Executor MCP
 *
 * Triggered when: Spec-Driven has created sub-goal specs and wants executable workflows
 * Purpose: Provide Task Executor with all context needed to create task workflows
 */
export interface SpecToTasksHandoff extends BaseHandoff<SpecToTasksPayload> {
    handoffType: 'spec-to-tasks';
    sourceMCP: 'spec-driven';
    targetMCP: 'task-executor';
}
export interface SpecToTasksPayload {
    subGoal: {
        id: string;
        name: string;
        description: string;
        parentGoalId: string;
        parentGoalName: string;
    };
    specification: {
        acceptanceCriteria: string[];
        technicalRequirements?: string[];
        constraints?: string[];
        deliverables: string[];
    };
    taskGuidance: {
        estimatedTaskCount?: number;
        complexity: 'simple' | 'moderate' | 'complex';
        workflowType?: 'bug-fix' | 'feature' | 'refactor' | 'deployment' | 'research';
    };
    timeframe: {
        estimate: string;
        urgency?: 'low' | 'medium' | 'high' | 'urgent';
    };
    targetPaths: {
        workflowFolder: string;
        relatedFiles?: string[];
    };
    dependencies: {
        blockedBy?: string[];
        relatedWorkflows?: string[];
    };
}
/**
 * Handoff from Task Executor MCP to Spec-Driven MCP
 *
 * Triggered when: A task (or entire workflow) is completed
 * Purpose: Update sub-goal progress and check if sub-goal is complete
 */
export interface TaskCompletionHandoff extends BaseHandoff<TaskCompletionPayload> {
    handoffType: 'task-completion';
    sourceMCP: 'task-executor';
    targetMCP: 'spec-driven';
}
export interface TaskCompletionPayload {
    workflow: {
        workflowId: string;
        workflowName: string;
        subGoalId: string;
        majorGoalId: string;
    };
    completion: {
        completedTaskId?: string;
        allTasksComplete: boolean;
        completedAt: string;
        completedBy?: string;
    };
    progress: {
        tasksCompleted: number;
        totalTasks: number;
        percentage: number;
        currentStatus: 'in-progress' | 'completed' | 'blocked';
    };
    verification?: {
        verified: boolean;
        verificationMethod?: string;
        verificationNotes?: string;
    };
    deliverables?: {
        filesCreated?: string[];
        filesModified?: string[];
        testsAdded?: number;
        documentation?: string[];
    };
    issues?: {
        blockers?: string[];
        warnings?: string[];
        technicalDebt?: string[];
    };
}
/**
 * Handoff from Spec-Driven MCP to Project Management MCP
 *
 * Triggered when: A sub-goal (and all its task workflows) is completed
 * Purpose: Update major goal progress and check if major goal is complete
 */
export interface SubgoalCompletionHandoff extends BaseHandoff<SubgoalCompletionPayload> {
    handoffType: 'subgoal-completion';
    sourceMCP: 'spec-driven';
    targetMCP: 'ai-planning';
}
export interface SubgoalCompletionPayload {
    subGoal: {
        id: string;
        name: string;
        majorGoalId: string;
        majorGoalName: string;
    };
    completion: {
        completedAt: string;
        allCriteriaMetStatus: boolean;
        totalWorkflows: number;
        completedWorkflows: number;
    };
    majorGoalProgress: {
        subGoalsCompleted: number;
        totalSubGoals: number;
        percentage: number;
        suggestedStatus: GoalStatus;
    };
    outcomes: {
        deliverables: string[];
        successCriteriaMet: string[];
        learnings?: string[];
    };
    quality?: {
        testsAdded?: number;
        testsPassing?: number;
        codeReviewStatus?: 'pending' | 'approved' | 'changes-requested';
        documentationComplete?: boolean;
    };
}
/**
 * General progress update handoff (can go in any direction)
 *
 * Triggered when: Progress changes at any level and needs to bubble up
 * Purpose: Keep all hierarchy levels in sync with latest progress
 */
export interface ProgressUpdateHandoff extends BaseHandoff<ProgressUpdatePayload> {
    handoffType: 'progress-update';
}
export interface ProgressUpdatePayload {
    entity: {
        type: 'task-workflow' | 'sub-goal' | 'major-goal' | 'component' | 'project';
        id: string;
        name: string;
    };
    progress: ProgressInfo;
    trigger: {
        event: 'task-completed' | 'workflow-completed' | 'status-changed' | 'manual-update';
        triggeredBy?: string;
        relatedEntityId?: string;
    };
    propagation: {
        shouldBubbleUp: boolean;
        parentEntityType?: 'sub-goal' | 'major-goal' | 'component';
        parentEntityId?: string;
    };
}
/**
 * Standard response structure for all handoffs
 */
export interface HandoffResponse {
    handoffId: string;
    receivedAt: string;
    success: boolean;
    status: 'accepted' | 'processing' | 'completed' | 'failed' | 'rejected';
    result?: HandoffResult;
    error?: HandoffError;
    processedBy: MCPIdentifier;
    processingTime?: number;
}
export interface HandoffResult {
    created?: {
        entityType: string;
        entityId: string;
        filePath?: string;
    }[];
    updated?: {
        entityType: string;
        entityId: string;
        changes: string[];
    }[];
    nextSteps?: {
        description: string;
        suggestedAction?: string;
        nextHandoffType?: HandoffType;
    }[];
    metadata?: Record<string, unknown>;
}
export interface HandoffError {
    code: string;
    message: string;
    details?: string;
    recoverable: boolean;
    suggestedFix?: string;
}
/**
 * Validation result for handoff payloads
 */
export interface HandoffValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
}
export declare function isGoalToSpecHandoff(handoff: BaseHandoff): handoff is GoalToSpecHandoff;
export declare function isSpecToTasksHandoff(handoff: BaseHandoff): handoff is SpecToTasksHandoff;
export declare function isTaskCompletionHandoff(handoff: BaseHandoff): handoff is TaskCompletionHandoff;
export declare function isSubgoalCompletionHandoff(handoff: BaseHandoff): handoff is SubgoalCompletionHandoff;
export declare function isProgressUpdateHandoff(handoff: BaseHandoff): handoff is ProgressUpdateHandoff;
//# sourceMappingURL=handoff-protocol%202.d.ts.map