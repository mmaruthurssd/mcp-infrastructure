/**
 * Analyze Task Parallelizability Tool
 *
 * Analyzes if a task can benefit from parallel sub-agent execution
 */
import { AnalyzeTaskParallelizabilityInput, AnalyzeTaskParallelizabilityOutput } from '../types.js';
export declare class AnalyzeTaskParallelizabilityTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                taskDescription: {
                    type: string;
                    description: string;
                };
                subtasks: {
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
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute task parallelizability analysis
     */
    static execute(input: AnalyzeTaskParallelizabilityInput): AnalyzeTaskParallelizabilityOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=analyze-task-parallelizability.d.ts.map