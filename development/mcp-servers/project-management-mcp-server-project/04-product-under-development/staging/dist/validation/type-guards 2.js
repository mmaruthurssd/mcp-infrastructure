/**
 * Type guards for hierarchical entities
 *
 * @module validation/type-guards
 * @description Runtime type checking for all hierarchical entity types
 */
/**
 * Type guard for VersionInfo
 */
export function isVersionInfo(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.version === 'string' &&
        typeof obj.lastModified === 'string' &&
        (obj.modifiedBy === undefined || typeof obj.modifiedBy === 'string') &&
        (obj.changeDescription === undefined || typeof obj.changeDescription === 'string'));
}
/**
 * Type guard for ProgressInfo
 */
export function isProgressInfo(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.percentage === 'number' &&
        obj.percentage >= 0 &&
        obj.percentage <= 100 &&
        typeof obj.status === 'string' &&
        ['not-started', 'planning', 'in-progress', 'blocked', 'on-hold', 'completed'].includes(obj.status) &&
        typeof obj.completedItems === 'number' &&
        typeof obj.totalItems === 'number' &&
        obj.completedItems <= obj.totalItems &&
        typeof obj.lastUpdated === 'string');
}
/**
 * Type guard for PROJECT OVERVIEW
 */
export function isProjectOverview(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        isVersionInfo(obj.versionInfo) &&
        typeof obj.vision === 'object' &&
        typeof obj.vision.statement === 'string' &&
        Array.isArray(obj.vision.goals) &&
        Array.isArray(obj.components) &&
        obj.components.length > 0 &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.filePath === 'string');
}
/**
 * Type guard for Component
 */
export function isComponent(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.folderPath === 'string' &&
        typeof obj.overviewFilePath === 'string');
}
/**
 * Type guard for Sub-Area
 */
export function isSubArea(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.componentId === 'string' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.folderPath === 'string');
}
/**
 * Type guard for Major Goal
 */
export function isMajorGoal(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.componentId === 'string' &&
        typeof obj.priority === 'string' &&
        ['High', 'Medium', 'Low'].includes(obj.priority) &&
        typeof obj.tier === 'string' &&
        ['Now', 'Next', 'Later', 'Someday'].includes(obj.tier) &&
        typeof obj.impact === 'string' &&
        typeof obj.effort === 'string' &&
        typeof obj.problem === 'string' &&
        typeof obj.expectedValue === 'string' &&
        Array.isArray(obj.successCriteria) &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.folderPath === 'string' &&
        typeof obj.goalFilePath === 'string' &&
        typeof obj.statusFilePath === 'string');
}
/**
 * Type guard for Sub-Goal
 */
export function isSubGoal(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.componentId === 'string' &&
        typeof obj.majorGoalId === 'string' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.folderPath === 'string' &&
        typeof obj.subGoalFilePath === 'string');
}
/**
 * Type guard for Task
 */
export function isTask(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.componentId === 'string' &&
        typeof obj.majorGoalId === 'string' &&
        typeof obj.subGoalId === 'string' &&
        typeof obj.workflowId === 'string' &&
        typeof obj.status === 'string' &&
        ['pending', 'in-progress', 'completed', 'blocked', 'skipped'].includes(obj.status) &&
        typeof obj.createdAt === 'string');
}
/**
 * Type guard for Task Workflow
 */
export function isTaskWorkflow(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.projectId === 'string' &&
        typeof obj.componentId === 'string' &&
        typeof obj.majorGoalId === 'string' &&
        typeof obj.subGoalId === 'string' &&
        Array.isArray(obj.tasks) &&
        obj.tasks.length > 0 &&
        typeof obj.createdAt === 'string' &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.workflowPath === 'string');
}
/**
 * Determine entity type from object
 */
export function getEntityType(obj) {
    if (isProjectOverview(obj))
        return 'project-overview';
    if (isComponent(obj))
        return 'component';
    if (isSubArea(obj))
        return 'sub-area';
    if (isMajorGoal(obj))
        return 'major-goal';
    if (isSubGoal(obj))
        return 'sub-goal';
    if (isTaskWorkflow(obj))
        return 'task-workflow';
    if (isTask(obj))
        return 'task';
    return null;
}
/**
 * Check if object has required hierarchical IDs for a given level
 */
export function hasRequiredParentIds(obj, level) {
    // Level 2: PROJECT OVERVIEW (no parent required)
    if (level === 2)
        return true;
    // Level 3: Component (requires projectId)
    if (level === 3) {
        return typeof obj.projectId === 'string' && obj.projectId.length > 0;
    }
    // Level 4: Sub-Area (requires projectId, componentId)
    if (level === 4) {
        return (typeof obj.projectId === 'string' &&
            obj.projectId.length > 0 &&
            typeof obj.componentId === 'string' &&
            obj.componentId.length > 0);
    }
    // Level 5: Major Goal (requires projectId, componentId)
    if (level === 5) {
        return (typeof obj.projectId === 'string' &&
            obj.projectId.length > 0 &&
            typeof obj.componentId === 'string' &&
            obj.componentId.length > 0);
    }
    // Level 6: Sub-Goal (requires projectId, componentId, majorGoalId)
    if (level === 6) {
        return (typeof obj.projectId === 'string' &&
            obj.projectId.length > 0 &&
            typeof obj.componentId === 'string' &&
            obj.componentId.length > 0 &&
            typeof obj.majorGoalId === 'string' &&
            obj.majorGoalId.length > 0);
    }
    // Level 7: Task Workflow / Task (requires projectId, componentId, majorGoalId, subGoalId)
    if (level === 7) {
        return (typeof obj.projectId === 'string' &&
            obj.projectId.length > 0 &&
            typeof obj.componentId === 'string' &&
            obj.componentId.length > 0 &&
            typeof obj.majorGoalId === 'string' &&
            obj.majorGoalId.length > 0 &&
            typeof obj.subGoalId === 'string' &&
            obj.subGoalId.length > 0);
    }
    return false;
}
/**
 * Assert that object is of expected entity type (throws if not)
 */
export function assertEntityType(obj, typeGuard, entityTypeName) {
    if (!typeGuard(obj)) {
        throw new TypeError(`Expected ${entityTypeName}, but received invalid entity`);
    }
}
//# sourceMappingURL=type-guards.js.map