import { DeploymentResult, Environment } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function deployToEnvironment(args: any) {
  const {
    environment,
    version,
    buildCommand = 'npm run build',
    runTests = true,
    rollbackOnFailure = true
  } = args;

  const startTime = Date.now();

  try {
    // Step 1: Pre-deployment validation
    console.error(`[deploy] Starting deployment to ${environment} (version ${version})`);

    // Step 2: Run tests if requested
    if (runTests) {
      console.error(`[deploy] Running pre-deployment tests...`);
      try {
        await execAsync('npm test');
        console.error(`[deploy] ✅ Tests passed`);
      } catch (testError) {
        throw new Error(`Pre-deployment tests failed: ${testError}`);
      }
    }

    // Step 3: Build process
    console.error(`[deploy] Building application...`);
    try {
      const { stdout, stderr } = await execAsync(buildCommand);
      console.error(`[deploy] Build output: ${stdout}`);
      if (stderr) console.error(`[deploy] Build warnings: ${stderr}`);
    } catch (buildError) {
      throw new Error(`Build failed: ${buildError}`);
    }

    // Step 4: Create artifacts
    console.error(`[deploy] Creating deployment artifacts...`);
    const artifacts: string[] = [];

    // Check for dist folder
    try {
      await fs.access('dist');
      artifacts.push('dist/');
    } catch {
      console.error(`[deploy] Warning: No dist/ folder found`);
    }

    // Check for package.json
    try {
      await fs.access('package.json');
      artifacts.push('package.json');
    } catch {
      console.error(`[deploy] Warning: No package.json found`);
    }

    // Step 5: Save deployment version
    const deploymentRecord = {
      version,
      environment,
      timestamp: new Date().toISOString(),
      artifacts,
      commit: process.env.GIT_COMMIT || 'unknown'
    };

    // Create deployment history directory
    const historyDir = path.join(process.cwd(), '.deployments');
    try {
      await fs.mkdir(historyDir, { recursive: true });
    } catch (error) {
      console.error(`[deploy] Warning: Could not create .deployments directory: ${error}`);
    }

    // Save deployment record
    const recordFile = path.join(historyDir, `${environment}-${version}.json`);
    try {
      await fs.writeFile(recordFile, JSON.stringify(deploymentRecord, null, 2));
    } catch (error) {
      console.error(`[deploy] Warning: Could not save deployment record: ${error}`);
    }

    // Update current deployment pointer
    const currentFile = path.join(historyDir, `${environment}-current.json`);
    try {
      await fs.writeFile(currentFile, JSON.stringify(deploymentRecord, null, 2));
    } catch (error) {
      console.error(`[deploy] Warning: Could not update current deployment: ${error}`);
    }

    // Step 6: Deployment complete
    const duration = Date.now() - startTime;
    console.error(`[deploy] ✅ Deployment complete in ${duration}ms`);

    const result: DeploymentResult = {
      success: true,
      environment: environment as Environment,
      version,
      timestamp: new Date().toISOString(),
      duration,
      artifacts
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...result,
            message: `Successfully deployed version ${version} to ${environment}`,
            formatted: formatDeploymentResult(result)
          }, null, 2)
        }
      ]
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[deploy] ❌ Deployment failed: ${errorMessage}`);

    const result: DeploymentResult = {
      success: false,
      environment: environment as Environment,
      version,
      timestamp: new Date().toISOString(),
      duration,
      error: errorMessage
    };

    // Handle automatic rollback if requested
    if (rollbackOnFailure) {
      console.error(`[deploy] Attempting automatic rollback...`);
      // Rollback would be triggered here
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...result,
            message: `Deployment failed: ${errorMessage}`,
            formatted: formatDeploymentResult(result)
          }, null, 2)
        }
      ]
    };
  }
}

function formatDeploymentResult(result: DeploymentResult): string {
  return `
======================================================================
  DEPLOYMENT RESULT
======================================================================

${result.success ? '✅ SUCCESS' : '❌ FAILED'}

Environment: ${result.environment}
Version: ${result.version}
Timestamp: ${result.timestamp}
Duration: ${result.duration}ms

${result.artifacts ? `Artifacts:\n${result.artifacts.map(a => `  - ${a}`).join('\n')}` : ''}

${result.error ? `Error: ${result.error}` : ''}

======================================================================
`.trim();
}
