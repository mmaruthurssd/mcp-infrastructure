/**
 * Research Best Practices Tool
 *
 * Provides guidance for researching current best practices for technology decisions.
 * Inspired by Taskmaster AI's research integration with Perplexity.
 *
 * Note: This is a guidance tool that helps structure research queries.
 * Actual web search/API integration would require additional dependencies.
 */
export interface ResearchQuery {
    topic: string;
    context?: string;
    specificQuestions?: string[];
    constraints?: string[];
}
export interface ResearchGuidance {
    searchQueries: string[];
    keyTopics: string[];
    evaluationCriteria: string[];
    resourceTypes: string[];
    cautionaryNotes: string[];
}
export declare class ResearchBestPracticesTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                topic: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                specificQuestions: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                constraints: {
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
     * Execute research guidance generation
     */
    static execute(args: ResearchQuery): ResearchGuidance;
    /**
     * Generate optimized search queries
     */
    private static generateSearchQueries;
    /**
     * Identify key topics to investigate
     */
    private static identifyKeyTopics;
    /**
     * Define evaluation criteria
     */
    private static defineEvaluationCriteria;
    /**
     * Recommend resource types
     */
    private static recommendResourceTypes;
    /**
     * Get cautionary notes
     */
    private static getCautionaryNotes;
    /**
     * Format research guidance for display
     */
    static formatGuidance(guidance: ResearchGuidance): string;
}
//# sourceMappingURL=research-best-practices.d.ts.map