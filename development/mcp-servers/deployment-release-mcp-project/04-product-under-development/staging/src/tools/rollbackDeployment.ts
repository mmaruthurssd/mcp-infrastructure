import type { RollbackDeploymentParams, RollbackDeploymentResult } from "../types.js";
import { DeploymentRegistryManager } from "../utils/registry.js";
import { StatePreservationManager } from "../rollback/statePreservation.js";
import { RollbackValidator } from "../rollback/validation.js";
import { RollbackManager } from "../rollback/rollbackManager.js";
import { HealthChecker } from "../rollback/healthChecker.js";
import { randomBytes } from 'crypto';

export async function rollbackDeployment(params: RollbackDeploymentParams): Promise<RollbackDeploymentResult> {
  const {
    projectPath,
    environment,
    deploymentId,
    target,
    preserveData = true,
    reason,
    force = false,
  } = params;

  const startTime = Date.now();
  const rollbackId = `rollback-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const warnings: string[] = [];

  try {
    // Step 1: Initialize managers
    const registryManager = new DeploymentRegistryManager(projectPath);
    const stateManager = new StatePreservationManager(projectPath);
    const validator = new RollbackValidator();
    const rollbackManager = new RollbackManager();
    const healthChecker = new HealthChecker();

    // Step 2: Get current and target deployments
    const currentDeployment = await registryManager.getLatestDeployment(environment);

    let targetDeployment;
    if (deploymentId) {
      targetDeployment = await registryManager.getDeployment(deploymentId);
    } else {
      targetDeployment = await registryManager.getPreviousDeployment(environment, currentDeployment?.id);
    }

    if (!targetDeployment) {
      throw new Error(`No valid rollback target found for environment '${environment}'`);
    }

    // Step 3: Run safety validation checks
    const safetyChecks = await validator.validateRollbackTarget(
      targetDeployment,
      currentDeployment,
      force
    );

    const { canProceed, blockers } = await validator.validateSafetyChecks(safetyChecks, force);

    if (!canProceed) {
      throw new Error(
        `Rollback safety checks failed:\n${blockers.join('\n')}\n\nUse force=true to override safety checks.`
      );
    }

    // Add warnings for non-critical safety check failures
    safetyChecks
      .filter(check => !check.passed && check.severity === 'warning')
      .forEach(check => {
        warnings.push(`${check.name}: ${check.message}`);
      });

    // Step 4: Create snapshot of current state before rollback
    console.error(`[Rollback] Creating snapshot of current state...`);
    const snapshotPath = await stateManager.createSnapshot(
      rollbackId,
      environment,
      currentDeployment?.id || 'unknown',
      targetDeployment.id,
      preserveData
    );
    console.error(`[Rollback] Snapshot created at: ${snapshotPath}`);

    // Step 5: Execute rollback
    console.error(`[Rollback] Executing rollback to ${targetDeployment.version}...`);
    const rollbackResult = await rollbackManager.executeRollback(
      projectPath,
      environment,
      targetDeployment,
      preserveData
    );

    if (!rollbackResult.success) {
      throw new Error(
        `Rollback execution failed:\n${rollbackResult.errors.join('\n')}`
      );
    }

    // Add execution warnings
    rollbackResult.errors.forEach(error => warnings.push(error));

    // Step 6: Run health checks after rollback
    console.error(`[Rollback] Running post-rollback health checks...`);
    const healthResult = await healthChecker.runHealthChecks(
      projectPath,
      environment,
      targetDeployment.servicesDeployed
    );

    // Add health check warnings
    healthResult.checks
      .filter(check => check.status === 'fail')
      .forEach(check => {
        warnings.push(`Health check '${check.name}' failed: ${check.message}`);
      });

    // Step 7: Update deployment registry
    await registryManager.addRollbackRecord(
      rollbackId,
      currentDeployment?.id || 'unknown',
      targetDeployment.id,
      reason
    );

    const duration = Date.now() - startTime;

    // Step 8: Build result
    const result: RollbackDeploymentResult = {
      success: true,
      rollbackId,
      timestamp: new Date().toISOString(),
      rolledBackTo: {
        deploymentId: targetDeployment.id,
        version: targetDeployment.version,
        timestamp: targetDeployment.timestamp,
      },
      summary: {
        servicesRolledBack: rollbackResult.servicesRolledBack,
        duration,
        dataPreserved: preserveData,
      },
      validation: {
        healthChecks: healthResult.healthy,
        configValid: healthResult.checks.find(c => c.name === 'configuration_validity')?.status === 'pass',
        servicesRunning: healthResult.servicesRunning,
      },
      warnings,
    };

    console.error(`[Rollback] Rollback completed successfully in ${duration}ms`);
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Rollback] Rollback failed: ${errorMessage}`);

    // Return failure result
    return {
      success: false,
      rollbackId,
      timestamp: new Date().toISOString(),
      rolledBackTo: {
        deploymentId: 'unknown',
        version: 'unknown',
        timestamp: new Date().toISOString(),
      },
      summary: {
        servicesRolledBack: 0,
        duration,
        dataPreserved: preserveData,
      },
      validation: {
        healthChecks: false,
        configValid: false,
        servicesRunning: 0,
      },
      warnings: [errorMessage, ...warnings],
    };
  }
}
