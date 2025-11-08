/**
 * CoverageReporter Utility
 *
 * Generates detailed test coverage reports in multiple formats (text, HTML, JSON).
 * Provides file-level coverage analysis with uncovered line identification.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
export class CoverageReporter {
    mcpPath;
    format;
    constructor(mcpPath, format = 'text') {
        this.mcpPath = mcpPath;
        this.format = format;
    }
    /**
     * Generate coverage report
     */
    async generate(outputPath) {
        try {
            // Validate path exists
            if (!existsSync(this.mcpPath)) {
                return this.createErrorResult(`MCP path does not exist: ${this.mcpPath}`);
            }
            // Check if coverage data exists
            const coveragePath = join(this.mcpPath, 'coverage', 'coverage-final.json');
            if (!existsSync(coveragePath)) {
                return this.createErrorResult('Coverage data not found. Run tests with --coverage first.');
            }
            // Parse coverage data
            const coverage = this.parseCoverage(coveragePath);
            if (!coverage) {
                return this.createErrorResult('Failed to parse coverage data');
            }
            // Generate report in requested format
            let reportContent;
            let reportPath;
            switch (this.format) {
                case 'text':
                    reportContent = this.generateTextReport(coverage);
                    if (outputPath) {
                        reportPath = this.saveReport(reportContent, outputPath, 'txt');
                    }
                    break;
                case 'html':
                    reportContent = this.generateHtmlReport(coverage);
                    if (outputPath) {
                        reportPath = this.saveReport(reportContent, outputPath, 'html');
                    }
                    break;
                case 'json':
                    reportContent = this.generateJsonReport(coverage);
                    if (outputPath) {
                        reportPath = this.saveReport(reportContent, outputPath, 'json');
                    }
                    break;
                default:
                    return this.createErrorResult(`Unknown format: ${this.format}`);
            }
            return {
                success: true,
                format: this.format,
                coverage,
                report: reportContent,
                savedTo: reportPath,
            };
        }
        catch (error) {
            return this.createErrorResult(`Report generation failed: ${error}`);
        }
    }
    /**
     * Parse coverage data from coverage-final.json
     */
    parseCoverage(coveragePath) {
        try {
            const rawData = readFileSync(coveragePath, 'utf-8');
            const coverageData = JSON.parse(rawData);
            const files = [];
            let totalStatements = 0;
            let coveredStatements = 0;
            let totalBranches = 0;
            let coveredBranches = 0;
            let totalFunctions = 0;
            let coveredFunctions = 0;
            let totalLines = 0;
            let coveredLines = 0;
            // Process each file
            for (const [filePath, data] of Object.entries(coverageData)) {
                const fileData = data;
                const relativePath = relative(this.mcpPath, filePath);
                // Calculate statements coverage
                const stmtTotal = Object.keys(fileData.s || {}).length;
                const stmtCovered = Object.values(fileData.s || {}).filter((v) => v > 0).length;
                totalStatements += stmtTotal;
                coveredStatements += stmtCovered;
                // Calculate branches coverage
                const branchTotal = Object.keys(fileData.b || {}).length;
                const branchCovered = Object.values(fileData.b || {}).filter((branches) => Array.isArray(branches) ? branches.some((count) => count > 0) : false).length;
                totalBranches += branchTotal;
                coveredBranches += branchCovered;
                // Calculate functions coverage
                const fnTotal = Object.keys(fileData.f || {}).length;
                const fnCovered = Object.values(fileData.f || {}).filter((v) => v > 0).length;
                totalFunctions += fnTotal;
                coveredFunctions += fnCovered;
                // Calculate lines coverage
                const lineMap = fileData.statementMap || {};
                const coveredLineSet = new Set();
                const uncoveredLineSet = new Set();
                for (const [stmtId, count] of Object.entries(fileData.s || {})) {
                    const location = lineMap[stmtId];
                    if (location && location.start && location.start.line) {
                        const line = location.start.line;
                        if (count > 0) {
                            coveredLineSet.add(line);
                        }
                        else {
                            uncoveredLineSet.add(line);
                        }
                    }
                }
                const lineTotal = coveredLineSet.size + uncoveredLineSet.size;
                const lineCovered = coveredLineSet.size;
                totalLines += lineTotal;
                coveredLines += lineCovered;
                // Calculate percentages for this file
                const stmtPercent = stmtTotal > 0 ? Math.round((stmtCovered / stmtTotal) * 100) : 100;
                const branchPercent = branchTotal > 0 ? Math.round((branchCovered / branchTotal) * 100) : 100;
                const fnPercent = fnTotal > 0 ? Math.round((fnCovered / fnTotal) * 100) : 100;
                const linePercent = lineTotal > 0 ? Math.round((lineCovered / lineTotal) * 100) : 100;
                files.push({
                    path: relativePath,
                    statements: stmtPercent,
                    branches: branchPercent,
                    functions: fnPercent,
                    lines: linePercent,
                    uncoveredLines: Array.from(uncoveredLineSet).sort((a, b) => a - b),
                });
            }
            // Calculate overall percentages
            const overallStatements = totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 100;
            const overallBranches = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 100;
            const overallFunctions = totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 100;
            const overallLines = totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 100;
            const overall = Math.round((overallStatements + overallBranches + overallFunctions + overallLines) / 4);
            return {
                overall,
                statements: overallStatements,
                branches: overallBranches,
                functions: overallFunctions,
                lines: overallLines,
                files: files.sort((a, b) => a.lines - b.lines), // Sort by lowest coverage first
            };
        }
        catch (error) {
            console.error('Failed to parse coverage:', error);
            return undefined;
        }
    }
    /**
     * Generate text report
     */
    generateTextReport(coverage) {
        const lines = [];
        lines.push('='.repeat(70));
        lines.push('TEST COVERAGE REPORT');
        lines.push('='.repeat(70));
        lines.push('');
        // Overall summary
        lines.push('OVERALL COVERAGE');
        lines.push('-'.repeat(70));
        lines.push(`Overall:    ${this.formatPercentage(coverage.overall)}`);
        lines.push(`Statements: ${this.formatPercentage(coverage.statements)}`);
        lines.push(`Branches:   ${this.formatPercentage(coverage.branches)}`);
        lines.push(`Functions:  ${this.formatPercentage(coverage.functions)}`);
        lines.push(`Lines:      ${this.formatPercentage(coverage.lines)}`);
        lines.push('');
        // Coverage threshold check
        const threshold = 70;
        if (coverage.overall >= threshold) {
            lines.push(`✅ Coverage meets threshold (>= ${threshold}%)`);
        }
        else {
            lines.push(`❌ Coverage below threshold (>= ${threshold}%)`);
        }
        lines.push('');
        // File breakdown
        lines.push('-'.repeat(70));
        lines.push('FILE BREAKDOWN');
        lines.push('-'.repeat(70));
        lines.push('');
        for (const file of coverage.files) {
            const icon = file.lines >= threshold ? '✅' : '❌';
            lines.push(`${icon} ${file.path}`);
            lines.push(`   Statements: ${this.formatPercentage(file.statements)}`);
            lines.push(`   Branches:   ${this.formatPercentage(file.branches)}`);
            lines.push(`   Functions:  ${this.formatPercentage(file.functions)}`);
            lines.push(`   Lines:      ${this.formatPercentage(file.lines)}`);
            if (file.uncoveredLines && file.uncoveredLines.length > 0) {
                const lineRanges = this.formatLineRanges(file.uncoveredLines);
                lines.push(`   Uncovered:  Lines ${lineRanges}`);
            }
            lines.push('');
        }
        lines.push('='.repeat(70));
        return lines.join('\n');
    }
    /**
     * Generate HTML report
     */
    generateHtmlReport(coverage) {
        const threshold = 70;
        const overallStatus = coverage.overall >= threshold ? 'passing' : 'failing';
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .metric.failing {
            border-left-color: #f44336;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
        }
        .file-list {
            margin-top: 30px;
        }
        .file-item {
            background: #f9f9f9;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .file-item.failing {
            border-left-color: #f44336;
        }
        .file-path {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .file-metrics {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
        }
        .uncovered {
            margin-top: 10px;
            font-size: 12px;
            color: #999;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-badge.passing {
            background: #4CAF50;
            color: white;
        }
        .status-badge.failing {
            background: #f44336;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Coverage Report</h1>

        <div class="status-badge ${overallStatus}">${coverage.overall >= threshold ? 'Passing' : 'Failing'}</div>

        <div class="summary">
            <div class="metric ${coverage.overall >= threshold ? '' : 'failing'}">
                <div class="metric-label">Overall</div>
                <div class="metric-value">${coverage.overall}%</div>
            </div>
            <div class="metric ${coverage.statements >= threshold ? '' : 'failing'}">
                <div class="metric-label">Statements</div>
                <div class="metric-value">${coverage.statements}%</div>
            </div>
            <div class="metric ${coverage.branches >= threshold ? '' : 'failing'}">
                <div class="metric-label">Branches</div>
                <div class="metric-value">${coverage.branches}%</div>
            </div>
            <div class="metric ${coverage.functions >= threshold ? '' : 'failing'}">
                <div class="metric-label">Functions</div>
                <div class="metric-value">${coverage.functions}%</div>
            </div>
            <div class="metric ${coverage.lines >= threshold ? '' : 'failing'}">
                <div class="metric-label">Lines</div>
                <div class="metric-value">${coverage.lines}%</div>
            </div>
        </div>

        <div class="file-list">
            <h2>File Coverage</h2>
            ${coverage.files
            .map((file) => `
                <div class="file-item ${file.lines >= threshold ? '' : 'failing'}">
                    <div class="file-path">${file.path}</div>
                    <div class="file-metrics">
                        <span>Statements: ${file.statements}%</span>
                        <span>Branches: ${file.branches}%</span>
                        <span>Functions: ${file.functions}%</span>
                        <span>Lines: ${file.lines}%</span>
                    </div>
                    ${file.uncoveredLines && file.uncoveredLines.length > 0
            ? `<div class="uncovered">Uncovered lines: ${this.formatLineRanges(file.uncoveredLines)}</div>`
            : ''}
                </div>
            `)
            .join('')}
        </div>
    </div>
</body>
</html>
    `.trim();
    }
    /**
     * Generate JSON report
     */
    generateJsonReport(coverage) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            coverage,
            threshold: 70,
            passing: coverage.overall >= 70,
        }, null, 2);
    }
    /**
     * Save report to file
     */
    saveReport(content, outputPath, extension) {
        try {
            // Ensure output directory exists
            const outputDir = join(this.mcpPath, outputPath);
            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
            }
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `coverage-report-${timestamp}.${extension}`;
            const fullPath = join(outputDir, filename);
            writeFileSync(fullPath, content, 'utf-8');
            return fullPath;
        }
        catch (error) {
            console.error('Failed to save report:', error);
            return '';
        }
    }
    /**
     * Format percentage with icon
     */
    formatPercentage(percent) {
        const threshold = 70;
        const icon = percent >= threshold ? '✅' : '❌';
        return `${percent}% ${icon}`;
    }
    /**
     * Format line ranges (e.g., [1, 2, 3, 5, 6, 7] -> "1-3, 5-7")
     */
    formatLineRanges(lines) {
        if (lines.length === 0)
            return '';
        const ranges = [];
        let start = lines[0];
        let end = lines[0];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i] === end + 1) {
                end = lines[i];
            }
            else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                start = lines[i];
                end = lines[i];
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        return ranges.join(', ');
    }
    /**
     * Create error result
     */
    createErrorResult(error) {
        return {
            success: false,
            format: this.format,
            error,
        };
    }
}
//# sourceMappingURL=coverage-reporter.js.map