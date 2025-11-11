/**
 * Get Statistics Tool
 *
 * Aggregate statistics from pattern performance data including resolution counts,
 * success rates, confidence metrics, and pattern performance analysis.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Filter outcomes by time range
 */
function filterByTimeRange(outcomes, timeRange) {
    const now = new Date();
    let cutoffTime;
    switch (timeRange) {
        case "day":
            cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case "week":
            cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "month":
            cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "all":
        default:
            return outcomes;
    }
    return outcomes.filter(outcome => new Date(outcome.timestamp) >= cutoffTime);
}
/**
 * Calculate confidence score based on success rate and usage
 */
function calculateConfidence(successRate, totalUses, baseConfidence) {
    // Weight: 70% success rate, 30% base confidence
    // Apply usage modifier (more usage = more confidence in the metric)
    const usageModifier = Math.min(1.0, totalUses / 10); // Full confidence after 10+ uses
    const weightedScore = (successRate * 0.7 + baseConfidence * 0.3) * usageModifier + baseConfidence * (1 - usageModifier);
    return Math.min(0.99, Math.max(0.01, weightedScore));
}
/**
 * Get comprehensive statistics
 */
export async function getStats(args) {
    const { timeRange = "week", groupBy = "none" } = args;
    try {
        const dataDir = path.join(__dirname, "..", "data");
        // Load pattern performance
        const performancePath = path.join(dataDir, "pattern-performance.json");
        let performance;
        try {
            performance = JSON.parse(await fs.readFile(performancePath, "utf-8"));
        }
        catch {
            return {
                content: [{
                        type: "text",
                        text: "No performance data available yet. Start resolving issues to collect statistics."
                    }]
            };
        }
        // Load patterns for metadata
        const patternsPath = path.join(dataDir, "patterns.json");
        const patternsData = JSON.parse(await fs.readFile(patternsPath, "utf-8"));
        const patterns = patternsData.patterns;
        // Create pattern lookup map
        const patternMap = new Map();
        patterns.forEach(p => patternMap.set(p.id, p));
        // Aggregate statistics
        let totalResolutions = 0;
        let totalSuccesses = 0;
        let totalFailures = 0;
        let autonomousCount = 0;
        let assistedCount = 0;
        let manualCount = 0;
        let totalDuration = 0;
        let durationCount = 0;
        const confidenceBuckets = {
            high: { count: 0, successes: 0 }, // >= 0.90
            medium: { count: 0, successes: 0 }, // 0.70 - 0.89
            low: { count: 0, successes: 0 } // < 0.70
        };
        const patternStats = [];
        // Process each pattern
        for (const [patternId, perf] of Object.entries(performance.patterns)) {
            const pattern = patternMap.get(patternId);
            // Filter outcomes by time range
            const filteredOutcomes = filterByTimeRange(perf.outcomes, timeRange);
            if (filteredOutcomes.length === 0)
                continue;
            const successes = filteredOutcomes.filter(o => o.outcome === "success").length;
            const failures = filteredOutcomes.filter(o => o.outcome === "failed").length;
            const autonomous = filteredOutcomes.filter(o => o.autonomous).length;
            const manual = filteredOutcomes.filter(o => o.manual).length;
            const assisted = filteredOutcomes.length - autonomous - manual;
            totalResolutions += filteredOutcomes.length;
            totalSuccesses += successes;
            totalFailures += failures;
            autonomousCount += autonomous;
            assistedCount += assisted;
            manualCount += manual;
            // Calculate average duration for this pattern
            const durations = filteredOutcomes.map(o => o.duration).filter(d => d > 0);
            const avgDuration = durations.length > 0
                ? durations.reduce((sum, d) => sum + d, 0) / durations.length
                : 0;
            if (avgDuration > 0) {
                totalDuration += avgDuration;
                durationCount++;
            }
            // Calculate success rate and confidence
            const successRate = successes / filteredOutcomes.length;
            const baseConfidence = pattern?.baseConfidence || 0.5;
            const confidence = calculateConfidence(successRate, filteredOutcomes.length, baseConfidence);
            // Categorize by confidence bucket
            if (confidence >= 0.90) {
                confidenceBuckets.high.count += filteredOutcomes.length;
                confidenceBuckets.high.successes += successes;
            }
            else if (confidence >= 0.70) {
                confidenceBuckets.medium.count += filteredOutcomes.length;
                confidenceBuckets.medium.successes += successes;
            }
            else {
                confidenceBuckets.low.count += filteredOutcomes.length;
                confidenceBuckets.low.successes += successes;
            }
            patternStats.push({
                id: patternId,
                name: pattern?.name || patternId,
                type: pattern?.type,
                severity: pattern?.severity,
                uses: filteredOutcomes.length,
                successes,
                successRate,
                avgDuration,
                confidence
            });
        }
        // Sort patterns by success rate (descending)
        patternStats.sort((a, b) => b.successRate - a.successRate);
        // Calculate overall metrics
        const overallSuccessRate = totalResolutions > 0 ? totalSuccesses / totalResolutions : 0;
        const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
        // Build response based on groupBy parameter
        let responseText = `📊 Autonomous Deployment Statistics\n`;
        responseText += `Time Range: ${timeRange.toUpperCase()}\n`;
        responseText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        // Overall metrics
        responseText += `📈 Overall Metrics:\n`;
        responseText += `Total Resolutions: ${totalResolutions}\n`;
        responseText += `  ✓ Successes: ${totalSuccesses} (${(overallSuccessRate * 100).toFixed(1)}%)\n`;
        responseText += `  ✗ Failures: ${totalFailures} (${((1 - overallSuccessRate) * 100).toFixed(1)}%)\n\n`;
        responseText += `Resolution Types:\n`;
        responseText += `  🤖 Autonomous: ${autonomousCount} (${totalResolutions > 0 ? ((autonomousCount / totalResolutions) * 100).toFixed(1) : 0}%)\n`;
        responseText += `  👤 Assisted: ${assistedCount} (${totalResolutions > 0 ? ((assistedCount / totalResolutions) * 100).toFixed(1) : 0}%)\n`;
        responseText += `  ✍️  Manual: ${manualCount} (${totalResolutions > 0 ? ((manualCount / totalResolutions) * 100).toFixed(1) : 0}%)\n\n`;
        if (avgDuration > 0) {
            responseText += `Average Resolution Time: ${(avgDuration / 1000).toFixed(1)}s\n\n`;
        }
        // Confidence bucket analysis
        responseText += `🎯 Success Rate by Confidence Bucket:\n`;
        if (confidenceBuckets.high.count > 0) {
            const highSuccessRate = confidenceBuckets.high.successes / confidenceBuckets.high.count;
            responseText += `  High (≥0.90): ${(highSuccessRate * 100).toFixed(1)}% (${confidenceBuckets.high.successes}/${confidenceBuckets.high.count})\n`;
        }
        if (confidenceBuckets.medium.count > 0) {
            const medSuccessRate = confidenceBuckets.medium.successes / confidenceBuckets.medium.count;
            responseText += `  Medium (0.70-0.89): ${(medSuccessRate * 100).toFixed(1)}% (${confidenceBuckets.medium.successes}/${confidenceBuckets.medium.count})\n`;
        }
        if (confidenceBuckets.low.count > 0) {
            const lowSuccessRate = confidenceBuckets.low.successes / confidenceBuckets.low.count;
            responseText += `  Low (<0.70): ${(lowSuccessRate * 100).toFixed(1)}% (${confidenceBuckets.low.successes}/${confidenceBuckets.low.count})\n`;
        }
        responseText += `\n`;
        // Group by analysis
        if (groupBy !== "none" && patternStats.length > 0) {
            responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            responseText += `📋 Grouped by: ${groupBy.toUpperCase()}\n\n`;
            if (groupBy === "pattern") {
                // Show top 5 performing patterns
                responseText += `🏆 Top Performing Patterns:\n`;
                patternStats.slice(0, 5).forEach((stat, idx) => {
                    responseText += `${idx + 1}. ${stat.name}\n`;
                    responseText += `   Success Rate: ${(stat.successRate * 100).toFixed(1)}% (${stat.successes}/${stat.uses})\n`;
                    responseText += `   Confidence: ${stat.confidence.toFixed(2)}\n`;
                    if (stat.avgDuration > 0) {
                        responseText += `   Avg Duration: ${(stat.avgDuration / 1000).toFixed(1)}s\n`;
                    }
                    responseText += `\n`;
                });
                // Show patterns needing review (low success rate)
                const needsReview = patternStats.filter(s => s.successRate < 0.70 && s.uses >= 3);
                if (needsReview.length > 0) {
                    responseText += `⚠️  Patterns Needing Review:\n`;
                    needsReview.forEach(stat => {
                        responseText += `  • ${stat.name}: ${(stat.successRate * 100).toFixed(1)}% success (${stat.uses} uses)\n`;
                    });
                }
            }
            else if (groupBy === "type" || groupBy === "severity") {
                // Group by type or severity
                const groups = new Map();
                patternStats.forEach(stat => {
                    const key = groupBy === "type" ? stat.type : stat.severity;
                    if (!key)
                        return;
                    if (!groups.has(key)) {
                        groups.set(key, { uses: 0, successes: 0 });
                    }
                    const group = groups.get(key);
                    group.uses += stat.uses;
                    group.successes += stat.successes;
                });
                groups.forEach((data, key) => {
                    const successRate = data.uses > 0 ? data.successes / data.uses : 0;
                    responseText += `${key}: ${(successRate * 100).toFixed(1)}% success (${data.successes}/${data.uses})\n`;
                });
            }
        }
        else {
            // Show top patterns without grouping
            if (patternStats.length > 0) {
                responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                responseText += `🏆 Top 5 Patterns by Success Rate:\n\n`;
                patternStats.slice(0, 5).forEach((stat, idx) => {
                    responseText += `${idx + 1}. ${stat.name}: ${(stat.successRate * 100).toFixed(1)}% (${stat.uses} uses)\n`;
                });
            }
        }
        return {
            content: [{
                    type: "text",
                    text: responseText
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error generating statistics: ${error.message}`
                }],
            isError: true
        };
    }
}
//# sourceMappingURL=get-stats.js.map