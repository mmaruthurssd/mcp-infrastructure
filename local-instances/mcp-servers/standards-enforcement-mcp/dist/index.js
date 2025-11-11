#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { ValidateMcpComplianceParamsSchema, ValidateProjectStructureParamsSchema, ValidateTemplateExistsParamsSchema, } from './types/tool-params.js';
import { validateMcpCompliance, validateProjectStructureTool, validateTemplateExistsTool, } from './tools/index.js';
/**
 * Standards Enforcement MCP Server
 * Enforces workspace development standards
 */
class StandardsEnforcementServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'standards-enforcement-mcp',
            version: '0.2.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    /**
     * Setup tool request handlers
     */
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.getToolDefinitions(),
            };
        });
        // Handle tool execution
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'validate_mcp_compliance':
                        return await this.handleValidateMcpCompliance(args);
                    case 'validate_project_structure':
                        return await this.handleValidateProjectStructure(args);
                    case 'validate_template_exists':
                        return await this.handleValidateTemplateExists(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * Get tool definitions for listing
     */
    getToolDefinitions() {
        return [
            {
                name: 'validate_mcp_compliance',
                description: 'Validate MCP against workspace standards. Checks dual-environment, template-first, project structure, configuration, documentation, and security standards.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mcpName: {
                            type: 'string',
                            description: 'Name of the MCP to validate (e.g., "task-executor-mcp")',
                        },
                        categories: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Optional: Specific categories to validate (dual-environment, template-first, project-structure, configuration, documentation, security)',
                        },
                        failFast: {
                            type: 'boolean',
                            description: 'Stop on first critical violation (default: false)',
                        },
                        includeWarnings: {
                            type: 'boolean',
                            description: 'Include warnings and info in results (default: true)',
                        },
                    },
                    required: ['mcpName'],
                },
            },
            {
                name: 'validate_project_structure',
                description: 'Validate project folder structure. Checks for 8-folder or 4-folder standard structure compliance.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: {
                            type: 'string',
                            description: 'Absolute path to project directory',
                        },
                        expectedStructure: {
                            type: 'string',
                            enum: ['8-folder', '4-folder', 'custom'],
                            description: 'Expected folder structure pattern (default: 8-folder)',
                        },
                        strictMode: {
                            type: 'boolean',
                            description: 'Enforce strict compliance (default: false)',
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'validate_template_exists',
                description: 'Validate that MCP has a corresponding drop-in template. Checks template existence, metadata, and installability.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mcpName: {
                            type: 'string',
                            description: 'Name of the MCP to check template for',
                        },
                        checkInstallable: {
                            type: 'boolean',
                            description: 'Validate template is installable (default: false)',
                        },
                        checkMetadata: {
                            type: 'boolean',
                            description: 'Validate template metadata files (default: true)',
                        },
                    },
                    required: ['mcpName'],
                },
            },
        ];
    }
    /**
     * Handle validate_mcp_compliance tool
     */
    async handleValidateMcpCompliance(args) {
        const params = ValidateMcpComplianceParamsSchema.parse(args);
        const result = await validateMcpCompliance(params);
        return {
            content: [
                {
                    type: 'text',
                    text: this.formatValidationResult(result),
                },
            ],
        };
    }
    /**
     * Handle validate_project_structure tool
     */
    async handleValidateProjectStructure(args) {
        const params = ValidateProjectStructureParamsSchema.parse(args);
        const result = await validateProjectStructureTool(params);
        return {
            content: [
                {
                    type: 'text',
                    text: this.formatValidationResult(result),
                },
            ],
        };
    }
    /**
     * Handle validate_template_exists tool
     */
    async handleValidateTemplateExists(args) {
        const params = ValidateTemplateExistsParamsSchema.parse(args);
        const result = await validateTemplateExistsTool(params);
        return {
            content: [
                {
                    type: 'text',
                    text: this.formatValidationResult(result),
                },
            ],
        };
    }
    /**
     * Format validation result as readable text
     */
    formatValidationResult(result) {
        const lines = [];
        lines.push('# Validation Result\n');
        lines.push(`**Status**: ${result.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
        lines.push(`**Compliance Score**: ${result.summary.complianceScore}/100\n`);
        lines.push('## Summary');
        lines.push(`- Total Rules Checked: ${result.summary.totalRules}`);
        lines.push(`- Passed: ${result.summary.passedRules}`);
        lines.push(`- Failed: ${result.summary.failedRules}`);
        lines.push(`- Critical Violations: ${result.summary.criticalViolations}`);
        lines.push(`- Warnings: ${result.summary.warningViolations}`);
        lines.push(`- Info: ${result.summary.infoViolations}\n`);
        if (result.violations.length > 0) {
            lines.push('## Violations\n');
            const groupedByCategory = {};
            for (const violation of result.violations) {
                if (!groupedByCategory[violation.category]) {
                    groupedByCategory[violation.category] = [];
                }
                groupedByCategory[violation.category].push(violation);
            }
            for (const [category, violations] of Object.entries(groupedByCategory)) {
                lines.push(`### ${category}\n`);
                for (const v of violations) {
                    const icon = v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '🟡' : 'ℹ️';
                    lines.push(`${icon} **${v.severity.toUpperCase()}**: ${v.message}`);
                    lines.push(`   📍 ${v.location.path}${v.location.line ? `:${v.location.line}` : ''}`);
                    lines.push(`   💡 ${v.suggestion}`);
                    if (v.autoFixAvailable) {
                        lines.push(`   ✨ Auto-fix available`);
                    }
                    lines.push('');
                }
            }
        }
        else {
            lines.push('✅ **No violations found!**\n');
        }
        lines.push(`\n*Validation completed at ${result.timestamp}*`);
        return lines.join('\n');
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    /**
     * Start the server
     */
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Standards Enforcement MCP Server running on stdio');
    }
}
// Start server
const server = new StandardsEnforcementServer();
server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map