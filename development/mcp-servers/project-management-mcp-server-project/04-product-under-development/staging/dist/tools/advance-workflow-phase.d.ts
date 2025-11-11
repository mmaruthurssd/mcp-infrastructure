/**
 * Advance Workflow Phase Tool
 *
 * Move project to the next workflow phase after validating prerequisites
 */
import { WorkflowPhase } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';
export interface AdvanceWorkflowPhaseInput {
    projectPath: string;
    targetPhase?: WorkflowPhase;
    skipValidation?: boolean;
}
export interface AdvanceWorkflowPhaseResult {
    success: boolean;
    previousPhase: string;
    currentPhase: string;
    message: string;
    validationsPassed: string[];
    warnings: string[];
}
export declare class AdvanceWorkflowPhaseTool {
    private static readonly PHASE_ORDER;
    static execute(input: AdvanceWorkflowPhaseInput): AdvanceWorkflowPhaseResult;
    /**
     * Validate phase transition
     */
    private static validatePhaseTransition;
    static formatResult(result: AdvanceWorkflowPhaseResult): string;
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
                targetPhase: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                skipValidation: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=advance-workflow-phase.d.ts.map