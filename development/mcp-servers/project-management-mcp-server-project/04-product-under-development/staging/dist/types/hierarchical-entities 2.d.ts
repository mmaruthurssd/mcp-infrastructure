/**
 * Hierarchical Planning Entities for Project Management MCP Server v1.0.0
 *
 * Defines the 7-level hierarchy:
 * 1. Initial Inputs (conversation data)
 * 2. PROJECT OVERVIEW (vision, components, constraints)
 * 3. Components (domain areas)
 * 4. Sub-Areas (focus areas within components)
 * 5. Major Goals (strategic objectives - Project Management MCP)
 * 6. Sub-Goals (tactical plans - Spec-Driven MCP)
 * 7. Tasks (execution - Task Executor MCP)
 */
/**
 * Version information for version-aware documents
 */
export interface VersionInfo {
    version: number;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
    changeDescription?: string;
}
/**
 * Version history entry
 */
export interface VersionHistoryEntry {
    version: number;
    date: string;
    changes: string[];
    impactedComponents?: string[];
    cascadeRequired?: boolean;
}
/**
 * Progress tracking for any hierarchical entity
 */
export interface ProgressInfo {
    percentage: number;
    status: ProgressStatus;
    lastUpdated: string;
    completedItems: number;
    totalItems: number;
    breakdown?: ProgressBreakdown;
}
export type ProgressStatus = 'not-started' | 'planning' | 'in-progress' | 'blocked' | 'on-hold' | 'completed' | 'cancelled';
/**
 * Detailed progress breakdown by sub-entities
 */
export interface ProgressBreakdown {
    [entityId: string]: {
        name: string;
        progress: number;
        status: ProgressStatus;
    };
}
/**
 * Priority levels across all hierarchical levels
 */
export type Priority = 'high' | 'medium' | 'low';
/**
 * Goal tiers for strategic planning
 */
export type GoalTier = 'now' | 'next' | 'later' | 'someday';
/**
 * Effort estimates
 */
export type EffortLevel = 'high' | 'medium' | 'low';
/**
 * Impact levels
 */
export type ImpactLevel = 'high' | 'medium' | 'low';
/**
 * MCP handoff protocol data structure
 */
export interface MCPHandoff {
    sourceContext: MCPHandoffContext;
    targetMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
    handoffType: HandoffType;
    payload: any;
    metadata: HandoffMetadata;
}
export type HandoffType = 'goal-to-spec' | 'spec-to-tasks' | 'task-completion' | 'subgoal-completion' | 'progress-update';
export interface MCPHandoffContext {
    projectPath: string;
    componentId?: string;
    majorGoalId?: string;
    subGoalId?: string;
    workflowId?: string;
}
export interface HandoffMetadata {
    timestamp: string;
    handoffId: string;
    version: string;
    retryCount?: number;
    errorMessage?: string;
}
/**
 * PROJECT OVERVIEW - The single source of truth for project vision
 *
 * This is the top-level entity that defines the entire project.
 * Contains vision, constraints, stakeholders, and components.
 */
export interface ProjectOverview {
    id: string;
    name: string;
    description: string;
    versionInfo: VersionInfo;
    versionHistory: VersionHistoryEntry[];
    vision: ProjectVision;
    constraints: ProjectConstraints;
    stakeholders: Stakeholder[];
    resources: ProjectResources;
    components: ComponentReference[];
    createdAt: string;
    lastUpdated: string;
    status: ProjectStatus;
    filePath: string;
}
export interface ProjectVision {
    missionStatement: string;
    successCriteria: string[];
    scope: {
        inScope: string[];
        outOfScope: string[];
    };
    risks: Risk[];
}
export interface ProjectConstraints {
    timeline: {
        startDate?: string;
        targetEndDate?: string;
        milestones: Milestone[];
    };
    budget?: {
        available: string;
        allocated: string;
    };
    resources: {
        team: string[];
        tools: string[];
        technologies: string[];
    };
}
export interface Stakeholder {
    name: string;
    role: string;
    influence: 'very-high' | 'high' | 'medium' | 'low';
    interest: 'very-high' | 'high' | 'medium' | 'low';
    concerns: string[];
    communication: string;
}
export interface ProjectResources {
    existingAssets: string[];
    neededAssets: string[];
    externalDependencies: string[];
}
export interface Risk {
    id: string;
    description: string;
    impact: 'very-high' | 'high' | 'medium' | 'low';
    probability: 'very-high' | 'high' | 'medium' | 'low';
    mitigation: string;
}
export interface Milestone {
    name: string;
    description: string;
    targetDate: string;
    deliverables: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'missed';
}
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
/**
 * Component reference (lightweight, full component data stored separately)
 */
export interface ComponentReference {
    id: string;
    name: string;
    description: string;
    filePath: string;
    progress?: ProgressInfo;
}
/**
 * COMPONENT - A major domain area within the project
 *
 * Examples: "Marketing", "Engineering", "Legal", "Data Model & Architecture"
 * Contains sub-areas and major goals.
 */
