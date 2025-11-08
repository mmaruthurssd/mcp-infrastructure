/**
 * check_config_drift tool
 * Detect configuration differences across environments
 */
import { ConfigurationError, } from '../types.js';
import * as driftDetector from '../utils/drift-detector.js';
export async function checkConfigDrift(params) {
    const { projectPath, environments, configType, ignoreKeys = [], reportFormat } = params;
    try {
        // Currently only supports environment config type
        // Future: Add support for mcp-config and other config types
        if (configType !== 'environment' && configType !== 'all') {
            throw new ConfigurationError('UNSUPPORTED_CONFIG_TYPE', `Config type "${configType}" not yet supported. Use "environment" for now.`);
        }
        // Detect drift
        const { drifts, summary } = await driftDetector.detectEnvironmentDrift(projectPath, environments, ignoreKeys);
        // Generate report if requested
        let report;
        if (reportFormat === 'text') {
            report = driftDetector.generateDriftReport(environments, drifts, summary);
        }
        else if (reportFormat === 'json') {
            report = JSON.stringify({ environments, drifts, summary }, null, 2);
        }
        else if (reportFormat === 'html') {
            report = driftDetector.generateDriftReportHTML(environments, drifts, summary);
        }
        return {
            success: true,
            hasDrift: drifts.length > 0,
            environments,
            drifts,
            summary,
            report,
        };
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            return {
                success: false,
                hasDrift: false,
                environments,
                drifts: [],
                summary: {
                    totalKeys: 0,
                    driftingKeys: 0,
                    criticalDrifts: 0,
                    warningDrifts: 0,
                    environmentsParity: 0,
                },
                report: `Error: ${error.message}`,
            };
        }
        return {
            success: false,
            hasDrift: false,
            environments,
            drifts: [],
            summary: {
                totalKeys: 0,
                driftingKeys: 0,
                criticalDrifts: 0,
                warningDrifts: 0,
                environmentsParity: 0,
            },
            report: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
//# sourceMappingURL=check-config-drift.js.map