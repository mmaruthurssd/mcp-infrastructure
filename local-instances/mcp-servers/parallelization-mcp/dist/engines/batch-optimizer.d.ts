/**
 * Batch Optimizer
 *
 * Optimizes task distribution across parallel agents using critical path
 * method and load balancing algorithms
 */
import { OptimizeBatchDistributionInput, OptimizeBatchDistributionOutput } from '../types.js';
export declare class BatchOptimizer {
    /**
     * Optimize batch distribution
     */
    static optimize(input: OptimizeBatchDistributionInput): OptimizeBatchDistributionOutput;
    /**
     * Normalize graph to ensure nodes is a Map (handles JSON deserialization)
     */
    private static normalizeGraph;
    /**
     * Optimize for minimum total time (critical path method)
     */
    private static optimizeForMinTime;
    /**
     * Optimize for balanced load distribution
     */
    private static optimizeForBalance;
    /**
     * Optimize to minimize conflicts (group similar tasks)
     */
    private static optimizeForConflicts;
    /**
     * Split tasks into sub-batches
     */
    private static splitIntoSubBatches;
    /**
     * Balanced split using bin packing
     */
    private static balancedSplit;
    /**
     * Group similar tasks to minimize conflicts
     */
    private static groupSimilarTasks;
    /**
     * Extract keywords from description
     */
    private static extractKeywords;
    /**
     * Calculate keyword similarity (Jaccard index)
     */
    private static calculateSimilarity;
    /**
     * Calculate load balance metric (0-100, higher is better)
     */
    private static calculateLoadBalance;
    /**
     * Generate reasoning for optimization
     */
    private static generateReasoning;
}
//# sourceMappingURL=batch-optimizer.d.ts.map