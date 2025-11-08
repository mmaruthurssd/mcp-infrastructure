/**
 * Execute Parallel Workflow Tool
 *
 * Spawns sub-agents and coordinates parallel execution with conflict detection
 */
import { SubAgentCoordinator } from '../engines/sub-agent-coordinator.js';
export class ExecuteParallelWorkflowTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'execute_parallel_workflow',
            description: 'Execute tasks in parallel with sub-agent coordination and conflict detection. Spawns multiple Claude sub-agents, distributes work, monitors progress, and aggregates results.',
            inputSchema: {
                type: 'object',
                properties: {
                    analysisResult: {
                        type: 'object',
                        description: 'Analysis result from analyze_task_parallelizability containing dependency graph and suggested batches',
                    },
                    executionStrategy: {
                        type: 'string',
                        enum: ['conservative', 'aggressive'],
                        description: 'Execution strategy: conservative (fewer agents, safer) or aggressive (more agents, faster)',
                    },
                    maxParallelAgents: {
                        type: 'number',
                        description: 'Maximum number of parallel agents to spawn (default: 5)',
                    },
                    constraints: {
                        type: 'object',
                        properties: {
                            apiRateLimit: {
                                type: 'object',
                                properties: {
                                    provider: {
                                        type: 'string',
                                        description: 'API provider name (e.g., "google-sheets")',
                                    },
                                    maxRequestsPerMinute: {
                                        type: 'number',
                                        description: 'Maximum requests per minute',
                                    },
                                },
                            },
                            resourceLimits: {
                                type: 'object',
                                properties: {
                                    maxMemoryMB: {
                                        type: 'number',
                                        description: 'Maximum memory per agent in MB',
                                    },
                                    maxCPUPercent: {
                                        type: 'number',
                                        description: 'Maximum CPU usage percent',
                                    },
                                },
                            },
                        },
                        description: 'Optional execution constraints (rate limits, resource limits)',
                    },
                },
                required: ['analysisResult', 'executionStrategy', 'maxParallelAgents'],
            },
        };
    }
    /**
     * Execute parallel workflow
     */
    static execute(input) {
        // Validation
        this.validateInput(input);
        try {
            return SubAgentCoordinator.coordinate(input);
        }
        catch (error) {
            throw new Error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate input parameters
     */
    static validateInput(input) {
        // Validate analysisResult
        if (!input.analysisResult) {
            throw new Error('analysisResult is required');
        }
        if (!input.analysisResult.suggestedBatches || input.analysisResult.suggestedBatches.length === 0) {
            throw new Error('analysisResult must contain suggestedBatches');
        }
        if (!input.analysisResult.dependencyGraph) {
            throw new Error('analysisResult must contain dependencyGraph');
        }
        // Validate executionStrategy
        if (!input.executionStrategy) {
            throw new Error('executionStrategy is required');
        }
        if (!['conservative', 'aggressive'].includes(input.executionStrategy)) {
            throw new Error('executionStrategy must be "conservative" or "aggressive"');
        }
        // Validate maxParallelAgents
        if (!input.maxParallelAgents) {
            throw new Error('maxParallelAgents is required');
        }
        if (input.maxParallelAgents < 1) {
            throw new Error('maxParallelAgents must be at least 1');
        }
        if (input.maxParallelAgents > 20) {
            throw new Error('maxParallelAgents cannot exceed 20 (system limit)');
        }
        // Validate constraints (if provided)
        if (input.constraints) {
            if (input.constraints.apiRateLimit) {
                const rateLimit = input.constraints.apiRateLimit;
                if (!rateLimit.provider || rateLimit.provider.trim().length === 0) {
                    throw new Error('apiRateLimit.provider is required when apiRateLimit is specified');
                }
                if (rateLimit.maxRequestsPerMinute !== undefined) {
                    if (rateLimit.maxRequestsPerMinute < 1 || rateLimit.maxRequestsPerMinute > 10000) {
                        throw new Error('apiRateLimit.maxRequestsPerMinute must be between 1 and 10000');
                    }
                }
            }
            if (input.constraints.resourceLimits) {
                const resourceLimits = input.constraints.resourceLimits;
                if (resourceLimits.maxMemoryMB !== undefined) {
                    if (resourceLimits.maxMemoryMB < 100 || resourceLimits.maxMemoryMB > 32768) {
                        throw new Error('resourceLimits.maxMemoryMB must be between 100 and 32768 MB');
                    }
                }
                if (resourceLimits.maxCPUPercent !== undefined) {
                    if (resourceLimits.maxCPUPercent < 1 || resourceLimits.maxCPUPercent > 100) {
                        throw new Error('resourceLimits.maxCPUPercent must be between 1 and 100');
                    }
                }
            }
        }
        // Validate batches structure
        for (let i = 0; i < input.analysisResult.suggestedBatches.length; i++) {
            const batch = input.analysisResult.suggestedBatches[i];
            if (!batch.id || batch.id.trim().length === 0) {
                throw new Error(`Batch at index ${i} is missing required field: id`);
            }
            if (!batch.tasks || batch.tasks.length === 0) {
                throw new Error(`Batch ${batch.id} must contain at least one task`);
            }
            if (batch.tasks.length > 50) {
                throw new Error(`Batch ${batch.id} contains too many tasks (${batch.tasks.length}). Maximum is 50 per batch.`);
            }
        }
    }
}
//# sourceMappingURL=execute-parallel-workflow.js.map