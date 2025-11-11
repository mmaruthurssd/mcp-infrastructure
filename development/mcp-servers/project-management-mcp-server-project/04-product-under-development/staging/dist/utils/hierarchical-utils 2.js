/**
 * Hierarchical Utilities for Project Management MCP Server v1.0.0
 *
 * Provides utility functions for working with hierarchical entities:
 * - Progress aggregation (bubble up from children to parent)
 * - Parent-child navigation (traverse hierarchy)
 * - Relationship validation (ensure referential integrity)
 * - Cascade updates (propagate version changes)
 */
// ============================================================================
// PROGRESS AGGREGATION
// ============================================================================
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
export function calculateAverageProgress(childProgressList) {
    if (childProgressList.length === 0)
        return 0;
    const sum = childProgressList.reduce((acc, progress) => acc + progress, 0);
    return Math.round(sum / childProgressList.length);
}
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
export function aggregateStatus(childStatusList) {
    if (childStatusList.length === 0)
        return 'not-started';
    // Check for blocking conditions (highest priority)
    if (childStatusList.some(status => status === 'blocked'))
        return 'blocked';
    // Check if all completed
    if (childStatusList.every(status => status === 'completed'))
        return 'completed';
    // Check if all not-started
    if (childStatusList.every(status => status === 'not-started'))
        return 'not-started';
    // Check for in-progress
    if (childStatusList.some(status => status === 'in-progress'))
        return 'in-progress';
    // Check for planning
    if (childStatusList.some(status => status === 'planning'))
        return 'planning';
    // Check for on-hold
    if (childStatusList.some(status => status === 'on-hold'))
        return 'on-hold';
    // Default fallback
    return 'not-started';
}
/**
 * Build progress breakdown showing contribution of each child entity
 *
 * @param children - Array of child entities with progress info
 * @returns Progress breakdown object mapping child IDs to their progress
 */
export function buildProgressBreakdown(children) {
    const breakdown = {};
    for (const child of children) {
        breakdown[child.id] = {
            name: child.name,
            progress: child.progress?.percentage ?? 0,
            status: child.progress?.status ?? 'not-started',
        };
    }
    return breakdown;
}
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
export function aggregateProgress(children) {
    if (children.length === 0) {
        return {
            percentage: 0,
            completedItems: 0,
            totalItems: 0,
            status: 'not-started',
            breakdown: {},
        };
    }
    const progressList = children.map(child => child.progress?.percentage ?? 0);
    const statusList = children.map(child => child.progress?.status ?? 'not-started');
    const completedItems = statusList.filter(status => status === 'completed').length;
    return {
        percentage: calculateAverageProgress(progressList),
        completedItems,
        totalItems: children.length,
        status: aggregateStatus(statusList),
        breakdown: buildProgressBreakdown(children),
    };
}
/**
 * Calculate project-level progress from all components
 *
 * @param components - Array of components with progress info
 * @returns Project-level progress aggregation
 */
export function calculateProjectProgress(components) {
    return aggregateProgress(components);
}
/**
 * Calculate component-level progress from all major goals
 *
 * @param majorGoals - Array of major goals with progress info
 * @returns Component-level progress aggregation
 */
export function calculateComponentProgress(majorGoals) {
    return aggregateProgress(majorGoals);
}
/**
 * Calculate major goal progress from all sub-goals
 *
 * @param subGoals - Array of sub-goals with progress info
 * @returns Major goal-level progress aggregation
 */
export function calculateMajorGoalProgress(subGoals) {
    return aggregateProgress(subGoals);
}
/**
 * Calculate sub-goal progress from task workflows
 *
 * @param taskWorkflows - Array of task workflows with progress info
 * @returns Sub-goal-level progress aggregation
 */
