import { DeploymentManager } from "../deployment/deploymentManager.js";
import { PreChecksManager } from "../deployment/preChecks.js";
import { standardsValidator } from "../utils/standards-validator-client.js";
export async function deployApplication(params) {
    const { projectPath, environment, target, strategy = "rolling", preChecks = true, dryRun = false, config, } = params;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const warnings = [];
    try {
        // Initialize deployment manager
        const deploymentManager = new DeploymentManager(projectPath);
        await deploymentManager.initialize();
        // Generate deployment ID
        const deploymentId = deploymentManager.generateDeploymentId();
        // ============================================
        // STANDARDS ENFORCEMENT GATE
        // ============================================
        if (!dryRun) {
            const mcpName = target || extractMcpNameFromPath(projectPath);
            try {
                console.log(`\n🔍 Running pre-deployment compliance check for ${mcpName}...`);
                // Environment-specific validation
                const validationOptions = getValidationOptionsForEnvironment(environment, mcpName);
                // Run validation
                const result = await standardsValidator.validateMcpCompliance(validationOptions);
                // Production: Strict enforcement
                if (environment === 'production') {
                    if (!result.compliant) {
                        warnings.push(`🛑 DEPLOYMENT BLOCKED TO PRODUCTION\n` +
                            `MCP: ${mcpName}\n` +
                            `Compliance Score: ${result.summary.complianceScore}/100\n` +
                            `Critical Violations: ${result.summary.criticalViolations}\n` +
                            `Warnings: ${result.summary.warningViolations}\n\n` +
                            `Production deployments require:\n` +
                            `  ✓ Compliance score ≥ 90\n` +
                            `  ✓ Zero critical violations\n` +
                            `  ✓ All security checks passed\n\n` +
                            `Fix violations and re-run deployment.`);
                        throw new Error(`Production deployment blocked: ${result.summary.criticalViolations} critical violations`);
                    }
                    // Additional production check: minimum score
                    if (result.summary.complianceScore < 90) {
                        warnings.push(`🛑 DEPLOYMENT BLOCKED: Compliance score ${result.summary.complianceScore}/100 is below production threshold (90)`);
                        throw new Error(`Compliance score ${result.summary.complianceScore}/100 below production threshold (90)`);
                    }
                    console.log(`✅ Production compliance check passed (Score: ${result.summary.complianceScore}/100)`);
                }
                // Staging: Warn but allow
                else if (environment === 'staging') {
                    if (!result.compliant) {
                        const warning = `\n⚠️  COMPLIANCE WARNINGS FOR STAGING DEPLOYMENT:\n` +
                            `Compliance Score: ${result.summary.complianceScore}/100\n` +
                            `Critical: ${result.summary.criticalViolations}, Warnings: ${result.summary.warningViolations}\n` +
                            `\nDeployment proceeding, but fix violations before promoting to production.\n`;
                        console.warn(warning);
                        warnings.push(warning);
                    }
                    else {
                        console.log(`✅ Staging compliance check passed (Score: ${result.summary.complianceScore}/100)`);
                    }
                }
                // Dev: Info only
                else {
                    console.log(`ℹ️  Dev compliance score: ${result.summary.complianceScore}/100 ` +
                        `(${result.summary.criticalViolations} critical, ${result.summary.warningViolations} warnings)`);
                }
            }
            catch (error) {
                if (environment === 'production') {
                    // Block production on any validation error
                    throw error;
                }
                else {
                    // Log but continue for non-production
                    const warning = `⚠️  Compliance check failed: ${error.message}`;
                    console.warn(warning);
                    console.warn(`Proceeding with ${environment} deployment...`);
                    warnings.push(warning);
                }
            }
        }
        // ============================================
        // EXISTING PRE-DEPLOYMENT CHECKS
        // ============================================
        // Run pre-deployment checks if enabled
        let preChecksPassed = 0;
        let preChecksFailed = 0;
        if (preChecks) {
            const preChecksManager = new PreChecksManager(projectPath);
            const preCheckResults = await preChecksManager.runAllChecks({
                codeQuality: true,
                tests: true,
                security: true,
            });
            // Count results
            preChecksPassed = preCheckResults.filter((r) => r.passed).length;
            preChecksFailed = preCheckResults.filter((r) => !r.passed).length;
            // Add warnings for failed checks
            preCheckResults
                .filter((r) => !r.passed)
                .forEach((r) => {
                warnings.push(`Pre-check failed: ${r.name} - ${r.message}`);
            });
            // Fail deployment if critical checks fail (configurable)
            if (preChecksFailed > 0 && !dryRun) {
                const failedChecks = preCheckResults.filter((r) => !r.passed);
                const criticalFailed = failedChecks.some((c) => c.name === "Security" || c.name === "Tests");
                if (criticalFailed) {
                    const deploymentStatus = "failed";
                    const deploymentRecord = {
                        id: deploymentId,
                        environment,
                        strategy,
                        version: "unknown",
                        timestamp,
                        status: deploymentStatus,
                        duration: Date.now() - startTime,
                        servicesDeployed: [],
                        healthStatus: "unhealthy",
                        rollbackAvailable: false,
                    };
                    await deploymentManager.updateRegistry(deploymentRecord);
                    return {
                        success: false,
                        deploymentId,
                        environment,
                        timestamp,
                        summary: {
                            servicesDeployed: 0,
                            duration: Date.now() - startTime,
                            strategy,
                            previousVersion: "unknown",
                            newVersion: "unknown",
                        },
                        preChecks: {
                            passed: preChecksPassed,
                            failed: preChecksFailed,
                            warnings,
                        },
                        deploymentLog: "",
                        rollbackAvailable: false,
                    };
                }
            }
        }
        // Perform deployment
        const deploymentResult = await deploymentManager.deploy(environment, strategy, target, config, dryRun);
        // Get previous deployment for rollback availability
        const previousDeployment = await deploymentManager.getLastDeployment(environment);
        const rollbackAvailable = previousDeployment !== null && deploymentResult.success;
        // Update deployment registry
        const deploymentStatus = deploymentResult.success ? "success" : "failed";
        const deploymentRecord = {
            id: deploymentResult.deploymentId,
            environment,
            strategy,
            version: deploymentResult.version,
            timestamp,
            status: deploymentStatus,
            duration: deploymentResult.duration,
            servicesDeployed: target ? [target] : ["default"],
            healthStatus: deploymentResult.success ? "healthy" : "unhealthy",
            rollbackAvailable,
        };
        await deploymentManager.updateRegistry(deploymentRecord);
        // Build result
        const result = {
            success: deploymentResult.success,
            deploymentId: deploymentResult.deploymentId,
            environment,
            timestamp,
            summary: {
                servicesDeployed: deploymentResult.servicesDeployed,
                duration: deploymentResult.duration,
                strategy,
                previousVersion: deploymentResult.previousVersion,
                newVersion: deploymentResult.version,
            },
            preChecks: {
                passed: preChecksPassed,
                failed: preChecksFailed,
                warnings,
            },
            deploymentLog: deploymentResult.logPath,
            rollbackAvailable,
        };
        // Add errors to warnings if deployment failed
        if (!deploymentResult.success) {
            result.preChecks.warnings.push(...deploymentResult.errors);
        }
        // Add dry-run warning if applicable
        if (dryRun) {
            result.preChecks.warnings.push("DRY-RUN MODE: No actual deployment was performed");
        }
        return result;
    }
    catch (error) {
        // Handle unexpected errors
        const duration = Date.now() - startTime;
        return {
            success: false,
            deploymentId: `error-${Date.now()}`,
            environment,
            timestamp,
            summary: {
                servicesDeployed: 0,
                duration,
                strategy: strategy || "rolling",
                previousVersion: "unknown",
                newVersion: "unknown",
            },
            preChecks: {
                passed: 0,
                failed: 0,
                warnings: [`Deployment error: ${error.message}`],
            },
            deploymentLog: "",
            rollbackAvailable: false,
        };
    }
}
/**
 * Extract MCP name from project path
 */
