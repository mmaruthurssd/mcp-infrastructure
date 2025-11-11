/**
 * Performance Tracker
 *
 * Tracks performance metrics across executions for benchmarking and optimization
 */
import { ExecutionMetrics } from '../types.js';
/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
    timestamp: Date;
    executionId: string;
    metrics: ExecutionMetrics;
    metadata: {
        taskCount: number;
        agentCount: number;
        strategy: string;
        optimizationGoal: string;
    };
}
/**
 * Performance statistics
 */
export interface PerformanceStats {
    totalExecutions: number;
    avgSpeedup: number;
    medianSpeedup: number;
    p95Speedup: number;
    avgDuration: number;
    avgConflictRate: number;
    avgFailureRate: number;
    avgLoadBalance: number;
    timeRange: {
        start: Date;
        end: Date;
    };
}
/**
 * Performance comparison
 */
export interface PerformanceComparison {
    strategyA: string;
    strategyB: string;
    statsA: PerformanceStats;
    statsB: PerformanceStats;
    winner: string;
    differences: {
        speedup: number;
        duration: number;
        conflictRate: number;
        failureRate: number;
    };
}
/**
 * Performance Tracker
 */
export declare class PerformanceTracker {
    private static snapshots;
    /**
     * Record performance snapshot
     */
    static record(executionId: string, metrics: ExecutionMetrics, metadata: {
        taskCount: number;
        agentCount: number;
        strategy: string;
        optimizationGoal: string;
    }): void;
    /**
     * Calculate statistics for a set of snapshots
     */
    static calculateStats(snapshots: PerformanceSnapshot[]): PerformanceStats;
    /**
     * Get statistics for all executions
     */
    static getOverallStats(): PerformanceStats;
    /**
     * Get statistics by strategy
     */
    static getStatsByStrategy(strategy: string): PerformanceStats;
    /**
     * Get statistics by optimization goal
     */
    static getStatsByGoal(goal: string): PerformanceStats;
    /**
     * Compare two strategies
     */
    static compareStrategies(strategyA: string, strategyB: string): PerformanceComparison;
    /**
     * Get trend over time
     */
    static getTrend(metric: 'speedup' | 'duration' | 'conflicts' | 'failures', timeWindowMs?: number): {
        timestamp: Date;
        value: number;
    }[];
    /**
     * Extract metric value
     */
    private static extractMetricValue;
    /**
     * Identify performance regressions
     */
    static identifyRegressions(baselineWindow?: number, currentWindow?: number): {
        hasRegression: boolean;
        details: string[];
    };
    /**
     * Generate performance report
     */
    static generateReport(): string;
    /**
     * Clear all data
     */
    static clear(): void;
    /**
     * Export data
     */
    static export(): PerformanceSnapshot[];
    /**
     * Import data
     */
    static import(snapshots: PerformanceSnapshot[]): void;
}
//# sourceMappingURL=performance-tracker.d.ts.map