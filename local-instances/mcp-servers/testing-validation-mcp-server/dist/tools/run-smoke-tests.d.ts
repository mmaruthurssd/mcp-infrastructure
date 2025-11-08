/**
 * Run Smoke Tests Tool
 *
 * Run basic smoke tests on MCP tools to verify they're callable
 * and handle basic scenarios correctly.
 */
import type { RunSmokeTestsInput, RunSmokeTestsOutput } from '../types.js';
export declare class RunSmokeTestsTool {
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
                tools: {
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
    static execute(input: RunSmokeTestsInput): Promise<RunSmokeTestsOutput>;
    /**
     * Format results for display
     */
    private static formatResults;
}
//# sourceMappingURL=run-smoke-tests.d.ts.map