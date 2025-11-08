/**
 * Complete Task Tool - MCP tool for marking tasks complete with verification
 * Enhanced with optional automated validation (build, test checks)
 */
import { WorkflowManager } from '../utils/workflow-manager-v2.js';
export class CompleteTaskTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'complete_task',
            description: 'Mark a task as complete with optional verification. System checks if task was actually done and provides verification report. Optionally runs automated validation (build, tests).',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory'
                    },
                    workflowName: {
                        type: 'string',
                        description: 'Name of the workflow (e.g., "bug-fix-123")'
                    },
                    taskId: {
                        type: 'string',
                        description: 'Task ID to complete (e.g., "1", "2", "3")'
                    },
                    notes: {
                        type: 'string',
                        description: 'Optional notes about how the task was completed'
                    },
                    skipVerification: {
                        type: 'boolean',
                        description: 'Set to true to skip automatic verification (default: false)'
                    },
                    runValidation: {
                        type: 'boolean',
                        description: 'Set to true to run automated validation checks (build, tests). Auto-detects which checks to run based on task description. (default: false)'
                    }
                },
                required: ['projectPath', 'workflowName', 'taskId']
            }
        };
    }
    /**
     * Execute task completion
     */
    static async execute(input) {
        const result = await WorkflowManager.completeTask(input.projectPath, input.workflowName, input.taskId, input.notes, input.skipVerification, input.runValidation);
        if (!result.success) {
            return {
                success: false,
                error: result.error
            };
        }
        return {
            success: true,
            verification: result.verification,
            progress: result.progress
        };
    }
}
//# sourceMappingURL=complete-task.js.map