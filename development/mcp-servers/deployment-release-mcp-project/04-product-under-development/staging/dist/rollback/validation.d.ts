import type { DeploymentRecord } from '../types.js';
export interface SafetyCheckResult {
    passed: boolean;
    name: string;
    message: string;
    severity: 'error' | 'warning';
}
export declare class RollbackValidator {
    validateRollbackTarget(targetDeployment: DeploymentRecord | null, currentDeployment: DeploymentRecord | null, force: boolean): Promise<SafetyCheckResult[]>;
    private checkSchemaCompatibility;
    private checkConfigCompatibility;
    private checkServiceDependencies;
    private extractMajorVersion;
    validateSafetyChecks(checks: SafetyCheckResult[], force: boolean): Promise<{
        canProceed: boolean;
        blockers: string[];
    }>;
}
//# sourceMappingURL=validation.d.ts.map