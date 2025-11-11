/**
 * Archive Workflow Tool - MCP tool for archiving completed workflows
 */
import { ArchiveWorkflowInput, ArchiveWorkflowOutput } from '../types.js';
export declare class ArchiveWorkflowTool {
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
                force: {
                    type: string;
                    description: string;
                };
                checkDeploymentReadiness: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute workflow archival
     */
    static execute(input: ArchiveWorkflowInput): Promise<ArchiveWorkflowOutput>;
}
//# sourceMappingURL=archive-workflow.d.ts.map