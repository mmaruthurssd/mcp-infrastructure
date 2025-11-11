/**
 * Hierarchical Utilities for Project Management MCP Server v1.0.0
 *
 * Provides utility functions for working with hierarchical entities:
 * - Progress aggregation (bubble up from children to parent)
 * - Parent-child navigation (traverse hierarchy)
 * - Relationship validation (ensure referential integrity)
 * - Cascade updates (propagate version changes)
 */
import type { ProgressInfo, ProgressStatus, ProgressBreakdown, ProgressAggregationResult, Component, MajorGoal, SubGoal, TaskWorkflow, Task, ProjectOverview } from '../types/hierarchical-entities.js';
/**
 * Calculate aggregate progress from child entities
 *
 * Uses simple average strategy for MVP. Each child entity contributes
 * equally to the parent's progress regardless of size/effort.
 *
 * @param childProgressList - Array of progress percentages (0-100)
 * @returns Aggregated progress percentage (0-100)
 *
 * @example
 * // 3 sub-goals: 100%, 50%, 0%
 * calculateAverageProgress([100, 50, 0]); // Returns 50
 */
export declare function calculateAverageProgress(childProgressList: number[]): number;
/**
 * Determine aggregate status from child entities
 *
 * Rules:
 * - If any child is blocked → parent is blocked
 * - If all children completed → parent is completed
 * - If all children not-started → parent is not-started
 * - If any child in-progress → parent is in-progress
 * - Priority: blocked > in-progress > planning > not-started > completed
 *
 * @param childStatusList - Array of child statuses
 * @returns Aggregated status for parent entity
 */
export declare function aggregateStatus(childStatusList: ProgressStatus[]): ProgressStatus;
/**
 * Build progress breakdown showing contribution of each child entity
 *
 * @param children - Array of child entities with progress info
 * @returns Progress breakdown object mapping child IDs to their progress
 */
export declare function buildProgressBreakdown(children: Array<{
    id: string;
    name: string;
    progress?: ProgressInfo;
}>): ProgressBreakdown;
/**
 * Calculate complete progress aggregation result from child entities
 *
 * This is the main function for aggregating progress from children to parent.
 * It calculates:
 * - Overall percentage (simple average)
 * - Aggregate status (based on child statuses)
 * - Completed/total counts
 * - Detailed breakdown
 *
 * @param children - Array of child entities with progress info
 * @returns Complete progress aggregation result
 *
 * @example
 * // Calculate major goal progress from sub-goals
 * const subGoals = [
 *   { id: '1.1', name: 'Sub-goal 1', progress: { percentage: 100, status: 'completed', ... } },
 *   { id: '1.2', name: 'Sub-goal 2', progress: { percentage: 50, status: 'in-progress', ... } },
 *   { id: '1.3', name: 'Sub-goal 3', progress: { percentage: 0, status: 'not-started', ... } },
 * ];
 * const result = aggregateProgress(subGoals);
 * // result.percentage === 50
 * // result.status === 'in-progress'
 * // result.completedItems === 1
 * // result.totalItems === 3
 */
export declare function aggregateProgress(children: Array<{
    id: string;
    name: string;
    progress?: ProgressInfo;
}>): ProgressAggregationResult;
/**
 * Calculate project-level progress from all components
 *
 * @param components - Array of components with progress info
 * @returns Project-level progress aggregation
 */
export declare function calculateProjectProgress(components: Array<{
    id: string;
    name: string;
    progress: ProgressInfo;
}>): ProgressAggregationResult;
/**
 * Calculate component-level progress from all major goals
 *
 * @param majorGoals - Array of major goals with progress info
 * @returns Component-level progress aggregation
 */
export declare function calculateComponentProgress(majorGoals: Array<{
    id: string;
    name: string;
    progress: ProgressInfo;
}>): ProgressAggregationResult;
/**
 * Calculate major goal progress from all sub-goals
 *
 * @param subGoals - Array of sub-goals with progress info
 * @returns Major goal-level progress aggregation
 */
export declare function calculateMajorGoalProgress(subGoals: Array<{
    id: string;
    name: string;
    progress?: ProgressInfo;
}>): ProgressAggregationResult;
/**
 * Calculate sub-goal progress from task workflows
 *
 * @param taskWorkflows - Array of task workflows with progress info
 * @returns Sub-goal-level progress aggregation
 */
export declare function calculateSubGoalProgress(taskWorkflows: Array<{
    workflowId: string;
    workflowName: string;
    progress?: ProgressInfo;
}>): ProgressAggregationResult;
/**
 * Calculate task workflow progress from individual tasks
 *
 * @param tasks - Array of tasks
 * @returns Task workflow-level progress aggregation
 */
export declare function calculateTaskWorkflowProgress(tasks: Task[]): ProgressAggregationResult;
/**
 * Create ProgressInfo object from aggregation result
 *
 * @param result - Progress aggregation result
 * @returns ProgressInfo object ready to be stored in entity
 */
export declare function createProgressInfo(result: ProgressAggregationResult): ProgressInfo;
/**
 * Example: Calculate full hierarchy progress from bottom to top
 *
 * This shows how to calculate progress at each level and bubble it up.
 * In a real implementation, this would read from actual files/database.
 */
