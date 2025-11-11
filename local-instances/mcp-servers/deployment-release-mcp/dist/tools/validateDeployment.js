import { runServiceHealthChecks } from "../validation/healthChecks.js";
import { runFunctionalValidation } from "../validation/smokeTests.js";
import { runPerformanceValidation } from "../validation/performanceChecks.js";
import { runDataValidation } from "../validation/dataValidation.js";
import { runIntegrationValidation } from "../validation/integrationTests.js";
import { promises as fs } from "fs";
import * as path from "path";
const DEFAULT_TIMEOUT = 300000; // 300 seconds (5 minutes)
/**
 * Load deployment configuration for validation
 */
async function loadDeploymentConfig(projectPath, environment) {
    try {
        const configPath = path.join(projectPath, 'deployment-config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        return config[environment] || config.default || {};
    }
    catch (error) {
        // Config file might not exist, use defaults
        return {};
    }
}
/**
 * Determine which checks to run based on params
 */
function getChecksToRun(requestedChecks) {
    const allChecks = new Set([
        'service-health',
        'functional',
        'performance',
        'data',
        'integration',
    ]);
    if (!requestedChecks || requestedChecks.length === 0 || requestedChecks.includes('all')) {
        return allChecks;
    }
    return new Set(requestedChecks.filter(check => allChecks.has(check)));
}
/**
 * Calculate overall health status from validation checks
 */
function calculateOverallHealth(checks) {
    const failed = checks.filter(c => c.status === 'failed').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const total = checks.length;
    if (total === 0) {
        return 'degraded';
    }
    // If more than 20% failed, system is unhealthy
    if (failed > total * 0.2) {
        return 'unhealthy';
    }
    // If any critical checks failed (service-health or data), system is unhealthy
    const criticalFailed = checks.some(c => c.status === 'failed' && (c.category === 'service-health' || c.category === 'data'));
    if (criticalFailed) {
        return 'unhealthy';
    }
    // If more than 30% have warnings or failures, system is degraded
    if ((failed + warnings) > total * 0.3) {
        return 'degraded';
    }
    // If any failures or significant warnings exist, system is degraded
    if (failed > 0 || warnings > total * 0.2) {
        return 'degraded';
    }
    return 'healthy';
}
/**
 * Determine recommendation based on validation results
 */
function determineRecommendation(overallHealth, checks) {
    if (overallHealth === 'unhealthy') {
        return 'rollback';
    }
    const failed = checks.filter(c => c.status === 'failed');
    const criticalFailed = failed.filter(c => c.category === 'service-health' || c.category === 'data');
    if (criticalFailed.length > 0) {
        return 'rollback';
    }
    if (overallHealth === 'degraded') {
        return 'monitor';
    }
    const warnings = checks.filter(c => c.status === 'warning');
    if (warnings.length > checks.length * 0.1) {
        return 'monitor';
    }
    return 'proceed';
}
/**
 * Generate detailed validation summary
 */
function generateValidationDetails(checks, overallHealth, recommendation) {
    const details = [];
    details.push(`Overall Health: ${overallHealth.toUpperCase()}`);
    details.push(`Recommendation: ${recommendation.toUpperCase()}`);
    details.push('');
    // Group checks by category
    const categories = new Map();
    for (const check of checks) {
        if (!categories.has(check.category)) {
            categories.set(check.category, []);
        }
        categories.get(check.category).push(check);
    }
    // Report by category
    for (const [category, categoryChecks] of categories) {
        const passed = categoryChecks.filter(c => c.status === 'passed').length;
        const failed = categoryChecks.filter(c => c.status === 'failed').length;
        const warnings = categoryChecks.filter(c => c.status === 'warning').length;
        details.push(`${category.toUpperCase()}: ${passed} passed, ${failed} failed, ${warnings} warnings`);
        // List failed checks
        if (failed > 0) {
            details.push('  Failed:');
            categoryChecks
                .filter(c => c.status === 'failed')
                .forEach(c => details.push(`    - ${c.name}: ${c.message}`));
        }
        // List warnings
        if (warnings > 0) {
            details.push('  Warnings:');
            categoryChecks
                .filter(c => c.status === 'warning')
                .forEach(c => details.push(`    - ${c.name}: ${c.message}`));
        }
        details.push('');
    }
    // Add recommendations based on results
    if (recommendation === 'rollback') {
        details.push('CRITICAL: Immediate rollback recommended due to failed health checks.');
        details.push('Failed checks indicate system instability or data issues.');
    }
    else if (recommendation === 'monitor') {
        details.push('WARNING: Continue monitoring deployment closely.');
        details.push('Some checks have warnings or non-critical failures.');
    }
    else {
        details.push('SUCCESS: All critical checks passed. Deployment is healthy.');
    }
    return details.join('\n');
}
/**
 * Main validation function
 */
export async function validateDeployment(params) {
    const { projectPath, environment, deploymentId, checks: requestedChecks, timeout = DEFAULT_TIMEOUT, } = params;
    const startTime = Date.now();
    const checksToRun = getChecksToRun(requestedChecks);
    const allChecks = [];
    try {
        // Load deployment configuration
        const config = await loadDeploymentConfig(projectPath, environment);
        // Run service health checks
        if (checksToRun.has('service-health')) {
            const healthChecks = await runServiceHealthChecks(projectPath, {
                processNames: config.processNames || ['node'],
                healthEndpoints: config.healthEndpoints || [],
                timeout: Math.min(timeout / 5, 10000),
            });
            allChecks.push(...healthChecks);
        }
        // Run functional validation
        if (checksToRun.has('functional')) {
            const functionalChecks = await runFunctionalValidation({
                apiEndpoints: config.apiEndpoints || [],
                criticalWorkflows: config.criticalWorkflows || [],
                timeout: Math.min(timeout / 5, 10000),
            });
            allChecks.push(...functionalChecks);
        }
        // Run performance validation
        if (checksToRun.has('performance')) {
            const performanceChecks = await runPerformanceValidation({
                endpoints: config.apiEndpoints || [],
                thresholds: {
                    maxResponseTime: config.maxResponseTime || 1000,
                    maxCpuUsage: config.maxCpuUsage || 80,
                    maxMemoryUsage: config.maxMemoryUsage || 85,
                },
                timeout: Math.min(timeout / 5, 10000),
            });
            allChecks.push(...performanceChecks);
        }
        // Run data validation
        if (checksToRun.has('data')) {
            const dataChecks = await runDataValidation(projectPath, {
                databaseConnections: config.databaseConnections || [],
                migrationPaths: config.migrationPaths || ['migrations'],
                timeout: Math.min(timeout / 5, 10000),
            });
            allChecks.push(...dataChecks);
        }
        // Run integration validation
        if (checksToRun.has('integration')) {
            const integrationChecks = await runIntegrationValidation({
                externalServices: config.externalServices || [],
                apiIntegrations: config.apiIntegrations || [],
                timeout: Math.min(timeout / 5, 10000),
            });
            allChecks.push(...integrationChecks);
        }
        // Calculate results
        const overallHealth = calculateOverallHealth(allChecks);
        const recommendation = determineRecommendation(overallHealth, allChecks);
        const summary = {
            totalChecks: allChecks.length,
            passed: allChecks.filter(c => c.status === 'passed').length,
            failed: allChecks.filter(c => c.status === 'failed').length,
            warnings: allChecks.filter(c => c.status === 'warning').length,
        };
        const details = generateValidationDetails(allChecks, overallHealth, recommendation);
        const totalDuration = Date.now() - startTime;
        return {
            success: overallHealth !== 'unhealthy' && summary.failed === 0,
            overallHealth,
            timestamp: new Date().toISOString(),
            checks: allChecks,
            summary,
            recommendation,
            details,
        };
    }
    catch (error) {
        // If validation itself fails, return unhealthy status
        const totalDuration = Date.now() - startTime;
        return {
            success: false,
            overallHealth: 'unhealthy',
            timestamp: new Date().toISOString(),
            checks: [
                {
                    name: 'Validation Process',
                    category: 'service-health',
                    status: 'failed',
                    message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
                    duration: totalDuration,
                },
            ],
            summary: {
                totalChecks: 1,
                passed: 0,
                failed: 1,
                warnings: 0,
            },
            recommendation: 'rollback',
            details: `CRITICAL: Validation process failed.\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nRecommendation: Investigate validation failure and consider rollback.`,
        };
    }
}
//# sourceMappingURL=validateDeployment.js.map