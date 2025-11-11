/**
 * Get Workflow Status Tool - MCP tool for checking workflow progress
 */
import { WorkflowManager } from '../utils/workflow-manager-v2.js';
export class GetWorkflowStatusTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'get_workflow_status',
            description: 'Get current status and progress of a workflow. Shows completed tasks, next task, and documentation status.',
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
                    }
                },
                required: ['projectPath', 'workflowName']
            }
        };
    }
    /**
     * Execute status retrieval
     */
    static execute(input) {
        return WorkflowManager.getStatus(input.projectPath, input.workflowName);
    }
    /**
     * Format status for display
     */
    static formatStatus(output) {
        if (!output.success || !output.workflow) {
            return output.error || 'Error retrieving workflow status';
        }
        let formatted = `# Workflow: ${output.workflow.name}\n\n`;
        formatted += `**Created**: ${output.workflow.created}\n`;
        formatted += `**Status**: ${output.workflow.status}\n`;
        formatted += `**Progress**: ${output.workflow.progress}\n`;
        formatted += `**Next**: ${output.workflow.nextTask}\n`;
        formatted += `**Constraints**: ${output.workflow.constraintsStatus}\n\n`;
        if (output.tasks && output.tasks.length > 0) {
            formatted += `## Tasks\n\n`;
            output.tasks.forEach(task => {
                const symbol = this.getTaskSymbol(task.status);
                const complexity = task.complexity ? ` ${task.complexity.emoji} (${task.complexity.score}/10)` : '';
                formatted += `${symbol} ${task.id}. ${task.description}${complexity}\n`;
            });
            formatted += `\n`;
        }
        if (output.documentation) {
            formatted += `## Documentation\n\n`;
            if (output.documentation.existing.length > 0) {
                formatted += `**Existing**: ${output.documentation.existing.join(', ')}\n`;
            }
            if (output.documentation.needsUpdate.length > 0) {
                formatted += `**Needs update**: ${output.documentation.needsUpdate.join(', ')}\n`;
            }
            if (output.documentation.updated.length > 0) {
                formatted += `**Updated**: ${output.documentation.updated.join(', ')}\n`;
            }
        }
        return formatted;
    }
    static getTaskSymbol(status) {
        switch (status) {
            case 'pending': return '[ ]';
            case 'in-progress': return '[~]';
            case 'completed': return '[x]';
            case 'verified': return '[✓]';
            default: return '[ ]';
        }
    }
}
//# sourceMappingURL=get-workflow-status.js.map