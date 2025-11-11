/**
 * Extract Ideas Tool
 *
 * Scans brainstorming discussion markdown files for actionable ideas using
 * AI pattern matching and confidence scoring.
 */
export interface ExtractIdeasInput {
    projectPath: string;
    filePath?: string;
    minConfidence?: number;
}
export interface ExtractedIdea {
    id: string;
    text: string;
    context: string;
    confidence: number;
    location: {
        lineNumber: number;
        sectionHeading?: string;
    };
    suggestedName: string;
    reasoning: string;
}
export interface ExtractIdeasOutput {
    success: boolean;
    ideasFound?: number;
    ideas?: ExtractedIdea[];
    formatted?: string;
    message: string;
    error?: string;
}
export declare class ExtractIdeasTool {
    /**
     * Execute the extract_ideas tool
     */
    static execute(input: ExtractIdeasInput): ExtractIdeasOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: ExtractIdeasOutput): string;
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
                filePath: {
                    type: string;
                    description: string;
                };
                minConfidence: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=extract-ideas.d.ts.map