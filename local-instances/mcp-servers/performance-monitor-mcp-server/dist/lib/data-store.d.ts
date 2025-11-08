/**
 * Data Store
 *
 * Time-series storage for performance metrics
 */
import type { PerformanceMetric, StorageConfig } from '../types/index.js';
export declare class DataStore {
    private config;
    constructor(config?: Partial<StorageConfig>);
    /**
     * Write metric to JSONL file
     * Organizes by date/mcpServer/toolName for efficient querying
     */
    writeMetric(metric: PerformanceMetric): Promise<void>;
    /**
     * Read metrics from time range
     */
    readMetrics(startTime: string, endTime: string, mcpServer?: string, toolName?: string): Promise<PerformanceMetric[]>;
    /**
     * Clean up old data based on retention policy
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=data-store.d.ts.map