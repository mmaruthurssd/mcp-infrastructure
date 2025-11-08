/**
 * Get Metrics Tool
 *
 * Query performance metrics with filtering and aggregation
 */

import { DataStore } from '../lib/data-store.js';
import type { AggregationType, PerformanceMetric, AggregatedMetric } from '../types/index.js';

const dataStore = new DataStore();

export async function getMetrics(args: Record<string, unknown>) {
  try {
    // Validate required parameters
    const startTime = args.startTime as string;
    const endTime = args.endTime as string;

    if (!startTime || !endTime) {
      throw new Error('Missing required parameters: startTime, endTime');
    }

    // Optional filters
    const mcpServer = args.mcpServer as string | undefined;
    const toolName = args.toolName as string | undefined;
    const aggregation = (args.aggregation as AggregationType) || 'count';
    const groupBy = args.groupBy as 'hour' | 'day' | undefined;

    // Read metrics
    const metrics = await dataStore.readMetrics(startTime, endTime, mcpServer, toolName);

    // Apply aggregation if requested
    if (aggregation !== 'count' && !groupBy) {
      const aggregatedValue = calculateAggregation(metrics, aggregation);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: {
                  startTime,
                  endTime,
                  mcpServer,
                  toolName,
                  aggregation,
                  value: aggregatedValue,
                  count: metrics.length,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Group by time period if requested
    if (groupBy) {
      const grouped = groupMetrics(metrics, groupBy, aggregation);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: {
                  startTime,
                  endTime,
                  mcpServer,
                  toolName,
                  aggregation,
                  groupBy,
                  metrics: grouped,
                  totalCount: metrics.length,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Return raw metrics
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              data: {
                startTime,
                endTime,
                mcpServer,
                toolName,
                metrics,
                count: metrics.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Calculate aggregation for metrics
 */
function calculateAggregation(metrics: PerformanceMetric[], aggregation: AggregationType): number {
  if (metrics.length === 0) return 0;

  const durations = metrics.map(m => m.duration);

  switch (aggregation) {
    case 'avg':
      return durations.reduce((a, b) => a + b, 0) / durations.length;

    case 'max':
      return Math.max(...durations);

    case 'p50':
      return percentile(durations, 50);

    case 'p95':
      return percentile(durations, 95);

    case 'p99':
      return percentile(durations, 99);

    case 'count':
      return metrics.length;

    default:
      return metrics.length;
  }
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Group metrics by time period
 */
function groupMetrics(
  metrics: PerformanceMetric[],
  groupBy: 'hour' | 'day',
  aggregation: AggregationType
): AggregatedMetric[] {
  const grouped = new Map<string, PerformanceMetric[]>();

  for (const metric of metrics) {
    const date = new Date(metric.timestamp);
    let key: string;

    if (groupBy === 'hour') {
      key = date.toISOString().substring(0, 13) + ':00:00.000Z'; // Hour precision
    } else {
      key = date.toISOString().substring(0, 10) + 'T00:00:00.000Z'; // Day precision
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(metric);
  }

  const result: AggregatedMetric[] = [];
  for (const [timestamp, groupMetrics] of grouped.entries()) {
    result.push({
      timestamp,
      value: calculateAggregation(groupMetrics, aggregation),
      count: groupMetrics.length,
      aggregationType: aggregation,
    });
  }

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
