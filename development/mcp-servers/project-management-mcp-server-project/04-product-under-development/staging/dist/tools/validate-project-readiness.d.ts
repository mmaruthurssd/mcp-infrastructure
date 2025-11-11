/**
 * Validate Project Readiness Tool
 *
 * Comprehensive validation to check if project is ready for completion/wrap-up
 */
export interface ValidateProjectReadinessInput {
    projectPath: string;
}
export interface ValidationCheck {
    category: string;
    passed: boolean;
    details: string[];
    blockers: string[];
}
export interface ValidateProjectReadinessResult {
    success: boolean;
    ready: boolean;
    completionPercentage: number;
    checks: {
        goals: ValidationCheck;
        documentation: ValidationCheck;
        deliverables: ValidationCheck;
        workflows: ValidationCheck;
    };
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
    };
    blockers: string[];
    recommendations: string[];
}
export declare class ValidateProjectReadinessTool {
    static execute(input: ValidateProjectReadinessInput): ValidateProjectReadinessResult;
    /**
     * Validate goals status
     */
    private static validateGoals;
    /**
     * Validate documentation completeness
     */
    private static validateDocumentation;
    /**
     * Validate deliverables
     */
    private static validateDeliverables;
    /**
     * Validate workflows status
     */
    private static validateWorkflows;
    /**
     * Generate recommendations based on checks
     */
    private static generateRecommendations;
    /**
     * Create a failed check result
     */
    private static createFailedCheck;
    static formatResult(result: ValidateProjectReadinessResult): string;
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
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=validate-project-readiness.d.ts.map