/**
 * Drift Detector - Detect configuration differences across environments
 * Identifies and classifies configuration drift
 */

import { DriftItem, DriftSeverity, DriftSummary, ConfigurationError } from '../types.js';
import * as environmentLoader from './environment-loader.js';

/**
 * Keys that are expected to differ across environments
 */
const EXPECTED_DRIFT_PATTERNS = [
  /^.*_URL$/,           // Database URLs, API URLs
  /^.*_ENDPOINT$/,      // API endpoints
  /^.*_HOST$/,          // Hostnames
  /^NODE_ENV$/,         // Environment name
  /^PORT$/,             // Ports may differ
];

/**
 * Keys that should be identical (critical drift if different)
 */
const CRITICAL_SYNC_PATTERNS = [
  /^.*_VERSION$/,       // API/library versions
  /^FEATURE_.*$/,       // Feature flags (should be consistent)
];

/**
 * Check if key matches any pattern in list
 */
function matchesAnyPattern(key: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(key));
}

/**
 * Classify drift severity
 */
function classifyDriftSeverity(
  key: string,
  values: Record<string, string>,
  environments: string[]
): DriftSeverity {
  // Check if production is missing this key
  if (environments.includes('production') && !values.production) {
    return 'critical';
  }

  // Check if it's a critical sync key (versions, feature flags)
  if (matchesAnyPattern(key, CRITICAL_SYNC_PATTERNS)) {
    return 'critical';
  }

  // Check if it's expected to differ (URLs, endpoints)
  if (matchesAnyPattern(key, EXPECTED_DRIFT_PATTERNS)) {
    return 'info';
  }

  // Default: warning (might be intentional, but worth reviewing)
  return 'warning';
}

/**
 * Generate recommendation for drift
 */
function generateRecommendation(
  key: string,
  values: Record<string, string>,
  severity: DriftSeverity
): string {
  switch (severity) {
    case 'critical':
      if (!values.production) {
        return `Add ${key} to production environment immediately`;
      }
      return `Sync ${key} across all environments - inconsistency may cause issues`;

    case 'warning':
      return `Review ${key} - ensure different values are intentional`;

    case 'info':
      return `Expected drift for ${key} - verify values are correct for each environment`;

    default:
      return `Review configuration for ${key}`;
  }
}

/**
 * Detect drift in environment configurations
 */
export async function detectEnvironmentDrift(
  projectPath: string,
  environments: string[],
  ignoreKeys: string[] = []
): Promise<{ drifts: DriftItem[]; summary: DriftSummary }> {
  // Load all environment configurations
  const envConfigs: Record<string, Record<string, string>> = {};

  for (const env of environments) {
    try {
      const result = await environmentLoader.loadEnvironmentVars(
        env as any,
        projectPath,
        undefined,
        false
      );
      envConfigs[env] = result.variables;
    } catch (error) {
      throw new ConfigurationError(
        'LOAD_ENV_FAILED',
        `Failed to load environment: ${env}`,
        { environment: env }
      );
    }
  }

  // Collect all unique keys across environments
  const allKeys = new Set<string>();
  for (const vars of Object.values(envConfigs)) {
    Object.keys(vars).forEach((key) => allKeys.add(key));
  }

  // Filter out ignored keys
  const keysToCheck = Array.from(allKeys).filter((key) => !ignoreKeys.includes(key));

  // Detect drifts
  const drifts: DriftItem[] = [];

  for (const key of keysToCheck) {
    const values: Record<string, string> = {};
    let hasDrift = false;

    // Collect values from each environment
    for (const env of environments) {
      if (key in envConfigs[env]) {
        values[env] = envConfigs[env][key];
      }
    }

    // Check if values differ
    const uniqueValues = new Set(Object.values(values));
    hasDrift = uniqueValues.size > 1 || Object.keys(values).length !== environments.length;

    if (hasDrift) {
      const severity = classifyDriftSeverity(key, values, environments);
      const recommendation = generateRecommendation(key, values, severity);

      drifts.push({
        key,
        values,
        severity,
        recommendation,
      });
    }
  }

  // Calculate summary
  const summary: DriftSummary = {
    totalKeys: keysToCheck.length,
    driftingKeys: drifts.length,
    criticalDrifts: drifts.filter((d) => d.severity === 'critical').length,
    warningDrifts: drifts.filter((d) => d.severity === 'warning').length,
    environmentsParity: Math.round(
      ((keysToCheck.length - drifts.length) / keysToCheck.length) * 100
    ),
  };

  // Sort drifts by severity (critical first)
  drifts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return { drifts, summary };
}

