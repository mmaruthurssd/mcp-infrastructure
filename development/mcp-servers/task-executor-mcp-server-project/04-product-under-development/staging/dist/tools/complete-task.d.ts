/**
 * Complete Task Tool - MCP tool for marking tasks complete with verification
 * Enhanced with optional automated validation (build, test checks)
 */
import { CompleteTaskInput, CompleteTaskOutput } from '../types.js';
export declare class CompleteTaskTool {
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
                taskId: {
                    type: string;
                    description: string;
                };
                notes: {
                    type: string;
                    description: string;
                };
                skipVerification: {
                    type: string;
                    description: string;
                };
                runValidation: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute task completion
     */
    static execute(input: CompleteTaskInput): Promise<CompleteTaskOutput>;
}
//# sourceMappingURL=complete-task.d.ts.map