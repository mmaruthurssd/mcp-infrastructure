/**
 * Metrics Collector
 *
 * Captures and validates performance data
 */

import type { PerformanceMetric } from '../types/index.js';

export class MetricsCollector {
  /**
   * Validate and normalize a performance metric
   */
  validateMetric(metric: Partial<PerformanceMetric>): PerformanceMetric {
    // Implementation will be added in Task 7
    const validated: PerformanceMetric = {
      timestamp: metric.timestamp || new Date().toISOString(),
      mcpServer: metric.mcpServer || '',
      toolName: metric.toolName || '',
      duration: metric.duration || 0,
      success: metric.success ?? true,
      errorMessage: metric.errorMessage,
      resourceUsage: metric.resourceUsage,
    };

    return validated;
  }

  /**
   * Calculate metric collection overhead
   */
  measureOverhead(startTime: number): number {
    return Date.now() - startTime;
  }
}
