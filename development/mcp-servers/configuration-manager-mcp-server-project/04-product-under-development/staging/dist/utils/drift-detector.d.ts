/**
 * Drift Detector - Detect configuration differences across environments
 * Identifies and classifies configuration drift
 */
import { DriftItem, DriftSummary } from '../types.js';
/**
 * Detect drift in environment configurations
 */
export declare function detectEnvironmentDrift(projectPath: string, environments: string[], ignoreKeys?: string[]): Promise<{
    drifts: DriftItem[];
    summary: DriftSummary;
}>;
/**
 * Generate text report for drift
 */
export declare function generateDriftReport(environments: string[], drifts: DriftItem[], summary: DriftSummary): string;
/**
 * Generate HTML report for drift
 */
export declare function generateDriftReportHTML(environments: string[], drifts: DriftItem[], summary: DriftSummary): string;
//# sourceMappingURL=drift-detector.d.ts.map