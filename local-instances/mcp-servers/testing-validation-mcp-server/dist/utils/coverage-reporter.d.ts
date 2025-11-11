/**
 * CoverageReporter Utility
 *
 * Generates detailed test coverage reports in multiple formats (text, HTML, JSON).
 * Provides file-level coverage analysis with uncovered line identification.
 */
import type { GenerateCoverageReportOutput } from '../types.js';
export type ReportFormat = 'text' | 'html' | 'json';
export declare class CoverageReporter {
    private mcpPath;
    private format;
    constructor(mcpPath: string, format?: ReportFormat);
    /**
     * Generate coverage report
     */
    generate(outputPath?: string): Promise<GenerateCoverageReportOutput>;
    /**
     * Parse coverage data from coverage-final.json
     */
    private parseCoverage;
    /**
     * Generate text report
     */
    private generateTextReport;
    /**
     * Generate HTML report
     */
    private generateHtmlReport;
    /**
     * Generate JSON report
     */
    private generateJsonReport;
    /**
     * Save report to file
     */
    private saveReport;
    /**
     * Format percentage with icon
     */
    private formatPercentage;
    /**
     * Format line ranges (e.g., [1, 2, 3, 5, 6, 7] -> "1-3, 5-7")
     */
    private formatLineRanges;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=coverage-reporter.d.ts.map