export function calculateSubGoalProgress(taskWorkflows) {
    // Map workflow structure to match aggregateProgress input
    const mappedWorkflows = taskWorkflows.map(workflow => ({
        id: workflow.workflowId,
        name: workflow.workflowName,
        progress: workflow.progress,
    }));
    return aggregateProgress(mappedWorkflows);
}
/**
 * Calculate task workflow progress from individual tasks
 *
 * @param tasks - Array of tasks
 * @returns Task workflow-level progress aggregation
 */
export function calculateTaskWorkflowProgress(tasks) {
    if (tasks.length === 0) {
        return {
            percentage: 0,
            completedItems: 0,
            totalItems: 0,
            status: 'not-started',
            breakdown: {},
        };
    }
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const percentage = Math.round((completedTasks / tasks.length) * 100);
    // Determine status
    let status = 'not-started';
    if (tasks.some(task => task.status === 'blocked')) {
        status = 'blocked';
    }
    else if (completedTasks === tasks.length) {
        status = 'completed';
    }
    else if (tasks.some(task => task.status === 'in-progress')) {
        status = 'in-progress';
    }
    else if (completedTasks > 0) {
        status = 'in-progress'; // Some tasks done but not all
    }
    // Build breakdown
    const breakdown = {};
    for (const task of tasks) {
        breakdown[task.taskId] = {
            name: task.description,
            progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
            status: task.status === 'completed' ? 'completed' :
                task.status === 'in-progress' ? 'in-progress' :
                    task.status === 'blocked' ? 'blocked' : 'not-started',
        };
    }
    return {
        percentage,
        completedItems: completedTasks,
        totalItems: tasks.length,
        status,
        breakdown,
    };
}
/**
 * Create ProgressInfo object from aggregation result
 *
 * @param result - Progress aggregation result
 * @returns ProgressInfo object ready to be stored in entity
 */
export function createProgressInfo(result) {
    return {
        percentage: result.percentage,
        status: result.status,
        lastUpdated: new Date().toISOString(),
        completedItems: result.completedItems,
        totalItems: result.totalItems,
        breakdown: result.breakdown,
    };
}
// ============================================================================
// PROGRESS CALCULATION EXAMPLES
// ============================================================================
/**
 * Example: Calculate full hierarchy progress from bottom to top
 *
 * This shows how to calculate progress at each level and bubble it up.
 * In a real implementation, this would read from actual files/database.
 */
export function calculateFullHierarchyProgress(projectOverview, components, majorGoals, subGoals, taskWorkflows) {
    // Calculate sub-goal progress from task workflows
    const subGoalProgressMap = {};
    for (const subGoal of subGoals) {
        const workflows = taskWorkflows.filter(wf => wf.subGoalId === subGoal.id);
        subGoalProgressMap[subGoal.id] = calculateSubGoalProgress(workflows);
    }
    // Calculate major goal progress from sub-goals
    const goalProgressMap = {};
    for (const goal of majorGoals) {
        const goalSubGoals = subGoals.filter(sg => sg.majorGoalId === goal.id);
        // Map sub-goals with their calculated progress
        const subGoalsWithProgress = goalSubGoals.map(sg => ({
            id: sg.id,
            name: sg.name,
            progress: createProgressInfo(subGoalProgressMap[sg.id]),
        }));
        goalProgressMap[goal.id] = calculateMajorGoalProgress(subGoalsWithProgress);
    }
    // Calculate component progress from major goals
    const componentProgressMap = {};
    for (const component of components) {
        const componentGoals = majorGoals.filter(g => g.componentId === component.id);
        // Map goals with their calculated progress
        const goalsWithProgress = componentGoals.map(g => ({
            id: g.id,
            name: g.name,
            progress: createProgressInfo(goalProgressMap[g.id]),
        }));
        componentProgressMap[component.id] = calculateComponentProgress(goalsWithProgress);
    }
    // Calculate project progress from components
    const componentsWithProgress = components.map(c => ({
        id: c.id,
        name: c.name,
        progress: createProgressInfo(componentProgressMap[c.id]),
    }));
    const projectProgress = calculateProjectProgress(componentsWithProgress);
    return {
        projectProgress,
        componentProgress: componentProgressMap,
        goalProgress: goalProgressMap,
        subGoalProgress: subGoalProgressMap,
    };
}
/**
 * Build navigation context from any entity
 *
 * @param entity - Entity with hierarchy identifiers
 * @returns Navigation context object
 */
