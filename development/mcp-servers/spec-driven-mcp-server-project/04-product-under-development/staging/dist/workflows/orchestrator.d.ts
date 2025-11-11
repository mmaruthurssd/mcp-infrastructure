/**
 * Workflow Orchestrator - Manages the SDD workflow lifecycle
 */
import { Scenario, StepResponse } from '../types.js';
export declare class WorkflowOrchestrator {
    private stateManager;
    private questionLoader;
    private templateRenderer;
    constructor();
    /**
     * Start a new workflow
     */
    start(projectPath: string, description: string, scenario?: Scenario, goalContext?: any): StepResponse;
    /**
     * Process an answer and advance workflow
     */
    answer(projectPath: string, answer: any): Promise<StepResponse>;
    /**
     * Handle setup confirmation
     */
    private handleSetupConfirmation;
    /**
     * Get current question, respecting conditions
     */
    private getCurrentQuestion;
    /**
     * Evaluate question condition
     */
    private evaluateCondition;
    /**
     * Complete current step and generate artifact
     */
    private completeStep;
    /**
     * Generate constitution document
     */
    private generateConstitution;
    /**
     * Generate specification document
     */
    private generateSpecification;
    /**
     * Generate plan document
     */
    private generatePlan;
    /**
     * Generate tasks document
     */
    private generateTasks;
    /**
     * Extract tasks from template context for parallelization analysis
     */
    private extractTasksFromContext;
    /**
     * Start next step
     */
    private startNextStep;
    /**
     * Advance workflow to next step
     */
    private advanceToNextStep;
    /**
     * Get next workflow step
     */
    private getNextStep;
    /**
     * Get scenario description
     */
    private getScenarioDescription;
    /**
     * Get progress string
     */
    private getProgress;
    private getStepNumber;
    private getStepTitle;
    /**
     * Extract MCP name from project path (if it's an MCP project)
     * Returns null if not an MCP project
     */
    private extractMcpName;
}
//# sourceMappingURL=orchestrator.d.ts.map