/**
 * Migrate Existing Project Tool
 *
 * Migrate an existing project into the standardized 8-folder template structure.
 * Uses AI-powered file detection to suggest optimal placement with user confirmation.
 */
export interface MigrateExistingProjectInput {
    projectPath: string;
    projectName?: string;
}
export interface FileSuggestion {
    sourceFile: string;
    suggestedDestination: string;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
    fileType: string;
}
export interface MigrateExistingProjectOutput {
    success: boolean;
    projectPath: string;
    projectName: string;
    analysis: {
        totalFiles: number;
        filesAnalyzed: number;
        filesSkipped: number;
    };
    suggestions: FileSuggestion[];
    conflicts: {
        type: 'readme' | 'folder' | 'file';
        description: string;
        options: string[];
    }[];
    message: string;
    formatted: string;
}
export declare class MigrateExistingProjectTool {
    static execute(input: MigrateExistingProjectInput): MigrateExistingProjectOutput;
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
                projectName: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static scanProject;
    private static shouldSkip;
    private static detectConflicts;
    private static formatOutput;
    private static percentage;
}
//# sourceMappingURL=migrate-existing-project.d.ts.map