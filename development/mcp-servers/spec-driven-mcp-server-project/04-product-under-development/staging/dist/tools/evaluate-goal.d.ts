/**
 * Evaluate Goal Tool
 *
 * Analyzes a goal description to estimate Impact, Effort, and suggest a tier.
 * Uses AI-assisted heuristics to help prioritize goals in the workflow.
 */
import { GoalEvaluation } from '../evaluators/tier-suggester.js';
export interface EvaluateGoalArgs {
    goalDescription: string;
    context?: string;
    projectType?: string;
}
export interface EvaluateGoalResult extends GoalEvaluation {
    suggestions: string[];
    nextSteps: string[];
}
export declare class EvaluateGoalTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                goalDescription: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                projectType: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute goal evaluation
     */
    static execute(args: EvaluateGoalArgs): EvaluateGoalResult;
    /**
     * Generate suggestions for improving the evaluation
     */
    private static generateSuggestions;
    /**
     * Generate next steps based on tier
     */
    private static generateNextSteps;
    /**
     * Format evaluation result for display
     */
    static formatResult(result: EvaluateGoalResult): string;
}
//# sourceMappingURL=evaluate-goal.d.ts.map