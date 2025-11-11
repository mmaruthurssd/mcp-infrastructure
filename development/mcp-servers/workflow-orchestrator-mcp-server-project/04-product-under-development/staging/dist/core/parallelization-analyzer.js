/**
 * Parallelization Analyzer
 *
 * Automatically analyzes tasks for parallelization opportunities
 * Integrates with parallelization-mcp-server tools
 */
export class ParallelizationAnalyzer {
    config;
    mcpTools = null;
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            minSpeedupThreshold: config.minSpeedupThreshold ?? 1.5,
            maxParallelAgents: config.maxParallelAgents ?? 3,
            executionStrategy: config.executionStrategy ?? 'conservative',
            autoExecute: config.autoExecute ?? false,
        };
    }
    /**
     * Set MCP tool caller (injected from parent MCP server)
     * @param mcpTools - Either an object with callTool method or a function (toolName, params) => Promise<any>
     */
    setMCPTools(mcpTools) {
        this.mcpTools = mcpTools;
    }
    /**
     * Analyze if tasks should be parallelized
     *
     * Strategy:
     * 1. Try to use full parallelization-mcp analysis (~90% confidence)
     * 2. Fall back to heuristic if MCP unavailable (~60% confidence)
     */
    async analyzeTasks(taskDescription, tasks) {
        // If parallelization disabled, return sequential mode
        if (!this.config.enabled) {
            return {
                shouldParallelize: false,
                confidence: 100,
                estimatedSpeedup: 1.0,
                reasoning: 'Parallelization disabled in configuration',
                mode: 'sequential',
            };
        }
        // If < 3 tasks, not worth parallelizing
        if (tasks.length < 3) {
            return {
                shouldParallelize: false,
                confidence: 100,
                estimatedSpeedup: 1.0,
                reasoning: `Only ${tasks.length} task(s) - parallelization overhead not justified`,
                mode: 'sequential',
            };
        }
        // PREFER: Call parallelization-mcp-server's analyze_task_parallelizability
        // This provides full dependency graph analysis with ~90% confidence
        try {
            const analysis = await this.callParallelizationMCP('analyze_task_parallelizability', {
                taskDescription,
                subtasks: tasks,
            });
            const shouldParallelize = analysis.parallelizable &&
                analysis.estimatedSpeedup >= this.config.minSpeedupThreshold;
            return {
                shouldParallelize,
                confidence: analysis.confidence, // ~90% when MCP is used
                estimatedSpeedup: analysis.estimatedSpeedup,
                suggestedBatches: analysis.suggestedBatches,
                risks: analysis.risks,
                reasoning: shouldParallelize
                    ? `${analysis.estimatedSpeedup.toFixed(1)}x speedup detected - parallelization recommended (full MCP analysis)`
                    : analysis.reasoning,
                mode: shouldParallelize ? 'parallel' : 'sequential',
            };
        }
        catch (error) {
            // FALLBACK: If parallelization-mcp not available, use simple heuristic
            // This provides basic analysis with ~60% confidence
            return this.fallbackHeuristic(tasks);
        }
    }
    /**
     * Fallback heuristic if parallelization-mcp unavailable
     */
    fallbackHeuristic(tasks) {
        const tasksWithDeps = tasks.filter((t) => t.dependsOn && t.dependsOn.length > 0).length;
        const independentTasks = tasks.length - tasksWithDeps;
        const canParallelize = independentTasks >= 2;
        const estimatedSpeedup = canParallelize ? Math.min(independentTasks / 2, 2.0) : 1.0;
        return {
            shouldParallelize: canParallelize && estimatedSpeedup >= this.config.minSpeedupThreshold,
            confidence: 60, // Lower confidence without full analysis
            estimatedSpeedup,
            reasoning: canParallelize
                ? `${independentTasks} independent tasks detected (heuristic)`
                : 'Too many dependencies for parallelization',
            mode: canParallelize ? 'parallel' : 'sequential',
        };
    }
    /**
     * Call parallelization-mcp-server tool
     * This will call the actual MCP tool when injected
     */
    async callParallelizationMCP(toolName, params) {
        if (!this.mcpTools) {
            throw new Error('MCP tools not injected - parallelization-mcp-server not available');
        }
        const fullToolName = `mcp__parallelization-mcp__${toolName}`;
        // Call the MCP tool through the injected caller
        // Supports both object with callTool method and direct function
        if (typeof this.mcpTools === 'function') {
            // mcpTools itself is the caller function
            return await this.mcpTools(fullToolName, params);
        }
        else if (this.mcpTools && typeof this.mcpTools.callTool === 'function') {
            // mcpTools has a callTool method
            return await this.mcpTools.callTool(fullToolName, params);
        }
        else {
            throw new Error('MCP tools caller does not have expected interface');
        }
    }
    /**
     * Extract dependency metadata from tasks
     */
    extractDependencies(tasks) {
        const edges = [];
        for (const task of tasks) {
            if (task.dependsOn) {
                for (const depId of task.dependsOn) {
                    edges.push({ from: depId, to: task.id });
                }
            }
        }
        return edges;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
}
//# sourceMappingURL=parallelization-analyzer.js.map