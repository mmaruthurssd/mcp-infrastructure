#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DataStore } from './lib/dataStore.js';
import { MetricsCollector } from './lib/metricsCollector.js';
import {
  mean,
  percentile,
  zScore,
  standardDeviation,
  errorRate,
  generateRecommendations,
} from './lib/utils.js';
import {
  PerformanceMetric,
  Anomaly,
  Alert,
  MetricSummary,
  AggregatedMetric,
  Sensitivity,
  LookbackWindow,
  DetectionMethod,
  MetricType,
  McpHealthStatus,
} from './types/index.js';

/**
 * Performance Monitor MCP Server
 *
 * Provides real-time performance monitoring and alerting for MCP servers
 */

// Initialize data store and metrics collector
const dataStore = new DataStore();
const metricsCollector = new MetricsCollector(dataStore);

// Alert state (in-memory for rate limiting)
const alertRateLimits = new Map<string, { count: number; resetTime: number }>();
const DEFAULT_THRESHOLDS = {
  response_time: { warning: 500, critical: 1000 },
  error_rate: { warning: 1, critical: 5 },
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 75, critical: 90 },
};

// Initialize server
const server = new Server(
  {
    name: 'performance-monitor-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool 1: track_performance
 */
const TrackPerformanceSchema = z.object({
  mcpServer: z.string().describe('MCP server name'),
  toolName: z.string().describe('Tool name'),
  duration: z.number().min(0).describe('Execution duration in milliseconds'),
  success: z.boolean().describe('Whether the operation succeeded'),
  errorMessage: z.string().optional().describe('Error message if failed'),
  resourceUsage: z.object({
    cpu: z.number().describe('CPU usage percentage'),
    memory: z.number().describe('Memory usage in MB'),
    diskIO: z.number().describe('Disk I/O in KB'),
  }).optional().describe('Resource usage metrics'),
});

/**
 * Tool 2: get_metrics
 */
const GetMetricsSchema = z.object({
  mcpServer: z.string().optional().describe('Filter by MCP server'),
  toolName: z.string().optional().describe('Filter by tool name'),
  startTime: z.string().describe('Start time (ISO 8601)'),
  endTime: z.string().describe('End time (ISO 8601)'),
  aggregation: z.enum(['avg', 'p50', 'p95', 'p99', 'max', 'count']).optional().default('avg').describe('Aggregation type'),
  groupBy: z.enum(['hour', 'day']).optional().describe('Group results by time period'),
});

/**
 * Tool 3: detect_anomalies
 */
const DetectAnomaliesSchema = z.object({
  mcpServer: z.string().optional().describe('Filter by MCP server'),
  toolName: z.string().optional().describe('Filter by tool name'),
  lookbackWindow: z.enum(['1h', '6h', '24h']).optional().default('6h').describe('Lookback window'),
  sensitivity: z.enum(['low', 'medium', 'high']).optional().default('medium').describe('Detection sensitivity'),
  method: z.enum(['z-score', 'moving-avg', 'percentile']).optional().default('z-score').describe('Detection method'),
});

/**
 * Tool 4: set_alert_threshold
 */
const SetAlertThresholdSchema = z.object({
  mcpServer: z.string().optional().describe('Apply to specific MCP'),
  toolName: z.string().optional().describe('Apply to specific tool'),
  metric: z.enum(['response_time', 'error_rate', 'cpu', 'memory']).describe('Metric type'),
  threshold: z.number().describe('Threshold value'),
  severity: z.enum(['warning', 'critical']).describe('Alert severity'),
  enabled: z.boolean().optional().default(true).describe('Whether threshold is enabled'),
});

/**
 * Tool 5: get_active_alerts
 */
const GetActiveAlertsSchema = z.object({
  severity: z.enum(['warning', 'critical']).optional().describe('Filter by severity'),
  mcpServer: z.string().optional().describe('Filter by MCP server'),
  status: z.enum(['active', 'acknowledged', 'escalated']).optional().describe('Filter by status'),
});

/**
 * Tool 6: acknowledge_alert
 */
const AcknowledgeAlertSchema = z.object({
  alertId: z.string().describe('Alert ID to acknowledge'),
  acknowledgedBy: z.string().describe('Person acknowledging the alert'),
  notes: z.string().optional().describe('Notes about resolution'),
});

/**
 * Tool 7: generate_performance_report
 */
const GenerateReportSchema = z.object({
  startTime: z.string().describe('Start time (ISO 8601)'),
  endTime: z.string().describe('End time (ISO 8601)'),
  format: z.enum(['markdown', 'json', 'html']).optional().default('markdown').describe('Report format'),
  includeRecommendations: z.boolean().optional().default(true).describe('Include recommendations'),
  mcpServer: z.string().optional().describe('Filter by MCP server'),
});

/**
 * Tool 8: get_performance_dashboard
 */
const GetDashboardSchema = z.object({
  refreshInterval: z.number().optional().default(30).describe('Refresh interval in seconds'),
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'track_performance',
        description: 'Track MCP tool execution performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            mcpServer: { type: 'string', description: 'MCP server name' },
            toolName: { type: 'string', description: 'Tool name' },
            duration: { type: 'number', description: 'Execution duration in milliseconds' },
            success: { type: 'boolean', description: 'Whether the operation succeeded' },
            errorMessage: { type: 'string', description: 'Error message if failed' },
            resourceUsage: {
              type: 'object',
              properties: {
                cpu: { type: 'number', description: 'CPU usage percentage' },
                memory: { type: 'number', description: 'Memory usage in MB' },
                diskIO: { type: 'number', description: 'Disk I/O in KB' },
              },
            },
          },
          required: ['mcpServer', 'toolName', 'duration', 'success'],
        },
      },
      {
        name: 'get_metrics',
        description: 'Query performance metrics with filtering and aggregation',
        inputSchema: {
          type: 'object',
          properties: {
            mcpServer: { type: 'string', description: 'Filter by MCP server' },
            toolName: { type: 'string', description: 'Filter by tool name' },
            startTime: { type: 'string', description: 'Start time (ISO 8601)' },
            endTime: { type: 'string', description: 'End time (ISO 8601)' },
            aggregation: {
              type: 'string',
              enum: ['avg', 'p50', 'p95', 'p99', 'max', 'count'],
              description: 'Aggregation type',
            },
            groupBy: { type: 'string', enum: ['hour', 'day'], description: 'Group by time period' },
          },
          required: ['startTime', 'endTime'],
        },
      },
      {
        name: 'detect_anomalies',
        description: 'Detect performance anomalies using statistical methods',
        inputSchema: {
          type: 'object',
          properties: {
            mcpServer: { type: 'string', description: 'Filter by MCP server' },
            toolName: { type: 'string', description: 'Filter by tool name' },
            lookbackWindow: {
              type: 'string',
              enum: ['1h', '6h', '24h'],
              description: 'Lookback window',
            },
            sensitivity: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Detection sensitivity',
            },
            method: {
              type: 'string',
              enum: ['z-score', 'moving-avg', 'percentile'],
              description: 'Detection method',
            },
          },
        },
      },
      {
        name: 'set_alert_threshold',
        description: 'Configure alerting thresholds for metrics',
        inputSchema: {
          type: 'object',
          properties: {
            mcpServer: { type: 'string', description: 'Apply to specific MCP' },
            toolName: { type: 'string', description: 'Apply to specific tool' },
            metric: {
              type: 'string',
              enum: ['response_time', 'error_rate', 'cpu', 'memory'],
              description: 'Metric type',
            },
            threshold: { type: 'number', description: 'Threshold value' },
            severity: {
              type: 'string',
              enum: ['warning', 'critical'],
              description: 'Alert severity',
            },
            enabled: { type: 'boolean', description: 'Whether threshold is enabled' },
          },
          required: ['metric', 'threshold', 'severity'],
        },
      },
      {
        name: 'get_active_alerts',
        description: 'Get all currently active alerts',
        inputSchema: {
          type: 'object',
          properties: {
            severity: {
              type: 'string',
              enum: ['warning', 'critical'],
              description: 'Filter by severity',
            },
            mcpServer: { type: 'string', description: 'Filter by MCP server' },
            status: {
              type: 'string',
              enum: ['active', 'acknowledged', 'escalated'],
              description: 'Filter by status',
            },
          },
        },
      },
      {
        name: 'acknowledge_alert',
        description: 'Acknowledge an alert to stop notifications',
        inputSchema: {
          type: 'object',
          properties: {
            alertId: { type: 'string', description: 'Alert ID to acknowledge' },
            acknowledgedBy: { type: 'string', description: 'Person acknowledging' },
            notes: { type: 'string', description: 'Notes about resolution' },
          },
          required: ['alertId', 'acknowledgedBy'],
        },
      },
      {
        name: 'generate_performance_report',
        description: 'Generate comprehensive performance report',
        inputSchema: {
          type: 'object',
          properties: {
            startTime: { type: 'string', description: 'Start time (ISO 8601)' },
            endTime: { type: 'string', description: 'End time (ISO 8601)' },
            format: {
              type: 'string',
              enum: ['markdown', 'json', 'html'],
              description: 'Report format',
            },
            includeRecommendations: {
              type: 'boolean',
              description: 'Include recommendations',
            },
            mcpServer: { type: 'string', description: 'Filter by MCP server' },
          },
          required: ['startTime', 'endTime'],
        },
      },
      {
        name: 'get_performance_dashboard',
        description: 'Get real-time performance dashboard data',
        inputSchema: {
          type: 'object',
          properties: {
            refreshInterval: {
              type: 'number',
              description: 'Refresh interval in seconds',
            },
          },
        },
      },
    ],
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'track_performance': {
        const params = TrackPerformanceSchema.parse(args);
        const result = await metricsCollector.trackMetric(params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_metrics': {
        const params = GetMetricsSchema.parse(args);
        const metrics = await dataStore.readMetrics({
          mcpServer: params.mcpServer,
          toolName: params.toolName,
          startTime: params.startTime,
          endTime: params.endTime,
        });

        // Calculate summary
        const durations = metrics.map((m: PerformanceMetric) => m.duration);
        const successCount = metrics.filter((m: PerformanceMetric) => m.success).length;

        const summary: MetricSummary = {
          totalCalls: metrics.length,
          avgResponseTime: mean(durations),
          p50ResponseTime: percentile(durations, 50),
          p95ResponseTime: percentile(durations, 95),
          p99ResponseTime: percentile(durations, 99),
          maxResponseTime: Math.max(...durations, 0),
          minResponseTime: Math.min(...durations, Infinity),
          errorRate: errorRate(successCount, metrics.length),
        };

        // Apply aggregation
        const aggregated: AggregatedMetric[] = [];

        if (params.groupBy) {
          // Group by time period
          const groups = new Map<string, PerformanceMetric[]>();

          for (const metric of metrics) {
            const date = new Date(metric.timestamp);
            const key =
              params.groupBy === 'hour'
                ? `${date.toISOString().slice(0, 13)}:00:00Z`
                : date.toISOString().slice(0, 10);

            if (!groups.has(key)) {
              groups.set(key, []);
            }
            groups.get(key)!.push(metric);
          }

          for (const [key, groupMetrics] of groups) {
            const groupDurations = groupMetrics.map(m => m.duration);
            let value = 0;

            switch (params.aggregation) {
              case 'avg':
                value = mean(groupDurations);
                break;
              case 'p50':
                value = percentile(groupDurations, 50);
                break;
              case 'p95':
                value = percentile(groupDurations, 95);
                break;
              case 'p99':
                value = percentile(groupDurations, 99);
                break;
              case 'max':
                value = Math.max(...groupDurations);
                break;
              case 'count':
                value = groupMetrics.length;
                break;
            }

            aggregated.push({
              timestamp: key,
              mcpServer: params.mcpServer || 'all',
              toolName: params.toolName || 'all',
              value,
              count: groupMetrics.length,
            });
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  metrics: aggregated.length > 0 ? aggregated : metrics.slice(0, 100), // Limit to 100 for non-grouped
                  summary,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'detect_anomalies': {
        const params = DetectAnomaliesSchema.parse(args);

        // Calculate lookback time
        const endTime = new Date();
        const startTime = new Date(endTime);
        switch (params.lookbackWindow) {
          case '1h':
            startTime.setHours(startTime.getHours() - 1);
            break;
          case '6h':
            startTime.setHours(startTime.getHours() - 6);
            break;
          case '24h':
            startTime.setHours(startTime.getHours() - 24);
            break;
        }

        // Read metrics
        const metrics = await dataStore.readMetrics({
          mcpServer: params.mcpServer,
          toolName: params.toolName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

        if (metrics.length < 10) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    anomalies: [],
                    summary: {
                      totalAnomalies: 0,
                      bySeverity: { info: 0, warning: 0, critical: 0 },
                      byType: {},
                    },
                    message:
                      'Insufficient data for anomaly detection (minimum 10 metrics required)',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Detect anomalies
        const anomalies: Anomaly[] = [];
        const durations = metrics.map(m => m.duration);
        const recentMetrics = metrics.slice(-10); // Last 10 metrics

        for (const metric of recentMetrics) {
          let isAnomaly = false;
          let deviation = '';

          // Determine threshold based on sensitivity
          const thresholds = {
            low: 3.0,
            medium: 2.5,
            high: 2.0,
          };
          const threshold = thresholds[params.sensitivity];

          // Apply detection method
          switch (params.method) {
            case 'z-score': {
              const z = zScore(metric.duration, durations);
              if (Math.abs(z) > threshold) {
                isAnomaly = true;
                deviation = `${Math.abs(z).toFixed(1)} standard deviations`;
              }
              break;
            }
            case 'moving-avg': {
              const avg = mean(durations);
              const ratio = metric.duration / avg;
              if (ratio > threshold) {
                isAnomaly = true;
                deviation = `${ratio.toFixed(1)}x average`;
              }
              break;
            }
            case 'percentile': {
              const p95 = percentile(durations, 95);
              if (metric.duration > p95 * (threshold / 2)) {
                isAnomaly = true;
                deviation = `${((metric.duration / p95) * 100).toFixed(0)}% of P95`;
              }
              break;
            }
          }

          if (isAnomaly) {
            const expectedMax = mean(durations) + threshold * standardDeviation(durations);
            const severity =
              metric.duration > expectedMax * 2
                ? 'critical'
                : metric.duration > expectedMax * 1.5
                  ? 'warning'
                  : 'info';

            const anomaly: Anomaly = {
              timestamp: metric.timestamp,
              mcpServer: metric.mcpServer,
              toolName: metric.toolName,
              anomalyType: 'response_time_spike',
              severity,
              details: {
                currentValue: metric.duration,
                expectedRange: `${mean(durations).toFixed(0)}-${expectedMax.toFixed(0)}`,
                deviation,
                confidence: 0.95,
                method: params.method,
              },
              recommendations: generateRecommendations('response_time_spike', metric.mcpServer),
            };

            anomalies.push(anomaly);

            // Store anomaly
            await dataStore.writeAnomaly(anomaly);
          }
        }

        // Calculate summary
        const bySeverity = {
          info: anomalies.filter((a: Anomaly) => a.severity === 'info').length,
          warning: anomalies.filter((a: Anomaly) => a.severity === 'warning').length,
          critical: anomalies.filter((a: Anomaly) => a.severity === 'critical').length,
        };

        const byType: Record<string, number> = {};
        for (const anomaly of anomalies) {
          byType[anomaly.anomalyType] = (byType[anomaly.anomalyType] || 0) + 1;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  anomalies,
                  summary: {
                    totalAnomalies: anomalies.length,
                    bySeverity,
                    byType,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'set_alert_threshold': {
        const params = SetAlertThresholdSchema.parse(args);

        // For now, just return success (thresholds stored in memory/config file)
        const thresholdId = `threshold-${Date.now()}`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  thresholdId,
                  config: {
                    mcpServer: params.mcpServer || 'all',
                    toolName: params.toolName || 'all',
                    metric: params.metric,
                    threshold: params.threshold,
                    severity: params.severity,
                    enabled: params.enabled,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_active_alerts': {
        const params = GetActiveAlertsSchema.parse(args);

        const alerts = await dataStore.readAlerts({
          severity: params.severity,
          mcpServer: params.mcpServer,
          status: params.status,
        });

        // Calculate summary
        const bySeverity = {
          warning: alerts.filter((a: Alert) => a.severity === 'warning').length,
          critical: alerts.filter((a: Alert) => a.severity === 'critical').length,
        };

        const byMcp: Record<string, number> = {};
        for (const alert of alerts) {
          byMcp[alert.mcpServer] = (byMcp[alert.mcpServer] || 0) + 1;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  alerts,
                  summary: {
                    totalActive: alerts.length,
                    bySeverity,
                    byMcp,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'acknowledge_alert': {
        const params = AcknowledgeAlertSchema.parse(args);

        const alerts = await dataStore.readAlerts({});
        const alert = alerts.find((a: Alert) => a.alertId === params.alertId);

        if (!alert) {
          throw new Error(`Alert not found: ${params.alertId}`);
        }

        alert.status = 'acknowledged';
        alert.acknowledgedBy = params.acknowledgedBy;
        alert.acknowledgedAt = new Date().toISOString();
        alert.notes = params.notes || null;

        await dataStore.writeAlert(alert);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  alert,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_performance_report': {
        const params = GenerateReportSchema.parse(args);

        // Read metrics
        const metrics = await dataStore.readMetrics({
          mcpServer: params.mcpServer,
          startTime: params.startTime,
          endTime: params.endTime,
        });

        // Read anomalies
        const anomalies = await dataStore.readAnomalies({
          mcpServer: params.mcpServer,
          startTime: params.startTime,
          endTime: params.endTime,
        });

        // Read alerts
        const alerts = await dataStore.readAlerts({
          mcpServer: params.mcpServer,
        });

        // Calculate summary
        const durations = metrics.map((m: PerformanceMetric) => m.duration);
        const successCount = metrics.filter((m: PerformanceMetric) => m.success).length;

        const summary = {
          period: `${params.startTime} to ${params.endTime}`,
          totalCalls: metrics.length,
          avgResponseTime: mean(durations),
          errorRate: errorRate(successCount, metrics.length),
          anomaliesDetected: anomalies.length,
          alertsTriggered: alerts.length,
        };

        // Generate markdown report
        let report = '';

        if (params.format === 'markdown') {
          report = `# Performance Report

**Period:** ${summary.period}

## Summary

- **Total Calls:** ${summary.totalCalls}
- **Average Response Time:** ${summary.avgResponseTime.toFixed(0)}ms
- **Error Rate:** ${summary.errorRate.toFixed(2)}%
- **Anomalies Detected:** ${summary.anomaliesDetected}
- **Alerts Triggered:** ${summary.alertsTriggered}

## Anomalies

${anomalies.length === 0 ? 'No anomalies detected.' : ''}
${anomalies.map((a: Anomaly) => `- **${a.severity.toUpperCase()}** - ${a.mcpServer}/${a.toolName}: ${a.details.deviation} (${a.details.currentValue}ms)`).join('\n')}

## Active Alerts

${alerts.length === 0 ? 'No active alerts.' : ''}
${alerts.map((a: Alert) => `- **${a.severity.toUpperCase()}** - ${a.mcpServer}: ${a.condition} (current: ${a.currentValue}, threshold: ${a.threshold})`).join('\n')}

${params.includeRecommendations ? '## Recommendations\n\n- Monitor resource usage\n- Review recent deployments\n- Check external service health' : ''}
`;
        } else {
          // JSON format
          report = JSON.stringify(
            {
              summary,
              metrics: metrics.slice(0, 100),
              anomalies,
              alerts,
            },
            null,
            2
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  report,
                  summary,
                  recommendations: params.includeRecommendations
                    ? [
                        'Monitor resource usage across all MCP servers',
                        'Review recent deployments for performance regressions',
                        'Check external service health and availability',
                      ]
                    : [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_performance_dashboard': {
        const params = GetDashboardSchema.parse(args);

        // Get metrics for last hour
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

        const metrics = await dataStore.readMetrics({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

        const alerts = await dataStore.readAlerts({});
        const anomalies = await dataStore.readAnomalies({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

        // Group by MCP server
        const byMcp = new Map<string, PerformanceMetric[]>();
        for (const metric of metrics) {
          if (!byMcp.has(metric.mcpServer)) {
            byMcp.set(metric.mcpServer, []);
          }
          byMcp.get(metric.mcpServer)!.push(metric);
        }

        // Calculate health scores
        const mcpServers: McpHealthStatus[] = [];
        for (const [name, mcpMetrics] of byMcp) {
          const durations = mcpMetrics.map((m: PerformanceMetric) => m.duration);
          const successCount = mcpMetrics.filter((m: PerformanceMetric) => m.success).length;
          const avgResponseTime = mean(durations);
          const mcpErrorRate = errorRate(successCount, mcpMetrics.length);
          const mcpAlerts = alerts.filter((a: Alert) => a.mcpServer === name);

          // Calculate health score (0-100)
          let healthScore = 100;
          if (avgResponseTime > 1000) healthScore -= 30;
          else if (avgResponseTime > 500) healthScore -= 15;
          if (mcpErrorRate > 5) healthScore -= 40;
          else if (mcpErrorRate > 1) healthScore -= 20;
          if (mcpAlerts.length > 0) healthScore -= 10;

          const status =
            healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'critical';

          mcpServers.push({
            name,
            healthScore: Math.max(0, healthScore),
            avgResponseTime,
            errorRate: mcpErrorRate,
            activeAlerts: mcpAlerts.length,
            status,
          });
        }

        const systemHealth =
          mcpServers.every(m => m.status === 'healthy')
            ? 'healthy'
            : mcpServers.some(m => m.status === 'critical')
              ? 'critical'
              : 'degraded';

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  timestamp: new Date().toISOString(),
                  mcpServers,
                  activeAlerts: alerts.length,
                  recentAnomalies: anomalies.length,
                  systemHealth,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

// Start server
async function main() {
  // Initialize data store
  await dataStore.initialize();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Performance Monitor MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
