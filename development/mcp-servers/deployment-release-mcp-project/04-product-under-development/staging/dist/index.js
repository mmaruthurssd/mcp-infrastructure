#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// Tool imports (to be implemented)
import { deployApplication } from "./tools/deployApplication.js";
import { rollbackDeployment } from "./tools/rollbackDeployment.js";
import { validateDeployment } from "./tools/validateDeployment.js";
import { coordinateRelease } from "./tools/coordinateRelease.js";
import { generateReleaseNotes } from "./tools/generateReleaseNotes.js";
import { monitorDeploymentHealth } from "./tools/monitorDeploymentHealth.js";
const server = new Server({
    name: "deployment-release-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "deploy_application",
                description: "Deploy application to target environment with pre-deployment validation and health checks. Supports multiple deployment strategies (rolling, blue-green, canary, recreate).",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        environment: {
                            type: "string",
                            enum: ["dev", "staging", "production"],
                            description: "Target deployment environment",
                        },
                        target: {
                            type: "string",
                            description: "Specific service/component to deploy (default: all)",
                        },
                        strategy: {
                            type: "string",
                            enum: ["rolling", "blue-green", "canary", "recreate"],
                            description: "Deployment strategy to use (default: rolling)",
                        },
                        preChecks: {
                            type: "boolean",
                            description: "Run quality gates before deployment (default: true)",
                        },
                        dryRun: {
                            type: "boolean",
                            description: "Simulate deployment without executing (default: false)",
                        },
                        config: {
                            type: "object",
                            properties: {
                                timeout: {
                                    type: "number",
                                    description: "Deployment timeout in seconds",
                                },
                                parallelism: {
                                    type: "number",
                                    description: "Number of parallel deployments",
                                },
                                healthCheckUrl: {
                                    type: "string",
                                    description: "Health check endpoint URL",
                                },
                            },
                            description: "Deployment configuration options",
                        },
                    },
                    required: ["projectPath", "environment"],
                },
            },
            {
                name: "rollback_deployment",
                description: "Rollback to previous stable version with state preservation and validation. Creates snapshot before rollback and validates after completion.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        environment: {
                            type: "string",
                            enum: ["dev", "staging", "production"],
                            description: "Environment to rollback",
                        },
                        deploymentId: {
                            type: "string",
                            description: "Specific deployment ID to rollback (default: latest)",
                        },
                        target: {
                            type: "string",
                            description: "Specific service to rollback (default: all)",
                        },
                        preserveData: {
                            type: "boolean",
                            description: "Preserve database state during rollback (default: true)",
                        },
                        reason: {
                            type: "string",
                            description: "Reason for rollback (required for audit trail)",
                        },
                        force: {
                            type: "boolean",
                            description: "Skip safety validation checks (default: false)",
                        },
                    },
                    required: ["projectPath", "environment", "reason"],
                },
            },
            {
                name: "validate_deployment",
                description: "Validate deployment health with comprehensive checks including service health, functional validation, performance, data integrity, and integration tests.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        environment: {
                            type: "string",
                            enum: ["dev", "staging", "production"],
                            description: "Environment to validate",
                        },
                        deploymentId: {
                            type: "string",
                            description: "Specific deployment ID to validate (default: latest)",
                        },
                        checks: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Specific validation checks to run (default: all)",
                        },
                        timeout: {
                            type: "number",
                            description: "Validation timeout in seconds (default: 300)",
                        },
                    },
                    required: ["projectPath", "environment"],
                },
            },
            {
                name: "coordinate_release",
                description: "Coordinate multi-service release with dependency resolution and automated rollback on failure. Handles complex deployment ordering based on service dependencies.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        releaseName: {
                            type: "string",
                            description: "Release identifier (e.g., 'v2.0.0-backend-migration')",
                        },
                        environment: {
                            type: "string",
                            enum: ["staging", "production"],
                            description: "Target environment for release",
                        },
                        services: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Service name",
                                    },
                                    version: {
                                        type: "string",
                                        description: "Service version to deploy",
                                    },
                                    dependencies: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                        },
                                        description: "Service dependencies (other service names)",
                                    },
                                    config: {
                                        type: "object",
                                        description: "Service-specific configuration",
                                    },
                                },
                                required: ["name", "version"],
                            },
                            description: "Services to deploy in this release",
                        },
                        strategy: {
                            type: "string",
                            enum: ["sequential", "parallel", "dependency-order"],
                            description: "Release coordination strategy (default: dependency-order)",
                        },
                        rollbackOnFailure: {
                            type: "boolean",
                            description: "Automatically rollback all services if any fails (default: true)",
                        },
                        notifyChannels: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Notification channels for release updates",
                        },
                    },
                    required: ["projectPath", "releaseName", "environment", "services"],
                },
            },
            {
                name: "generate_release_notes",
                description: "Generate comprehensive release notes from git commit history with automatic categorization (features, fixes, breaking changes). Supports markdown, HTML, and JSON formats.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        fromVersion: {
                            type: "string",
                            description: "Starting version/tag (default: last release tag)",
                        },
                        toVersion: {
                            type: "string",
                            description: "Ending version/tag (default: HEAD)",
                        },
                        format: {
                            type: "string",
                            enum: ["markdown", "html", "json"],
                            description: "Output format (default: markdown)",
                        },
                        includeBreakingChanges: {
                            type: "boolean",
                            description: "Highlight breaking changes (default: true)",
                        },
                        includeAuthors: {
                            type: "boolean",
                            description: "List contributors (default: true)",
                        },
                        outputPath: {
                            type: "string",
                            description: "Custom output path (default: projectPath/RELEASE_NOTES.md)",
                        },
                        sections: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Custom sections to include",
                        },
                    },
                    required: ["projectPath"],
                },
            },
            {
                name: "monitor_deployment_health",
                description: "Continuously monitor deployment health with metrics collection, alerting, and trend analysis. Tracks application metrics, system metrics, service health, and errors.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the project directory",
                        },
                        environment: {
                            type: "string",
                            enum: ["dev", "staging", "production"],
                            description: "Environment to monitor",
                        },
                        deploymentId: {
                            type: "string",
                            description: "Specific deployment to monitor (default: latest)",
                        },
                        duration: {
                            type: "number",
                            description: "Monitoring duration in seconds (default: 300)",
                        },
                        interval: {
                            type: "number",
                            description: "Check interval in seconds (default: 30)",
                        },
                        metrics: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Specific metrics to monitor (default: all)",
                        },
                        alertThresholds: {
                            type: "object",
                            properties: {
                                errorRate: {
                                    type: "number",
                                    description: "Error rate threshold percentage (default: 5)",
                                },
                                responseTime: {
                                    type: "number",
                                    description: "Response time threshold in ms (default: 1000)",
                                },
                                cpuUsage: {
                                    type: "number",
                                    description: "CPU usage threshold percentage (default: 80)",
                                },
                                memoryUsage: {
                                    type: "number",
                                    description: "Memory usage threshold percentage (default: 85)",
                                },
                            },
                            description: "Custom alert thresholds",
                        },
                        notifyOnIssue: {
                            type: "boolean",
                            description: "Send alerts when issues detected (default: true)",
                        },
                    },
                    required: ["projectPath", "environment"],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "deploy_application": {
                const params = args;
                const result = await deployApplication(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "rollback_deployment": {
                const params = args;
                const result = await rollbackDeployment(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "validate_deployment": {
                const params = args;
                const result = await validateDeployment(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "coordinate_release": {
                const params = args;
                const result = await coordinateRelease(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "generate_release_notes": {
                const params = args;
                const result = await generateReleaseNotes(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "monitor_deployment_health": {
                const params = args;
                const result = await monitorDeploymentHealth(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Deployment & Release MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map