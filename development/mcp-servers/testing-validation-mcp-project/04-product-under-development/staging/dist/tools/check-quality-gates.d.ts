/**
 * Check Quality Gates Tool
 *
 * Execute ROLLOUT-CHECKLIST.md quality gates for production readiness.
 */
import type { CheckQualityGatesInput, CheckQualityGatesOutput } from '../types.js';
export declare class CheckQualityGatesTool {
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
                phase: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute the tool
     */
    static execute(input: CheckQualityGatesInput): Promise<CheckQualityGatesOutput>;
    /**
     * Format results for display
     */
    private static formatResults;
    /**
     * Format phase name for display
     */
    private static formatPhaseName;
}
//# sourceMappingURL=check-quality-gates.d.ts.map