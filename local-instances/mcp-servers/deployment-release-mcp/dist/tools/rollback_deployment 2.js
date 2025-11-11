import * as fs from 'fs/promises';
import * as path from 'path';
export async function rollbackDeployment(args) {
    const { environment, toVersion, validateAfter = true } = args;
    try {
        console.error(`[rollback] Starting rollback for ${environment}...`);
        // Step 1: Get current deployment
        const historyDir = path.join(process.cwd(), '.deployments');
        const currentFile = path.join(historyDir, `${environment}-current.json`);
        let currentDeployment;
        try {
            const currentData = await fs.readFile(currentFile, 'utf-8');
            currentDeployment = JSON.parse(currentData);
        }
        catch (error) {
            throw new Error(`No current deployment found for ${environment}`);
        }
        const fromVersion = currentDeployment.version;
        // Step 2: Determine target version
        let targetVersion = toVersion;
        if (!targetVersion) {
            // Find previous version
            const files = await fs.readdir(historyDir);
            const deployments = files
                .filter(f => f.startsWith(`${environment}-`) && f.endsWith('.json') && f !== `${environment}-current.json`)
                .sort()
                .reverse();
            if (deployments.length < 2) {
                throw new Error(`No previous version available for rollback`);
            }
            // Get the second most recent deployment (previous version)
            const previousFile = deployments[1];
            const previousData = await fs.readFile(path.join(historyDir, previousFile), 'utf-8');
            const previousDeployment = JSON.parse(previousData);
            targetVersion = previousDeployment.version;
        }
        console.error(`[rollback] Rolling back from ${fromVersion} to ${targetVersion}`);
        // Step 3: Restore state
        const targetFile = path.join(historyDir, `${environment}-${targetVersion}.json`);
        let targetDeployment;
        try {
            const targetData = await fs.readFile(targetFile, 'utf-8');
            targetDeployment = JSON.parse(targetData);
        }
        catch (error) {
            throw new Error(`Target version ${targetVersion} not found in deployment history`);
        }
        // Step 4: Update current deployment pointer
        await fs.writeFile(currentFile, JSON.stringify(targetDeployment, null, 2));
        // Step 5: Validation (if requested)
        let validationPassed = true;
        if (validateAfter) {
            console.error(`[rollback] Validating rollback...`);
            // Basic validation - check that artifacts exist
            if (targetDeployment.artifacts) {
                for (const artifact of targetDeployment.artifacts) {
                    try {
                        await fs.access(artifact);
                    }
                    catch {
                        console.error(`[rollback] Warning: Artifact ${artifact} not found`);
                        validationPassed = false;
                    }
                }
            }
        }
        console.error(`[rollback] ✅ Rollback complete`);
        const result = {
            success: true,
            environment: environment,
            fromVersion,
            toVersion: targetVersion,
            timestamp: new Date().toISOString(),
            stateRestored: validationPassed
        };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        ...result,
                        message: `Successfully rolled back ${environment} from ${fromVersion} to ${targetVersion}`,
                        formatted: formatRollbackResult(result)
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[rollback] ❌ Rollback failed: ${errorMessage}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        environment,
                        error: errorMessage,
                        message: `Rollback failed: ${errorMessage}`
                    }, null, 2)
                }
            ]
        };
    }
}
function formatRollbackResult(result) {
    return `
======================================================================
  ROLLBACK RESULT
======================================================================

${result.success ? '✅ SUCCESS' : '❌ FAILED'}

Environment: ${result.environment}
From Version: ${result.fromVersion}
To Version: ${result.toVersion}
Timestamp: ${result.timestamp}
State Restored: ${result.stateRestored ? 'Yes' : 'No'}

${result.error ? `Error: ${result.error}` : ''}

======================================================================
`.trim();
}
//# sourceMappingURL=rollback_deployment.js.map