/**
 * Metrics Collector
 *
 * Captures and validates performance data
 */
import type { PerformanceMetric } from '../types/index.js';
export declare class MetricsCollector {
    /**
     * Validate and normalize a performance metric
     */
    validateMetric(metric: Partial<PerformanceMetric>): PerformanceMetric;
    /**
     * Calculate metric collection overhead
     */
    measureOverhead(startTime: number): number;
}
//# sourceMappingURL=metrics-collector.d.ts.map