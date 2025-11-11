/**
 * Execute Parallel Workflow Tool
 *
 * Spawns sub-agents and coordinates parallel execution with conflict detection
 */
import { ExecuteParallelWorkflowInput, ExecuteParallelWorkflowOutput } from '../types.js';
export declare class ExecuteParallelWorkflowTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                analysisResult: {
                    type: string;
                    description: string;
                };
                executionStrategy: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                maxParallelAgents: {
                    type: string;
                    description: string;
                };
                constraints: {
                    type: string;
                    properties: {
                        apiRateLimit: {
                            type: string;
                            properties: {
                                provider: {
                                    type: string;
                                    description: string;
                                };
                                maxRequestsPerMinute: {
                                    type: string;
                                    description: string;
                                };
                            };
                        };
                        resourceLimits: {
                            type: string;
                            properties: {
                                maxMemoryMB: {
                                    type: string;
                                    description: string;
                                };
                                maxCPUPercent: {
                                    type: string;
                                    description: string;
                                };
                            };
                        };
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute parallel workflow
     */
    static execute(input: ExecuteParallelWorkflowInput): ExecuteParallelWorkflowOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=execute-parallel-workflow.d.ts.map