import { DataStore } from './dataStore.js';
import { PerformanceMetric, ResourceUsage, MetricResult } from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * MetricsCollector - Collects and validates performance metrics
 *
 * Features:
 * - Input validation
 * - Automatic timestamping
 * - Batched writes for performance
 * - <5ms processing time
 */
export class MetricsCollector {
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Track a performance metric
   */
  async trackMetric(params: {
    mcpServer: string;
    toolName: string;
    duration: number;
    success: boolean;
    errorMessage?: string;
    resourceUsage?: ResourceUsage;
  }): Promise<MetricResult> {
    const startTime = Date.now();

    // Validate inputs
    this.validateMetric(params);

    // Create metric object
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      mcpServer: params.mcpServer,
      toolName: params.toolName,
      duration: params.duration,
      success: params.success,
      error: params.errorMessage || null,
      resource: params.resourceUsage || null,
    };

    // Generate metric ID
    const metricId = this.generateMetricId(metric);

    // Write to data store (batched, async)
    await this.dataStore.writeMetrics([metric]);

    const processingTime = Date.now() - startTime;

    // Warn if processing takes too long
    if (processingTime > 5) {
      console.warn(`Metric collection took ${processingTime}ms (target: <5ms)`);
    }

    return {
      success: true,
      metricId,
      timestamp: metric.timestamp,
      stored: true,
    };
  }

  /**
   * Validate metric parameters
   */
  private validateMetric(params: {
    mcpServer: string;
    toolName: string;
    duration: number;
    success: boolean;
  }): void {
    if (typeof params.mcpServer !== 'string' || params.mcpServer.trim() === '') {
      throw new Error('mcpServer must be a non-empty string');
    }

    if (typeof params.toolName !== 'string' || params.toolName.trim() === '') {
      throw new Error('toolName must be a non-empty string');
    }

    if (typeof params.duration !== 'number' || params.duration < 0) {
      throw new Error('duration must be a non-negative number');
    }

    if (typeof params.success !== 'boolean') {
      throw new Error('success must be a boolean');
    }
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(metric: PerformanceMetric): string {
    return `${metric.mcpServer}-${metric.toolName}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  }

  /**
   * Flush pending metrics
   */
  async flush(): Promise<void> {
    await this.dataStore.flush();
  }
}
