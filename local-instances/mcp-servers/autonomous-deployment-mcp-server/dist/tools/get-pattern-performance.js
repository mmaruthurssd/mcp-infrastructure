/**
 * Pattern Performance Analysis Tool
 * Analyzes pattern performance metrics and provides insights
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Paths to data files
const PERFORMANCE_FILE = path.join(__dirname, '../data/pattern-performance.json');
const PATTERNS_FILE = path.join(__dirname, '../data/patterns.json');
/**
 * Load pattern performance data
 */
async function loadPerformanceData() {
    const data = await fs.readFile(PERFORMANCE_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Load patterns data
 */
async function loadPatternsData() {
    const data = await fs.readFile(PATTERNS_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Calculate trend based on recent performance
 */
function calculateTrend(confidenceHistory) {
    if (confidenceHistory.length < 3) {
        return 'new';
    }
    // Take last 5 data points for trend analysis
    const recentHistory = confidenceHistory.slice(-5);
    // Calculate simple moving average of first half vs second half
    const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
    const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const change = secondAvg - firstAvg;
    if (change > 0.05)
        return 'improving';
    if (change < -0.05)
        return 'declining';
    return 'stable';
}
/**
 * Calculate performance metrics for a single pattern
 */
function calculateMetrics(patternId, pattern, perfRecord) {
    if (!perfRecord) {
        // Pattern has not been used yet
        return {
            patternId,
            patternName: pattern.name,
            successRate: 0,
            usageCount: 0,
            currentConfidence: pattern.baseConfidence,
            baseConfidence: pattern.baseConfidence,
            confidenceChange: 0,
            lastUsed: null,
            avgResolutionTimeMinutes: 0,
            trend: 'new',
            flagForReview: false,
        };
    }
    const successRate = perfRecord.totalUsage > 0
        ? (perfRecord.successful / perfRecord.totalUsage) * 100
        : 0;
    const currentConfidence = perfRecord.confidenceHistory.length > 0
        ? perfRecord.confidenceHistory[perfRecord.confidenceHistory.length - 1]
        : pattern.baseConfidence;
    const confidenceChange = currentConfidence - pattern.baseConfidence;
    const trend = calculateTrend(perfRecord.confidenceHistory);
    const flagForReview = successRate < 50 && perfRecord.totalUsage >= 3;
    return {
        patternId,
        patternName: pattern.name,
        successRate: Math.round(successRate * 100) / 100,
        usageCount: perfRecord.totalUsage,
        currentConfidence: Math.round(currentConfidence * 100) / 100,
        baseConfidence: pattern.baseConfidence,
        confidenceChange: Math.round(confidenceChange * 100) / 100,
        lastUsed: perfRecord.lastUsed,
        avgResolutionTimeMinutes: Math.round(perfRecord.avgResolutionTimeMinutes * 100) / 100,
        trend,
        flagForReview,
    };
}
/**
 * Sort metrics based on criteria
 */
function sortMetrics(metrics, sortBy) {
    const sorted = [...metrics];
    switch (sortBy) {
        case 'success-rate':
            sorted.sort((a, b) => b.successRate - a.successRate);
            break;
        case 'usage-count':
            sorted.sort((a, b) => b.usageCount - a.usageCount);
            break;
        case 'confidence':
            sorted.sort((a, b) => b.currentConfidence - a.currentConfidence);
            break;
    }
    return sorted;
}
/**
 * Format performance report
 */
function formatReport(metrics) {
    const flaggedPatterns = metrics.filter(m => m.flagForReview);
    let report = '=== PATTERN PERFORMANCE REPORT ===\n\n';
    report += `Total Patterns: ${metrics.length}\n`;
    report += `Patterns Flagged for Review: ${flaggedPatterns.length}\n\n`;
    if (flaggedPatterns.length > 0) {
        report += '--- FLAGGED PATTERNS (Success Rate < 50%) ---\n';
        flaggedPatterns.forEach(m => {
            report += `  - ${m.patternName} (${m.patternId}): ${m.successRate}% success, ${m.usageCount} uses\n`;
        });
        report += '\n';
    }
    report += '--- PATTERN METRICS ---\n\n';
    metrics.forEach(m => {
        report += `Pattern: ${m.patternName} (${m.patternId})\n`;
        report += `  Success Rate: ${m.successRate}%\n`;
        report += `  Usage Count: ${m.usageCount}\n`;
        report += `  Current Confidence: ${m.currentConfidence}\n`;
        report += `  Base Confidence: ${m.baseConfidence}\n`;
        report += `  Confidence Change: ${m.confidenceChange >= 0 ? '+' : ''}${m.confidenceChange}\n`;
        report += `  Avg Resolution Time: ${m.avgResolutionTimeMinutes} min\n`;
        report += `  Trend: ${m.trend}\n`;
        report += `  Last Used: ${m.lastUsed || 'Never'}\n`;
        report += `  Flag for Review: ${m.flagForReview ? 'YES' : 'No'}\n`;
        report += '\n';
    });
    return report;
}
/**
 * Main tool handler
 */
export async function getPatternPerformance(params) {
    try {
        const performanceData = await loadPerformanceData();
        const patternsData = await loadPatternsData();
        let metrics = [];
        if (params.patternId) {
            // Single pattern query
            const pattern = patternsData.patterns.find(p => p.id === params.patternId);
            if (!pattern) {
                throw new Error(`Pattern '${params.patternId}' not found`);
            }
            const perfRecord = performanceData.patterns[params.patternId];
            metrics = [calculateMetrics(params.patternId, pattern, perfRecord)];
        }
        else {
            // All patterns query
            metrics = patternsData.patterns.map(pattern => {
                const perfRecord = performanceData.patterns[pattern.id];
                return calculateMetrics(pattern.id, pattern, perfRecord);
            });
            // Apply filters
            if (params.minUsage !== undefined) {
                metrics = metrics.filter(m => m.usageCount >= (params.minUsage || 0));
            }
            if (!params.includeNew) {
                metrics = metrics.filter(m => m.usageCount > 0);
            }
            // Apply sorting
            if (params.sortBy) {
                metrics = sortMetrics(metrics, params.sortBy);
            }
        }
        // Format and return report
        const report = formatReport(metrics);
        const jsonData = {
            summary: {
                totalPatterns: metrics.length,
                flaggedForReview: metrics.filter(m => m.flagForReview).length,
            },
            metrics,
        };
        return {
            content: [
                {
                    type: 'text',
                    text: report + '\n\n--- JSON DATA ---\n' + JSON.stringify(jsonData, null, 2),
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
//# sourceMappingURL=get-pattern-performance.js.map