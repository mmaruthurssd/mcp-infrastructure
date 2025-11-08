/**
 * Validate Project Tool
 *
 * Validates project structure, YAML frontmatter, RESOURCE-INDEX tracking, goal metadata,
 * and workflow compliance. Provides comprehensive validation with optional auto-fix capabilities.
 */
export interface ValidateProjectInput {
    projectPath: string;
    checks?: ValidationType[];
    autoFix?: boolean;
    skipConfirmation?: boolean;
}
export type ValidationType = 'structure' | 'yaml' | 'resource-index' | 'goals' | 'workflow' | 'all';
export interface ValidationResult {
    success: boolean;
    checks: {
        structure?: StructureValidation;
        yaml?: YamlValidation;
        resourceIndex?: ResourceIndexValidation;
        goals?: GoalsValidation;
        workflow?: WorkflowValidation;
    };
    summary: {
        totalIssues: number;
        criticalIssues: number;
        warnings: number;
        fixesApplied?: number;
    };
    message: string;
}
export interface StructureValidation {
    passed: boolean;
    missingFolders: string[];
    missingRootFiles: string[];
    unexpectedItems: string[];
    details: string[];
}
export interface YamlValidation {
    passed: boolean;
    filesWithoutFrontmatter: string[];
    filesWithInvalidFrontmatter: string[];
    details: string[];
}
export interface ResourceIndexValidation {
    passed: boolean;
    untrackedFiles: string[];
    missingIndex: boolean;
    details: string[];
}
export interface GoalsValidation {
    passed: boolean;
    goalsWithMissingMetadata: string[];
    goalsWithInvalidMetadata: string[];
    details: string[];
}
export interface WorkflowValidation {
    passed: boolean;
    completionPercentage: number;
    missingSteps: string[];
    completedSteps: string[];
    details: string[];
}
export declare class ValidateProjectTool {
    static execute(input: ValidateProjectInput): ValidationResult;
    private static validateStructure;
    private static validateYamlFrontmatter;
    private static validateResourceIndex;
    private static validateGoals;
    private static validateGoalsInFolder;
    private static validateWorkflow;
    private static applyAutoFixes;
    private static updateSummary;
    private static findMarkdownFiles;
    private static findResourceFiles;
    private static shouldSkipFile;
    private static shouldSkipDirectory;
    private static extractFrontmatter;
    private static generateDefaultFrontmatter;
    private static inferFileType;
    private static inferTags;
    private static getDefaultFileContent;
    private static getSummaryMessage;
    static formatResult(result: ValidationResult): string;
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
                checks: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                };
                autoFix: {
                    type: string;
                    description: string;
                };
                skipConfirmation: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=validate-project%202.d.ts.map