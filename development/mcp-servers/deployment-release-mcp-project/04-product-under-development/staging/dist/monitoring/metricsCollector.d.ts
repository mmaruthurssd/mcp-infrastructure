import type { MetricsData } from '../types.js';
export interface MetricsSnapshot {
    timestamp: string;
    errorRate: number;
    avgResponseTime: number;
    requestRate: number;
    cpuUsage: number;
    memoryUsage: number;
    serviceHealthy: boolean;
    errors: string[];
}
export declare class MetricsCollector {
    private snapshots;
    private errorCount;
    private requestCount;
    private responseTimes;
    /**
     * Collect a single snapshot of all metrics
     */
    collectSnapshot(healthCheckUrl?: string): Promise<MetricsSnapshot>;
    /**
     * Get CPU usage percentage
     */
    private getCpuUsage;
    /**
     * Get memory usage percentage
     */
    private getMemoryUsage;
    /**
     * Check service health via HTTP/HTTPS endpoint
     */
    private checkServiceHealth;
    /**
     * Calculate aggregated metrics from all snapshots
     */
    getAggregatedMetrics(): MetricsData;
    /**
     * Get all snapshots
     */
    getSnapshots(): MetricsSnapshot[];
    /**
     * Get all errors from snapshots
     */
    getAllErrors(): string[];
    /**
     * Reset all collected data
     */
    reset(): void;
}
//# sourceMappingURL=metricsCollector.d.ts.map