function extractMcpNameFromPath(projectPath) {
    const match = projectPath.match(/mcp-servers\/([^/]+)/);
    if (match) {
        // Remove '-project' suffix if present
        return match[1].replace(/-project$/, '');
    }
    // Fallback: use last directory name
    const parts = projectPath.split('/');
    return parts[parts.length - 1].replace(/-project$/, '');
}
/**
 * Get validation options based on environment
 */
function getValidationOptionsForEnvironment(environment, mcpName) {
    switch (environment) {
        case 'production':
            // Strictest validation for production
            return {
                mcpName,
                categories: [
                    'security', // Must have no hardcoded secrets
                    'dual-environment', // Must exist in dev+prod
                    'template-first', // Must have template
                    'configuration', // Must have valid config
                ],
                failFast: false, // Check all rules
                includeWarnings: true, // Include all violations
            };
        case 'staging':
            // Moderate validation for staging
            return {
                mcpName,
                categories: [
                    'security',
                    'dual-environment',
                    'configuration',
                ],
                failFast: false,
                includeWarnings: true,
            };
        case 'dev':
            // Minimal validation for dev
            return {
                mcpName,
                categories: ['security'], // Only security checks
                failFast: false,
                includeWarnings: false, // Critical only
            };
        default:
            return {
                mcpName,
                failFast: false,
                includeWarnings: true,
            };
    }
}
//# sourceMappingURL=deployApplication.js.map