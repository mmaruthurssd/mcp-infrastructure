/**
 * Sub-Agent Coordinator
 *
 * Spawns and coordinates multiple Claude sub-agents for parallel execution
 *
 * NOTE: This implementation provides the coordination logic and interfaces.
 * Actual sub-agent spawning requires integration with LLM orchestration layer
 * (Claude Code or similar). Currently simulated for development/testing.
 */
import { ExecuteParallelWorkflowInput, ExecuteParallelWorkflowOutput, Task, AgentProgress } from '../types.js';
interface Agent {
    id: string;
    status: 'idle' | 'working' | 'complete' | 'failed';
    currentTask?: Task;
    startTime?: number;
}
export declare class SubAgentCoordinator {
    /**
     * Coordinate parallel execution across multiple agents
     */
    static coordinate(input: ExecuteParallelWorkflowInput): ExecuteParallelWorkflowOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
    /**
     * Initialize agent pool
     */
    private static initializeAgents;
    /**
     * Execute a single batch (tasks in parallel)
     */
    private static executeBatch;
    /**
     * Distribute tasks to agents (load balancing)
     */
    private static distributeTasksToAgents;
    /**
     * Execute a single task
     *
     * NOTE: This is simulated execution for development.
     * In production, this would:
     * 1. Spawn a Claude sub-agent
     * 2. Pass the task context
     * 3. Monitor execution
     * 4. Collect results
     */
    private static executeTask;
    /**
     * Calculate execution metrics
     */
    private static calculateMetrics;
    /**
     * Create metrics for failed execution
     */
    private static createFailedMetrics;
    /**
     * Monitor progress across all agents
     *
     * NOTE: In production, this would query actual sub-agent progress
     */
    static monitorProgress(agents: Agent[]): AgentProgress[];
    /**
     * Gracefully stop all agents
     */
    static stopAll(agents: Agent[]): void;
    /**
     * Get performance insights
     */
    static getPerformanceInsights(): string;
    /**
     * Get learned patterns
     */
    static getLearnedPatterns(): import("../utils/learning-optimizer.js").LearnedPattern[];
    /**
     * Get improvement suggestions
     */
    static getSuggestions(taskCount: number, agentCount: number): string[];
}
export {};
/**
 * Integration notes for production:
 *
 * To integrate with actual Claude sub-agent spawning:
 *
 * 1. Replace executeTask() with actual spawning:
 *    ```
 *    const subAgent = await ClaudeOrchestrator.spawn({
 *      context: task.context,
 *      systemPrompt: generateSubAgentPrompt(task),
 *      tools: task.requiredTools,
 *    });
 *
 *    const result = await subAgent.execute(task.description);
 *    await subAgent.terminate();
 *    ```
 *
 * 2. Implement real-time progress monitoring:
 *    ```
 *    const progress = await subAgent.getProgress();
 *    ```
 *
 * 3. Add communication protocol:
 *    ```
 *    subAgent.on('progress', (update) => { ... });
 *    subAgent.on('question', (query) => { ... });
 *    subAgent.on('complete', (result) => { ... });
 *    ```
 *
 * 4. Implement resource limits:
 *    ```
 *    await subAgent.setLimits({
 *      maxMemoryMB: constraints.resourceLimits.maxMemoryMB,
 *      maxDurationMs: task.estimatedMinutes * 60000 * 2,
 *    });
 *    ```
 */
//# sourceMappingURL=sub-agent-coordinator.d.ts.map