export function buildNavigationContext(entity) {
    return {
        projectId: entity.projectId || '',
        componentId: entity.componentId,
        subAreaId: entity.subAreaId,
        majorGoalId: entity.majorGoalId,
        subGoalId: entity.subGoalId,
        workflowId: entity.workflowId,
        taskId: entity.taskId,
    };
}
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
export function getParentReference(context) {
    // Task → Task Workflow
    if (context.taskId && context.workflowId) {
        return { id: context.workflowId, type: 'task-workflow' };
    }
    // Task Workflow → Sub-Goal
    if (context.workflowId && context.subGoalId) {
        return { id: context.subGoalId, type: 'sub-goal' };
    }
    // Sub-Goal → Major Goal
    if (context.subGoalId && context.majorGoalId) {
        return { id: context.majorGoalId, type: 'major-goal' };
    }
    // Major Goal → Component or Sub-Area
    if (context.majorGoalId) {
        if (context.subAreaId) {
            return { id: context.subAreaId, type: 'sub-area' };
        }
        if (context.componentId) {
            return { id: context.componentId, type: 'component' };
        }
    }
    // Sub-Area → Component
    if (context.subAreaId && context.componentId) {
        return { id: context.componentId, type: 'component' };
    }
    // Component → Project
    if (context.componentId && context.projectId) {
        return { id: context.projectId, type: 'project' };
    }
    // At top level (PROJECT OVERVIEW has no parent)
    return null;
}
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
export function getParentChain(context) {
    const chain = [];
    let currentContext = { ...context };
    let parent = getParentReference(currentContext);
    while (parent) {
        chain.push(parent);
        // Update context to parent's context
        if (parent.type === 'task-workflow') {
            currentContext.taskId = undefined;
        }
        else if (parent.type === 'sub-goal') {
            currentContext.workflowId = undefined;
        }
        else if (parent.type === 'major-goal') {
            currentContext.subGoalId = undefined;
        }
        else if (parent.type === 'sub-area') {
            currentContext.majorGoalId = undefined;
        }
        else if (parent.type === 'component') {
            currentContext.subAreaId = undefined;
            currentContext.majorGoalId = undefined;
        }
        parent = getParentReference(currentContext);
    }
    return chain;
}
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
export function calculateEntityDepth(context) {
    let depth = 0;
    if (context.projectId)
        depth++;
    if (context.componentId)
        depth++;
    if (context.subAreaId)
        depth++;
    if (context.majorGoalId)
        depth++;
    if (context.subGoalId)
        depth++;
    if (context.workflowId)
        depth++;
    if (context.taskId)
        depth++;
    return depth;
}
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
export function isAncestor(ancestorContext, descendantContext) {
    // Must be in same project
    if (ancestorContext.projectId !== descendantContext.projectId)
        return false;
    // Check component match
    if (ancestorContext.componentId) {
        if (ancestorContext.componentId !== descendantContext.componentId)
            return false;
    }
    // Check sub-area match
    if (ancestorContext.subAreaId) {
        if (ancestorContext.subAreaId !== descendantContext.subAreaId)
            return false;
    }
    // Check major goal match
    if (ancestorContext.majorGoalId) {
        if (ancestorContext.majorGoalId !== descendantContext.majorGoalId)
            return false;
    }
    // Check sub-goal match
    if (ancestorContext.subGoalId) {
        if (ancestorContext.subGoalId !== descendantContext.subGoalId)
            return false;
    }
    // Check workflow match
    if (ancestorContext.workflowId) {
        if (ancestorContext.workflowId !== descendantContext.workflowId)
            return false;
    }
    // Ancestor must have fewer levels than descendant
    const ancestorDepth = calculateEntityDepth(ancestorContext);
    const descendantDepth = calculateEntityDepth(descendantContext);
    return ancestorDepth < descendantDepth;
}
/**
 * Find common ancestor of two entities
 *
 * @param context1 - First entity context
 * @param context2 - Second entity context
 * @returns Navigation context of common ancestor, or null if no common ancestor
 */
