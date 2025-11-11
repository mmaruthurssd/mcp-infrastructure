/**
 * Task Validation Utility
 *
 * Integrates with Autonomous Deployment Framework for automated validation
 * when completing tasks.
 */
export interface ValidationOptions {
    projectPath: string;
    taskDescription: string;
    runBuild?: boolean;
    runTests?: boolean;
    runSecurityScan?: boolean;
}
export interface ValidationResult {
    buildCheck?: {
        passed: boolean;
        output?: string;
        error?: string;
    };
    testCheck?: {
        passed: boolean;
        output?: string;
        error?: string;
    };
    securityCheck?: {
        passed: boolean;
        findings?: string[];
        error?: string;
    };
    overallPassed: boolean;
    evidence: string[];
    concerns: string[];
}
export declare class TaskValidation {
    /**
     * Run automated validation checks for a completed task
     */
    static validate(options: ValidationOptions): Promise<ValidationResult>;
    /**
     * Determine if build check should run based on task description
     */
    private static shouldRunBuildCheck;
    /**
     * Determine if test check should run based on task description
     */
    private static shouldRunTestCheck;
    /**
     * Run build check
     */
    private static runBuildCheck;
    /**
     * Run test check
     */
    private static runTestCheck;
    /**
     * Run security scan (placeholder for future integration)
     */
    private static runSecurityCheck;
}
//# sourceMappingURL=task-validation.d.ts.map