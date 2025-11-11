/**
 * Extract Project Goals Tool
 *
 * Extract structured goals from planning conversation.
 */
export interface ExtractProjectGoalsInput {
    projectPath: string;
    conversationId: string;
}
export interface ExtractedGoal {
    id: string;
    name: string;
    description: string;
    suggestedImpact: 'High' | 'Medium' | 'Low';
    suggestedEffort: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
    suggestedTier: 'Now' | 'Next' | 'Later' | 'Someday';
    tier: 'Now' | 'Next' | 'Later' | 'Someday';
    extractedFrom: string;
    confidence: number;
}
export interface ExtractProjectGoalsOutput {
    success: boolean;
    goalsExtracted: number;
    mainGoals: ExtractedGoal[];
    formatted: string;
}
export declare class ExtractProjectGoalsTool {
    static execute(input: ExtractProjectGoalsInput): ExtractProjectGoalsOutput;
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
                conversationId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static deduplicateGoals;
    private static generateGoalName;
    private static formatOutput;
}
//# sourceMappingURL=extract-project-goals.d.ts.map