/**
 * Validate Tool Schema Tool
 *
 * Validate MCP tool parameter schemas to ensure they follow
 * proper JSON Schema structure and MCP standards.
 */
import type { ValidateToolSchemaInput, ValidateToolSchemaOutput } from '../types.js';
export declare class ValidateToolSchemaTool {
    /**
     * Get tool definition for MCP server
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                mcpPath: {
                    type: string;
                    description: string;
                };
                toolName: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute the tool
     */
    static execute(input: ValidateToolSchemaInput): Promise<ValidateToolSchemaOutput>;
    /**
     * Format results for display
     */
    private static formatResults;
}
//# sourceMappingURL=validate-tool-schema.d.ts.map