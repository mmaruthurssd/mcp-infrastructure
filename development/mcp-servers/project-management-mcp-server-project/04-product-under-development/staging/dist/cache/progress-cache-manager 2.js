/**
 * Progress Cache Manager
 *
 * High-performance caching system for hierarchical progress calculations.
 * Provides TTL-based expiration, manual invalidation, and hierarchical cache invalidation.
 *
 * Performance target: < 5 seconds for 100+ goals
 *
 * Created: 2025-10-27
 */
/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxTTL: 60 * 60 * 1000, // 1 hour
    minTTL: 30 * 1000, // 30 seconds
    maxEntries: 10000,
    maxMemoryMB: 50,
    evictionPolicy: 'LRU',
    enableStatistics: true,
    enableCascadeInvalidation: true,
};
// ============================================================================
// PROGRESS CACHE MANAGER
// ============================================================================
/**
 * High-performance cache manager for hierarchical progress
 */
export class ProgressCacheManager {
    cache = new Map();
    config;
    statistics;
    cleanupInterval;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.statistics = this.initializeStatistics();
        // Start automatic cleanup (every minute)
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
    // ==========================================================================
    // CORE CACHE OPERATIONS
    // ==========================================================================
    /**
     * Get cached progress entry
     */
    get(entityType, entityId) {
        const startTime = Date.now();
        const key = this.getCacheKey(entityType, entityId);
        const entry = this.cache.get(key);
        if (!entry) {
            this.recordMiss();
            this.recordGetTime(Date.now() - startTime);
            return null;
        }
        // Check expiration
        const now = Date.now();
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.statistics.expirations++;
            this.recordMiss();
            this.recordGetTime(Date.now() - startTime);
            return null;
        }
        // Update access metadata
        entry.hits++;
        entry.lastAccessed = now;
        this.recordHit();
        this.recordGetTime(Date.now() - startTime);
        return entry.progress;
    }
    /**
     * Set cached progress entry
     */
    set(entityType, entityId, progress, options = {}) {
        const startTime = Date.now();
        // Check size limits before adding
        if (this.cache.size >= this.config.maxEntries) {
            this.evict();
        }
        const now = Date.now();
        const ttl = this.validateTTL(options.ttl ?? this.config.defaultTTL);
        const key = this.getCacheKey(entityType, entityId);
        const entry = {
            progress,
            cachedAt: now,
            expiresAt: now + ttl,
            hits: 0,
            lastAccessed: now,
            entityType,
            entityId,
            parentEntityType: options.parentEntityType,
            parentEntityId: options.parentEntityId,
            childEntityIds: options.childEntityIds,
        };
        this.cache.set(key, entry);
        this.statistics.totalSets++;
        this.recordSetTime(Date.now() - startTime);
    }
    /**
     * Check if entry exists and is valid
     */
    has(entityType, entityId) {
        const key = this.getCacheKey(entityType, entityId);
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.statistics.expirations++;
            return false;
        }
        return true;
    }
    /**
     * Delete specific entry
     */
    delete(entityType, entityId) {
        const key = this.getCacheKey(entityType, entityId);
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.statistics.manualInvalidations++;
        }
        return deleted;
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.statistics.manualInvalidations += this.cache.size;
    }
    // ==========================================================================
    // INVALIDATION STRATEGIES
    // ==========================================================================
    /**
     * Invalidate specific entity and optionally cascade to children
     */
    invalidate(entityType, entityId, options = {}) {
        let invalidatedCount = 0;
        // Invalidate the entity itself
        if (this.delete(entityType, entityId)) {
            invalidatedCount++;
        }
        // Cascade to children
        if (options.cascade && this.config.enableCascadeInvalidation) {
            const key = this.getCacheKey(entityType, entityId);
            const entry = this.cache.get(key);
            if (entry?.childEntityIds) {
                const childType = this.getChildEntityType(entityType);
                if (childType) {
                    for (const childId of entry.childEntityIds) {
                        invalidatedCount += this.invalidate(childType, childId, { cascade: true });
                    }
                }
            }
        }
        // Cascade to parents
        if (options.cascadeUp && this.config.enableCascadeInvalidation) {
            const key = this.getCacheKey(entityType, entityId);
            const entry = this.cache.get(key);
            if (entry?.parentEntityType && entry.parentEntityId) {
                invalidatedCount += this.invalidate(entry.parentEntityType, entry.parentEntityId, { cascadeUp: true });
            }
        }
        this.statistics.cascadeInvalidations += invalidatedCount;
        return invalidatedCount;
    }
    /**
     * Invalidate by entity type
     */
    invalidateByType(entityType) {
        let invalidatedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.entityType === entityType) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }
        this.statistics.manualInvalidations += invalidatedCount;
        return invalidatedCount;
    }
    /**
     * Invalidate by pattern (e.g., all goals in a component)
     */
    invalidateByPattern(pattern) {
        let invalidatedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            let matches = true;
            if (pattern.entityType && entry.entityType !== pattern.entityType) {
                matches = false;
            }
            if (pattern.parentEntityType && entry.parentEntityType !== pattern.parentEntityType) {
                matches = false;
            }
            if (pattern.parentEntityId && entry.parentEntityId !== pattern.parentEntityId) {
                matches = false;
            }
            if (matches) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }
        this.statistics.manualInvalidations += invalidatedCount;
        return invalidatedCount;
    }
    /**
     * Invalidate expired entries
     */
    invalidateExpired() {
        const now = Date.now();
        let invalidatedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }
        this.statistics.expirations += invalidatedCount;
        return invalidatedCount;
    }
    // ==========================================================================
    // EVICTION POLICIES
    // ==========================================================================
    /**
     * Evict entries based on configured policy
     */
    evict() {
        const entriesToEvict = Math.max(1, Math.floor(this.config.maxEntries * 0.1)); // Evict 10%
        switch (this.config.evictionPolicy) {
            case 'LRU':
                this.evictLRU(entriesToEvict);
                break;
            case 'LFU':
                this.evictLFU(entriesToEvict);
                break;
            case 'FIFO':
                this.evictFIFO(entriesToEvict);
                break;
        }
    }
    /**
     * Evict least recently used entries
     */
    evictLRU(count) {
        const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        for (let i = 0; i < count && i < entries.length; i++) {
            this.cache.delete(entries[i][0]);
            this.statistics.evictions++;
        }
    }
    /**
     * Evict least frequently used entries
     */
    evictLFU(count) {
        const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.hits - b.hits);
        for (let i = 0; i < count && i < entries.length; i++) {
            this.cache.delete(entries[i][0]);
            this.statistics.evictions++;
        }
    }
    /**
     * Evict first-in entries
     */
    evictFIFO(count) {
        const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.cachedAt - b.cachedAt);
        for (let i = 0; i < count && i < entries.length; i++) {
            this.cache.delete(entries[i][0]);
            this.statistics.evictions++;
        }
    }
    // ==========================================================================
    // MAINTENANCE
    // ==========================================================================
    /**
     * Cleanup expired entries and check memory limits
     */
    cleanup() {
        // Remove expired entries
        this.invalidateExpired();
        // Check memory limits
        const estimatedMemoryMB = this.estimateMemoryUsage();
        if (estimatedMemoryMB > this.config.maxMemoryMB) {
            const entriesToEvict = Math.ceil(this.cache.size * 0.2); // Evict 20%
            this.evictLRU(entriesToEvict);
        }
    }
    /**
     * Estimate memory usage (rough approximation)
     */
    estimateMemoryUsage() {
        // Rough estimate: 500 bytes per entry (entry object + progress data)
        const bytesPerEntry = 500;
        const totalBytes = this.cache.size * bytesPerEntry;
        return totalBytes / (1024 * 1024); // Convert to MB
    }
    // ==========================================================================
    // STATISTICS
    // ==========================================================================
    /**
     * Get cache statistics
     */
    getStatistics() {
        const hitRate = this.statistics.totalGets > 0
            ? (this.statistics.hits / this.statistics.totalGets) * 100
            : 0;
        return {
            ...this.statistics,
            hitRate: Math.round(hitRate * 100) / 100,
            currentEntries: this.cache.size,
            estimatedMemoryMB: this.estimateMemoryUsage(),
        };
    }
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = this.initializeStatistics();
    }
    /**
     * Initialize statistics object
     */
    initializeStatistics() {
        return {
            hits: 0,
            misses: 0,
            hitRate: 0,
            currentEntries: 0,
            maxEntries: this.config.maxEntries,
            estimatedMemoryMB: 0,
            evictions: 0,
            expirations: 0,
            manualInvalidations: 0,
            cascadeInvalidations: 0,
            averageGetTimeMs: 0,
            averageSetTimeMs: 0,
            totalGets: 0,
            totalSets: 0,
            startTime: Date.now(),
            lastResetTime: Date.now(),
        };
    }
    recordHit() {
        this.statistics.hits++;
        this.statistics.totalGets++;
    }
    recordMiss() {
        this.statistics.misses++;
        this.statistics.totalGets++;
    }
    recordGetTime(timeMs) {
        const total = this.statistics.averageGetTimeMs * (this.statistics.totalGets - 1);
        this.statistics.averageGetTimeMs = (total + timeMs) / this.statistics.totalGets;
    }
    recordSetTime(timeMs) {
        const total = this.statistics.averageSetTimeMs * (this.statistics.totalSets - 1);
        this.statistics.averageSetTimeMs = (total + timeMs) / this.statistics.totalSets;
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Generate cache key
     */
    getCacheKey(entityType, entityId) {
        return `${entityType}:${entityId}`;
    }
    /**
     * Validate and constrain TTL
     */
    validateTTL(ttl) {
        return Math.max(this.config.minTTL, Math.min(ttl, this.config.maxTTL));
    }
    /**
     * Get child entity type for cascade invalidation
     */
    getChildEntityType(entityType) {
        const hierarchy = {
            project: 'component',
            component: 'major-goal',
            'sub-area': 'major-goal',
            'major-goal': 'sub-goal',
            'sub-goal': 'task-workflow',
            'task-workflow': 'task',
            task: null,
        };
        return hierarchy[entityType];
    }
    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}
// ============================================================================
// GLOBAL CACHE INSTANCE
// ============================================================================
let globalCacheManager = null;
/**
 * Initialize global cache manager
 */
export function initializeProgressCache(config) {
    if (globalCacheManager) {
        globalCacheManager.destroy();
    }
    globalCacheManager = new ProgressCacheManager(config);
    return globalCacheManager;
}
/**
 * Get global cache manager
 */
export function getProgressCache() {
    if (!globalCacheManager) {
        throw new Error('Progress cache not initialized. Call initializeProgressCache first.');
    }
    return globalCacheManager;
}
/**
 * Destroy global cache manager
 */
export function destroyProgressCache() {
    if (globalCacheManager) {
        globalCacheManager.destroy();
        globalCacheManager = null;
    }
}
//# sourceMappingURL=progress-cache-manager%202.js.map