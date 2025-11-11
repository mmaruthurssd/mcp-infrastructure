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
import { ProgressInfo } from '../types/hierarchical-entities';
/**
 * Cached progress entry with metadata
 */
export interface CachedProgressEntry {
    progress: ProgressInfo;
    cachedAt: number;
    expiresAt: number;
    hits: number;
    lastAccessed: number;
    entityType: EntityType;
    entityId: string;
    parentEntityType?: EntityType;
    parentEntityId?: string;
    childEntityIds?: string[];
}
export type EntityType = 'project' | 'component' | 'sub-area' | 'major-goal' | 'sub-goal' | 'task-workflow' | 'task';
/**
 * Cache configuration options
 */
export interface CacheConfig {
    defaultTTL: number;
    maxTTL: number;
    minTTL: number;
    maxEntries: number;
    maxMemoryMB: number;
    evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
    enableStatistics: boolean;
    enableCascadeInvalidation: boolean;
}
/**
 * Default cache configuration
 */
export declare const DEFAULT_CACHE_CONFIG: CacheConfig;
/**
 * Cache performance statistics
 */
export interface CacheStatistics {
    hits: number;
    misses: number;
    hitRate: number;
    currentEntries: number;
    maxEntries: number;
    estimatedMemoryMB: number;
    evictions: number;
    expirations: number;
    manualInvalidations: number;
    cascadeInvalidations: number;
    averageGetTimeMs: number;
    averageSetTimeMs: number;
    totalGets: number;
    totalSets: number;
    startTime: number;
    lastResetTime: number;
}
/**
 * High-performance cache manager for hierarchical progress
 */
export declare class ProgressCacheManager {
    private cache;
    private config;
    private statistics;
    private cleanupInterval?;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get cached progress entry
     */
    get(entityType: EntityType, entityId: string): ProgressInfo | null;
    /**
     * Set cached progress entry
     */
    set(entityType: EntityType, entityId: string, progress: ProgressInfo, options?: {
        ttl?: number;
        parentEntityType?: EntityType;
        parentEntityId?: string;
        childEntityIds?: string[];
    }): void;
    /**
     * Check if entry exists and is valid
     */
    has(entityType: EntityType, entityId: string): boolean;
    /**
     * Delete specific entry
     */
    delete(entityType: EntityType, entityId: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Invalidate specific entity and optionally cascade to children
     */
    invalidate(entityType: EntityType, entityId: string, options?: {
        cascade?: boolean;
        cascadeUp?: boolean;
    }): number;
    /**
     * Invalidate by entity type
     */
    invalidateByType(entityType: EntityType): number;
    /**
     * Invalidate by pattern (e.g., all goals in a component)
     */
    invalidateByPattern(pattern: {
        entityType?: EntityType;
        parentEntityType?: EntityType;
        parentEntityId?: string;
    }): number;
    /**
     * Invalidate expired entries
     */
    invalidateExpired(): number;
    /**
     * Evict entries based on configured policy
     */
    private evict;
    /**
     * Evict least recently used entries
     */
    private evictLRU;
    /**
     * Evict least frequently used entries
     */
    private evictLFU;
    /**
     * Evict first-in entries
     */
    private evictFIFO;
    /**
     * Cleanup expired entries and check memory limits
     */
    cleanup(): void;
    /**
     * Estimate memory usage (rough approximation)
     */
    private estimateMemoryUsage;
    /**
     * Get cache statistics
     */
    getStatistics(): CacheStatistics;
    /**
     * Reset statistics
     */
    resetStatistics(): void;
    /**
     * Initialize statistics object
     */
    private initializeStatistics;
    private recordHit;
    private recordMiss;
    private recordGetTime;
    private recordSetTime;
    /**
     * Generate cache key
     */
    private getCacheKey;
    /**
     * Validate and constrain TTL
     */
    private validateTTL;
    /**
     * Get child entity type for cascade invalidation
     */
    private getChildEntityType;
    /**
     * Cleanup on destroy
     */
    destroy(): void;
}
/**
 * Initialize global cache manager
 */
export declare function initializeProgressCache(config?: Partial<CacheConfig>): ProgressCacheManager;
/**
 * Get global cache manager
 */
export declare function getProgressCache(): ProgressCacheManager;
/**
 * Destroy global cache manager
 */
export declare function destroyProgressCache(): void;
//# sourceMappingURL=progress-cache-manager%202.d.ts.map