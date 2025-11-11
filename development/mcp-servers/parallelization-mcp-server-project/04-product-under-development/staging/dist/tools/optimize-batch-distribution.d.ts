/**
 * Optimize Batch Distribution Tool
 *
 * Optimizes task distribution across parallel agents to minimize total time
 */
import { OptimizeBatchDistributionInput, OptimizeBatchDistributionOutput } from '../types.js';
export declare class OptimizeBatchDistributionTool {
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
                dependencyGraph: {
                    type: string;
                    description: string;
                };
                maxParallelAgents: {
                    type: string;
                    description: string;
                };
                optimizationGoal: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute batch distribution optimization
     */
    static execute(input: OptimizeBatchDistributionInput): OptimizeBatchDistributionOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=optimize-batch-distribution.d.ts.map