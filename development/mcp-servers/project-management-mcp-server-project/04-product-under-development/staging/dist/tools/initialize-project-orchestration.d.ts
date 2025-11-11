/**
 * Initialize Project Orchestration Tool
 *
 * Initializes workflow state tracking for a project
 */
import { ProjectState } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';
export interface InitializeOrchestrationInput {
    projectPath: string;
    projectName?: string;
    force?: boolean;
}
export interface InitializeOrchestrationResult {
    success: boolean;
    statePath: string;
    state: ProjectState;
    message: string;
    wasExisting: boolean;
}
export declare class InitializeProjectOrchestrationTool {
    static execute(input: InitializeOrchestrationInput): InitializeOrchestrationResult;
    static formatResult(result: InitializeOrchestrationResult): string;
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
                projectName: {
                    type: string;
                    description: string;
                };
                force: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=initialize-project-orchestration.d.ts.map