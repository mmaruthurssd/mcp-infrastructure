/**
 * MCP Handoff Sender
 *
 * Creates, serializes, and sends handoffs to target MCPs
 */
import { Handoff, HandoffType, GoalToSpecHandoff, SpecToTasksHandoff, TaskCompletionHandoff, ProgressUpdateHandoff } from '../types/handoff.js';
/**
 * Create a goal-to-spec handoff
 */
export declare function createGoalToSpecHandoff(projectPath: string, goalData: {
    goalId: string;
    goalName: string;
    goalDescription: string;
    impact: string;
    effort: string;
    tier: string;
    autonomous?: any;
}): Handoff<GoalToSpecHandoff>;
/**
 * Create a spec-to-tasks handoff
 */
export declare function createSpecToTasksHandoff(projectPath: string, specData: {
    specificationPath: string;
    goalId: string;
    goalName: string;
    tasks: Array<{
        description: string;
        estimatedHours?: number;
        dependencies?: string[];
    }>;
    parallelizationAnalysis?: any;
}): Handoff<SpecToTasksHandoff>;
/**
 * Create a task completion handoff
 */
export declare function createTaskCompletionHandoff(projectPath: string, taskData: {
    workflowName: string;
    goalId: string;
    completedTasks: number;
    totalTasks: number;
    completionPercentage: number;
    remainingWork?: string[];
    blockers?: string[];
}): Handoff<TaskCompletionHandoff>;
/**
 * Create a progress update handoff
 */
export declare function createProgressUpdateHandoff(projectPath: string, progressData: ProgressUpdateHandoff): Handoff<ProgressUpdateHandoff>;
/**
 * Create a subgoal completion handoff
 */
export declare function createSubgoalCompletionHandoff(projectPath: string, data: any): Handoff<any>;
/**
 * Serialize a handoff to JSON string
 */
export declare function serializeHandoff(handoff: Handoff): string;
/**
 * Send a handoff by writing to the handoffs directory
 * Returns the file path where the handoff was saved
 */
export declare function sendHandoff(handoff: Handoff): string;
/**
 * HandoffBuilder - Fluent interface for building handoffs
 */
export declare class HandoffBuilder {
    private handoff;
    constructor(type: HandoffType);
    setSource(mcp: string, projectPath: string): this;
    setTarget(mcp: string, projectPath?: string): this;
    setData(data: any): this;
    build(): Handoff;
    buildAndSend(): string;
}
//# sourceMappingURL=handoff-sender.d.ts.map