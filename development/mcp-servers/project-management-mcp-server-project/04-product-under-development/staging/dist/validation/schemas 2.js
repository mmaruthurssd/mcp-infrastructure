/**
 * Zod validation schemas for hierarchical entities
 *
 * @module validation/schemas
 * @description Runtime validation schemas for all 7 hierarchical entity types
 */
import { z } from 'zod';
// ============================================================================
// SHARED SCHEMAS
// ============================================================================
/**
 * Version information schema
 */
export const VersionInfoSchema = z.object({
    version: z.string().min(1, 'Version is required'),
    lastModified: z.string().datetime('Invalid datetime format'),
    modifiedBy: z.string().optional(),
    changeDescription: z.string().optional(),
});
/**
 * Version history entry schema
 */
export const VersionHistoryEntrySchema = z.object({
    version: z.string().min(1, 'Version is required'),
    date: z.string().datetime('Invalid datetime format'),
    changes: z.array(z.string()).min(1, 'At least one change is required'),
    modifiedBy: z.string().optional(),
});
/**
 * Progress information schema
 */
export const ProgressInfoSchema = z.object({
    percentage: z.number().min(0, 'Percentage must be >= 0').max(100, 'Percentage must be <= 100'),
    status: z.enum(['not-started', 'planning', 'in-progress', 'blocked', 'on-hold', 'completed']),
    completedItems: z.number().min(0, 'Completed items must be >= 0'),
    totalItems: z.number().min(0, 'Total items must be >= 0'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    breakdown: z.record(z.string(), z.any()).optional(),
}).refine(data => data.completedItems <= data.totalItems, {
    message: 'Completed items cannot exceed total items',
    path: ['completedItems'],
});
/**
 * Priority levels
 */
export const PrioritySchema = z.enum(['High', 'Medium', 'Low']);
/**
 * Goal tier
 */
export const GoalTierSchema = z.enum(['Now', 'Next', 'Later', 'Someday']);
/**
 * Impact level
 */
export const ImpactLevelSchema = z.enum(['High', 'Medium', 'Low']);
/**
 * Effort level
 */
export const EffortLevelSchema = z.enum(['High', 'Medium', 'Low']);
/**
 * Risk schema
 */
export const RiskSchema = z.object({
    description: z.string().min(1, 'Risk description is required'),
    severity: z.enum(['High', 'Medium', 'Low']),
    mitigation: z.string().optional(),
});
/**
 * Stakeholder schema
 */
export const StakeholderSchema = z.object({
    name: z.string().min(1, 'Stakeholder name is required'),
    role: z.string().min(1, 'Stakeholder role is required'),
    influence: z.enum(['High', 'Medium', 'Low']),
    interest: z.enum(['High', 'Medium', 'Low']),
    concerns: z.array(z.string()).optional(),
});
/**
 * Milestone schema
 */
export const MilestoneSchema = z.object({
    name: z.string().min(1, 'Milestone name is required'),
    description: z.string().optional(),
    targetDate: z.string().optional(),
    status: z.enum(['not-started', 'in-progress', 'completed', 'blocked']),
    dependencies: z.array(z.string()).optional(),
});
// ============================================================================
// LEVEL 2: PROJECT OVERVIEW
// ============================================================================
/**
 * Project vision schema
 */
const ProjectVisionSchema = z.object({
    statement: z.string().min(10, 'Vision statement must be at least 10 characters'),
    goals: z.array(z.string()).min(1, 'At least one goal is required'),
    targetAudience: z.array(z.string()).optional(),
    keyOutcomes: z.array(z.string()).optional(),
});
/**
 * Project constraints schema
 */
const ProjectConstraintsSchema = z.object({
    timeline: z.string().optional(),
    budget: z.string().optional(),
    resources: z.array(z.string()).optional(),
    technical: z.array(z.string()).optional(),
    regulatory: z.array(z.string()).optional(),
});
/**
 * Project resources schema
 */
const ProjectResourcesSchema = z.object({
    team: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    budget: z.string().optional(),
    externalPartners: z.array(z.string()).optional(),
});
/**
 * Component reference schema
 */
const ComponentReferenceSchema = z.object({
    id: z.string().min(1, 'Component ID is required'),
    name: z.string().min(1, 'Component name is required'),
    description: z.string().optional(),
    folderPath: z.string().min(1, 'Folder path is required'),
});
/**
 * PROJECT OVERVIEW entity schema (Level 2)
 */
export const ProjectOverviewSchema = z.object({
    id: z.string().min(1, 'Project ID is required'),
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().min(10, 'Project description must be at least 10 characters'),
    versionInfo: VersionInfoSchema,
    versionHistory: z.array(VersionHistoryEntrySchema).optional(),
    vision: ProjectVisionSchema,
    constraints: ProjectConstraintsSchema.optional(),
    stakeholders: z.array(StakeholderSchema).optional(),
    resources: ProjectResourcesSchema.optional(),
    components: z.array(ComponentReferenceSchema).min(1, 'At least one component is required'),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    status: z.enum(['planning', 'active', 'on-hold', 'completed', 'archived']),
    filePath: z.string().min(1, 'File path is required'),
}).refine(data => new Date(data.createdAt) <= new Date(data.lastUpdated), {
    message: 'lastUpdated must be >= createdAt',
    path: ['lastUpdated'],
});
// ============================================================================
// LEVEL 3: COMPONENT
// ============================================================================
/**
 * Component dependency schema
 */
const ComponentDependencySchema = z.object({
    componentId: z.string().min(1, 'Component ID is required'),
    componentName: z.string().min(1, 'Component name is required'),
    dependencyType: z.enum(['required', 'optional', 'blocking']),
    description: z.string().optional(),
});
/**
 * Sub-Area reference schema
 */
const SubAreaReferenceSchema = z.object({
    id: z.string().min(1, 'Sub-area ID is required'),
    name: z.string().min(1, 'Sub-area name is required'),
    description: z.string().optional(),
    folderPath: z.string().min(1, 'Folder path is required'),
});
/**
 * Major Goal reference schema
 */
const MajorGoalReferenceSchema = z.object({
    id: z.string().min(1, 'Goal ID is required'),
    name: z.string().min(1, 'Goal name is required'),
    description: z.string().optional(),
    priority: PrioritySchema,
    tier: GoalTierSchema,
    folderPath: z.string().min(1, 'Folder path is required'),
});
/**
 * COMPONENT entity schema (Level 3)
 */
export const ComponentSchema = z.object({
    id: z.string().min(1, 'Component ID is required'),
    name: z.string().min(3, 'Component name must be at least 3 characters'),
    description: z.string().min(10, 'Component description must be at least 10 characters'),
    projectId: z.string().min(1, 'Project ID is required'),
    purpose: z.string().optional(),
    scope: z.string().optional(),
    subAreas: z.array(SubAreaReferenceSchema).optional(),
    majorGoals: z.array(MajorGoalReferenceSchema).optional(),
    dependencies: z.array(ComponentDependencySchema).optional(),
    risks: z.array(RiskSchema).optional(),
    successCriteria: z.array(z.string()).optional(),
    progress: ProgressInfoSchema.optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    status: z.enum(['planning', 'active', 'on-hold', 'completed']),
    folderPath: z.string().min(1, 'Folder path is required'),
    overviewFilePath: z.string().min(1, 'Overview file path is required'),
});
// ============================================================================
// LEVEL 4: SUB-AREA
// ============================================================================
/**
 * SUB-AREA entity schema (Level 4)
 */
export const SubAreaSchema = z.object({
    id: z.string().min(1, 'Sub-area ID is required'),
    name: z.string().min(3, 'Sub-area name must be at least 3 characters'),
    description: z.string().min(10, 'Sub-area description must be at least 10 characters'),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    purpose: z.string().optional(),
    scope: z.string().optional(),
    majorGoals: z.array(MajorGoalReferenceSchema).optional(),
    progress: ProgressInfoSchema.optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    status: z.enum(['planning', 'active', 'on-hold', 'completed']),
    folderPath: z.string().min(1, 'Folder path is required'),
});
// ============================================================================
// LEVEL 5: MAJOR GOAL
// ============================================================================
/**
 * Goal dependency schema
 */
const GoalDependencySchema = z.object({
    goalId: z.string().min(1, 'Goal ID is required'),
    goalName: z.string().min(1, 'Goal name is required'),
    dependencyType: z.enum(['required', 'optional', 'blocking']),
    description: z.string().optional(),
});
/**
 * Sub-Goal reference schema
 */
const SubGoalReferenceSchema = z.object({
    id: z.string().min(1, 'Sub-goal ID is required'),
    name: z.string().min(1, 'Sub-goal name is required'),
    description: z.string().optional(),
    folderPath: z.string().min(1, 'Folder path is required'),
});
/**
 * MAJOR GOAL entity schema (Level 5)
 */
export const MajorGoalSchema = z.object({
    id: z.string().min(1, 'Goal ID is required'),
    name: z.string().min(3, 'Goal name must be at least 3 characters'),
    description: z.string().min(10, 'Goal description must be at least 10 characters'),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    subAreaId: z.string().optional(),
    priority: PrioritySchema,
    tier: GoalTierSchema,
    impact: ImpactLevelSchema,
    effort: EffortLevelSchema,
    problem: z.string().min(10, 'Problem statement must be at least 10 characters'),
    expectedValue: z.string().min(10, 'Expected value must be at least 10 characters'),
    successCriteria: z.array(z.string()).min(1, 'At least one success criterion is required'),
    dependencies: z.array(GoalDependencySchema).optional(),
    risks: z.array(RiskSchema).optional(),
    alternatives: z.array(z.string()).optional(),
    subGoals: z.array(SubGoalReferenceSchema).optional(),
    progress: ProgressInfoSchema.optional(),
    timeEstimate: z.string().optional(),
    targetDate: z.string().optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    status: z.enum(['planning', 'not-started', 'in-progress', 'blocked', 'on-hold', 'completed']),
    owner: z.string().optional(),
    folderPath: z.string().min(1, 'Folder path is required'),
    goalFilePath: z.string().min(1, 'Goal file path is required'),
    statusFilePath: z.string().min(1, 'Status file path is required'),
});
// ============================================================================
// LEVEL 6: SUB-GOAL
// ============================================================================
/**
 * MCP handoff info schema
 */
const MCPHandoffInfoSchema = z.object({
    targetMCP: z.enum(['spec-driven', 'task-executor']),
    handoffType: z.enum(['goal-to-spec', 'spec-to-tasks', 'task-completion', 'subgoal-completion', 'progress-update']),
    payload: z.any().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
    lastHandoff: z.string().datetime('Invalid datetime format').optional(),
});
/**
 * Task Workflow reference schema
 */
const TaskWorkflowReferenceSchema = z.object({
    id: z.string().min(1, 'Workflow ID is required'),
    name: z.string().min(1, 'Workflow name is required'),
    description: z.string().optional(),
    workflowPath: z.string().min(1, 'Workflow path is required'),
});
/**
 * SUB-GOAL entity schema (Level 6)
 */
export const SubGoalSchema = z.object({
    id: z.string().min(1, 'Sub-goal ID is required'),
    name: z.string().min(3, 'Sub-goal name must be at least 3 characters'),
    description: z.string().min(10, 'Sub-goal description must be at least 10 characters'),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    majorGoalId: z.string().min(1, 'Major goal ID is required'),
    subAreaId: z.string().optional(),
    deliverables: z.array(z.string()).optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    taskWorkflows: z.array(TaskWorkflowReferenceSchema).optional(),
    mcpHandoff: MCPHandoffInfoSchema.optional(),
    progress: ProgressInfoSchema.optional(),
    timeEstimate: z.string().optional(),
    targetDate: z.string().optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    status: z.enum(['planning', 'not-started', 'in-progress', 'blocked', 'completed']),
    owner: z.string().optional(),
    folderPath: z.string().min(1, 'Folder path is required'),
    subGoalFilePath: z.string().min(1, 'Sub-goal file path is required'),
    specPath: z.string().optional(),
});
// ============================================================================
// LEVEL 7: TASK WORKFLOW & TASK
// ============================================================================
/**
 * TASK entity schema (Level 7 - granular)
 */
export const TaskSchema = z.object({
    id: z.string().min(1, 'Task ID is required'),
    description: z.string().min(5, 'Task description must be at least 5 characters'),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    majorGoalId: z.string().min(1, 'Major goal ID is required'),
    subGoalId: z.string().min(1, 'Sub-goal ID is required'),
    workflowId: z.string().min(1, 'Workflow ID is required'),
    status: z.enum(['pending', 'in-progress', 'completed', 'blocked', 'skipped']),
    complexity: z.enum(['trivial', 'simple', 'moderate', 'complex']).optional(),
    estimatedHours: z.number().min(0, 'Estimated hours must be >= 0').optional(),
    actualHours: z.number().min(0, 'Actual hours must be >= 0').optional(),
    assignedTo: z.string().optional(),
    blockers: z.array(z.string()).optional(),
    notes: z.string().optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    completedAt: z.string().datetime('Invalid datetime format').optional(),
});
/**
 * TASK WORKFLOW entity schema (Level 7 - container)
 */
export const TaskWorkflowSchema = z.object({
    id: z.string().min(1, 'Workflow ID is required'),
    name: z.string().min(3, 'Workflow name must be at least 3 characters'),
    description: z.string().optional(),
    projectId: z.string().min(1, 'Project ID is required'),
    componentId: z.string().min(1, 'Component ID is required'),
    majorGoalId: z.string().min(1, 'Major goal ID is required'),
    subGoalId: z.string().min(1, 'Sub-goal ID is required'),
    tasks: z.array(TaskSchema).min(1, 'At least one task is required'),
    mcpHandoff: MCPHandoffInfoSchema.optional(),
    progress: ProgressInfoSchema.optional(),
    constraints: z.array(z.string()).optional(),
    createdAt: z.string().datetime('Invalid datetime format'),
    lastUpdated: z.string().datetime('Invalid datetime format'),
    completedAt: z.string().datetime('Invalid datetime format').optional(),
    status: z.enum(['active', 'paused', 'completed', 'archived']),
    workflowPath: z.string().min(1, 'Workflow path is required'),
});
//# sourceMappingURL=schemas.js.map