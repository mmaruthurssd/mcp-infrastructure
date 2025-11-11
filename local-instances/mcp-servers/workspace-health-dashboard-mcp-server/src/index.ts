#!/usr/bin/env node

/**
 * Workspace Health Dashboard MCP Server
 *
 * Unified health dashboard providing single pane of glass for:
 * - Workspace health scoring
 * - MCP status and performance
 * - Autonomous resolution metrics
 * - System alerts and bottlenecks
 * - Automation opportunities
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

// Tool imports
import { getWorkspaceHealth } from './tools/get-workspace-health.js';
import { getMcpStatus } from './tools/get-mcp-status.js';
import { getAutonomousMetrics } from './tools/get-autonomous-metrics.js';
import { getTopBottlenecks } from './tools/get-top-bottlenecks.js';
import { getAutomationOpportunities } from './tools/get-automation-opportunities.js';
import { getSystemAlerts } from './tools/get-system-alerts.js';
import { createHealthDashboard } from './tools/create-health-dashboard.js';

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOLS: Tool[] = [
  {
    name: 'get_workspace_health',
    description: 'Get overall workspace health score (0-100) with status, top issues, and breakdown by category. Aggregates data from MCP performance, autonomous resolution success rates, and workflow status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_mcp_status',
    description: 'Query all registered MCPs for health status. Shows name, status, error rate, avg response time, last used, and request counts. Identifies deprecation candidates (unused 30+ days) and high error rate MCPs needing investigation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_autonomous_metrics',
    description: 'Get autonomous resolution metrics from workspace-brain and autonomous framework. Shows total resolutions, success rates (7d, 30d), avg resolution time, ROI metrics (if available), and confidence calibration status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_top_bottlenecks',
    description: 'Identify top bottlenecks in the workspace. Finds slowest MCPs (>2x baseline), high error rate services, and stuck workflows. Returns severity, impact, and recommendations for each bottleneck.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of bottlenecks to return (default: 5)',
        },
      },
    },
  },
  {
    name: 'get_automation_opportunities',
    description: 'Get automation opportunities from workspace-brain telemetry. Identifies repetitive patterns with frequency ≥5 and duration ≥15 min. Calculates potential ROI and provides effort estimates.',
    inputSchema: {
      type: 'object',
      properties: {
        minRoi: {
          type: 'number',
          description: 'Minimum ROI threshold in dollars per month (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of opportunities to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'get_system_alerts',
    description: 'Get critical system alerts requiring immediate attention. Alert types: MCP error rate >10%, autonomous success rate <70%, workflows stuck >24h, disk space low, calibration drift. Returns severity, description, and recommended action.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_health_dashboard',
    description: 'Generate comprehensive formatted health dashboard showing all key metrics in one view. Includes health score, MCP status, autonomous metrics, bottlenecks, and automation opportunities. Real-time updates with emoji indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['markdown', 'json'],
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
    name: 'workspace-health-dashboard-mcp-server',
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
      case 'get_workspace_health':
        return await getWorkspaceHealth(args);

      case 'get_mcp_status':
        return await getMcpStatus(args);

      case 'get_autonomous_metrics':
        return await getAutonomousMetrics(args);

      case 'get_top_bottlenecks':
        return await getTopBottlenecks(args);

      case 'get_automation_opportunities':
        return await getAutomationOpportunities(args);

      case 'get_system_alerts':
        return await getSystemAlerts(args);

      case 'create_health_dashboard':
        return await createHealthDashboard(args);

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
  console.error('Workspace Health Dashboard MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
