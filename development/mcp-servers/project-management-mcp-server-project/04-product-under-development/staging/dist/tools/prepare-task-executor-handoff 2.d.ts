/**
 * Prepare Task Executor Handoff Tool
 *
 * Prepares task workflow for Task Executor MCP with ready-to-execute tool call
 */
export interface PrepareTaskExecutorHandoffInput {
    projectPath: string;
    goalId: string;
}
export interface TaskSuggestion {
    description: string;
    estimatedHours?: number;
}
export interface AgentAssignment {
    taskIndex: number;
    taskDescription: string;
    recommendedAgent: string;
    reasoning: string;
    alternatives?: Array<{
        agent: string;
        score: number;
        reason: string;
    }>;
}
export interface PrepareTaskExecutorHandoffResult {
    success: boolean;
    goalName: string;
    workflowName: string;
    tasks: TaskSuggestion[];
    agentAssignments?: AgentAssignment[];
    parallelizationAnalysis?: {
        shouldParallelize: boolean;
        estimatedSpeedup: number;
        mode: 'parallel' | 'sequential';
        reasoning: string;
    };
    suggestedToolCall: {
        tool: string;
        params: any;
    };
    message: string;
}
export declare class PrepareTaskExecutorHandoffTool {
    static execute(input: PrepareTaskExecutorHandoffInput): Promise<PrepareTaskExecutorHandoffResult>;
    /**
     * Extract tasks from specification file
     */
    private static extractTasksFromSpec;
    /**
     * Create generic implementation tasks
     */
    private static createGenericTasks;
    /**
     * Suggest agents for tasks using agent-coordinator logic
     * Implements graceful degradation if agent-coordinator is not available
     */
    private static suggestAgentsForTasks;
    /**
     * Find agent registry file
     * Searches in standard locations
     */
    private static findAgentRegistry;
    /**
     * Parse goal from SELECTED-GOALS.md markdown file
     */
    private static parseGoalFromMarkdown;
    /**
     * Suggest best agent for a task (adapted from agent-coordinator)
     * Uses keyword-based scoring algorithm
     */
    private static suggestAgentForTask;
    static formatResult(result: PrepareTaskExecutorHandoffResult): string;
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                goalId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=prepare-task-executor-handoff%202.d.ts.map