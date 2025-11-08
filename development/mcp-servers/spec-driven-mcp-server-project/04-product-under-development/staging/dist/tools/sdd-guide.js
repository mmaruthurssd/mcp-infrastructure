/**
 * SDD Guide Tool - Main MCP tool for guided Spec-Driven Development
 */
import { WorkflowOrchestrator } from '../workflows/orchestrator.js';
export class SDDGuideTool {
    orchestrator;
    constructor() {
        this.orchestrator = new WorkflowOrchestrator();
    }
    /**
     * Handle tool invocation
     */
    async execute(args) {
        const { action, project_path, description, response, scenario, goal_context } = args;
        switch (action) {
            case 'start':
                return this.handleStart(project_path, description, scenario, goal_context);
            case 'answer':
                return this.handleAnswer(project_path, response);
            default:
                return {
                    success: false,
                    error: `Unknown action: ${action}`
                };
        }
    }
    /**
     * Start a new SDD workflow
     */
    handleStart(projectPath, description, scenario, goalContext) {
        if (!projectPath) {
            return {
                success: false,
                error: 'project_path is required'
            };
        }
        try {
            const result = this.orchestrator.start(projectPath, description, scenario, goalContext);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                error: String(error)
            };
        }
    }
    /**
     * Handle user answer
     */
    handleAnswer(projectPath, response) {
        if (!projectPath) {
            return {
                success: false,
                error: 'project_path is required'
            };
        }
        if (response === undefined) {
            return {
                success: false,
                error: 'response is required'
            };
        }
        try {
            const result = this.orchestrator.answer(projectPath, response);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                error: String(error)
            };
        }
    }
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'sdd_guide',
            description: 'Interactive guide for Spec-Driven Development. Walks you through creating constitution, specification, plan, and tasks for your project.',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['start', 'answer'],
                        description: 'Action to perform: "start" to begin new workflow, "answer" to respond to questions'
                    },
                    project_path: {
                        type: 'string',
                        description: 'Absolute path to the project directory'
                    },
                    description: {
                        type: 'string',
                        description: 'Brief description of what you want to build (used when action=start)'
                    },
                    response: {
                        description: 'Your answer to the current question (used when action=answer). Can be string, number, boolean, or array.'
                    },
                    scenario: {
                        type: 'string',
                        enum: ['new-project', 'existing-project', 'add-feature'],
                        description: 'Optional: Specify scenario type. If not provided, will be auto-detected.'
                    },
                    goal_context: {
                        type: 'object',
                        description: 'Optional: Goal context from Project Management MCP for cross-server integration. Contains goal evaluation data (impact, effort, etc.)'
                    }
                },
                required: ['action', 'project_path']
            }
        };
    }
}
//# sourceMappingURL=sdd-guide.js.map