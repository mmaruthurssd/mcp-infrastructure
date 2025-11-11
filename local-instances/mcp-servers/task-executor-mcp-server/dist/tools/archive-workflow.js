/**
 * Archive Workflow Tool - MCP tool for archiving completed workflows
 */
import { WorkflowManager } from '../utils/workflow-manager-v2.js';
export class ArchiveWorkflowTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'archive_workflow',
            description: 'Archive a completed workflow. Validates all tasks complete, moves from temp/ to archive/ with timestamp. Optionally checks deployment readiness.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory'
                    },
                    workflowName: {
                        type: 'string',
                        description: 'Name of the workflow to archive (e.g., "bug-fix-123")'
                    },
                    force: {
                        type: 'boolean',
                        description: 'Force archive even if validation fails (default: false)'
                    },
                    checkDeploymentReadiness: {
                        type: 'boolean',
                        description: 'Check if component is ready for deployment (runs build, test, and health checks). (default: false)'
                    }
                },
                required: ['projectPath', 'workflowName']
            }
        };
    }
    /**
     * Execute workflow archival
     */
    static async execute(input) {
        return await WorkflowManager.archive(input.projectPath, input.workflowName, input.force, input.checkDeploymentReadiness);
    }
}
//# sourceMappingURL=archive-workflow.js.map