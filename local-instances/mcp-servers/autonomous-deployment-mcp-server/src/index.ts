#!/usr/bin/env node

/**
 * Autonomous Deployment MCP Server
 *
 * Provides intelligent issue detection and resolution capabilities
 * with learning-based pattern matching and confidence scoring.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tool handlers (will be implemented in parallel)
import { detectIssue } from "./tools/detect-issue.js";
import { suggestApproaches } from "./tools/suggest-approaches.js";
import { resolveAutonomously } from "./tools/resolve-autonomously.js";
import { resolveWithApproval } from "./tools/resolve-with-approval.js";
import { recordManualResolution } from "./tools/record-manual-resolution.js";
import { getStats } from "./tools/get-stats.js";
import { managePatterns } from "./tools/manage-patterns.js";
import { getPatternPerformance } from "./tools/get-pattern-performance.js";
import { adjustThresholds } from "./tools/adjust-thresholds.js";
import { exportLearningData } from "./tools/export-learning-data.js";

/**
 * Initialize and start the MCP server
 */
async function main() {
  const server = new Server(
    {
      name: "autonomous-deployment-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * List all available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "detect_issue",
          description: "Scan error logs, match patterns, and calculate confidence for autonomous resolution. Returns detected issues with suggested approaches.",
          inputSchema: {
            type: "object",
            properties: {
              source: {
                type: "string",
                enum: ["error-log", "mcp-logs", "performance-metrics"],
                description: "Source to scan for issues (default: error-log)"
              },
              limit: {
                type: "number",
                description: "Maximum number of issues to return (default: 10)"
              },
              minConfidence: {
                type: "number",
                description: "Minimum confidence threshold (0-1, default: 0.5)"
              }
            }
          }
        },
        {
          name: "suggest_approaches",
          description: "Get ranked resolution approaches for a detected issue based on pattern matching and historical success rates.",
          inputSchema: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "Issue ID from detect_issue"
              },
              errorMessage: {
                type: "string",
                description: "Error message to analyze"
              },
              context: {
                type: "object",
                description: "Additional context (component, severity, etc.)"
              }
            },
            required: ["errorMessage"]
          }
        },
        {
          name: "resolve_autonomously",
          description: "Execute autonomous resolution for high-confidence issues (≥0.95). Orchestrates full workflow: goal creation → specification → execution → validation → deployment.",
          inputSchema: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "Issue ID to resolve"
              },
              approachId: {
                type: "string",
                description: "Specific approach to use (optional, uses highest confidence if not provided)"
              },
              dryRun: {
                type: "boolean",
                description: "Simulate resolution without executing (default: false)"
              }
            },
            required: ["issueId"]
          }
        },
        {
          name: "resolve_with_approval",
          description: "Execute assisted resolution for medium-confidence issues (0.70-0.94). Requires human approval before execution.",
          inputSchema: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "Issue ID to resolve"
              },
              approachId: {
                type: "string",
                description: "Approved approach ID"
              },
              approvedBy: {
                type: "string",
                description: "Name/ID of person approving"
              }
            },
            required: ["issueId", "approachId", "approvedBy"]
          }
        },
        {
          name: "record_manual_resolution",
          description: "Learn from manually-resolved issues to improve pattern matching and confidence scoring.",
          inputSchema: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "Issue ID that was manually resolved"
              },
              errorMessage: {
                type: "string",
                description: "Original error message"
              },
              solution: {
                type: "string",
                description: "How the issue was resolved"
              },
              solutionSteps: {
                type: "array",
                items: { type: "string" },
                description: "Step-by-step resolution process"
              },
              duration: {
                type: "number",
                description: "Time taken to resolve (minutes)"
              },
              outcome: {
                type: "string",
                enum: ["success", "partial", "failed"],
                description: "Resolution outcome"
              }
            },
            required: ["errorMessage", "solution", "outcome"]
          }
        },
        {
          name: "get_stats",
          description: "Get autonomous deployment framework statistics including resolution counts, success rates, and confidence metrics.",
          inputSchema: {
            type: "object",
            properties: {
              timeRange: {
                type: "string",
                enum: ["day", "week", "month", "all"],
                description: "Time range for statistics (default: week)"
              },
              groupBy: {
                type: "string",
                enum: ["type", "severity", "pattern", "none"],
                description: "Group statistics by category (default: none)"
              }
            }
          }
        },
        {
          name: "manage_patterns",
          description: "Add, update, or delete patterns in the learning library. Supports creating custom patterns for new issue types.",
          inputSchema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["add", "update", "delete", "list"],
                description: "Pattern management action"
              },
              pattern: {
                type: "object",
                description: "Pattern definition (for add/update)",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  regex: { type: "string" },
                  type: { type: "string", enum: ["broken", "missing", "improvement"] },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  baseConfidence: { type: "number" },
                  suggestedApproaches: { type: "array" }
                }
              },
              patternId: {
                type: "string",
                description: "Pattern ID (for update/delete)"
              }
            },
            required: ["action"]
          }
        },
        {
          name: "get_pattern_performance",
          description: "Analyze pattern matching accuracy and success rates. Identifies high-performing and underperforming patterns.",
          inputSchema: {
            type: "object",
            properties: {
              patternId: {
                type: "string",
                description: "Specific pattern to analyze (optional, shows all if not provided)"
              },
              minUsage: {
                type: "number",
                description: "Minimum usage count to include (default: 1)"
              },
              sortBy: {
                type: "string",
                enum: ["success-rate", "usage-count", "confidence"],
                description: "Sort order (default: success-rate)"
              }
            }
          }
        },
        {
          name: "adjust_thresholds",
          description: "Update autonomous and assisted confidence thresholds based on calibration data and performance metrics.",
          inputSchema: {
            type: "object",
            properties: {
              autonomousThreshold: {
                type: "number",
                description: "New threshold for autonomous resolution (0-1)"
              },
              assistedThreshold: {
                type: "number",
                description: "New threshold for assisted resolution (0-1)"
              },
              maxAutonomousPerDay: {
                type: "number",
                description: "Daily limit for autonomous resolutions"
              },
              dryRun: {
                type: "boolean",
                description: "Preview changes without applying (default: false)"
              }
            }
          }
        },
        {
          name: "export_learning_data",
          description: "Export patterns, outcomes, and performance metrics for analysis and backup.",
          inputSchema: {
            type: "object",
            properties: {
              format: {
                type: "string",
                enum: ["json", "csv"],
                description: "Export format (default: json)"
              },
              includePatterns: {
                type: "boolean",
                description: "Include pattern library (default: true)"
              },
              includeOutcomes: {
                type: "boolean",
                description: "Include resolution outcomes (default: true)"
              },
              includeMetrics: {
                type: "boolean",
                description: "Include performance metrics (default: true)"
              },
              outputPath: {
                type: "string",
                description: "Custom output path (optional)"
              }
            }
          }
        }
      ]
    };
  });

  /**
   * Handle tool execution requests
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "detect_issue":
          return await detectIssue(args as any);

        case "suggest_approaches":
          return await suggestApproaches(args as any);

        case "resolve_autonomously":
          return await resolveAutonomously(args as any);

        case "resolve_with_approval":
          return await resolveWithApproval(args);

        case "record_manual_resolution":
          return await recordManualResolution(args);

        case "get_stats":
          return await getStats(args);

        case "manage_patterns":
          return await managePatterns(args as any);

        case "get_pattern_performance":
          return await getPatternPerformance(args as any);

        case "adjust_thresholds":
          return await adjustThresholds(args as any);

        case "export_learning_data":
          return await exportLearningData(args as any);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Autonomous Deployment MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
