/**
 * Learning & Optimization Layer
 *
 * Tracks execution patterns, learns from successes/failures, and improves
 * parallelization decisions over time.
 */
import { ExecuteParallelWorkflowOutput, AnalyzeTaskParallelizabilityOutput, OptimizeBatchDistributionOutput } from '../types.js';
/**
 * Execution record for learning
 */
export interface ExecutionRecord {
    id: string;
    timestamp: Date;
    taskCount: number;
    agentCount: number;
    optimizationGoal: string;
    executionStrategy: string;
    analysis: {
        score: number;
        confidence: number;
        estimatedSpeedup: number;
        riskCount: number;
    };
    execution: {
        success: boolean;
        actualSpeedup: number;
        duration: number;
        conflictCount: number;
        failureCount: number;
    };
    batchDistribution: {
        batchCount: number;
        loadBalance: number;
        avgBatchSize: number;
    };
    outcome: 'success' | 'partial-success' | 'failure';
    learnings: string[];
}
/**
 * Performance benchmark data
 */
export interface BenchmarkData {
    strategy: string;
    totalExecutions: number;
    successRate: number;
    avgSpeedup: number;
    avgLoadBalance: number;
    avgConflictRate: number;
    bestCaseSpeedup: number;
    worstCaseSpeedup: number;
}
/**
 * Pattern learned from history
 */
export interface LearnedPattern {
    id: string;
    pattern: string;
    confidence: number;
    occurrences: number;
    avgSpeedup: number;
    recommendation: string;
    conditions: {
        taskCountRange?: [number, number];
        agentCountRange?: [number, number];
        scoreRange?: [number, number];
    };
}
/**
 * Learning Optimizer
 */
export declare class LearningOptimizer {
    private static records;
    private static patterns;
    /**
     * Record an execution for learning
     */
    static recordExecution(analysis: AnalyzeTaskParallelizabilityOutput, distribution: OptimizeBatchDistributionOutput, execution: ExecuteParallelWorkflowOutput, params: {
        taskCount: number;
        agentCount: number;
        optimizationGoal: string;
        executionStrategy: string;
    }): ExecutionRecord;
    /**
     * Classify execution outcome
     */
    private static classifyOutcome;
    /**
     * Extract learnings from execution
     */
    private static extractLearnings;
    /**
     * Update learned patterns
     */
    private static updatePatterns;
    /**
     * Find or create pattern
     */
    private static findOrCreatePattern;
    /**
     * Update pattern statistics
     */
    private static updatePatternStats;
    /**
     * Get task count bucket
     */
    private static getTaskCountBucket;
    /**
     * Get task count range
     */
    private static getTaskCountRange;
    /**
     * Generate benchmark report
     */
    static generateBenchmark(): BenchmarkData[];
    /**
     * Get learned patterns
     */
    static getLearnedPatterns(): LearnedPattern[];
    /**
     * Suggest improvements based on history
     */
    static suggestImprovements(taskCount: number, agentCount: number): string[];
    /**
     * Analyze failure patterns
     */
    static analyzeFailures(): {
        totalFailures: number;
        commonPatterns: string[];
        recommendations: string[];
    };
    /**
     * Get execution history
     */
    static getExecutionHistory(limit?: number): ExecutionRecord[];
    /**
     * Clear history (for testing or reset)
     */
    static clearHistory(): void;
    /**
     * Export data for persistence
     */
    static exportData(): {
        records: ExecutionRecord[];
        patterns: LearnedPattern[];
    };
    /**
     * Import data from persistence
     */
    static importData(data: {
        records: ExecutionRecord[];
        patterns: LearnedPattern[];
    }): void;
}
//# sourceMappingURL=learning-optimizer.d.ts.map