/**
 * Generate Completion Checklist Tool
 *
 * Creates a comprehensive pre-closure checklist
 */
export interface GenerateCompletionChecklistInput {
    projectPath: string;
    outputFile?: string;
}
export interface GenerateCompletionChecklistResult {
    success: boolean;
    checklistPath: string;
    itemCount: number;
    message: string;
}
export declare class GenerateCompletionChecklistTool {
    static execute(input: GenerateCompletionChecklistInput): GenerateCompletionChecklistResult;
    /**
     * Generate checklist content
     */
    private static generateChecklistContent;
    static formatResult(result: GenerateCompletionChecklistResult): string;
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
                outputFile: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=generate-completion-checklist.d.ts.map