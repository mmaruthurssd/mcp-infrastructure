/**
 * Update Goal Progress Tool
 *
 * Updates goal progress based on task completion and calculates velocity.
 */
import { VelocityEstimate } from '../utils/velocity-calculator.js';
export interface UpdateGoalProgressInput {
    projectPath: string;
    goalId: string;
    tasksCompleted?: number;
    totalTasks?: number;
    progress?: number;
    status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold' | 'Completed';
    blockers?: string;
    nextAction?: string;
    specPath?: string;
}
export interface UpdateGoalProgressOutput {
    success: boolean;
    goalId?: string;
    goalName?: string;
    previousProgress?: number;
    newProgress?: number;
    previousStatus?: string;
    newStatus?: string;
    velocity?: VelocityEstimate;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class UpdateGoalProgressTool {
    /**
     * Execute the update_goal_progress tool
     */
    static execute(input: UpdateGoalProgressInput): UpdateGoalProgressOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: UpdateGoalProgressOutput): string;
    /**
     * Get MCP tool definition
     */
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
                tasksCompleted: {
                    type: string;
                    description: string;
                };
                totalTasks: {
                    type: string;
                    description: string;
                };
                progress: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                };
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                blockers: {
                    type: string;
                    description: string;
                };
                nextAction: {
                    type: string;
                    description: string;
                };
                specPath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=update-goal-progress.d.ts.map