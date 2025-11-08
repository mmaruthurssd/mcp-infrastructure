/**
 * Get Task Progress Tool
 *
 * Retrieves current task execution progress and status
 */
import { TaskStatus } from '../utils/task-status-manager.js';
export interface GetTaskProgressArgs {
    projectPath: string;
    featureId: string;
    taskId?: string;
}
export interface TaskProgressResponse {
    success: boolean;
    message: string;
    summary?: {
        featureId: string;
        featureName: string;
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        blockedTasks: number;
        percentComplete: number;
        lastUpdated: Date;
    };
    tasks?: Array<{
        id: string;
        status: TaskStatus;
        startedAt?: Date;
        completedAt?: Date;
        notes?: string;
        blockedReason?: string;
    }>;
    task?: {
        id: string;
        status: TaskStatus;
        startedAt?: Date;
        completedAt?: Date;
        notes?: string;
        blockedReason?: string;
    };
    error?: string;
}
export declare class GetTaskProgressTool {
    /**
     * Get tool definition for MCP
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
                featureId: {
                    type: string;
                    description: string;
                };
                taskId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute task progress retrieval
     */
    static execute(args: GetTaskProgressArgs): TaskProgressResponse;
    /**
     * Format progress response for display
     */
    static formatProgress(response: TaskProgressResponse): string;
}
//# sourceMappingURL=get-task-progress.d.ts.map