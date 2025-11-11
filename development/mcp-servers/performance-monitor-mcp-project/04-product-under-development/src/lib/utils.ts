/**
 * Utility functions for statistical calculations
 */

/**
 * Calculate mean (average)
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate z-score for a value
 */
export function zScore(value: number, values: number[]): number {
  const avg = mean(values);
  const stdDev = standardDeviation(values);
  if (stdDev === 0) return 0;
  return (value - avg) / stdDev;
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate moving average
 */
export function movingAverage(values: number[], windowSize: number): number {
  if (values.length === 0) return 0;

  const window = values.slice(-windowSize);
  return mean(window);
}

/**
 * Calculate error rate from metrics
 */
export function errorRate(successCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return ((totalCount - successCount) / totalCount) * 100;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Generate recommendations based on anomaly type
 */
export function generateRecommendations(
  anomalyType: string,
  mcpServer: string
): string[] {
  const recommendations: string[] = [];

  if (anomalyType === 'response_time_spike') {
    recommendations.push(`Check ${mcpServer} resource usage (CPU/Memory)`);
    recommendations.push('Review recent deployments for performance regressions');
    recommendations.push('Verify database connection pool health');
    recommendations.push('Check for network latency issues');
  } else if (anomalyType === 'error_rate_spike') {
    recommendations.push(`Review ${mcpServer} error logs`);
    recommendations.push('Check for recent configuration changes');
    recommendations.push('Verify external service availability');
    recommendations.push('Review input validation logic');
  } else if (anomalyType === 'resource_spike') {
    recommendations.push(`Check ${mcpServer} for memory leaks`);
    recommendations.push('Review concurrent operation limits');
    recommendations.push('Consider scaling resources');
    recommendations.push('Profile CPU-intensive operations');
  }

  return recommendations;
}
