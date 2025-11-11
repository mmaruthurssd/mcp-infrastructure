/**
 * Task Deployment Utility
 *
 * Provides deployment readiness checking for archived workflows
 * Integrates with Autonomous Deployment Framework
 */
export interface DeploymentReadinessOptions {
    projectPath: string;
    workflowName: string;
    checkBuild?: boolean;
    checkTests?: boolean;
    checkHealth?: boolean;
}
export interface DeploymentReadinessResult {
    ready: boolean;
    checks: {
        build?: {
            passed: boolean;
            output?: string;
            error?: string;
        };
        tests?: {
            passed: boolean;
            output?: string;
            error?: string;
        };
        health?: {
            passed: boolean;
            details?: string[];
        };
    };
    recommendations: string[];
    deploymentEligible: boolean;
}
export declare class TaskDeployment {
    /**
     * Check deployment readiness for an archived workflow
     *
     * Verifies that the component is ready to be deployed:
     * - Build passes
     * - Tests pass
     * - Health checks pass
     */
    static checkReadiness(options: DeploymentReadinessOptions): Promise<DeploymentReadinessResult>;
    /**
     * Check if project builds successfully
     */
    private static checkBuild;
    /**
     * Check if tests pass
     */
    private static checkTests;
    /**
     * Check component health
     */
    private static checkHealth;
}
//# sourceMappingURL=task-deployment.d.ts.map