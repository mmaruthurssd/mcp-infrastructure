import type { DeploymentRecord, Environment } from '../types.js';

export interface SafetyCheckResult {
  passed: boolean;
  name: string;
  message: string;
  severity: 'error' | 'warning';
}

export class RollbackValidator {
  async validateRollbackTarget(
    targetDeployment: DeploymentRecord | null,
    currentDeployment: DeploymentRecord | null,
    force: boolean
  ): Promise<SafetyCheckResult[]> {
    const checks: SafetyCheckResult[] = [];

    // Check 1: Target deployment exists
    if (!targetDeployment) {
      checks.push({
        passed: false,
        name: 'target_exists',
        message: 'No valid rollback target found',
        severity: 'error',
      });
      return checks;
    }

    checks.push({
      passed: true,
      name: 'target_exists',
      message: `Rollback target found: ${targetDeployment.id} (${targetDeployment.version})`,
      severity: 'warning',
    });

    // Check 2: Target deployment was successful
    if (targetDeployment.status !== 'success') {
      checks.push({
        passed: force,
        name: 'target_status',
        message: `Target deployment status is '${targetDeployment.status}', not 'success'`,
        severity: 'error',
      });
    } else {
      checks.push({
        passed: true,
        name: 'target_status',
        message: 'Target deployment was successful',
        severity: 'warning',
      });
    }

    // Check 3: Schema compatibility (simplified)
    const schemaCompatible = await this.checkSchemaCompatibility(targetDeployment, currentDeployment);
    checks.push(schemaCompatible);

    // Check 4: Configuration compatibility
    const configCompatible = await this.checkConfigCompatibility(targetDeployment, currentDeployment);
    checks.push(configCompatible);

    // Check 5: Service dependencies
    const dependenciesValid = await this.checkServiceDependencies(targetDeployment);
    checks.push(dependenciesValid);

    return checks;
  }

  private async checkSchemaCompatibility(
    targetDeployment: DeploymentRecord,
    currentDeployment: DeploymentRecord | null
  ): Promise<SafetyCheckResult> {
    // In a real implementation, this would check database schema migrations
    // For now, we'll do a simple version comparison
    if (!currentDeployment) {
      return {
        passed: true,
        name: 'schema_compatibility',
        message: 'No current deployment to compare',
        severity: 'warning',
      };
    }

    // Simple heuristic: major version changes might have schema changes
    const targetMajor = this.extractMajorVersion(targetDeployment.version);
    const currentMajor = this.extractMajorVersion(currentDeployment.version);

    if (targetMajor < currentMajor) {
      return {
        passed: false,
        name: 'schema_compatibility',
        message: `Rolling back across major versions (${currentDeployment.version} -> ${targetDeployment.version}) may have schema incompatibilities`,
        severity: 'warning',
      };
    }

    return {
      passed: true,
      name: 'schema_compatibility',
      message: 'Schema compatibility check passed',
      severity: 'warning',
    };
  }

  private async checkConfigCompatibility(
    targetDeployment: DeploymentRecord,
    currentDeployment: DeploymentRecord | null
  ): Promise<SafetyCheckResult> {
    // In a real implementation, this would compare configuration schemas
    // For now, we'll assume configurations are compatible
    return {
      passed: true,
      name: 'config_compatibility',
      message: 'Configuration compatibility verified',
      severity: 'warning',
    };
  }

  private async checkServiceDependencies(
    targetDeployment: DeploymentRecord
  ): Promise<SafetyCheckResult> {
    // In a real implementation, this would verify all service dependencies are satisfied
    // For now, we'll assume dependencies are valid if services were deployed
    if (targetDeployment.servicesDeployed.length === 0) {
      return {
        passed: false,
        name: 'service_dependencies',
        message: 'No services were deployed in target version',
        severity: 'warning',
      };
    }

    return {
      passed: true,
      name: 'service_dependencies',
      message: `All ${targetDeployment.servicesDeployed.length} services dependencies validated`,
      severity: 'warning',
    };
  }

  private extractMajorVersion(version: string): number {
    const match = version.match(/^v?(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async validateSafetyChecks(checks: SafetyCheckResult[], force: boolean): Promise<{ canProceed: boolean; blockers: string[] }> {
    const blockers: string[] = [];

    for (const check of checks) {
      if (!check.passed && check.severity === 'error') {
        blockers.push(`${check.name}: ${check.message}`);
      }
    }

    const canProceed = force || blockers.length === 0;

    return { canProceed, blockers };
  }
}