/**
 * Generate text report for drift
 */
export function generateDriftReport(
  environments: string[],
  drifts: DriftItem[],
  summary: DriftSummary
): string {
  let report = `Configuration Drift Report\n`;
  report += `${'='.repeat(70)}\n\n`;

  report += `Environments: ${environments.join(', ')}\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `Summary:\n`;
  report += `${'-'.repeat(70)}\n`;
  report += `  Total Keys: ${summary.totalKeys}\n`;
  report += `  Drifting Keys: ${summary.driftingKeys}\n`;
  report += `  Critical Drifts: ${summary.criticalDrifts}\n`;
  report += `  Warning Drifts: ${summary.warningDrifts}\n`;
  report += `  Environments Parity: ${summary.environmentsParity}%\n\n`;

  if (drifts.length === 0) {
    report += `✓ No configuration drift detected\n`;
    return report;
  }

  // Group by severity
  const critical = drifts.filter((d) => d.severity === 'critical');
  const warnings = drifts.filter((d) => d.severity === 'warning');
  const info = drifts.filter((d) => d.severity === 'info');

  if (critical.length > 0) {
    report += `Critical Drifts (${critical.length}):\n`;
    report += `${'='.repeat(70)}\n`;
    for (const drift of critical) {
      report += `\n  Key: ${drift.key}\n`;
      report += `  Values:\n`;
      for (const [env, value] of Object.entries(drift.values)) {
        report += `    ${env}: ${value}\n`;
      }
      report += `  Recommendation: ${drift.recommendation}\n`;
    }
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `Warnings (${warnings.length}):\n`;
    report += `${'-'.repeat(70)}\n`;
    for (const drift of warnings) {
      report += `\n  Key: ${drift.key}\n`;
      report += `  Values:\n`;
      for (const [env, value] of Object.entries(drift.values)) {
        report += `    ${env}: ${value}\n`;
      }
      report += `  Recommendation: ${drift.recommendation}\n`;
    }
    report += `\n`;
  }

  if (info.length > 0) {
    report += `Info (${info.length}):\n`;
    report += `${'-'.repeat(70)}\n`;
    for (const drift of info) {
      report += `\n  Key: ${drift.key}\n`;
      report += `  Values: ${Object.entries(drift.values)
        .map(([env, val]) => `${env}=${val}`)
        .join(', ')}\n`;
    }
  }

  return report;
}

/**
 * Generate HTML report for drift
 */
export function generateDriftReportHTML(
  environments: string[],
  drifts: DriftItem[],
  summary: DriftSummary
): string {
  const severityColors = {
    critical: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  };

  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Configuration Drift Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .drift { border-left: 4px solid; padding: 10px; margin: 10px 0; }
    .critical { border-color: ${severityColors.critical}; background: #f8d7da; }
    .warning { border-color: ${severityColors.warning}; background: #fff3cd; }
    .info { border-color: ${severityColors.info}; background: #d1ecf1; }
    .key { font-weight: bold; }
    .values { margin: 5px 0; }
    .recommendation { font-style: italic; color: #666; }
  </style>
</head>
<body>
  <h1>Configuration Drift Report</h1>
  <p><strong>Environments:</strong> ${environments.join(', ')}</p>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Keys:</strong> ${summary.totalKeys}</p>
    <p><strong>Drifting Keys:</strong> ${summary.driftingKeys}</p>
    <p><strong>Critical Drifts:</strong> ${summary.criticalDrifts}</p>
    <p><strong>Warning Drifts:</strong> ${summary.warningDrifts}</p>
    <p><strong>Environments Parity:</strong> ${summary.environmentsParity}%</p>
  </div>

  <h2>Drifts</h2>`;

  for (const drift of drifts) {
    html += `
  <div class="drift ${drift.severity}">
    <div class="key">${drift.key}</div>
    <div class="values">`;

    for (const [env, value] of Object.entries(drift.values)) {
      html += `<div><strong>${env}:</strong> ${value}</div>`;
    }

    html += `</div>
    <div class="recommendation">${drift.recommendation}</div>
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
}
