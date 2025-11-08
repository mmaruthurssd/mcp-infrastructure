/**
 * Get Task Progress Tool
 *
 * Retrieves current task execution progress and status
 */
import { TaskStatusManager } from '../utils/task-status-manager.js';
export class GetTaskProgressTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'get_task_progress',
            description: 'Get current progress and status of tasks for a feature. Can retrieve all tasks or a specific task.',
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
                        description: 'Optional: Specific task ID to query (e.g., "1.1", "2.3"). If omitted, returns all tasks.'
                    }
                },
                required: ['projectPath', 'featureId']
            }
        };
    }
    /**
     * Execute task progress retrieval
     */
    static execute(args) {
        try {
            const { projectPath, featureId, taskId } = args;
            // Load state file
            const stateFile = TaskStatusManager.load(projectPath, featureId);
            if (!stateFile) {
                return {
                    success: false,
                    message: `No task state found for feature ${featureId}. Tasks may not have been initialized yet.`,
                    error: 'State file not found'
                };
            }
            // If specific task requested
            if (taskId) {
                const task = stateFile.tasks.find(t => t.id === taskId);
                if (!task) {
                    return {
                        success: false,
                        message: `Task ${taskId} not found in feature ${featureId}`,
                        error: 'Task not found'
                    };
                }
                return {
                    success: true,
                    message: `Task ${taskId} status: ${task.status}`,
                    task: {
                        id: task.id,
                        status: task.status,
                        startedAt: task.startedAt,
                        completedAt: task.completedAt,
                        notes: task.notes,
                        blockedReason: task.blockedReason
                    },
                    summary: {
                        featureId: stateFile.featureId,
                        featureName: stateFile.featureName,
                        totalTasks: stateFile.metadata.totalTasks,
                        completedTasks: stateFile.metadata.completedTasks,
                        inProgressTasks: stateFile.metadata.inProgressTasks,
                        blockedTasks: stateFile.metadata.blockedTasks,
                        percentComplete: stateFile.metadata.percentComplete,
                        lastUpdated: stateFile.lastUpdated
                    }
                };
            }
            // Return all tasks
            return {
                success: true,
                message: `Feature ${featureId} progress: ${stateFile.metadata.percentComplete}% complete`,
                summary: {
                    featureId: stateFile.featureId,
                    featureName: stateFile.featureName,
                    totalTasks: stateFile.metadata.totalTasks,
                    completedTasks: stateFile.metadata.completedTasks,
                    inProgressTasks: stateFile.metadata.inProgressTasks,
                    blockedTasks: stateFile.metadata.blockedTasks,
                    percentComplete: stateFile.metadata.percentComplete,
                    lastUpdated: stateFile.lastUpdated
                },
                tasks: stateFile.tasks.map(t => ({
                    id: t.id,
                    status: t.status,
                    startedAt: t.startedAt,
                    completedAt: t.completedAt,
                    notes: t.notes,
                    blockedReason: t.blockedReason
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error retrieving task progress: ${error}`,
                error: String(error)
            };
        }
    }
    /**
     * Format progress response for display
     */
    static formatProgress(response) {
        if (!response.success || !response.summary) {
            return response.message;
        }
        let output = `# Task Progress: ${response.summary.featureName}\n\n`;
        output += `**Feature ID**: ${response.summary.featureId}\n`;
        output += `**Progress**: ${response.summary.percentComplete}% complete\n`;
        output += `**Last Updated**: ${response.summary.lastUpdated}\n\n`;
        output += `## Summary\n\n`;
        output += `- Total Tasks: ${response.summary.totalTasks}\n`;
        output += `- ✅ Completed: ${response.summary.completedTasks}\n`;
        output += `- 🔄 In Progress: ${response.summary.inProgressTasks}\n`;
        output += `- 🚫 Blocked: ${response.summary.blockedTasks}\n`;
        output += `- ⬜ Backlog: ${response.summary.totalTasks - response.summary.completedTasks - response.summary.inProgressTasks - response.summary.blockedTasks}\n\n`;
        if (response.tasks && response.tasks.length > 0) {
            output += `## Tasks\n\n`;
            response.tasks.forEach(task => {
                const symbol = TaskStatusManager.getStatusSymbol(task.status);
                output += `${symbol} **Task ${task.id}** - ${task.status}\n`;
                if (task.startedAt) {
                    output += `  - Started: ${task.startedAt}\n`;
                }
                if (task.completedAt) {
                    output += `  - Completed: ${task.completedAt}\n`;
                }
                if (task.notes) {
                    output += `  - Notes: ${task.notes}\n`;
                }
                if (task.blockedReason) {
                    output += `  - ⚠️ Blocked: ${task.blockedReason}\n`;
                }
                output += `\n`;
            });
        }
        return output;
    }
}
//# sourceMappingURL=get-task-progress.js.map