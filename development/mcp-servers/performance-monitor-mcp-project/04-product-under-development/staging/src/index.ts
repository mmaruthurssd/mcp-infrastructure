#!/usr/bin/env node

/**
 * Performance Monitor MCP Server
 *
 * Real-time performance monitoring and alerting for MCP tool execution
 *
 * Features:
 * - Track performance metrics with <5ms overhead
 * - Detect anomalies using statistical methods
 * - Configure alerting thresholds
 * - Generate performance reports and dashboards
 *
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Tool imports (will be implemented in subsequent tasks)
import { trackPerformance } from './tools/track-performance.js';
import { getMetrics } from './tools/get-metrics.js';
import { detectAnomalies } from './tools/detect-anomalies.js';
import { setAlertThreshold } from './tools/set-alert-threshold.js';
import { getActiveAlerts } from './tools/get-active-alerts.js';
import { acknowledgeAlert } from './tools/acknowledge-alert.js';
import { generatePerformanceReport } from './tools/generate-performance-report.js';
import { getPerformanceDashboard } from './tools/get-performance-dashboard.js';

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOLS: Tool[] = [
  {
    name: 'track_performance',
    description: 'Track MCP tool execution performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        mcpServer: {
          type: 'string',
          description: 'MCP server name',
        },
        toolName: {
          type: 'string',
          description: 'Tool name',
        },
        duration: {
          type: 'number',
          description: 'Execution duration in milliseconds',
        },
        success: {
          type: 'boolean',
          description: 'Whether the operation succeeded',
        },
        errorMessage: {
          type: 'string',
          description: 'Error message if failed',
        },
        resourceUsage: {
          type: 'object',
          properties: {
            cpu: {
              type: 'number',
              description: 'CPU usage percentage',
            },
            memory: {
              type: 'number',
              description: 'Memory usage in MB',
            },
            diskIO: {
              type: 'number',
              description: 'Disk I/O in KB',
            },
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
        mcpServer: {
          type: 'string',
          description: 'Filter by MCP server',
        },
        toolName: {
          type: 'string',
          description: 'Filter by tool name',
        },
        startTime: {
          type: 'string',
          description: 'Start time (ISO 8601)',
        },
        endTime: {
          type: 'string',
          description: 'End time (ISO 8601)',
        },
        aggregation: {
          type: 'string',
          description: 'Aggregation type',
          enum: ['avg', 'p50', 'p95', 'p99', 'max', 'count'],
        },
        groupBy: {
          type: 'string',
          description: 'Group by time period',
          enum: ['hour', 'day'],
        },
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
        mcpServer: {
          type: 'string',
          description: 'Filter by MCP server',
        },
        toolName: {
          type: 'string',
          description: 'Filter by tool name',
        },
        lookbackWindow: {
          type: 'string',
          description: 'Lookback window',
          enum: ['1h', '6h', '24h'],
        },
        sensitivity: {
          type: 'string',
          description: 'Detection sensitivity',
          enum: ['low', 'medium', 'high'],
        },
        method: {
          type: 'string',
          description: 'Detection method',
          enum: ['z-score', 'moving-avg', 'percentile'],
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
        metric: {
          type: 'string',
          description: 'Metric type',
          enum: ['response_time', 'error_rate', 'cpu', 'memory'],
        },
        threshold: {
          type: 'number',
          description: 'Threshold value',
        },
        severity: {
          type: 'string',
          description: 'Alert severity',
          enum: ['warning', 'critical'],
        },
        mcpServer: {
          type: 'string',
          description: 'Apply to specific MCP',
        },
        toolName: {
          type: 'string',
          description: 'Apply to specific tool',
        },
        enabled: {
          type: 'boolean',
          description: 'Whether threshold is enabled',
        },
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
        mcpServer: {
          type: 'string',
          description: 'Filter by MCP server',
        },
        severity: {
          type: 'string',
          description: 'Filter by severity',
          enum: ['warning', 'critical'],
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['active', 'acknowledged', 'escalated'],
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
        alertId: {
          type: 'string',
          description: 'Alert ID to acknowledge',
        },
        acknowledgedBy: {
          type: 'string',
          description: 'Person acknowledging',
        },
        notes: {
          type: 'string',
          description: 'Notes about resolution',
        },
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
        startTime: {
          type: 'string',
          description: 'Start time (ISO 8601)',
        },
        endTime: {
          type: 'string',
          description: 'End time (ISO 8601)',
        },
        mcpServer: {
          type: 'string',
          description: 'Filter by MCP server',
        },
        format: {
          type: 'string',
          description: 'Report format',
          enum: ['markdown', 'json', 'html'],
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Include recommendations',
        },
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
];

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new Server(
  {
    name: 'performance-monitor-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// Request Handlers
// ============================================================================

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'track_performance':
        return await trackPerformance(args);

      case 'get_metrics':
        return await getMetrics(args);

      case 'detect_anomalies':
        return await detectAnomalies(args);

      case 'set_alert_threshold':
        return await setAlertThreshold(args);

      case 'get_active_alerts':
        return await getActiveAlerts(args);

      case 'acknowledge_alert':
        return await acknowledgeAlert(args);

      case 'generate_performance_report':
        return await generatePerformanceReport(args);

      case 'get_performance_dashboard':
        return await getPerformanceDashboard(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
});

// ============================================================================
// Server Startup
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Performance Monitor MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
