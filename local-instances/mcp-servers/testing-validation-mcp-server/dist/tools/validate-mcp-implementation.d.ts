/**
 * Validate MCP Implementation Tool
 *
 * Validate MCP against workspace standards and best practices.
 */
import type { ValidateMcpImplementationInput, ValidateMcpImplementationOutput } from '../types.js';
export declare class ValidateMcpImplementationTool {
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
                standards: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute the tool
     */
    static execute(input: ValidateMcpImplementationInput): Promise<ValidateMcpImplementationOutput>;
    /**
     * Format results for display
     */
    private static formatResults;
    /**
     * Format category name for display
     */
    private static formatCategoryName;
}
//# sourceMappingURL=validate-mcp-implementation.d.ts.map