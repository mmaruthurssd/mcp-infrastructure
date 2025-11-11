/**
 * Update Task Status Tool
 *
 * Allows updating task execution status during implementation
 */
import { TaskStatus } from '../utils/task-status-manager.js';
export interface UpdateTaskStatusArgs {
    projectPath: string;
    featureId: string;
    taskId: string;
    status: TaskStatus;
    notes?: string;
    blockedReason?: string;
}
export interface TaskStatusResponse {
    success: boolean;
    message: string;
    taskState?: {
        id: string;
        status: TaskStatus;
        startedAt?: Date;
        completedAt?: Date;
        notes?: string;
    };
    progress?: {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        blockedTasks: number;
        percentComplete: number;
    };
    error?: string;
}
export declare class UpdateTaskStatusTool {
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
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                notes: {
                    type: string;
                    description: string;
                };
                blockedReason: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute task status update
     */
    static execute(args: UpdateTaskStatusArgs): TaskStatusResponse;
}
//# sourceMappingURL=update-task-status.d.ts.map