export interface Component {
    id: string;
    name: string;
    description: string;
    projectId: string;
    versionInfo: VersionInfo;
    subAreas: SubAreaReference[];
    majorGoals: MajorGoalReference[];
    purpose: string;
    successCriteria: string[];
    dependencies: ComponentDependency[];
    risks: Risk[];
    progress: ProgressInfo;
    createdAt: string;
    lastUpdated: string;
    status: ComponentStatus;
    folderPath: string;
    overviewFilePath: string;
}
export interface ComponentDependency {
    componentId: string;
    componentName: string;
    dependencyType: 'blocks' | 'influences' | 'integrates-with';
    description: string;
}
export type ComponentStatus = 'not-started' | 'planning' | 'in-progress' | 'completed';
export interface SubAreaReference {
    id: string;
    name: string;
    description: string;
    folderPath: string;
}
export interface MajorGoalReference {
    id: string;
    name: string;
    priority: Priority;
    tier: GoalTier;
    progress?: ProgressInfo;
    filePath: string;
}
/**
 * SUB-AREA - A focus area within a component (optional organizational level)
 *
 * Examples within "Marketing" component:
 * - "Website Marketing"
 * - "Social Media"
 * - "Email Campaigns"
 *
 * Sub-areas are optional - components can contain major goals directly.
 */
export interface SubArea {
    id: string;
    name: string;
    description: string;
    projectId: string;
    componentId: string;
    majorGoals: MajorGoalReference[];
    folderPath: string;
}
/**
 * MAJOR GOAL - A strategic objective (weeks-months timeframe)
 *
 * Owned by Project Management MCP.
 * Decomposed into sub-goals by Spec-Driven MCP.
 */
export interface MajorGoal {
    id: string;
    name: string;
    description: string;
    projectId: string;
    componentId: string;
    subAreaId?: string;
    priority: Priority;
    tier: GoalTier;
    impact: ImpactLevel;
    effort: EffortLevel;
    problem: string;
    expectedValue: string;
    successCriteria: string[];
    dependencies: GoalDependency[];
    risks: Risk[];
    alternatives: string[];
    subGoals: SubGoalReference[];
    progress: ProgressInfo;
    timeEstimate: string;
    targetDate?: string;
    createdAt: string;
    lastUpdated: string;
    status: GoalStatus;
    owner?: string;
    folderPath: string;
    goalFilePath: string;
    statusFilePath: string;
    handoffInfo?: MCPHandoffInfo;
}
export interface GoalDependency {
    goalId: string;
    goalName: string;
    dependencyType: 'blocks' | 'influences';
    description: string;
}
export type GoalStatus = 'planning' | 'not-started' | 'in-progress' | 'blocked' | 'on-hold' | 'completed' | 'cancelled';
export interface SubGoalReference {
    id: string;
    name: string;
    progress?: ProgressInfo;
    folderPath: string;
    specFilePath?: string;
}
/**
 * SUB-GOAL - A tactical plan (days-weeks timeframe)
 *
 * Owned by Spec-Driven MCP.
 * Decomposed into task workflows by Task Executor MCP.
 */
export interface SubGoal {
    id: string;
    name: string;
    description: string;
    projectId: string;
    componentId: string;
    majorGoalId: string;
    specification?: string;
    acceptanceCriteria: string[];
    technicalNotes?: string;
    taskWorkflows: TaskWorkflowReference[];
    progress: ProgressInfo;
    timeEstimate: string;
    createdAt: string;
    lastUpdated: string;
    status: GoalStatus;
    folderPath: string;
    specFilePath?: string;
    handoffInfo?: MCPHandoffInfo;
}
/**
 * Handoff tracking information for MCP communication
 *
 * Enhanced in v1.0.0 to support comprehensive handoff protocol
 */
export interface MCPHandoffInfo {
    handoffId: string;
    timestamp: string;
    sourceMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
    targetMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
    handoffType: HandoffType;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
    errorMessage?: string;
    errorCode?: string;
    sentAt?: string;
    receivedAt?: string;
    completedAt?: string;
    processingTimeMs?: number;
    retryCount?: number;
    lastRetryAt?: string;
    resultSummary?: string;
    entitiesCreated?: number;
    entitiesUpdated?: number;
}
export interface TaskWorkflowReference {
    workflowId: string;
    workflowName: string;
    progress?: ProgressInfo;
    workflowPath: string;
}
/**
 * TASK WORKFLOW - A workflow containing multiple tasks
 *
 * Owned by Task Executor MCP.
 * Represents the actual execution work.
 */
export interface TaskWorkflow {
    workflowId: string;
    workflowName: string;
    projectId: string;
    componentId: string;
    majorGoalId: string;
    subGoalId: string;
    tasks: Task[];
    progress: ProgressInfo;
    createdAt: string;
    lastUpdated: string;
    status: 'pending' | 'in-progress' | 'completed';
    workflowPath: string;
    handoffInfo?: MCPHandoffInfo;
}
/**
 * TASK - An individual execution task (hours-days timeframe)
 *
 * Owned by Task Executor MCP.
 * Smallest unit of work.
 */
export interface Task {
    taskId: string;
    description: string;
    estimatedHours?: number;
    actualHours?: number;
    notes?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'blocked';
    completedAt?: string;
    blockedReason?: string;
    verified: boolean;
    verificationNotes?: string;
}
/**
 * Type guard to check if an entity has progress tracking
 */
export declare function hasProgress(entity: any): entity is {
    progress: ProgressInfo;
};
/**
 * Calculate aggregate progress from child entities
 */
export interface ProgressAggregationResult {
    percentage: number;
    completedItems: number;
    totalItems: number;
    status: ProgressStatus;
    breakdown: ProgressBreakdown;
}
/**
 * Version cascade update result
 */
export interface CascadeUpdateResult {
    updated: string[];
    failed: string[];
    warnings: string[];
}
//# sourceMappingURL=hierarchical-entities%202.d.ts.map