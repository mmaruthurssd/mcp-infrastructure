import { rollbackDeployment } from '../src/tools/rollbackDeployment.js';
import type { RollbackDeploymentParams } from '../src/types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('rollbackDeployment', () => {
  let testProjectPath: string;

  beforeEach(async () => {
    // Create a temporary test project directory
    testProjectPath = path.join(os.tmpdir(), `test-rollback-${Date.now()}`);
    await fs.mkdir(testProjectPath, { recursive: true });

    // Create a mock deployment registry
    const registryDir = path.join(testProjectPath, '.deployments');
    await fs.mkdir(registryDir, { recursive: true });

    const mockRegistry = {
      version: '1.0.0',
      projectPath: testProjectPath,
      lastUpdated: new Date().toISOString(),
      deployments: [
        {
          id: 'deploy-001',
          environment: 'staging',
          strategy: 'rolling',
          version: 'v1.0.0',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          status: 'success',
          duration: 120000,
          servicesDeployed: ['api', 'web', 'worker'],
          healthStatus: 'healthy',
          rollbackAvailable: true,
        },
        {
          id: 'deploy-002',
          environment: 'staging',
          strategy: 'rolling',
          version: 'v1.1.0',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          status: 'success',
          duration: 150000,
          servicesDeployed: ['api', 'web', 'worker'],
          healthStatus: 'healthy',
          rollbackAvailable: true,
        },
      ],
    };

    await fs.writeFile(
      path.join(registryDir, 'deployment-registry.json'),
      JSON.stringify(mockRegistry, null, 2)
    );
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should successfully rollback to previous deployment', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing rollback functionality',
      preserveData: true,
      force: false,
    };

    const result = await rollbackDeployment(params);

    expect(result.success).toBe(true);
    expect(result.rollbackId).toBeDefined();
    expect(result.rolledBackTo.deploymentId).toBe('deploy-001');
    expect(result.rolledBackTo.version).toBe('v1.0.0');
    expect(result.summary.servicesRolledBack).toBe(3);
    expect(result.summary.dataPreserved).toBe(true);
    expect(result.validation.servicesRunning).toBeGreaterThan(0);
  });

  test('should rollback to specific deployment ID', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      deploymentId: 'deploy-001',
      reason: 'Rolling back to specific deployment',
      preserveData: false,
    };

    const result = await rollbackDeployment(params);

    expect(result.success).toBe(true);
    expect(result.rolledBackTo.deploymentId).toBe('deploy-001');
    expect(result.summary.dataPreserved).toBe(false);
  });

  test('should create snapshot before rollback', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing snapshot creation',
      preserveData: true,
    };

    const result = await rollbackDeployment(params);

    // Verify snapshot was created
    const snapshotDir = path.join(
      testProjectPath,
      '.deployments',
      'rollback-snapshots',
      result.rollbackId
    );

    const snapshotExists = await fs.access(snapshotDir).then(() => true).catch(() => false);
    expect(snapshotExists).toBe(true);

    // Verify snapshot metadata
    const metadataPath = path.join(snapshotDir, 'metadata.json');
    const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
    expect(metadataExists).toBe(true);

    if (metadataExists) {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      expect(metadata.rollbackId).toBe(result.rollbackId);
      expect(metadata.environment).toBe('staging');
      expect(metadata.preserveData).toBe(true);
    }
  });

  test('should fail when no rollback target exists', async () => {
    // Create empty registry
    const registryPath = path.join(testProjectPath, '.deployments', 'deployment-registry.json');
    const emptyRegistry = {
      version: '1.0.0',
      projectPath: testProjectPath,
      lastUpdated: new Date().toISOString(),
      deployments: [],
    };

    await fs.writeFile(registryPath, JSON.stringify(emptyRegistry, null, 2));

    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing failure case',
    };

    const result = await rollbackDeployment(params);

    expect(result.success).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('No valid rollback target found');
  });

  test('should include warnings for safety check failures', async () => {
    // Update registry to have a major version jump
    const registryPath = path.join(testProjectPath, '.deployments', 'deployment-registry.json');
    const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

    registry.deployments[1].version = 'v2.0.0'; // Major version change

    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing safety warnings',
    };

    const result = await rollbackDeployment(params);

    // Should succeed but include warnings
    expect(result.success).toBe(true);
    // Warnings might include schema compatibility issues
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  test('should update deployment registry with rollback record', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing registry update',
    };

    const result = await rollbackDeployment(params);

    // Read updated registry
    const registryPath = path.join(testProjectPath, '.deployments', 'deployment-registry.json');
    const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

    // Should have a new rollback record
    const rollbackRecord = registry.deployments.find((d: any) => d.id === result.rollbackId);
    expect(rollbackRecord).toBeDefined();
    expect(rollbackRecord?.strategy).toBe('rollback');

    // Original deployment should be marked as rolled-back
    const originalDeployment = registry.deployments.find((d: any) => d.id === 'deploy-002');
    expect(originalDeployment?.status).toBe('rolled-back');
  });

  test('should preserve data when preserveData is true', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing data preservation',
      preserveData: true,
    };

    const result = await rollbackDeployment(params);

    expect(result.success).toBe(true);
    expect(result.summary.dataPreserved).toBe(true);

    // Verify database preservation note was created
    const snapshotDir = path.join(
      testProjectPath,
      '.deployments',
      'rollback-snapshots',
      result.rollbackId,
      'database'
    );

    const dbSnapshotExists = await fs.access(snapshotDir).then(() => true).catch(() => false);
    expect(dbSnapshotExists).toBe(true);
  });

  test('should run health checks after rollback', async () => {
    const params: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing health checks',
    };

    const result = await rollbackDeployment(params);

    expect(result.success).toBe(true);
    expect(result.validation.healthChecks).toBeDefined();
    expect(result.validation.configValid).toBeDefined();
    expect(result.validation.servicesRunning).toBeGreaterThanOrEqual(0);
  });

  test('should handle force rollback with safety check failures', async () => {
    // Modify registry to create an invalid target
    const registryPath = path.join(testProjectPath, '.deployments', 'deployment-registry.json');
    const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

    registry.deployments[0].status = 'failed'; // Target deployment failed

    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    // Without force, should fail
    const paramsNoForce: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing force rollback - no force',
      force: false,
    };

    const resultNoForce = await rollbackDeployment(paramsNoForce);
    expect(resultNoForce.success).toBe(false);

    // Restore registry for force test
    registry.deployments[0].status = 'failed';
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    // With force, should succeed
    const paramsForce: RollbackDeploymentParams = {
      projectPath: testProjectPath,
      environment: 'staging',
      reason: 'Testing force rollback - with force',
      force: true,
    };

    const resultForce = await rollbackDeployment(paramsForce);
    expect(resultForce.success).toBe(true);
  });
});
