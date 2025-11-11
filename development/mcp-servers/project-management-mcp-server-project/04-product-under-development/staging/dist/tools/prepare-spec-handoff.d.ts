/**
 * Prepare Spec Handoff Tool
 *
 * Prepares goal context for Spec-Driven MCP with ready-to-execute tool call
 */
export interface PrepareSpecHandoffInput {
    projectPath: string;
    goalId: string;
}
export interface PrepareSpecHandoffResult {
    success: boolean;
    goalName: string;
    goalContext: {
        name: string;
        description: string;
        impactScore: string;
        effortScore: string;
        tier: string;
    };
    suggestedToolCall: {
        tool: string;
        params: any;
    };
    suggestedAgent?: {
        agent: string;
        reasoning: string;
        taskDescription: string;
    };
    message: string;
}
export declare class PrepareSpecHandoffTool {
    static execute(input: PrepareSpecHandoffInput): PrepareSpecHandoffResult;
    /**
     * Parse goal from SELECTED-GOALS.md markdown file
     */
    private static parseGoalFromMarkdown;
    static formatResult(result: PrepareSpecHandoffResult): string;
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
                goalId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=prepare-spec-handoff.d.ts.map