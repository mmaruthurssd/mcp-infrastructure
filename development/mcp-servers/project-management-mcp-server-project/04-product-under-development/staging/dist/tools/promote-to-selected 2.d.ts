/**
 * Promote to Selected Tool
 *
 * Promotes a potential goal to selected status, adds it to SELECTED-GOALS.md,
 * and optionally prepares goal context for spec-driven workflow.
 */
export interface PromoteToSelectedInput {
    projectPath: string;
    potentialGoalFile: string;
    priority: 'High' | 'Medium' | 'Low';
    owner?: string;
    targetDate?: string;
    generateSpec?: boolean;
    status?: 'Planning' | 'Not Started';
    nextAction?: string;
}
export interface GoalContext {
    goalId: string;
    goalName: string;
    goalDescription: string;
    impactScore: string;
    impactReasoning: string;
    effortScore: string;
    effortReasoning: string;
    tier: string;
    priority: string;
    owner: string;
    targetDate: string;
    problem?: string;
    expectedValue?: string;
    effortDetails?: string;
    dependencies?: string;
    risks?: string;
    alternatives?: string;
    decisionCriteria?: string;
}
export interface PromoteToSelectedOutput {
    success: boolean;
    goalId?: string;
    goalName?: string;
    addedToFile?: string;
    goalContext?: GoalContext;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class PromoteToSelectedTool {
    /**
     * Execute the promote_to_selected tool
     */
    static execute(input: PromoteToSelectedInput): PromoteToSelectedOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: PromoteToSelectedOutput): string;
    /**
     * Get MCP tool definition
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
                potentialGoalFile: {
                    type: string;
                    description: string;
                };
                priority: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                owner: {
                    type: string;
                    description: string;
                };
                targetDate: {
                    type: string;
                    description: string;
                };
                generateSpec: {
                    type: string;
                    description: string;
                };
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                nextAction: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=promote-to-selected%202.d.ts.map