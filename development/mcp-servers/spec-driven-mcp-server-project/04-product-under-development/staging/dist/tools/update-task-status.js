/**
 * Update Task Status Tool
 *
 * Allows updating task execution status during implementation
 */
import { TaskStatusManager } from '../utils/task-status-manager.js';
export class UpdateTaskStatusTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'update_task_status',
            description: 'Update the execution status of a task. Track progress as you implement features defined in your spec.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory'
                    },
                    featureId: {
                        type: 'string',
                        description: 'Feature ID (e.g., "001", "002")'
                    },
                    taskId: {
                        type: 'string',
                        description: 'Task ID to update (e.g., "1.1", "2.3")'
                    },
                    status: {
                        type: 'string',
                        enum: ['backlog', 'in-progress', 'done', 'blocked'],
                        description: 'New status for the task'
                    },
                    notes: {
                        type: 'string',
                        description: 'Optional notes about the task progress or completion'
                    },
                    blockedReason: {
                        type: 'string',
                        description: 'If status is "blocked", describe what is blocking progress'
                    }
                },
                required: ['projectPath', 'featureId', 'taskId', 'status']
            }
        };
    }
    /**
     * Execute task status update
     */
    static execute(args) {
        try {
            const { projectPath, featureId, taskId, status, notes, blockedReason } = args;
            // Validate status
            if (!['backlog', 'in-progress', 'done', 'blocked'].includes(status)) {
                return {
                    success: false,
                    message: 'Invalid status. Must be: backlog, in-progress, done, or blocked',
                    error: 'Invalid status value'
                };
            }
            // Update task status
            const stateFile = TaskStatusManager.updateTaskStatus(projectPath, featureId, taskId, status, notes, blockedReason);
            if (!stateFile) {
                return {
                    success: false,
                    message: `Task state file not found for feature ${featureId}`,
                    error: 'State file not found'
                };
            }
            // Get updated task state
            const taskState = stateFile.tasks.find(t => t.id === taskId);
            if (!taskState) {
                return {
                    success: false,
                    message: `Task ${taskId} not found`,
                    error: 'Task not found'
                };
            }
            return {
                success: true,
                message: `Task ${taskId} updated to ${status}`,
                taskState: {
                    id: taskState.id,
                    status: taskState.status,
                    startedAt: taskState.startedAt,
                    completedAt: taskState.completedAt,
                    notes: taskState.notes
                },
                progress: stateFile.metadata
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error updating task status: ${error}`,
                error: String(error)
            };
        }
    }
}
//# sourceMappingURL=update-task-status.js.map