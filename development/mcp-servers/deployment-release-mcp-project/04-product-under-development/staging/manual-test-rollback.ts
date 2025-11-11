#!/usr/bin/env node

/**
 * Manual Test Script for Rollback Deployment
 *
 * This script demonstrates the rollback_deployment functionality
 * by creating a test project with mock deployments and performing rollback.
 */

import { rollbackDeployment } from './dist/tools/rollbackDeployment.js';
import type { RollbackDeploymentParams } from './dist/types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

async function setupTestProject(): Promise<string> {
  // Create temporary test directory
  const testDir = path.join(os.tmpdir(), `rollback-test-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });

  console.log(`\n📁 Created test project at: ${testDir}`);

  // Create deployment registry with multiple deployments
  const registryDir = path.join(testDir, '.deployments');
  await fs.mkdir(registryDir, { recursive: true });

  const mockRegistry = {
    version: '1.0.0',
    projectPath: testDir,
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
      {
        id: 'deploy-003',
        environment: 'staging',
        strategy: 'blue-green',
        version: 'v1.2.0',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        status: 'success',
        duration: 180000,
        servicesDeployed: ['api', 'web', 'worker'],
        healthStatus: 'degraded',
        rollbackAvailable: true,
      },
    ],
  };

  await fs.writeFile(
    path.join(registryDir, 'deployment-registry.json'),
    JSON.stringify(mockRegistry, null, 2)
  );

  console.log('✅ Created mock deployment registry with 3 deployments');
  console.log('   - deploy-001: v1.0.0 (2 hours ago, healthy)');
  console.log('   - deploy-002: v1.1.0 (1 hour ago, healthy)');
  console.log('   - deploy-003: v1.2.0 (30 min ago, degraded)');

  return testDir;
}

async function testRollbackToPrevious(projectPath: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Rollback to Previous Deployment (v1.1.0)');
  console.log('='.repeat(80));

  const params: RollbackDeploymentParams = {
    projectPath,
    environment: 'staging',
    reason: 'Testing rollback to previous stable version',
    preserveData: true,
    force: false,
  };

  console.log('\n📋 Parameters:');
  console.log(JSON.stringify(params, null, 2));

  const result = await rollbackDeployment(params);

  console.log('\n📊 Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ TEST 1 PASSED');
    console.log(`   - Rolled back to: ${result.rolledBackTo.version}`);
    console.log(`   - Services rolled back: ${result.summary.servicesRolledBack}`);
    console.log(`   - Duration: ${result.summary.duration}ms`);
    console.log(`   - Data preserved: ${result.summary.dataPreserved}`);
    console.log(`   - Health checks passed: ${result.validation.healthChecks}`);
    console.log(`   - Services running: ${result.validation.servicesRunning}`);

    // Verify snapshot was created
    const snapshotPath = path.join(projectPath, '.deployments', 'rollback-snapshots', result.rollbackId);
    try {
      await fs.access(snapshotPath);
      console.log(`   - Snapshot created: ${snapshotPath}`);
    } catch {
      console.log('   ⚠️ Warning: Snapshot directory not found');
    }
  } else {
    console.log('\n❌ TEST 1 FAILED');
    console.log(`   Errors: ${result.warnings.join(', ')}`);
  }
}

async function testRollbackToSpecificDeployment(projectPath: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Rollback to Specific Deployment (v1.0.0)');
  console.log('='.repeat(80));

  const params: RollbackDeploymentParams = {
    projectPath,
    environment: 'staging',
    deploymentId: 'deploy-001',
    reason: 'Rolling back to known stable baseline version',
    preserveData: false, // Don\'t preserve data this time
    force: false,
  };

  console.log('\n📋 Parameters:');
  console.log(JSON.stringify(params, null, 2));

  const result = await rollbackDeployment(params);

  console.log('\n📊 Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ TEST 2 PASSED');
    console.log(`   - Rolled back to: ${result.rolledBackTo.version}`);
    console.log(`   - Deployment ID: ${result.rolledBackTo.deploymentId}`);
    console.log(`   - Data preserved: ${result.summary.dataPreserved}`);
  } else {
    console.log('\n❌ TEST 2 FAILED');
    console.log(`   Errors: ${result.warnings.join(', ')}`);
  }
}

async function testRollbackWithWarnings(projectPath: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Rollback with Safety Warnings (Major Version Change)');
  console.log('='.repeat(80));

  // Modify registry to create a major version jump
  const registryPath = path.join(projectPath, '.deployments', 'deployment-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  // Add a v2.0.0 deployment
  registry.deployments.push({
    id: 'deploy-004',
    environment: 'staging',
    strategy: 'rolling',
    version: 'v2.0.0',
    timestamp: new Date().toISOString(),
    status: 'success',
    duration: 200000,
    servicesDeployed: ['api', 'web', 'worker'],
    healthStatus: 'healthy',
    rollbackAvailable: true,
  });

  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

  const params: RollbackDeploymentParams = {
    projectPath,
    environment: 'staging',
    deploymentId: 'deploy-001', // v1.0.0 - major version jump from v2.0.0
    reason: 'Testing rollback with major version change',
    preserveData: true,
    force: false, // Allow warnings but don't force
  };

  console.log('\n📋 Parameters:');
  console.log(JSON.stringify(params, null, 2));

  const result = await rollbackDeployment(params);

  console.log('\n📊 Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ TEST 3 PASSED');
    console.log(`   - Rolled back successfully despite warnings`);
    console.log(`   - Warnings: ${result.warnings.length}`);
    if (result.warnings.length > 0) {
      console.log('   - Warning messages:');
      result.warnings.forEach(w => console.log(`     • ${w}`));
    }
  } else {
    console.log('\n❌ TEST 3 FAILED');
    console.log(`   Errors: ${result.warnings.join(', ')}`);
  }
}

async function inspectRegistry(projectPath: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL REGISTRY STATE');
  console.log('='.repeat(80));

  const registryPath = path.join(projectPath, '.deployments', 'deployment-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  console.log('\n📋 Deployment History:');
  registry.deployments.forEach((d: any, i: number) => {
    console.log(`\n${i + 1}. ${d.id} (${d.version})`);
    console.log(`   Environment: ${d.environment}`);
    console.log(`   Strategy: ${d.strategy}`);
    console.log(`   Status: ${d.status}`);
    console.log(`   Health: ${d.healthStatus}`);
    console.log(`   Timestamp: ${d.timestamp}`);
    if (d.strategy === 'rollback') {
      console.log('   🔄 This is a rollback record');
    }
  });

  // Count rollbacks
  const rollbacks = registry.deployments.filter((d: any) => d.strategy === 'rollback');
  console.log(`\n📊 Summary:`);
  console.log(`   Total deployments: ${registry.deployments.length}`);
  console.log(`   Rollback operations: ${rollbacks.length}`);
}

async function cleanup(projectPath: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('CLEANUP');
  console.log('='.repeat(80));

  console.log(`\n🧹 Cleaning up test directory: ${projectPath}`);

  try {
    await fs.rm(projectPath, { recursive: true, force: true });
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️ Warning: Could not clean up test directory');
    console.log(`   You may need to manually delete: ${projectPath}`);
  }
}

async function main() {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'ROLLBACK DEPLOYMENT MANUAL TEST' + ' '.repeat(25) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  let projectPath: string | null = null;

  try {
    // Setup test project
    projectPath = await setupTestProject();

    // Run tests
    await testRollbackToPrevious(projectPath);
    await testRollbackToSpecificDeployment(projectPath);
    await testRollbackWithWarnings(projectPath);

    // Inspect final state
    await inspectRegistry(projectPath);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
  } catch (error) {
    console.error('\n' + '═'.repeat(80));
    console.error('❌ TEST SUITE FAILED');
    console.error('═'.repeat(80));
    console.error('\nError:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (projectPath) {
      await cleanup(projectPath);
    }
  }
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
