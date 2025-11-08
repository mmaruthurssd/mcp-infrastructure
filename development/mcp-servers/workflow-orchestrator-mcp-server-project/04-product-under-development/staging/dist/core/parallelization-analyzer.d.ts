/**
 * Parallelization Analyzer
 *
 * Automatically analyzes tasks for parallelization opportunities
 * Integrates with parallelization-mcp-server tools
 */
export interface Task {
    id: string;
    description: string;
    dependsOn?: string[];
    estimatedMinutes?: number;
}
/**
 * MCP Tool Caller Interface
 * Supports two calling patterns:
 * 1. Object with callTool method: { callTool: (name, params) => Promise<any> }
 * 2. Direct function: (name, params) => Promise<any>
 */
export interface MCPToolCaller {
    callTool(toolName: string, params: any): Promise<any>;
}
/**
 * Response from parallelization-mcp analyze_task_parallelizability tool
 */
export interface ParallelizationMCPResponse {
    parallelizable: boolean;
    confidence: number;
    reasoning: string;
    dependencyGraph?: any;
    suggestedBatches?: any[];
    estimatedSpeedup: number;
    risks?: any[];
}
export interface ParallelizationConfig {
    enabled: boolean;
    minSpeedupThreshold: number;
    maxParallelAgents: number;
    executionStrategy: 'conservative' | 'aggressive';
    autoExecute: boolean;
}
export interface ParallelizationAnalysis {
    shouldParallelize: boolean;
    confidence: number;
    estimatedSpeedup: number;
    suggestedBatches?: any[];
    risks?: any[];
    reasoning: string;
    mode: 'parallel' | 'sequential';
}
export declare class ParallelizationAnalyzer {
    private config;
    private mcpTools;
    constructor(config?: Partial<ParallelizationConfig>);
    /**
     * Set MCP tool caller (injected from parent MCP server)
     * @param mcpTools - Either an object with callTool method or a function (toolName, params) => Promise<any>
     */
    setMCPTools(mcpTools: MCPToolCaller | ((toolName: string, params: any) => Promise<any>)): void;
    /**
     * Analyze if tasks should be parallelized
     *
     * Strategy:
     * 1. Try to use full parallelization-mcp analysis (~90% confidence)
     * 2. Fall back to heuristic if MCP unavailable (~60% confidence)
     */
    analyzeTasks(taskDescription: string, tasks: Task[]): Promise<ParallelizationAnalysis>;
    /**
     * Fallback heuristic if parallelization-mcp unavailable
     */
    private fallbackHeuristic;
    /**
     * Call parallelization-mcp-server tool
     * This will call the actual MCP tool when injected
     */
    private callParallelizationMCP;
    /**
     * Extract dependency metadata from tasks
     */
    extractDependencies(tasks: Task[]): {
        from: string;
        to: string;
    }[];
    /**
     * Get configuration
     */
    getConfig(): ParallelizationConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ParallelizationConfig>): void;
}
//# sourceMappingURL=parallelization-analyzer.d.ts.map