#!/usr/bin/env node
/**
 * Workspace Brain MCP Server
 * External storage and intelligence layer for workspace data
 *
 * Version: 1.2.0
 * Phase: 1.2 (Advanced Analytics - BI Analyst integration)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { homedir } from "os";
import { join } from "path";
// Tool imports
import { logEvent, queryEvents, getEventStats } from "./tools/telemetry.js";
import { generateWeeklySummary, getAutomationOpportunities, getToolUsageStats, analyzeWorkflowEfficiency, identifyHighValueAutomations, generateInsightsReport, trackGoalVelocity, analyzeMcpUsagePatterns, createCustomDashboard } from "./tools/analytics.js";
import { recordPattern, getSimilarPatterns, getPreventiveChecks } from "./tools/learning.js";
import { cacheSet, cacheGet, cacheInvalidate } from "./tools/cache.js";
import { archiveOldData, exportData, getStorageStats } from "./tools/maintenance.js";
// Configuration
const WORKSPACE_BRAIN_PATH = process.env.WORKSPACE_BRAIN_PATH || join(homedir(), "workspace-brain");
// MCP Server
const server = new Server({
    name: "workspace-brain-mcp",
    version: "1.2.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Telemetry Tools
            {
                name: "log_event",
                description: "Log a telemetry event to external brain (task, MCP usage, workflow, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        event_type: {
                            type: "string",
                            description: "Type of event: 'task', 'mcp-usage', 'workflow', etc."
                        },
                        event_data: {
                            type: "object",
                            description: "Event data with optional timestamp, workflow_name, task_type, duration_minutes, tools_used, complexity, outcome, metadata",
                            properties: {
                                timestamp: { type: "string", description: "ISO 8601 timestamp (auto-generated if omitted)" },
                                workflow_name: { type: "string" },
                                task_type: { type: "string" },
                                duration_minutes: { type: "number" },
                                tools_used: { type: "array", items: { type: "string" } },
                                complexity: { type: "number", description: "1-10 complexity score" },
                                outcome: { type: "string", enum: ["completed", "failed", "blocked"] },
                                metadata: { type: "object" }
                            }
                        }
                    },
                    required: ["event_type", "event_data"],
                },
            },
            {
                name: "query_events",
                description: "Query events with filters and time range",
                inputSchema: {
                    type: "object",
                    properties: {
                        filters: {
                            type: "object",
                            properties: {
                                event_type: { type: "string" },
                                workflow_name: { type: "string" },
                                task_type: { type: "string" },
                                tools_used: { type: "array", items: { type: "string" } },
                                outcome: { type: "string" }
                            }
                        },
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        limit: { type: "number", description: "Max results (default: 100)" },
                        sort: { type: "string", enum: ["asc", "desc"], description: "By timestamp (default: desc)" }
                    }
                }
            },
            {
                name: "get_event_stats",
                description: "Get statistics for specific metric",
                inputSchema: {
                    type: "object",
                    properties: {
                        metric: {
                            type: "string",
                            enum: ["count", "avg_duration", "tool_usage", "outcome_distribution"],
                            description: "Metric to calculate"
                        },
                        filters: {
                            type: "object",
                            properties: {
                                event_type: { type: "string" },
                                task_type: { type: "string" },
                                time_range: {
                                    type: "object",
                                    properties: {
                                        start: { type: "string" },
                                        end: { type: "string" }
                                    }
                                }
                            }
                        },
                        group_by: {
                            type: "string",
                            enum: ["type", "day", "week", "month"],
                            description: "Group statistics by time period or type"
                        }
                    },
                    required: ["metric"]
                }
            },
            // Analytics Tools
            {
                name: "generate_weekly_summary",
                description: "Create weekly analytics report from telemetry data",
                inputSchema: {
                    type: "object",
                    properties: {
                        week_start: { type: "string", description: "ISO 8601 date (default: last Monday)" },
                        include_sections: {
                            type: "array",
                            items: { type: "string" },
                            description: "Sections to include: 'summary', 'patterns', 'opportunities'"
                        },
                        output_format: { type: "string", enum: ["markdown", "json"], description: "Output format (default: markdown)" }
                    }
                }
            },
            {
                name: "get_automation_opportunities",
                description: "Find high-value automation targets based on task patterns",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string" },
                                end: { type: "string" }
                            }
                        },
                        min_frequency: { type: "number", description: "Minimum occurrences (default: 3)" },
                        min_duration: { type: "number", description: "Minimum avg duration minutes (default: 15)" },
                        sort_by: { type: "string", enum: ["frequency", "time_savings", "score"], description: "Sort criteria" }
                    }
                }
            },
            {
                name: "get_tool_usage_stats",
                description: "Get tool usage statistics across all events",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string" },
                                end: { type: "string" }
                            }
                        },
                        group_by: { type: "string", enum: ["tool", "day", "week"] },
                        include_combinations: { type: "boolean", description: "Include tool pairs (default: false)" }
                    }
                }
            },
            {
                name: "analyze_workflow_efficiency",
                description: "Analyze workflow efficiency and detect bottlenecks",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        workflow_filter: { type: "string", description: "Filter by workflow name (optional)" },
                        min_executions: { type: "number", description: "Minimum executions to analyze (default: 2)" }
                    }
                }
            },
            {
                name: "identify_high_value_automations",
                description: "Identify high-ROI automation opportunities with detailed analysis",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        min_frequency: { type: "number", description: "Minimum occurrences (default: 3)" },
                        min_duration: { type: "number", description: "Minimum avg duration minutes (default: 15)" },
                        min_roi: { type: "number", description: "Minimum ROI threshold (default: 1.0)" }
                    }
                }
            },
            {
                name: "generate_insights_report",
                description: "Generate actionable insights from telemetry data across multiple categories",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        categories: {
                            type: "array",
                            items: { type: "string", enum: ["productivity", "quality", "tools", "automation"] },
                            description: "Categories to include (default: all)"
                        },
                        min_priority: { type: "string", enum: ["high", "medium", "low"], description: "Minimum priority level (default: medium)" }
                    }
                }
            },
            {
                name: "track_goal_velocity",
                description: "Track goal completion velocity and trends over time",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        goal_filter: { type: "string", description: "Filter by goal name pattern (optional)" },
                        group_by: { type: "string", enum: ["goal", "week", "month"], description: "Grouping method (default: goal)" }
                    }
                }
            },
            {
                name: "analyze_mcp_usage_patterns",
                description: "Analyze MCP tool usage patterns and effectiveness metrics",
                inputSchema: {
                    type: "object",
                    properties: {
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        mcp_filter: { type: "string", description: "Filter by MCP name (optional)" },
                        min_usage_count: { type: "number", description: "Minimum usage count (default: 5)" }
                    }
                }
            },
            {
                name: "create_custom_dashboard",
                description: "Create custom analytics dashboard with selected metrics",
                inputSchema: {
                    type: "object",
                    properties: {
                        dashboard_type: {
                            type: "string",
                            enum: ["productivity", "system_health", "goals"],
                            description: "Type of dashboard to generate"
                        },
                        time_range: {
                            type: "object",
                            properties: {
                                start: { type: "string", description: "ISO 8601" },
                                end: { type: "string", description: "ISO 8601" }
                            }
                        },
                        refresh_interval: { type: "number", description: "Auto-refresh interval in seconds (optional)" }
                    },
                    required: ["dashboard_type"]
                }
            },
            // Learning Tools
            {
                name: "record_pattern",
                description: "Record discovered pattern for learning",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Pattern name" },
                                category: { type: "string", description: "Category: 'workflow', 'bug-fix', 'feature', etc." },
                                description: { type: "string" },
                                frequency: { type: "number" },
                                tools_involved: { type: "array", items: { type: "string" } },
                                steps: { type: "array", items: { type: "string" } },
                                notes: { type: "string" }
                            },
                            required: ["name", "category", "description"]
                        }
                    },
                    required: ["pattern"]
                }
            },
            {
                name: "get_similar_patterns",
                description: "Find similar patterns by query (keyword matching)",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Pattern name or description to search" },
                        category: { type: "string", description: "Filter by category" },
                        limit: { type: "number", description: "Max results (default: 5)" },
                        similarity_threshold: { type: "number", description: "0-1 similarity threshold (default: 0.6)" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_preventive_checks",
                description: "Get preventive checks recommendations based on learned patterns",
                inputSchema: {
                    type: "object",
                    properties: {
                        context: { type: "string", description: "Context: 'pre-commit', 'deployment', etc." },
                        category: { type: "string", description: "Filter by category" }
                    }
                }
            },
            // Cache Tools
            {
                name: "cache_set",
                description: "Store cached value with TTL",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Cache key" },
                        value: { description: "JSON-serializable value" },
                        ttl_seconds: { type: "number", description: "Time to live in seconds (default: 3600)" },
                        category: { type: "string", description: "Cache category: 'project-index', 'metrics', etc." }
                    },
                    required: ["key", "value"]
                }
            },
            {
                name: "cache_get",
                description: "Retrieve cached value (returns null if expired or not found)",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Cache key" },
                        category: { type: "string", description: "Cache category (optional, searches all if not specified)" }
                    },
                    required: ["key"]
                }
            },
            {
                name: "cache_invalidate",
                description: "Invalidate cache by pattern (glob pattern or exact key)",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: { type: "string", description: "Glob pattern or exact key" },
                        category: { type: "string", description: "Cache category to filter" }
                    },
                    required: ["pattern"]
                }
            },
            // Maintenance Tools
            {
                name: "archive_old_data",
                description: "Archive data older than specified date (compresses with gzip)",
                inputSchema: {
                    type: "object",
                    properties: {
                        before_date: { type: "string", description: "ISO 8601 date" },
                        data_type: { type: "string", enum: ["telemetry", "analytics", "all"], description: "Type of data to archive" },
                        compress: { type: "boolean", description: "Compress with gzip (default: true)" }
                    },
                    required: ["before_date"]
                }
            },
            {
                name: "export_data",
                description: "Export data in specified format to backups directory",
                inputSchema: {
                    type: "object",
                    properties: {
                        data_type: {
                            type: "string",
                            enum: ["telemetry", "analytics", "learning", "all"],
                            description: "Type of data to export"
                        },
                        format: { type: "string", enum: ["json", "csv", "jsonl"], description: "Export format" },
                        filters: {
                            type: "object",
                            description: "Optional filters (same as query_events)"
                        },
                        output_path: { type: "string", description: "Custom output path (default: backups/manual-exports/)" }
                    },
                    required: ["data_type", "format"]
                }
            },
            {
                name: "get_storage_stats",
                description: "Get storage usage statistics for external brain",
                inputSchema: {
                    type: "object",
                    properties: {
                        include_breakdown: { type: "boolean", description: "Include breakdown by category (default: true)" }
                    }
                }
            }
        ],
    };
});
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            // Telemetry
            case "log_event":
                return await logEvent(args, WORKSPACE_BRAIN_PATH);
            case "query_events":
                return await queryEvents(args, WORKSPACE_BRAIN_PATH);
            case "get_event_stats":
                return await getEventStats(args, WORKSPACE_BRAIN_PATH);
            // Analytics
            case "generate_weekly_summary":
                return await generateWeeklySummary(args, WORKSPACE_BRAIN_PATH);
            case "get_automation_opportunities":
                return await getAutomationOpportunities(args, WORKSPACE_BRAIN_PATH);
            case "get_tool_usage_stats":
                return await getToolUsageStats(args, WORKSPACE_BRAIN_PATH);
            case "analyze_workflow_efficiency":
                return await analyzeWorkflowEfficiency(args, WORKSPACE_BRAIN_PATH);
            case "identify_high_value_automations":
                return await identifyHighValueAutomations(args, WORKSPACE_BRAIN_PATH);
            case "generate_insights_report":
                return await generateInsightsReport(args, WORKSPACE_BRAIN_PATH);
            case "track_goal_velocity":
                return await trackGoalVelocity(args, WORKSPACE_BRAIN_PATH);
            case "analyze_mcp_usage_patterns":
                return await analyzeMcpUsagePatterns(args, WORKSPACE_BRAIN_PATH);
            case "create_custom_dashboard":
                return await createCustomDashboard(args, WORKSPACE_BRAIN_PATH);
            // Learning
            case "record_pattern":
                return await recordPattern(args, WORKSPACE_BRAIN_PATH);
            case "get_similar_patterns":
                return await getSimilarPatterns(args, WORKSPACE_BRAIN_PATH);
            case "get_preventive_checks":
                return await getPreventiveChecks(args, WORKSPACE_BRAIN_PATH);
            // Cache
            case "cache_set":
                return await cacheSet(args, WORKSPACE_BRAIN_PATH);
            case "cache_get":
                return await cacheGet(args, WORKSPACE_BRAIN_PATH);
            case "cache_invalidate":
                return await cacheInvalidate(args, WORKSPACE_BRAIN_PATH);
            // Maintenance
            case "archive_old_data":
                return await archiveOldData(args, WORKSPACE_BRAIN_PATH);
            case "export_data":
                return await exportData(args, WORKSPACE_BRAIN_PATH);
            case "get_storage_stats":
                return await getStorageStats(args, WORKSPACE_BRAIN_PATH);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing ${name}: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Workspace Brain MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map