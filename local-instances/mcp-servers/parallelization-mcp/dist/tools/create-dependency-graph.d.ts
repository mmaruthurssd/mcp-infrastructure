/**
 * Create Dependency Graph Tool
 *
 * Builds a directed acyclic graph (DAG) from task dependencies
 */
import { CreateDependencyGraphInput, CreateDependencyGraphOutput } from '../types.js';
export declare class CreateDependencyGraphTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                tasks: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                                description: string;
                            };
                            description: {
                                type: string;
                                description: string;
                            };
                            estimatedMinutes: {
                                type: string;
                                description: string;
                            };
                            dependsOn: {
                                type: string;
                                items: {
                                    type: string;
                                };
                                description: string;
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                detectImplicit: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute dependency graph creation
     */
    static execute(input: CreateDependencyGraphInput): CreateDependencyGraphOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=create-dependency-graph.d.ts.map