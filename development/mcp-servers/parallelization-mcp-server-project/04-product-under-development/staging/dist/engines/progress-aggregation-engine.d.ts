/**
 * Progress Aggregation Engine
 *
 * Aggregates progress from multiple parallel agents with bottleneck detection
 */
import { AggregateProgressInput, AggregateProgressOutput } from '../types.js';
export declare class ProgressAggregationEngine {
    /**
     * Aggregate progress from agents
     */
    static aggregate(input: AggregateProgressInput): AggregateProgressOutput;
    /**
     * Simple average aggregation
     */
    private static simpleAverage;
    /**
     * Weighted average aggregation
     */
    private static weightedAverage;
    /**
     * Critical path aggregation
     */
    private static criticalPathProgress;
    /**
     * Detect bottlenecks (agents blocking others or running slow)
     */
    private static detectBottlenecks;
    /**
     * Assess bottleneck impact
     */
    private static assessBottleneckImpact;
    /**
     * Estimate completion time
     */
    private static estimateCompletion;
    /**
     * Format progress report (for debugging/logging)
     */
    static formatProgressReport(output: AggregateProgressOutput): string;
}
//# sourceMappingURL=progress-aggregation-engine.d.ts.map