export function findCommonAncestor(context1, context2) {
    // Must be in same project
    if (context1.projectId !== context2.projectId)
        return null;
    const commonAncestor = {
        projectId: context1.projectId,
    };
    // Check component
    if (context1.componentId === context2.componentId && context1.componentId) {
        commonAncestor.componentId = context1.componentId;
    }
    else {
        // Different components, project is common ancestor
        return commonAncestor;
    }
    // Check sub-area
    if (context1.subAreaId === context2.subAreaId && context1.subAreaId) {
        commonAncestor.subAreaId = context1.subAreaId;
    }
    else if (context1.subAreaId || context2.subAreaId) {
        // Different sub-areas or one has sub-area and other doesn't
        return commonAncestor;
    }
    // Check major goal
    if (context1.majorGoalId === context2.majorGoalId && context1.majorGoalId) {
        commonAncestor.majorGoalId = context1.majorGoalId;
    }
    else {
        return commonAncestor;
    }
    // Check sub-goal
    if (context1.subGoalId === context2.subGoalId && context1.subGoalId) {
        commonAncestor.subGoalId = context1.subGoalId;
    }
    else {
        return commonAncestor;
    }
    // Check workflow
    if (context1.workflowId === context2.workflowId && context1.workflowId) {
        commonAncestor.workflowId = context1.workflowId;
    }
    else {
        return commonAncestor;
    }
    // Same workflow is the common ancestor
    return commonAncestor;
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
export function analyzeProjectOverviewImpact(oldVersion, newVersion, components) {
    const impacts = [];
    // Check scope changes (components added/removed)
    if (oldVersion.components && newVersion.components) {
        const oldComponentIds = new Set(oldVersion.components.map(c => c.id));
        const newComponentIds = new Set(newVersion.components.map(c => c.id));
        const added = newVersion.components.filter(c => !oldComponentIds.has(c.id));
        const removed = oldVersion.components.filter(c => !newComponentIds.has(c.id));
        if (added.length > 0 || removed.length > 0) {
            impacts.push({
                entityType: 'project',
                entityId: newVersion.id || '',
                entityName: newVersion.name || '',
                changeType: 'structure',
                impactedChildren: [...added.map(c => c.id), ...removed.map(c => c.id)],
                requiresReview: true,
                autoUpdateable: false,
            });
        }
    }
    // Check timeline changes
    if (oldVersion.constraints?.timeline?.targetEndDate !==
        newVersion.constraints?.timeline?.targetEndDate) {
        // Timeline change affects all components
        impacts.push({
            entityType: 'project',
            entityId: newVersion.id || '',
            entityName: newVersion.name || '',
            changeType: 'timeline',
            impactedChildren: components.map(c => c.id),
            requiresReview: true,
            autoUpdateable: false, // Timeline adjustments need human review
        });
    }
    // Check resource changes
    const oldResources = JSON.stringify(oldVersion.constraints?.resources || {});
    const newResources = JSON.stringify(newVersion.constraints?.resources || {});
    if (oldResources !== newResources) {
        impacts.push({
            entityType: 'project',
            entityId: newVersion.id || '',
            entityName: newVersion.name || '',
            changeType: 'resources',
            impactedChildren: components.map(c => c.id),
            requiresReview: true,
            autoUpdateable: false,
        });
    }
    // Check constraints changes
    const oldBudget = oldVersion.constraints?.budget?.available;
    const newBudget = newVersion.constraints?.budget?.available;
    if (oldBudget !== newBudget) {
        impacts.push({
            entityType: 'project',
            entityId: newVersion.id || '',
            entityName: newVersion.name || '',
            changeType: 'constraints',
            impactedChildren: components.map(c => c.id),
            requiresReview: true,
            autoUpdateable: false,
        });
    }
    return impacts;
}
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
export function analyzeComponentImpact(oldVersion, newVersion, majorGoals) {
    const impacts = [];
    // Check if component success criteria changed
    const oldCriteria = JSON.stringify(oldVersion.successCriteria || []);
    const newCriteria = JSON.stringify(newVersion.successCriteria || []);
    if (oldCriteria !== newCriteria) {
        impacts.push({
            entityType: 'component',
            entityId: newVersion.id || '',
            entityName: newVersion.name || '',
            changeType: 'scope',
            impactedChildren: majorGoals.map(g => g.id),
            requiresReview: true,
            autoUpdateable: false,
        });
    }
    // Check if component dependencies changed
    const oldDeps = JSON.stringify(oldVersion.dependencies || []);
    const newDeps = JSON.stringify(newVersion.dependencies || []);
    if (oldDeps !== newDeps) {
        impacts.push({
            entityType: 'component',
            entityId: newVersion.id || '',
            entityName: newVersion.name || '',
            changeType: 'constraints',
            impactedChildren: majorGoals.map(g => g.id),
            requiresReview: true,
            autoUpdateable: false,
        });
    }
    return impacts;
}
/**
 * Create cascade update notification
 *
 * When a parent entity changes, generate notification for child entities
 * that may need updates.
 *
 * @param impact - Change impact assessment
 * @returns Human-readable notification message
 */
export function createCascadeNotification(impact) {
    const entityLabel = impact.entityType.replace('-', ' ').toUpperCase();
    let message = `${entityLabel} "${impact.entityName}" has been updated.\n`;
    message += `Change Type: ${impact.changeType}\n`;
    message += `Affected Entities: ${impact.impactedChildren.length}\n\n`;
    if (impact.requiresReview) {
        message += `⚠️ REVIEW REQUIRED: This change may impact child entities.\n`;
        message += `Please review the following entities:\n`;
        message += impact.impactedChildren.map(id => `  - ${id}`).join('\n');
    }
    if (!impact.autoUpdateable) {
        message += `\n\nℹ️ Manual updates recommended - automatic propagation not available for this change type.`;
    }
    return message;
}
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
export function executeCascadeUpdate(impacts, dryRun = false) {
    const result = {
        updated: [],
        failed: [],
        warnings: [],
    };
    for (const impact of impacts) {
        // Auto-updatable changes can be applied automatically
        if (impact.autoUpdateable && !dryRun) {
            try {
                // In real implementation, this would update file system
                result.updated.push(...impact.impactedChildren);
            }
            catch (error) {
                result.failed.push(...impact.impactedChildren);
                result.warnings.push(`Failed to update children of ${impact.entityId}: ${error}`);
            }
        }
        else if (impact.requiresReview) {
            // Changes requiring review get a warning
            result.warnings.push(`${impact.entityType} ${impact.entityId} change requires manual review of ${impact.impactedChildren.length} children`);
        }
        if (dryRun) {
            result.warnings.push(`[DRY RUN] Would update: ${impact.impactedChildren.join(', ')}`);
        }
    }
    return result;
}
/**
 * Validate cascade update safety
 *
 * Check if cascade update can be safely applied without data loss.
 *
 * @param impacts - Change impacts to validate
 * @returns Validation result with safety warnings
 */
export function validateCascadeUpdate(impacts) {
    const warnings = [];
    const blockers = [];
    for (const impact of impacts) {
        // Check for breaking changes
        if (impact.changeType === 'structure') {
            blockers.push(`Structural change to ${impact.entityId} may break existing references`);
        }
        // Warn about non-auto-updatable changes
        if (!impact.autoUpdateable && impact.impactedChildren.length > 5) {
            warnings.push(`${impact.impactedChildren.length} entities require manual review - this may take significant time`);
        }
        // Check for circular dependencies (not implemented in MVP but important for future)
        if (impact.changeType === 'constraints') {
            warnings.push(`Constraint changes may create circular dependencies - verify affected entities`);
        }
    }
    return {
        safe: blockers.length === 0,
        warnings,
        blockers,
    };
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
export function validateParentReferences(context, existingIds) {
    const errors = [];
    const warnings = [];
    // Validate project ID
    if (context.projectId) {
        if (!existingIds.project?.includes(context.projectId)) {
            errors.push(`Project ID "${context.projectId}" does not exist`);
        }
    }
    else {
        errors.push('Project ID is required');
    }
    // Validate component ID (if present)
    if (context.componentId) {
        if (!existingIds.component?.includes(context.componentId)) {
            errors.push(`Component ID "${context.componentId}" does not exist`);
        }
    }
    // Validate sub-area ID (if present)
    if (context.subAreaId) {
        if (!existingIds['sub-area']?.includes(context.subAreaId)) {
            errors.push(`Sub-area ID "${context.subAreaId}" does not exist`);
        }
        // Sub-area requires component
        if (!context.componentId) {
            errors.push('Sub-area requires componentId');
        }
    }
    // Validate major goal ID (if present)
    if (context.majorGoalId) {
        if (!existingIds['major-goal']?.includes(context.majorGoalId)) {
            errors.push(`Major goal ID "${context.majorGoalId}" does not exist`);
        }
        // Goal requires component or sub-area
        if (!context.componentId) {
            errors.push('Major goal requires componentId');
        }
    }
    // Validate sub-goal ID (if present)
    if (context.subGoalId) {
        if (!existingIds['sub-goal']?.includes(context.subGoalId)) {
            errors.push(`Sub-goal ID "${context.subGoalId}" does not exist`);
        }
        // Sub-goal requires major goal
        if (!context.majorGoalId) {
            errors.push('Sub-goal requires majorGoalId');
        }
    }
    // Validate workflow ID (if present)
    if (context.workflowId) {
        if (!existingIds['task-workflow']?.includes(context.workflowId)) {
            errors.push(`Workflow ID "${context.workflowId}" does not exist`);
        }
        // Workflow requires sub-goal
        if (!context.subGoalId) {
            errors.push('Task workflow requires subGoalId');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
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
export function validateProgress(progress) {
    const errors = [];
    const warnings = [];
    // Validate percentage
    if (progress.percentage < 0 || progress.percentage > 100) {
        errors.push(`Progress percentage ${progress.percentage} is out of range (0-100)`);
    }
    // Validate item counts
    if (progress.completedItems > progress.totalItems) {
        errors.push(`Completed items (${progress.completedItems}) exceeds total (${progress.totalItems})`);
    }
    if (progress.totalItems < 0) {
        errors.push(`Total items cannot be negative: ${progress.totalItems}`);
    }
    // Validate status consistency
    if (progress.percentage === 100 && progress.status !== 'completed') {
        warnings.push(`Progress is 100% but status is "${progress.status}" (should be "completed")`);
    }
    if (progress.percentage === 0 && progress.status === 'completed') {
        errors.push('Status is "completed" but progress is 0%');
    }
    if (progress.percentage > 0 &&
        progress.percentage < 100 &&
        progress.status === 'not-started') {
        warnings.push(`Progress is ${progress.percentage}% but status is "not-started"`);
    }
    // Validate breakdown consistency (if present)
    if (progress.breakdown) {
        const breakdownCount = Object.keys(progress.breakdown).length;
        if (breakdownCount !== progress.totalItems) {
            warnings.push(`Breakdown has ${breakdownCount} items but totalItems is ${progress.totalItems}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Validate entity required fields
 *
 * Checks that an entity has all required fields populated.
 *
 * @param entity - Entity to validate
 * @param requiredFields - List of required field names
 * @returns Validation result
 */
export function validateRequiredFields(entity, requiredFields) {
    const errors = [];
    const warnings = [];
    for (const field of requiredFields) {
        if (!(field in entity)) {
            errors.push(`Required field "${field}" is missing`);
        }
        else if (entity[field] === null || entity[field] === undefined) {
            errors.push(`Required field "${field}" is null or undefined`);
        }
        else if (typeof entity[field] === 'string' && entity[field].trim() === '') {
            errors.push(`Required field "${field}" is empty`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Detect orphaned entities
 *
 * Find entities whose parents no longer exist.
 *
 * @param allContexts - Array of all entity contexts in project
 * @param existingIds - Map of entity type to existing IDs
 * @returns Array of orphaned entity contexts
 */
export function detectOrphanedEntities(allContexts, existingIds) {
    const orphaned = [];
    for (const context of allContexts) {
        const validation = validateParentReferences(context, existingIds);
        if (!validation.valid) {
            orphaned.push(context);
        }
    }
    return orphaned;
}
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
export function validateHierarchyIntegrity(projectData) {
    const errors = [];
    const warnings = [];
    // Build ID maps
    const existingIds = {
        project: [projectData.projectOverview.id],
        component: projectData.components.map(c => c.id),
        'major-goal': projectData.majorGoals.map(g => g.id),
        'sub-goal': projectData.subGoals.map(sg => sg.id),
        'task-workflow': projectData.taskWorkflows.map(wf => wf.workflowId),
    };
    // Validate components
    for (const component of projectData.components) {
        const context = buildNavigationContext(component);
        const result = validateParentReferences(context, existingIds);
        errors.push(...result.errors.map(e => `Component ${component.id}: ${e}`));
        warnings.push(...result.warnings.map(w => `Component ${component.id}: ${w}`));
        // Validate progress
        const progressResult = validateProgress(component.progress);
        errors.push(...progressResult.errors.map(e => `Component ${component.id} progress: ${e}`));
        warnings.push(...progressResult.warnings.map(w => `Component ${component.id} progress: ${w}`));
    }
    // Validate major goals
    for (const goal of projectData.majorGoals) {
        const context = buildNavigationContext(goal);
        const result = validateParentReferences(context, existingIds);
        errors.push(...result.errors.map(e => `Goal ${goal.id}: ${e}`));
        warnings.push(...result.warnings.map(w => `Goal ${goal.id}: ${w}`));
        // Validate progress
        const progressResult = validateProgress(goal.progress);
        errors.push(...progressResult.errors.map(e => `Goal ${goal.id} progress: ${e}`));
        warnings.push(...progressResult.warnings.map(w => `Goal ${goal.id} progress: ${w}`));
    }
    // Validate sub-goals
    for (const subGoal of projectData.subGoals) {
        const context = buildNavigationContext(subGoal);
        const result = validateParentReferences(context, existingIds);
        errors.push(...result.errors.map(e => `Sub-goal ${subGoal.id}: ${e}`));
        warnings.push(...result.warnings.map(w => `Sub-goal ${subGoal.id}: ${w}`));
        if (subGoal.progress) {
            const progressResult = validateProgress(subGoal.progress);
            errors.push(...progressResult.errors.map(e => `Sub-goal ${subGoal.id} progress: ${e}`));
            warnings.push(...progressResult.warnings.map(w => `Sub-goal ${subGoal.id} progress: ${w}`));
        }
    }
    // Validate task workflows
    for (const workflow of projectData.taskWorkflows) {
        const context = buildNavigationContext(workflow);
        const result = validateParentReferences(context, existingIds);
        errors.push(...result.errors.map(e => `Workflow ${workflow.workflowId}: ${e}`));
        warnings.push(...result.warnings.map(w => `Workflow ${workflow.workflowId}: ${w}`));
        const progressResult = validateProgress(workflow.progress);
        errors.push(...progressResult.errors.map(e => `Workflow ${workflow.workflowId} progress: ${e}`));
        warnings.push(...progressResult.warnings.map(w => `Workflow ${workflow.workflowId} progress: ${w}`));
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=hierarchical-utils%202.js.map