export declare function calculateFullHierarchyProgress(projectOverview: ProjectOverview, components: Component[], majorGoals: MajorGoal[], subGoals: SubGoal[], taskWorkflows: TaskWorkflow[]): {
    projectProgress: ProgressAggregationResult;
    componentProgress: Record<string, ProgressAggregationResult>;
    goalProgress: Record<string, ProgressAggregationResult>;
    subGoalProgress: Record<string, ProgressAggregationResult>;
};
/**
 * Entity reference for navigation
 * Used when we only need ID and file path without loading full entity
 */
export interface EntityReference {
    id: string;
    name?: string;
    filePath?: string;
    folderPath?: string;
}
/**
 * Navigation context - tracks current position in hierarchy
 */
export interface NavigationContext {
    projectId: string;
    componentId?: string;
    subAreaId?: string;
    majorGoalId?: string;
    subGoalId?: string;
    workflowId?: string;
    taskId?: string;
}
/**
 * Build navigation context from any entity
 *
 * @param entity - Entity with hierarchy identifiers
 * @returns Navigation context object
 */
export declare function buildNavigationContext(entity: {
    projectId?: string;
    componentId?: string;
    subAreaId?: string;
    majorGoalId?: string;
    subGoalId?: string;
    workflowId?: string;
    taskId?: string;
}): NavigationContext;
/**
 * Get parent entity reference from child entity
 *
 * Given any entity, determine what its parent is and return reference.
 * Returns null if entity is at top level (PROJECT OVERVIEW).
 *
 * @param context - Navigation context for current entity
 * @returns Parent entity reference or null if at top level
 *
 * @example
 * // For a sub-goal
 * const context = { projectId: 'p1', componentId: 'c1', majorGoalId: 'g1', subGoalId: 's1' };
 * const parent = getParentReference(context);
 * // parent === { id: 'g1', type: 'major-goal' }
 */
export declare function getParentReference(context: NavigationContext): {
    id: string;
    type: 'project' | 'component' | 'sub-area' | 'major-goal' | 'sub-goal' | 'task-workflow';
} | null;
/**
 * Get full parent chain from entity to root
 *
 * Returns array of parent references from immediate parent to PROJECT OVERVIEW.
 *
 * @param context - Navigation context for current entity
 * @returns Array of parent references (nearest parent first)
 *
 * @example
 * // For a sub-goal in a component with sub-area
 * const context = {
 *   projectId: 'p1',
 *   componentId: 'c1',
 *   subAreaId: 'sa1',
 *   majorGoalId: 'g1',
 *   subGoalId: 's1'
 * };
 * const chain = getParentChain(context);
 * // Returns: [
 * //   { id: 'g1', type: 'major-goal' },
 * //   { id: 'sa1', type: 'sub-area' },
 * //   { id: 'c1', type: 'component' },
 * //   { id: 'p1', type: 'project' }
 * // ]
 */
export declare function getParentChain(context: NavigationContext): Array<{
    id: string;
    type: 'project' | 'component' | 'sub-area' | 'major-goal' | 'sub-goal' | 'task-workflow';
}>;
/**
 * Calculate depth of entity in hierarchy
 *
 * PROJECT OVERVIEW = depth 0
 * Component = depth 1
 * Sub-Area = depth 2 (optional)
 * Major Goal = depth 2 or 3 (depending on if sub-area exists)
 * Sub-Goal = depth 3 or 4
 * Task Workflow = depth 4 or 5
 * Task = depth 5 or 6
 *
 * @param context - Navigation context
 * @returns Depth in hierarchy (0-based)
 */
export declare function calculateEntityDepth(context: NavigationContext): number;
/**
 * Check if entity is ancestor of another entity
 *
 * @param ancestorContext - Potential ancestor context
 * @param descendantContext - Potential descendant context
 * @returns True if ancestor is actually an ancestor of descendant
 *
 * @example
 * const component = { projectId: 'p1', componentId: 'c1' };
 * const goal = { projectId: 'p1', componentId: 'c1', majorGoalId: 'g1' };
 * isAncestor(component, goal); // true
 */
export declare function isAncestor(ancestorContext: NavigationContext, descendantContext: NavigationContext): boolean;
/**
 * Find common ancestor of two entities
 *
 * @param context1 - First entity context
 * @param context2 - Second entity context
 * @returns Navigation context of common ancestor, or null if no common ancestor
 */
export declare function findCommonAncestor(context1: NavigationContext, context2: NavigationContext): NavigationContext | null;
import type { CascadeUpdateResult } from '../types/hierarchical-entities.js';
/**
 * Change impact assessment for cascade updates
 */
