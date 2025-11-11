/**
 * Confirm Migration Tool
 *
 * Execute migration based on user-reviewed and confirmed suggestions.
 * Handles file moves, conflict resolution, and generates summary report.
 */
export interface ConfirmMigrationInput {
    projectPath: string;
    suggestions: Array<{
        sourceFile: string;
        suggestedDestination: string;
        action: 'accept' | 'reject' | 'custom';
        customDestination?: string;
    }>;
    conflictResolutions: {
        readme?: 'keep-both' | 'merge' | 'existing-only' | 'template-only';
        existingStructure?: 'merge' | 'archive' | 'cancel';
    };
    createBackup?: boolean;
}
export interface ConfirmMigrationOutput {
    success: boolean;
    projectPath: string;
    summary: {
        filesMoved: number;
        filesSkipped: number;
        conflictsResolved: number;
        errors: string[];
    };
    movements: Array<{
        source: string;
        destination: string;
        status: 'success' | 'failed' | 'skipped';
        error?: string;
    }>;
    backupPath?: string;
    message: string;
    formatted: string;
}
export declare class ConfirmMigrationTool {
    static execute(input: ConfirmMigrationInput): ConfirmMigrationOutput;
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
                suggestions: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            sourceFile: {
                                type: string;
                                description: string;
                            };
                            suggestedDestination: {
                                type: string;
                                description: string;
                            };
                            action: {
                                type: string;
                                enum: string[];
                                description: string;
                            };
                            customDestination: {
                                type: string;
                                description: string;
                            };
                        };
                        required: string[];
                    };
                };
                conflictResolutions: {
                    type: string;
                    description: string;
                    properties: {
                        readme: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        existingStructure: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                    };
                };
                createBackup: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static createBackup;
    private static copyDirectory;
    private static moveFile;
    private static handleConflicts;
    private static saveMigrationReport;
    private static formatOutput;
}
//# sourceMappingURL=confirm-migration.d.ts.map