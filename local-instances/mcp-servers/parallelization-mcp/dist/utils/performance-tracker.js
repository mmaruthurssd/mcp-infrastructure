/**
 * Performance Tracker
 *
 * Tracks performance metrics across executions for benchmarking and optimization
 */
/**
 * Performance Tracker
 */
export class PerformanceTracker {
    static snapshots = [];
    /**
     * Record performance snapshot
     */
    static record(executionId, metrics, metadata) {
        this.snapshots.push({
            timestamp: new Date(),
            executionId,
            metrics,
            metadata,
        });
    }
    /**
     * Calculate statistics for a set of snapshots
     */
    static calculateStats(snapshots) {
        if (snapshots.length === 0) {
            return {
                totalExecutions: 0,
                avgSpeedup: 0,
                medianSpeedup: 0,
                p95Speedup: 0,
                avgDuration: 0,
                avgConflictRate: 0,
                avgFailureRate: 0,
                avgLoadBalance: 0,
                timeRange: {
                    start: new Date(),
                    end: new Date(),
                },
            };
        }
        // Sort by speedup for percentile calculations
        const speedups = snapshots
            .map(s => s.metrics.actualSpeedup)
            .sort((a, b) => a - b);
        const medianIndex = Math.floor(speedups.length / 2);
        const p95Index = Math.floor(speedups.length * 0.95);
        // Calculate averages
        const avgSpeedup = snapshots.reduce((sum, s) => sum + s.metrics.actualSpeedup, 0) /
            snapshots.length;
        const avgDuration = snapshots.reduce((sum, s) => sum + s.metrics.totalDuration, 0) /
            snapshots.length;
        const avgConflictRate = snapshots.reduce((sum, s) => sum + s.metrics.conflictCount / s.metrics.totalTasks, 0) / snapshots.length;
        const avgFailureRate = snapshots.reduce((sum, s) => sum + s.metrics.failureCount / s.metrics.totalTasks, 0) / snapshots.length;
        // Note: Load balance not in ExecutionMetrics, using placeholder
        const avgLoadBalance = 0;
        // Time range
        const timestamps = snapshots.map(s => s.timestamp.getTime());
        const timeRange = {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps)),
        };
        return {
            totalExecutions: snapshots.length,
            avgSpeedup,
            medianSpeedup: speedups[medianIndex],
            p95Speedup: speedups[p95Index],
            avgDuration,
            avgConflictRate,
            avgFailureRate,
            avgLoadBalance,
            timeRange,
        };
    }
    /**
     * Get statistics for all executions
     */
    static getOverallStats() {
        return this.calculateStats(this.snapshots);
    }
    /**
     * Get statistics by strategy
     */
    static getStatsByStrategy(strategy) {
        const filtered = this.snapshots.filter(s => s.metadata.strategy === strategy);
        return this.calculateStats(filtered);
    }
    /**
     * Get statistics by optimization goal
     */
    static getStatsByGoal(goal) {
        const filtered = this.snapshots.filter(s => s.metadata.optimizationGoal === goal);
        return this.calculateStats(filtered);
    }
    /**
     * Compare two strategies
     */
    static compareStrategies(strategyA, strategyB) {
        const statsA = this.getStatsByStrategy(strategyA);
        const statsB = this.getStatsByStrategy(strategyB);
        // Determine winner based on multiple factors
        let scoreA = 0;
        let scoreB = 0;
        if (statsA.avgSpeedup > statsB.avgSpeedup)
            scoreA++;
        else if (statsB.avgSpeedup > statsA.avgSpeedup)
            scoreB++;
        if (statsA.avgConflictRate < statsB.avgConflictRate)
            scoreA++;
        else if (statsB.avgConflictRate < statsA.avgConflictRate)
            scoreB++;
        if (statsA.avgFailureRate < statsB.avgFailureRate)
            scoreA++;
        else if (statsB.avgFailureRate < statsA.avgFailureRate)
            scoreB++;
        const winner = scoreA > scoreB ? strategyA : scoreB > scoreA ? strategyB : 'tie';
        return {
            strategyA,
            strategyB,
            statsA,
            statsB,
            winner,
            differences: {
                speedup: statsA.avgSpeedup - statsB.avgSpeedup,
                duration: statsA.avgDuration - statsB.avgDuration,
                conflictRate: statsA.avgConflictRate - statsB.avgConflictRate,
                failureRate: statsA.avgFailureRate - statsB.avgFailureRate,
            },
        };
    }
    /**
     * Get trend over time
     */
    static getTrend(metric, timeWindowMs = 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
        const now = Date.now();
        const cutoff = now - timeWindowMs;
        const recent = this.snapshots.filter(s => s.timestamp.getTime() >= cutoff);
        return recent.map(s => ({
            timestamp: s.timestamp,
            value: this.extractMetricValue(s, metric),
        }));
    }
    /**
     * Extract metric value
     */
    static extractMetricValue(snapshot, metric) {
        switch (metric) {
            case 'speedup':
                return snapshot.metrics.actualSpeedup;
            case 'duration':
                return snapshot.metrics.totalDuration;
            case 'conflicts':
                return snapshot.metrics.conflictCount / snapshot.metrics.totalTasks;
            case 'failures':
                return snapshot.metrics.failureCount / snapshot.metrics.totalTasks;
            default:
                return 0;
        }
    }
    /**
     * Identify performance regressions
     */
    static identifyRegressions(baselineWindow = 7, currentWindow = 1) {
        const details = [];
        // Get baseline (older data)
        const allSorted = [...this.snapshots].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const baselineCount = Math.floor(allSorted.length * (baselineWindow / 10));
        const currentCount = Math.floor(allSorted.length * (currentWindow / 10));
        const baseline = allSorted.slice(0, baselineCount);
        const current = allSorted.slice(-currentCount);
        if (baseline.length === 0 || current.length === 0) {
            return {
                hasRegression: false,
                details: ['Insufficient data for regression analysis'],
            };
        }
        const baselineStats = this.calculateStats(baseline);
        const currentStats = this.calculateStats(current);
        let hasRegression = false;
        // Check speedup regression
        const speedupDiff = currentStats.avgSpeedup - baselineStats.avgSpeedup;
        if (speedupDiff < -0.3) {
            // 0.3x drop
            hasRegression = true;
            details.push(`Speedup regression: ${baselineStats.avgSpeedup.toFixed(1)}x → ${currentStats.avgSpeedup.toFixed(1)}x (${speedupDiff.toFixed(1)}x drop)`);
        }
        // Check conflict rate increase
        const conflictDiff = currentStats.avgConflictRate - baselineStats.avgConflictRate;
        if (conflictDiff > 0.1) {
            // 10% increase
            hasRegression = true;
            details.push(`Conflict rate increase: ${(baselineStats.avgConflictRate * 100).toFixed(1)}% → ${(currentStats.avgConflictRate * 100).toFixed(1)}% (+${(conflictDiff * 100).toFixed(1)}%)`);
        }
        // Check failure rate increase
        const failureDiff = currentStats.avgFailureRate - baselineStats.avgFailureRate;
        if (failureDiff > 0.05) {
            // 5% increase
            hasRegression = true;
            details.push(`Failure rate increase: ${(baselineStats.avgFailureRate * 100).toFixed(1)}% → ${(currentStats.avgFailureRate * 100).toFixed(1)}% (+${(failureDiff * 100).toFixed(1)}%)`);
        }
        if (!hasRegression) {
            details.push('No significant performance regressions detected');
        }
        return {
            hasRegression,
            details,
        };
    }
    /**
     * Generate performance report
     */
    static generateReport() {
        const overall = this.getOverallStats();
        const lines = [];
        lines.push('=== Performance Report ===');
        lines.push(`Total Executions: ${overall.totalExecutions}`);
        lines.push(`Time Range: ${overall.timeRange.start.toLocaleDateString()} - ${overall.timeRange.end.toLocaleDateString()}`);
        lines.push('');
        lines.push('Speedup Metrics:');
        lines.push(`  Average: ${overall.avgSpeedup.toFixed(2)}x`);
        lines.push(`  Median: ${overall.medianSpeedup.toFixed(2)}x`);
        lines.push(`  P95: ${overall.p95Speedup.toFixed(2)}x`);
        lines.push('');
        lines.push('Quality Metrics:');
        lines.push(`  Avg Conflict Rate: ${(overall.avgConflictRate * 100).toFixed(1)}%`);
        lines.push(`  Avg Failure Rate: ${(overall.avgFailureRate * 100).toFixed(1)}%`);
        lines.push('');
        lines.push('Duration Metrics:');
        lines.push(`  Avg Duration: ${(overall.avgDuration / 1000).toFixed(1)}s`);
        lines.push('');
        // Strategy comparison
        const strategies = [
            ...new Set(this.snapshots.map(s => s.metadata.strategy)),
        ];
        if (strategies.length > 1) {
            lines.push('Strategy Comparison:');
            for (const strategy of strategies) {
                const stats = this.getStatsByStrategy(strategy);
                lines.push(`  ${strategy}: ${stats.avgSpeedup.toFixed(2)}x speedup ` +
                    `(${stats.totalExecutions} executions)`);
            }
            lines.push('');
        }
        // Regression check
        const regression = this.identifyRegressions();
        lines.push('Regression Analysis:');
        for (const detail of regression.details) {
            lines.push(`  ${detail}`);
        }
        return lines.join('\n');
    }
    /**
     * Clear all data
     */
    static clear() {
        this.snapshots = [];
    }
    /**
     * Export data
     */
    static export() {
        return this.snapshots;
    }
    /**
     * Import data
     */
    static import(snapshots) {
        this.snapshots = snapshots.map(s => ({
            ...s,
            timestamp: new Date(s.timestamp),
        }));
    }
}
//# sourceMappingURL=performance-tracker.js.map