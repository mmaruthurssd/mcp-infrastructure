/**
 * Get Workflow Status Tool - MCP tool for checking workflow progress
 */
import { GetWorkflowStatusInput, GetWorkflowStatusOutput } from '../types.js';
export declare class GetWorkflowStatusTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                workflowName: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute status retrieval
     */
    static execute(input: GetWorkflowStatusInput): GetWorkflowStatusOutput;
    /**
     * Format status for display
     */
    static formatStatus(output: GetWorkflowStatusOutput): string;
    private static getTaskSymbol;
}
//# sourceMappingURL=get-workflow-status.d.ts.map