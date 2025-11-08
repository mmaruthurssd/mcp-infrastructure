/**
 * Validate Tool Schema Tool
 *
 * Validate MCP tool parameter schemas to ensure they follow
 * proper JSON Schema structure and MCP standards.
 */
import { SchemaValidator } from '../utils/schema-validator.js';
export class ValidateToolSchemaTool {
    /**
     * Get tool definition for MCP server
     */
    static getToolDefinition() {
        return {
            name: 'validate_tool_schema',
            description: 'Validate MCP tool parameter schemas',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpPath: {
                        type: 'string',
                        description: 'Path to MCP project',
                    },
                    toolName: {
                        type: 'string',
                        description: 'Specific tool to validate (default: all)',
                    },
                },
                required: ['mcpPath'],
            },
        };
    }
    /**
     * Execute the tool
     */
    static async execute(input) {
        try {
            // Validate input
            if (!input.mcpPath) {
                return {
                    success: false,
                    tools: [],
                    error: 'mcpPath is required',
                };
            }
            // Create schema validator and validate
            const validator = new SchemaValidator(input.mcpPath, input.toolName);
            const result = await validator.validate();
            // Add formatted output
            const formatted = this.formatResults(result);
            return {
                ...result,
                formatted,
            };
        }
        catch (error) {
            return {
                success: false,
                tools: [],
                error: `Tool execution failed: ${error}`,
            };
        }
    }
    /**
     * Format results for display
     */
    static formatResults(result) {
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('TOOL SCHEMA VALIDATION RESULTS');
        lines.push('='.repeat(60));
        lines.push('');
        if (!result.success) {
            lines.push(`❌ Schema Validation Failed`);
            lines.push('');
            if (result.error) {
                lines.push(`Error: ${result.error}`);
            }
            return lines.join('\n');
        }
        // Summary
        const totalTools = result.tools.length;
        const validTools = result.tools.filter((t) => t.schemaValid).length;
        const invalidTools = totalTools - validTools;
        const statusIcon = invalidTools === 0 ? '✅' : '❌';
        lines.push(`Status: ${statusIcon} ${validTools}/${totalTools} tools have valid schemas`);
        lines.push('');
        // Individual tool results
        if (result.tools.length > 0) {
            lines.push('-'.repeat(60));
            lines.push('TOOL SCHEMAS');
            lines.push('-'.repeat(60));
            lines.push('');
            for (const tool of result.tools) {
                const icon = tool.schemaValid ? '✅' : '❌';
                lines.push(`${icon} ${tool.name}`);
                // Show parameters
                if (tool.parameters.length > 0) {
                    lines.push(`   Parameters: ${tool.parameters.length}`);
                    for (const param of tool.parameters) {
                        const paramIcon = param.valid ? '✅' : '❌';
                        const reqLabel = param.required ? '[REQUIRED]' : '[OPTIONAL]';
                        lines.push(`     ${paramIcon} ${param.name}: ${param.type} ${reqLabel}`);
                    }
                }
                else {
                    lines.push(`   Parameters: None`);
                }
                // Show issues if any
                if (tool.issues.length > 0) {
                    lines.push(`   Issues:`);
                    // Group by type
                    const errors = tool.issues.filter((i) => i.type === 'error');
                    const warnings = tool.issues.filter((i) => i.type === 'warning');
                    if (errors.length > 0) {
                        for (const issue of errors) {
                            const field = issue.field ? ` [${issue.field}]` : '';
                            lines.push(`     ❌ ${issue.message}${field}`);
                        }
                    }
                    if (warnings.length > 0) {
                        for (const issue of warnings) {
                            const field = issue.field ? ` [${issue.field}]` : '';
                            lines.push(`     ⚠️  ${issue.message}${field}`);
                        }
                    }
                }
                lines.push('');
            }
        }
        lines.push('-'.repeat(60));
        if (invalidTools === 0) {
            lines.push('✅ ALL TOOL SCHEMAS VALID');
            lines.push('');
            lines.push('All tool schemas follow MCP standards and JSON Schema conventions.');
        }
        else {
            lines.push('❌ SOME TOOL SCHEMAS INVALID');
            lines.push('');
            lines.push(`${invalidTools} tool schema(s) have issues. Review the errors above.`);
        }
        lines.push('='.repeat(60));
        return lines.join('\n');
    }
}
//# sourceMappingURL=validate-tool-schema.js.map