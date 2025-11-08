/**
 * Progress Query Service
 *
 * High-level service for querying hierarchical progress with caching.
 * Integrates cache manager, entity loader, and progress calculation utilities.
 *
 * Created: 2025-10-27
 */
import { getProgressCache, } from '../cache/progress-cache-manager';
import { EntityLoader } from '../loaders/entity-loader';
import { calculateProjectProgress, calculateComponentProgress, calculateMajorGoalProgress, calculateSubGoalProgress, calculateTaskWorkflowProgress, createProgressInfo, } from '../utils/hierarchical-utils';
const DEFAULT_QUERY_OPTIONS = {
    useCache: true,
    refreshCache: false,
    includeBreakdown: false,
    cascadeRefresh: false,
};
// ============================================================================
// PROGRESS QUERY SERVICE
// ============================================================================
export class ProgressQueryService {
    projectPath;
    cache;
    hierarchy;
    lastHierarchyLoad;
    hierarchyRefreshInterval = 5 * 60 * 1000; // 5 minutes
    constructor(projectPath, cache) {
        this.projectPath = projectPath;
        this.cache = cache ?? getProgressCache();
    }
    /**
     * Ensure hierarchy is loaded and fresh
     */
    async ensureHierarchy() {
        const now = Date.now();
        if (!this.hierarchy ||
            !this.lastHierarchyLoad ||
            now - this.lastHierarchyLoad > this.hierarchyRefreshInterval) {
            const loader = new EntityLoader(this.projectPath);
            this.hierarchy = await loader.loadHierarchy();
            this.lastHierarchyLoad = now;
        }
        return this.hierarchy;
    }
    /**
     * Force refresh hierarchy
     */
    async refreshHierarchy() {
        const loader = new EntityLoader(this.projectPath);
        this.hierarchy = await loader.loadHierarchy();
        this.lastHierarchyLoad = Date.now();
    }
    // ==========================================================================
    // SINGLE ENTITY QUERIES
    // ==========================================================================
    /**
     * Get project-level progress
     */
    async getProjectProgress(options = {}) {
        return this.queryProgress('project', 'project', options);
    }
    /**
     * Get component progress
     */
    async getComponentProgress(componentId, options = {}) {
        return this.queryProgress('component', componentId, options);
    }
    /**
     * Get major goal progress
     */
    async getMajorGoalProgress(goalId, options = {}) {
        return this.queryProgress('major-goal', goalId, options);
    }
    /**
     * Get sub-goal progress
     */
    async getSubGoalProgress(subGoalId, options = {}) {
        return this.queryProgress('sub-goal', subGoalId, options);
    }
    /**
     * Get task workflow progress
     */
    async getTaskWorkflowProgress(workflowId, options = {}) {
        return this.queryProgress('task-workflow', workflowId, options);
    }
    // ==========================================================================
    // BATCH QUERIES
    // ==========================================================================
    /**
     * Get progress for multiple components
     */
    async getMultipleComponentProgress(componentIds, options = {}) {
        return this.batchQuery(componentIds.map(id => ({ entityType: 'component', entityId: id })), options);
    }
    /**
     * Get progress for multiple major goals
     */
    async getMultipleMajorGoalProgress(goalIds, options = {}) {
        return this.batchQuery(goalIds.map(id => ({ entityType: 'major-goal', entityId: id })), options);
    }
    /**
     * Get progress for all entities of a type
     */
    async getAllProgressByType(entityType, options = {}) {
        const hierarchy = await this.ensureHierarchy();
        const entityIds = [];
        switch (entityType) {
            case 'component':
                entityIds.push(...hierarchy.components.keys());
                break;
            case 'major-goal':
                entityIds.push(...hierarchy.majorGoals.keys());
                break;
            case 'sub-goal':
                entityIds.push(...hierarchy.subGoals.keys());
                break;
            case 'task-workflow':
                entityIds.push(...hierarchy.taskWorkflows.keys());
                break;
        }
        return this.batchQuery(entityIds.map(id => ({ entityType, entityId: id })), options);
    }
    // ==========================================================================
    // CORE QUERY LOGIC
    // ==========================================================================
    /**
     * Generic progress query with caching
     */
    async queryProgress(entityType, entityId, options = {}) {
        const opts = { ...DEFAULT_QUERY_OPTIONS, ...options };
        const startTime = Date.now();
        let fromCache = false;
        // Check cache (if enabled and not forcing refresh)
        if (opts.useCache && !opts.refreshCache) {
            const cached = this.cache.get(entityType, entityId);
            if (cached) {
                fromCache = true;
                return {
                    progress: cached,
                    metadata: {
                        queriedAt: startTime,
                        fromCache: true,
                        calculationTimeMs: Date.now() - startTime,
                        entityType,
                        entityId,
                    },
                };
            }
        }
        // Cache miss or refresh - calculate progress
        const progress = await this.calculateProgress(entityType, entityId, opts);
        // Store in cache
        if (opts.useCache) {
            const hierarchy = await this.ensureHierarchy();
            const entity = this.getEntity(hierarchy, entityType, entityId);
            this.cache.set(entityType, entityId, progress, {
                ttl: opts.cacheTTL,
                parentEntityType: this.getParentEntityType(entityType),
                parentEntityId: entity ? this.getParentEntityId(entity, entityType) : undefined,
                childEntityIds: entity ? this.getChildEntityIds(entity, entityType) : undefined,
            });
        }
        // Cascade refresh if requested
        if (opts.cascadeRefresh) {
            await this.cascadeRefreshProgress(entityType, entityId);
        }
        return {
            progress,
            metadata: {
                queriedAt: startTime,
                fromCache,
                calculationTimeMs: Date.now() - startTime,
                entityType,
                entityId,
                cascadeInvalidated: opts.cascadeRefresh,
            },
        };
    }
    /**
     * Batch query for multiple entities
     */
    async batchQuery(queries, options = {}) {
        const startTime = Date.now();
        const results = new Map();
        let cacheHits = 0;
        let cacheMisses = 0;
        // Execute queries in parallel (up to 10 concurrent)
        const batchSize = 10;
        for (let i = 0; i < queries.length; i += batchSize) {
            const batch = queries.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(({ entityType, entityId }) => this.queryProgress(entityType, entityId, options)));
            batch.forEach(({ entityType, entityId }, index) => {
                const key = `${entityType}:${entityId}`;
                const result = batchResults[index];
                results.set(key, result);
                if (result.metadata.fromCache) {
                    cacheHits++;
                }
                else {
                    cacheMisses++;
                }
            });
        }
        const totalCalculationTimeMs = Date.now() - startTime;
        return {
            results,
            metadata: {
                queriedAt: startTime,
                totalQueries: queries.length,
                cacheHits,
                cacheMisses,
                totalCalculationTimeMs,
                averageQueryTimeMs: totalCalculationTimeMs / queries.length,
            },
        };
    }
    // ==========================================================================
    // PROGRESS CALCULATION
    // ==========================================================================
    /**
     * Calculate progress for entity (cache miss)
     */
    async calculateProgress(entityType, entityId, options) {
        const hierarchy = await this.ensureHierarchy();
        switch (entityType) {
            case 'project': {
                // Build array of components with their progress
                const components = Array.from(hierarchy.components.values())
                    .filter(comp => comp.progress !== undefined)
                    .map(comp => ({
                    id: comp.id,
                    name: comp.name,
                    progress: comp.progress
                }));
                const result = calculateProjectProgress(components);
                return createProgressInfo(result);
            }
            case 'component': {
                const component = hierarchy.components.get(entityId);
                if (!component) {
                    throw new Error(`Component not found: ${entityId}`);
                }
                // Build array of major goals with their progress
                const majorGoals = (component.majorGoals || [])
                    .filter(goal => goal.progress !== undefined)
                    .map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    progress: goal.progress
                }));
                const result = calculateComponentProgress(majorGoals);
                return createProgressInfo(result);
            }
            case 'major-goal': {
                const goal = hierarchy.majorGoals.get(entityId);
                if (!goal) {
                    throw new Error(`Major goal not found: ${entityId}`);
                }
                // Build array of sub-goals with their progress
                const subGoals = (goal.subGoals || [])
                    .filter(sg => sg.progress !== undefined)
                    .map(sg => ({
                    id: sg.id,
                    name: sg.name,
                    progress: sg.progress
                }));
                const result = calculateMajorGoalProgress(subGoals);
                return createProgressInfo(result);
            }
            case 'sub-goal': {
                const subGoal = hierarchy.subGoals.get(entityId);
                if (!subGoal) {
                    throw new Error(`Sub-goal not found: ${entityId}`);
                }
                // Build array of task workflows with their progress
                const taskWorkflows = (subGoal.taskWorkflows || [])
                    .filter(tw => tw.progress !== undefined)
                    .map(tw => ({
                    workflowId: tw.workflowId,
                    workflowName: tw.workflowName,
                    progress: tw.progress
                }));
                const result = calculateSubGoalProgress(taskWorkflows);
                return createProgressInfo(result);
            }
            case 'task-workflow': {
                const workflow = hierarchy.taskWorkflows.get(entityId);
                if (!workflow) {
                    throw new Error(`Task workflow not found: ${entityId}`);
                }
                // Pass tasks array directly
                const result = calculateTaskWorkflowProgress(workflow.tasks || []);
                return createProgressInfo(result);
            }
            default:
                throw new Error(`Unsupported entity type: ${entityType}`);
        }
    }
    // ==========================================================================
    // CASCADE OPERATIONS
    // ==========================================================================
    /**
     * Cascade refresh progress up and down hierarchy
     */
    async cascadeRefreshProgress(entityType, entityId) {
        // Invalidate cache for this entity and all parents/children
        this.cache.invalidate(entityType, entityId, {
            cascade: true,
            cascadeUp: true,
        });
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Get entity from hierarchy
     */
    getEntity(hierarchy, entityType, entityId) {
        switch (entityType) {
            case 'component':
                return hierarchy.components.get(entityId);
            case 'major-goal':
                return hierarchy.majorGoals.get(entityId);
            case 'sub-goal':
                return hierarchy.subGoals.get(entityId);
            case 'task-workflow':
                return hierarchy.taskWorkflows.get(entityId);
            default:
                return null;
        }
    }
    /**
     * Get parent entity type
     */
    getParentEntityType(entityType) {
        const hierarchy = {
            'task': 'task-workflow',
            'task-workflow': 'sub-goal',
            'sub-goal': 'major-goal',
            'major-goal': 'component',
            'sub-area': 'component',
            'component': 'project',
            'project': undefined,
        };
        return hierarchy[entityType];
    }
    /**
     * Get parent entity ID
     */
    getParentEntityId(entity, entityType) {
        switch (entityType) {
            case 'component':
                return entity.projectId;
            case 'major-goal':
                return entity.componentId;
            case 'sub-goal':
                return entity.majorGoalId;
            case 'task-workflow':
                return entity.subGoalId;
            default:
                return undefined;
        }
    }
    /**
     * Get child entity IDs
     */
    getChildEntityIds(entity, entityType) {
        switch (entityType) {
            case 'component':
                return entity.majorGoals?.map((g) => g.id);
            case 'major-goal':
                return entity.subGoals?.map((sg) => sg.id);
            case 'sub-goal':
                return entity.taskWorkflows?.map((tw) => tw.workflowId);
            case 'task-workflow':
                return entity.tasks?.map((t) => t.taskId);
            default:
                return undefined;
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStatistics() {
        return this.cache.getStatistics();
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
// ============================================================================
// GLOBAL SERVICE INSTANCE
// ============================================================================
let globalQueryService = null;
/**
 * Initialize global query service
 */
export function initializeProgressQueryService(projectPath, cache) {
    globalQueryService = new ProgressQueryService(projectPath, cache);
    return globalQueryService;
}
/**
 * Get global query service
 */
export function getProgressQueryService() {
    if (!globalQueryService) {
        throw new Error('Progress query service not initialized. Call initializeProgressQueryService first.');
    }
    return globalQueryService;
}
//# sourceMappingURL=progress-query-service.js.map