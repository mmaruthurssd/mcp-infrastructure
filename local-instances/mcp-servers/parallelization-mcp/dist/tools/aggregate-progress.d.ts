/**
 * Aggregate Progress Tool
 *
 * Aggregates progress from multiple parallel sub-agents into unified view
 */
import { AggregateProgressInput, AggregateProgressOutput } from '../types.js';
export declare class AggregateProgressTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                agentProgresses: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            agentId: {
                                type: string;
                                description: string;
                            };
                            currentTask: {
                                type: string;
                                description: string;
                            };
                            percentComplete: {
                                type: string;
                                description: string;
                            };
                            taskWeight: {
                                type: string;
                                description: string;
                            };
                            status: {
                                type: string;
                                enum: string[];
                                description: string;
                            };
                            estimatedTimeRemaining: {
                                type: string;
                                description: string;
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                aggregationStrategy: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute progress aggregation
     */
    static execute(input: AggregateProgressInput): AggregateProgressOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=aggregate-progress.d.ts.map