/**
 * Generate Project Constitution Tool
 *
 * Generate project-specific constitution with principles and guidelines.
 */
export interface GenerateProjectConstitutionInput {
    projectPath: string;
    conversationId: string;
    mode?: 'quick' | 'deep';
    customPrinciples?: string[];
}
export interface GenerateProjectConstitutionOutput {
    success: boolean;
    constitutionPath: string;
    mode: 'quick' | 'deep';
    sections: {
        principles: number;
        hasDecisionFramework: boolean;
        hasGuidelines: boolean;
        constraints: number;
        successCriteria: number;
        hasEthicsStatement: boolean;
    };
    formatted: string;
}
export declare class GenerateProjectConstitutionTool {
    static execute(input: GenerateProjectConstitutionInput): GenerateProjectConstitutionOutput;
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
                mode: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                customPrinciples: {
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
    private static formatOutput;
}
//# sourceMappingURL=generate-project-constitution.d.ts.map