export interface ChangeImpact {
    entityType: 'project' | 'component' | 'major-goal';
    entityId: string;
    entityName: string;
    changeType: 'scope' | 'timeline' | 'resources' | 'constraints' | 'structure';
    impactedChildren: string[];
    requiresReview: boolean;
    autoUpdateable: boolean;
}
/**
 * Analyze impact of PROJECT OVERVIEW version change
 *
 * Determines which components and goals are affected by a change to
 * the PROJECT OVERVIEW vision, constraints, or resources.
 *
 * @param oldVersion - Previous PROJECT OVERVIEW state
 * @param newVersion - New PROJECT OVERVIEW state
 * @param components - All components in project
 * @returns Impact assessment with affected entities
 *
 * @example
 * // Timeline constraint changed from "3 months" to "2 months"
 * const impact = analyzeProjectOverviewImpact(oldPO, newPO, components);
 * // Returns list of components that may need timeline adjustment
 */
export declare function analyzeProjectOverviewImpact(oldVersion: Partial<ProjectOverview>, newVersion: Partial<ProjectOverview>, components: Component[]): ChangeImpact[];
/**
 * Analyze impact of Component version change
 *
 * Determines which major goals are affected by changes to a component.
 *
 * @param oldVersion - Previous component state
 * @param newVersion - New component state
 * @param majorGoals - All major goals in component
 * @returns Impact assessment with affected goals
 */
export declare function analyzeComponentImpact(oldVersion: Partial<Component>, newVersion: Partial<Component>, majorGoals: MajorGoal[]): ChangeImpact[];
/**
 * Create cascade update notification
 *
 * When a parent entity changes, generate notification for child entities
 * that may need updates.
 *
 * @param impact - Change impact assessment
 * @returns Human-readable notification message
 */
export declare function createCascadeNotification(impact: ChangeImpact): string;
/**
 * Execute cascade update (dry run mode available)
 *
 * Apply version changes from parent to affected children.
 * Can run in dry-run mode to preview changes without applying.
 *
 * @param impacts - Array of change impacts to apply
 * @param dryRun - If true, don't actually update, just report what would change
 * @returns Result showing what was updated, failed, or warnings
 */
export declare function executeCascadeUpdate(impacts: ChangeImpact[], dryRun?: boolean): CascadeUpdateResult;
/**
 * Validate cascade update safety
 *
 * Check if cascade update can be safely applied without data loss.
 *
 * @param impacts - Change impacts to validate
 * @returns Validation result with safety warnings
 */
export declare function validateCascadeUpdate(impacts: ChangeImpact[]): {
    safe: boolean;
    warnings: string[];
    blockers: string[];
};
/**
 * Validation result for entity relationships
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate that an entity's parent references exist
 *
 * Checks that projectId, componentId, etc. actually point to existing entities.
 * This prevents orphaned entities.
 *
 * @param context - Entity's navigation context
 * @param existingIds - Map of entity type to existing IDs
 * @returns Validation result
 *
 * @example
 * const context = { projectId: 'p1', componentId: 'c1', majorGoalId: 'g1' };
 * const ids = {
 *   project: ['p1'],
 *   component: ['c1'],
 *   'major-goal': ['g1', 'g2']
 * };
 * const result = validateParentReferences(context, ids);
 * // result.valid === true (all parents exist)
 */
export declare function validateParentReferences(context: NavigationContext, existingIds: {
    project?: string[];
    component?: string[];
    'sub-area'?: string[];
    'major-goal'?: string[];
    'sub-goal'?: string[];
    'task-workflow'?: string[];
}): ValidationResult;
/**
 * Validate progress consistency
 *
 * Ensures that entity progress makes sense:
 * - Percentage is 0-100
 * - completedItems <= totalItems
 * - Status matches percentage (e.g., 100% should be "completed")
 *
 * @param progress - Progress info to validate
 * @returns Validation result
 */
export declare function validateProgress(progress: ProgressInfo): ValidationResult;
/**
 * Validate entity required fields
 *
 * Checks that an entity has all required fields populated.
 *
 * @param entity - Entity to validate
 * @param requiredFields - List of required field names
 * @returns Validation result
 */
export declare function validateRequiredFields(entity: Record<string, any>, requiredFields: string[]): ValidationResult;
/**
 * Detect orphaned entities
 *
 * Find entities whose parents no longer exist.
 *
 * @param allContexts - Array of all entity contexts in project
 * @param existingIds - Map of entity type to existing IDs
 * @returns Array of orphaned entity contexts
 */
export declare function detectOrphanedEntities(allContexts: NavigationContext[], existingIds: {
    project?: string[];
    component?: string[];
    'sub-area'?: string[];
    'major-goal'?: string[];
    'sub-goal'?: string[];
    'task-workflow'?: string[];
}): NavigationContext[];
/**
 * Validate complete hierarchy integrity
 *
 * Performs comprehensive validation of entire project hierarchy:
 * - All parent references valid
 * - No orphaned entities
 * - Progress values consistent
 * - Required fields present
 *
 * @param projectData - Complete project data structure
 * @returns Comprehensive validation result
 */
export declare function validateHierarchyIntegrity(projectData: {
    projectOverview: ProjectOverview;
    components: Component[];
    majorGoals: MajorGoal[];
    subGoals: SubGoal[];
    taskWorkflows: TaskWorkflow[];
}): ValidationResult;
//# sourceMappingURL=hierarchical-utils.d.ts.map