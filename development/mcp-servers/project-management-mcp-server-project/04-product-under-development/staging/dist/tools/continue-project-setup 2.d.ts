/**
 * Continue Project Setup Tool
 *
 * Continue multi-turn planning conversation.
 */
export interface ContinueProjectSetupInput {
    projectPath: string;
    conversationId: string;
    userResponse: string;
}
export interface ContinueProjectSetupOutput {
    success: boolean;
    conversationId: string;
    nextQuestion?: string;
    readyToGenerate: boolean;
    extractedSoFar: {
        goals: number;
        stakeholders: number;
        resources: number;
        assets: number;
        constraints: number;
    };
    completeness: number;
    message: string;
    formatted: string;
}
export declare class ContinueProjectSetupTool {
    static execute(input: ContinueProjectSetupInput): ContinueProjectSetupOutput;
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
                userResponse: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static formatOutput;
}
//# sourceMappingURL=continue-project-setup%202.d.ts.map