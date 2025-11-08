/**
 * Automatic Progress Update System
 *
 * Listens for handoff completions and automatically updates progress up the hierarchy.
 * Integrates with MCP handoff protocol, cache invalidation, and progress calculation.
 *
 * Created: 2025-10-27
 */
import { EventEmitter } from 'events';
import { getProgressQueryService } from './progress-query-service';
import { getProgressCache } from '../cache/progress-cache-manager';
import { getAuditLogger } from '../utils/handoff-audit';
const DEFAULT_UPDATE_OPTIONS = {
    enableCascadeUpdates: true,
    maxCascadeLevels: 5,
    invalidateCacheOnUpdate: true,
    refreshCacheAfterUpdate: true,
    enableAuditLog: true,
    debounceMs: 1000,
    batchUpdates: true,
};
// ============================================================================
// PROGRESS UPDATE SYSTEM
// ============================================================================
export class ProgressUpdateSystem extends EventEmitter {
    projectPath;
    options;
    queryService;
    cache;
    auditLogger;
    pendingUpdates = new Map();
    debounceTimers = new Map();
    constructor(projectPath, queryService, cache, auditLogger, options = {}) {
        super();
        this.projectPath = projectPath;
        this.options = { ...DEFAULT_UPDATE_OPTIONS, ...options };
        this.queryService = queryService ?? getProgressQueryService();
        this.cache = cache ?? getProgressCache();
        this.auditLogger = this.options.enableAuditLog ? auditLogger ?? getAuditLogger() : undefined;
    }
    // ==========================================================================
    // HANDOFF EVENT HANDLERS
    // ==========================================================================
    /**
     * Handle task completion handoff
     */
    async handleTaskCompletion(handoff) {
        const { workflowId, subGoalId, majorGoalId } = handoff.context;
        // Build cascade chain: task-workflow -> sub-goal -> major-goal -> component -> project
        const affectedEntities = [];
        // 1. Update task workflow progress
        if (workflowId) {
            const entity = await this.updateEntity('task-workflow', workflowId);
            if (entity)
                affectedEntities.push(entity);
        }
        // 2. Update sub-goal progress (if cascade enabled)
        if (this.options.enableCascadeUpdates && subGoalId) {
            const entity = await this.updateEntity('sub-goal', subGoalId);
            if (entity)
                affectedEntities.push(entity);
        }
        // 3. Update major goal progress
        if (this.options.enableCascadeUpdates && majorGoalId) {
            const entity = await this.updateEntity('major-goal', majorGoalId);
            if (entity)
                affectedEntities.push(entity);
        }
        // 4. Update component and project (if cascade enabled)
        if (this.options.enableCascadeUpdates && affectedEntities.length > 0) {
            await this.cascadeToTopLevel(handoff.context.componentId);
        }
        // Create update event
        const updateEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'task-completed',
            triggeredBy: 'task-completion',
            affectedEntities,
            updatedProgress: new Map(affectedEntities.map(e => [`${e.entityType}:${e.entityId}`, this.createProgressInfo(e)])),
            cascadeLevel: affectedEntities.length,
        };
        // Emit event
        this.emit('progress-updated', updateEvent);
        // Log to audit trail
        if (this.auditLogger) {
            await this.logProgressUpdate(updateEvent, handoff);
        }
        return updateEvent;
    }
    /**
     * Handle sub-goal completion handoff
     */
    async handleSubGoalCompletion(handoff) {
        const { subGoalId, majorGoalId, componentId } = handoff.context;
        const affectedEntities = [];
        // 1. Update sub-goal progress
        if (subGoalId) {
            const entity = await this.updateEntity('sub-goal', subGoalId);
            if (entity)
                affectedEntities.push(entity);
        }
        // 2. Update major goal progress
        if (this.options.enableCascadeUpdates && majorGoalId) {
            const entity = await this.updateEntity('major-goal', majorGoalId);
            if (entity)
                affectedEntities.push(entity);
        }
        // 3. Update component and project
        if (this.options.enableCascadeUpdates && componentId) {
            await this.cascadeToTopLevel(componentId);
        }
        const updateEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'subgoal-completed',
            triggeredBy: 'subgoal-completion',
            affectedEntities,
            updatedProgress: new Map(affectedEntities.map(e => [`${e.entityType}:${e.entityId}`, this.createProgressInfo(e)])),
            cascadeLevel: affectedEntities.length,
        };
        this.emit('progress-updated', updateEvent);
        if (this.auditLogger) {
            await this.logProgressUpdate(updateEvent, handoff);
        }
        return updateEvent;
    }
    /**
     * Handle progress update handoff
     */
    async handleProgressUpdate(handoff) {
        const { type: entityType, id: entityId } = handoff.payload.entity;
        const affectedEntities = [];
        // Update the entity
        const entity = await this.updateEntity(entityType, entityId);
        if (entity)
            affectedEntities.push(entity);
        // Cascade if requested
        if (this.options.enableCascadeUpdates &&
            handoff.payload.propagation?.shouldBubbleUp) {
            const parentEntityType = handoff.payload.propagation.parentEntityType;
            const parentEntityId = handoff.payload.propagation.parentEntityId;
            if (parentEntityType && parentEntityId) {
                const parentEntity = await this.updateEntity(parentEntityType, parentEntityId);
                if (parentEntity)
                    affectedEntities.push(parentEntity);
            }
        }
        const updateEvent = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'component-updated',
            triggeredBy: 'progress-update',
            affectedEntities,
            updatedProgress: new Map(affectedEntities.map(e => [`${e.entityType}:${e.entityId}`, this.createProgressInfo(e)])),
            cascadeLevel: affectedEntities.length,
        };
        this.emit('progress-updated', updateEvent);
        if (this.auditLogger) {
            await this.logProgressUpdate(updateEvent, handoff);
        }
        return updateEvent;
    }
    // ==========================================================================
    // UPDATE OPERATIONS
    // ==========================================================================
    /**
     * Update single entity progress
     */
    async updateEntity(entityType, entityId) {
        try {
            // Get current progress (from cache if available)
            const previousResult = await this.getProgressForEntity(entityType, entityId, {
                useCache: true,
                refreshCache: false,
            });
            const previousProgress = previousResult.progress.percentage;
            // Invalidate cache
            if (this.options.invalidateCacheOnUpdate) {
                this.cache.invalidate(entityType, entityId, { cascade: false });
            }
            // Recalculate progress
            const newResult = await this.getProgressForEntity(entityType, entityId, {
                useCache: this.options.refreshCacheAfterUpdate,
                refreshCache: true,
            });
            const newProgress = newResult.progress.percentage;
            return {
                entityType,
                entityId,
                previousProgress,
                newProgress,
                progressChange: newProgress - previousProgress,
            };
        }
        catch (error) {
            console.error(`Failed to update ${entityType} ${entityId}:`, error);
            return null;
        }
    }
    /**
     * Get progress using appropriate public method based on entity type
     */
    async getProgressForEntity(entityType, entityId, options) {
        switch (entityType) {
            case 'project':
                return this.queryService.getProjectProgress(options);
            case 'component':
                return this.queryService.getComponentProgress(entityId, options);
            case 'major-goal':
                return this.queryService.getMajorGoalProgress(entityId, options);
            case 'sub-goal':
                return this.queryService.getSubGoalProgress(entityId, options);
            case 'task-workflow':
                return this.queryService.getTaskWorkflowProgress(entityId, options);
            default:
                throw new Error(`Unsupported entity type: ${entityType}`);
        }
    }
    /**
     * Cascade updates to component and project level
     */
    async cascadeToTopLevel(componentId) {
        if (!componentId)
            return;
        // Update component
        await this.updateEntity('component', componentId);
        // Update project
        await this.updateEntity('project', 'project');
    }
    // ==========================================================================
    // DEBOUNCING AND BATCHING
    // ==========================================================================
    /**
     * Queue update with debouncing
     */
    queueUpdate(handoff) {
        if (!this.options.batchUpdates) {
            // Execute immediately
            this.processHandoff(handoff);
            return;
        }
        const key = `${handoff.handoffType}:${handoff.handoffId}`;
        this.pendingUpdates.set(key, { handoff, queuedAt: Date.now() });
        // Clear existing debounce timer
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new debounce timer
        const timer = setTimeout(() => {
            this.processPendingUpdates();
        }, this.options.debounceMs);
        this.debounceTimers.set(key, timer);
    }
    /**
     * Process pending updates
     */
    async processPendingUpdates() {
        const updates = Array.from(this.pendingUpdates.values());
        this.pendingUpdates.clear();
        this.debounceTimers.clear();
        for (const update of updates) {
            await this.processHandoff(update.handoff);
        }
    }
    /**
     * Process single handoff
     */
    async processHandoff(handoff) {
        try {
            switch (handoff.handoffType) {
                case 'task-completion':
                    await this.handleTaskCompletion(handoff);
                    break;
                case 'subgoal-completion':
                    await this.handleSubGoalCompletion(handoff);
                    break;
                case 'progress-update':
                    await this.handleProgressUpdate(handoff);
                    break;
            }
        }
        catch (error) {
            console.error(`Failed to process handoff ${handoff.handoffId}:`, error);
            this.emit('update-error', { handoff, error });
        }
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create ProgressInfo from AffectedEntity
     */
    createProgressInfo(entity) {
        return {
            percentage: entity.newProgress,
            status: this.calculateStatus(entity.newProgress),
            lastUpdated: new Date().toISOString(),
            completedItems: 0,
            totalItems: 0,
        };
    }
    /**
     * Calculate status from percentage
     */
    calculateStatus(percentage) {
        if (percentage === 0)
            return 'not-started';
        if (percentage === 100)
            return 'completed';
        return 'in-progress';
    }
    /**
     * Log progress update to audit trail
     */
    async logProgressUpdate(event, handoff) {
        if (!this.auditLogger)
            return;
        // This would integrate with the audit logger to record progress updates
        // For now, just emit an event
        this.emit('audit-log', { event, handoff });
    }
    /**
     * Cleanup
     */
    destroy() {
        // Clear all debounce timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        this.pendingUpdates.clear();
        this.removeAllListeners();
    }
}
// ============================================================================
// GLOBAL UPDATE SYSTEM INSTANCE
// ============================================================================
let globalUpdateSystem = null;
/**
 * Initialize global update system
 */
export function initializeProgressUpdateSystem(projectPath, queryService, cache, auditLogger, options) {
    if (globalUpdateSystem) {
        globalUpdateSystem.destroy();
    }
    globalUpdateSystem = new ProgressUpdateSystem(projectPath, queryService, cache, auditLogger, options);
    return globalUpdateSystem;
}
/**
 * Get global update system
 */
export function getProgressUpdateSystem() {
    if (!globalUpdateSystem) {
        throw new Error('Progress update system not initialized. Call initializeProgressUpdateSystem first.');
    }
    return globalUpdateSystem;
}
/**
 * Destroy global update system
 */
export function destroyProgressUpdateSystem() {
    if (globalUpdateSystem) {
        globalUpdateSystem.destroy();
        globalUpdateSystem = null;
    }
}
//# sourceMappingURL=progress-update-system.js.map