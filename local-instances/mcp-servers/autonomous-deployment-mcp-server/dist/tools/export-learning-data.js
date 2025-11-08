/**
 * Learning Data Export Tool
 * Exports patterns, performance data, and outcomes in JSON or CSV format
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Paths to data files
const PATTERNS_FILE = path.join(__dirname, '../data/patterns.json');
const PERFORMANCE_FILE = path.join(__dirname, '../data/pattern-performance.json');
const EXPORTS_DIR = path.join(__dirname, '../../../../../.ai-planning/exports');
/**
 * Ensure exports directory exists
 */
async function ensureExportsDir() {
    try {
        await fs.access(EXPORTS_DIR);
    }
    catch {
        await fs.mkdir(EXPORTS_DIR, { recursive: true });
    }
}
/**
 * Load patterns data
 */
async function loadPatternsData() {
    const data = await fs.readFile(PATTERNS_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Load performance data
 */
async function loadPerformanceData() {
    const data = await fs.readFile(PERFORMANCE_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Generate export metadata
 */
function generateMetadata(params) {
    return {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        workspace: 'autonomous-deployment-mcp',
        filters: {
            includePatterns: params.includePatterns ?? true,
            includeOutcomes: params.includeOutcomes ?? true,
            includeMetrics: params.includeMetrics ?? true,
        },
    };
}
/**
 * Flatten object for CSV export
 */
function flattenObject(obj, prefix = '') {
    const flattened = {};
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (value === null || value === undefined) {
            flattened[newKey] = '';
        }
        else if (Array.isArray(value)) {
            flattened[newKey] = JSON.stringify(value);
        }
        else if (typeof value === 'object' && !(value instanceof Date)) {
            Object.assign(flattened, flattenObject(value, newKey));
        }
        else {
            flattened[newKey] = value;
        }
    }
    return flattened;
}
/**
 * Convert array of objects to CSV
 */
function arrayToCSV(data) {
    if (data.length === 0) {
        return '';
    }
    // Flatten all objects
    const flattenedData = data.map(item => flattenObject(item));
    // Get all unique keys
    const allKeys = new Set();
    flattenedData.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);
    // Create CSV header
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    // Create CSV rows
    flattenedData.forEach(item => {
        const row = headers.map(header => {
            const value = item[header] ?? '';
            // Escape quotes and wrap in quotes
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        });
        csv += row.join(',') + '\n';
    });
    return csv;
}
/**
 * Export data in JSON format
 */
async function exportJSON(patterns, performance, metadata, params) {
    const exportData = { metadata };
    if (params.includePatterns ?? true) {
        exportData.patterns = patterns.patterns;
    }
    if (params.includeOutcomes ?? true) {
        exportData.outcomes = performance.patterns;
    }
    if (params.includeMetrics ?? true) {
        // Calculate aggregate metrics
        const totalPatterns = patterns.patterns.length;
        const patternsWithUsage = patterns.patterns.filter(p => p.usageCount > 0).length;
        let totalSuccessful = 0;
        let totalFailed = 0;
        let totalUsage = 0;
        Object.values(performance.patterns).forEach(perf => {
            totalSuccessful += perf.successful;
            totalFailed += perf.failed;
            totalUsage += perf.totalUsage;
        });
        const overallSuccessRate = totalUsage > 0
            ? (totalSuccessful / totalUsage) * 100
            : 0;
        exportData.metrics = {
            totalPatterns,
            patternsWithUsage,
            totalResolutions: totalUsage,
            successfulResolutions: totalSuccessful,
            failedResolutions: totalFailed,
            overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
        };
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `learning-data-${timestamp}.json`;
    const filepath = path.join(EXPORTS_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
    return filepath;
}
/**
 * Export data in CSV format
 */
async function exportCSV(patterns, performance, params) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseFilename = `learning-data-${timestamp}`;
    const files = [];
    // Export patterns to CSV
    if (params.includePatterns ?? true) {
        const patternsCSV = arrayToCSV(patterns.patterns);
        const patternsFile = path.join(EXPORTS_DIR, `${baseFilename}-patterns.csv`);
        await fs.writeFile(patternsFile, patternsCSV, 'utf-8');
        files.push(patternsFile);
    }
    // Export outcomes to CSV
    if (params.includeOutcomes ?? true) {
        const outcomesData = Object.entries(performance.patterns).map(([id, perf]) => ({
            patternId: id,
            ...perf,
        }));
        const outcomesCSV = arrayToCSV(outcomesData);
        const outcomesFile = path.join(EXPORTS_DIR, `${baseFilename}-outcomes.csv`);
        await fs.writeFile(outcomesFile, outcomesCSV, 'utf-8');
        files.push(outcomesFile);
    }
    // Export metrics to CSV
    if (params.includeMetrics ?? true) {
        const metricsData = [];
        patterns.patterns.forEach(pattern => {
            const perf = performance.patterns[pattern.id];
            const successRate = perf && perf.totalUsage > 0
                ? (perf.successful / perf.totalUsage) * 100
                : 0;
            metricsData.push({
                patternId: pattern.id,
                patternName: pattern.name,
                type: pattern.type,
                severity: pattern.severity,
                baseConfidence: pattern.baseConfidence,
                usageCount: perf?.totalUsage || 0,
                successful: perf?.successful || 0,
                failed: perf?.failed || 0,
                successRate: Math.round(successRate * 100) / 100,
                avgResolutionTime: perf?.avgResolutionTimeMinutes || 0,
                lastUsed: perf?.lastUsed || null,
            });
        });
        const metricsCSV = arrayToCSV(metricsData);
        const metricsFile = path.join(EXPORTS_DIR, `${baseFilename}-metrics.csv`);
        await fs.writeFile(metricsFile, metricsCSV, 'utf-8');
        files.push(metricsFile);
    }
    return files.join(', ');
}
/**
 * Main tool handler
 */
export async function exportLearningData(params) {
    try {
        // Ensure exports directory exists
        await ensureExportsDir();
        // Load data
        const patterns = await loadPatternsData();
        const performance = await loadPerformanceData();
        // Generate metadata
        const metadata = generateMetadata(params);
        // Export based on format
        let exportPath;
        let summary;
        if (params.format === 'json') {
            exportPath = await exportJSON(patterns, performance, metadata, params);
            summary = `Exported learning data to JSON: ${exportPath}`;
        }
        else if (params.format === 'csv') {
            exportPath = await exportCSV(patterns, performance, params);
            summary = `Exported learning data to CSV files: ${exportPath}`;
        }
        else {
            throw new Error(`Unsupported format: ${params.format}`);
        }
        // Calculate summary statistics
        const totalPatterns = patterns.patterns.length;
        const patternsWithUsage = patterns.patterns.filter(p => p.usageCount > 0).length;
        let totalUsage = 0;
        let totalSuccessful = 0;
        Object.values(performance.patterns).forEach(perf => {
            totalUsage += perf.totalUsage;
            totalSuccessful += perf.successful;
        });
        const report = `
=== LEARNING DATA EXPORT ===

Format: ${params.format.toUpperCase()}
Export Date: ${metadata.exportDate}
Output Path: ${exportPath}

--- SUMMARY STATISTICS ---
Total Patterns: ${totalPatterns}
Patterns with Usage: ${patternsWithUsage}
Total Resolutions: ${totalUsage}
Successful Resolutions: ${totalSuccessful}

--- EXPORT FILTERS ---
Include Patterns: ${params.includePatterns ?? true}
Include Outcomes: ${params.includeOutcomes ?? true}
Include Metrics: ${params.includeMetrics ?? true}

${summary}
`;
        return {
            content: [
                {
                    type: 'text',
                    text: report,
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
        };
    }
}
//# sourceMappingURL=export-learning-data.js.map