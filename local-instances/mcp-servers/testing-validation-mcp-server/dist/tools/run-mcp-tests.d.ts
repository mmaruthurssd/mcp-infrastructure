/**
 * Run MCP Tests Tool
 *
 * Execute unit and integration tests for an MCP server with optional coverage reporting.
 */
import type { RunMcpTestsInput, RunMcpTestsOutput } from '../types.js';
export declare class RunMcpTestsTool {
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
                testType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                coverage: {
                    type: string;
                    description: string;
                };
                verbose: {
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
    static execute(input: RunMcpTestsInput): Promise<RunMcpTestsOutput>;
    /**
     * Format results for display
     */
    private static formatResults;
}
//# sourceMappingURL=run-mcp-tests.d.ts.map