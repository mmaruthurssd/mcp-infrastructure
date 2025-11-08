/**
 * Create Workflow Tool - MCP tool for creating new task workflows
 */
import { CreateWorkflowInput, CreateWorkflowOutput } from '../types.js';
export declare class CreateWorkflowTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                projectPath: {
                    type: string;
                    description: string;
                };
                tasks: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            description: {
                                type: string;
                                description: string;
                            };
                            estimatedHours: {
                                type: string;
                                description: string;
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                constraints: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                context: {
                    type: string;
                    properties: {
                        phiHandling: {
                            type: string;
                            description: string;
                        };
                        category: {
                            type: string;
                            description: string;
                        };
                    };
                };
            };
            required: string[];
        };
    };
    /**
     * Execute workflow creation
     */
    static execute(input: CreateWorkflowInput): CreateWorkflowOutput;
}
//# sourceMappingURL=create-workflow.d.ts.map