/**
 * Create Potential Goal Tool
 *
 * Creates a potential goal markdown file from an evaluation result.
 * Saves the file to the project's potential-goals/ directory.
 */
import { EvaluateGoalResult } from './evaluate-goal.js';
export interface CreatePotentialGoalArgs {
    projectPath: string;
    goalName: string;
    goalDescription: string;
    context?: string;
    impactScore: string;
    impactReasoning: string;
    peopleAffected: number;
    problemSeverity: string;
    strategicValue: string;
    impactConfidence: string;
    effortScore: string;
    effortReasoning: string;
    timeEstimate: string;
    technicalComplexity: string;
    dependenciesCount: number;
    scopeClarity: string;
    effortConfidence: string;
    suggestedTier: string;
    userOverride?: string;
    problem?: string;
    expectedValue?: string;
    effortDetails?: string;
    dependencies?: string;
    risks?: string;
    alternatives?: string;
    decisionCriteria?: string;
    notes?: string;
    suggestions?: string[];
    nextSteps?: string[];
}
export interface CreatePotentialGoalResult {
    success: boolean;
    filePath: string;
    fileName: string;
    message: string;
    error?: string;
}
export declare class CreatePotentialGoalTool {
    /**
     * Get tool definition for MCP
     */
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
                goalName: {
                    type: string;
                    description: string;
                };
                goalDescription: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                impactScore: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                impactReasoning: {
                    type: string;
                    description: string;
                };
                peopleAffected: {
                    type: string;
                    description: string;
                };
                problemSeverity: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                strategicValue: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                impactConfidence: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                effortScore: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                effortReasoning: {
                    type: string;
                    description: string;
                };
                timeEstimate: {
                    type: string;
                    description: string;
                };
                technicalComplexity: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                dependenciesCount: {
                    type: string;
                    description: string;
                };
                scopeClarity: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                effortConfidence: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                suggestedTier: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                userOverride: {
                    type: string;
                    description: string;
                };
                problem: {
                    type: string;
                    description: string;
                };
                expectedValue: {
                    type: string;
                    description: string;
                };
                effortDetails: {
                    type: string;
                    description: string;
                };
                dependencies: {
                    type: string;
                    description: string;
                };
                risks: {
                    type: string;
                    description: string;
                };
                alternatives: {
                    type: string;
                    description: string;
                };
                decisionCriteria: {
                    type: string;
                    description: string;
                };
                notes: {
                    type: string;
                    description: string;
                };
                suggestions: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                nextSteps: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute potential goal creation
     */
    static execute(args: CreatePotentialGoalArgs): CreatePotentialGoalResult;
    /**
     * Helper: Create from evaluation result
     */
    static createFromEvaluation(projectPath: string, goalName: string, goalDescription: string, evaluationResult: EvaluateGoalResult, context?: string, userOverride?: string, evaluationAnswers?: {
        problem?: string;
        expectedValue?: string;
        effortDetails?: string;
        dependencies?: string;
        risks?: string;
        alternatives?: string;
        decisionCriteria?: string;
        notes?: string;
    }): CreatePotentialGoalResult;
    /**
     * Get potential-goals directory path
     */
    private static getPotentialGoalsDir;
    /**
     * Generate filename from goal name
     */
    private static generateFileName;
    /**
     * Format result for display
     */
    static formatResult(result: CreatePotentialGoalResult): string;
}
//# sourceMappingURL=create-potential-goal.d.ts.map