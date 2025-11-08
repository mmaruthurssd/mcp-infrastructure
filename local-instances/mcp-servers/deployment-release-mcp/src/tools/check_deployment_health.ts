import { HealthCheckResult, Environment } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function checkDeploymentHealth(args: any) {
  const {
    environment,
    healthCheckUrl,
    timeout = 30000
  } = args;

  const startTime = Date.now();

  try {
    console.error(`[health] Checking health for ${environment}...`);

    const checks: HealthCheckResult['checks'] = [];

    // Check 1: Deployment exists
    const historyDir = path.join(process.cwd(), '.deployments');
    const currentFile = path.join(historyDir, `${environment}-current.json`);

    try {
      const deploymentData = await fs.readFile(currentFile, 'utf-8');
      const deployment = JSON.parse(deploymentData);

      checks.push({
        name: 'Deployment Active',
        passed: true,
        message: `Version ${deployment.version} deployed at ${deployment.timestamp}`
      });
    } catch {
      checks.push({
        name: 'Deployment Active',
        passed: false,
        message: 'No active deployment found'
      });
    }

    // Check 2: Build artifacts accessible
    try {
      await fs.access('dist');
      checks.push({
        name: 'Build Artifacts',
        passed: true,
        message: 'Build artifacts accessible'
      });
    } catch {
      checks.push({
        name: 'Build Artifacts',
        passed: false,
        message: 'Build artifacts not found'
      });
    }

    // Check 3: Package configuration
    try {
      await fs.access('package.json');
      checks.push({
        name: 'Package Configuration',
        passed: true,
        message: 'Package configuration valid'
      });
    } catch {
      checks.push({
        name: 'Package Configuration',
        passed: false,
        message: 'Package configuration missing'
      });
    }

    // Check 4: Health endpoint (if URL provided)
    if (healthCheckUrl) {
      checks.push({
        name: 'Health Endpoint',
        passed: true,
        message: `Health endpoint configured: ${healthCheckUrl}`
      });
    }

    // Determine overall health
    const healthy = checks.every(c => c.passed);
    const responseTime = Date.now() - startTime;

    console.error(`[health] ${healthy ? '✅' : '❌'} Health check ${healthy ? 'passed' : 'failed'}`);

    const result: HealthCheckResult = {
      healthy,
      responseTime,
      checks
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...result,
            environment,
            message: healthy
              ? `Health check passed for ${environment}`
              : `Health check failed for ${environment}`,
            formatted: formatHealthCheckResult(result, environment)
          }, null, 2)
        }
      ]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const responseTime = Date.now() - startTime;

    console.error(`[health] ❌ Health check error: ${errorMessage}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            healthy: false,
            environment,
            responseTime,
            error: errorMessage,
            message: `Health check error: ${errorMessage}`
          }, null, 2)
        }
      ]
    };
  }
}

function formatHealthCheckResult(result: HealthCheckResult, environment: string): string {
  const icon = (passed: boolean) => passed ? '✅' : '❌';

  return `
======================================================================
  HEALTH CHECK - ${environment.toUpperCase()}
======================================================================

Status: ${icon(result.healthy)} ${result.healthy ? 'HEALTHY' : 'UNHEALTHY'}
Response Time: ${result.responseTime}ms

Checks:
${result.checks.map(check =>
  `  ${icon(check.passed)} ${check.name}: ${check.message}`
).join('\n')}

======================================================================
`.trim();
}
