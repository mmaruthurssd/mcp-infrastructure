/**
 * Anomaly Detector
 *
 * Statistical analysis for anomaly detection
 */
import { randomUUID } from 'crypto';
export class AnomalyDetector {
    /**
     * Detect anomalies using z-score method
     */
    detectZScore(metrics, sensitivity = 'medium') {
        if (metrics.length < 10)
            return []; // Need sufficient data
        const durations = metrics.map(m => m.duration);
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const stdDev = this.calculateStdDev(durations);
        // Sensitivity thresholds (standard deviations)
        const threshold = sensitivity === 'low' ? 3 : sensitivity === 'medium' ? 2 : 1.5;
        const anomalies = [];
        for (const metric of metrics) {
            const zScore = Math.abs((metric.duration - mean) / stdDev);
            if (zScore > threshold) {
                anomalies.push({
                    id: randomUUID(),
                    timestamp: metric.timestamp,
                    mcpServer: metric.mcpServer,
                    toolName: metric.toolName,
                    metric: 'response_time',
                    observedValue: metric.duration,
                    expectedValue: mean,
                    deviation: zScore,
                    severity: zScore > threshold * 1.5 ? 'critical' : 'warning',
                    detectionMethod: 'z-score',
                });
            }
        }
        return anomalies;
    }
    /**
     * Detect anomalies using moving average method
     */
    detectMovingAverage(metrics, sensitivity = 'medium') {
        if (metrics.length < 10)
            return []; // Need sufficient data
        const windowSize = 5;
        const anomalies = [];
        // Sensitivity multipliers
        const multiplier = sensitivity === 'low' ? 3 : sensitivity === 'medium' ? 2 : 1.5;
        for (let i = windowSize; i < metrics.length; i++) {
            // Calculate moving average of previous window
            const window = metrics.slice(i - windowSize, i);
            const avg = window.reduce((sum, m) => sum + m.duration, 0) / windowSize;
            const stdDev = this.calculateStdDev(window.map(m => m.duration));
            const metric = metrics[i];
            const deviation = Math.abs(metric.duration - avg) / stdDev;
            if (deviation > multiplier) {
                anomalies.push({
                    id: randomUUID(),
                    timestamp: metric.timestamp,
                    mcpServer: metric.mcpServer,
                    toolName: metric.toolName,
                    metric: 'response_time',
                    observedValue: metric.duration,
                    expectedValue: avg,
                    deviation,
                    severity: deviation > multiplier * 1.5 ? 'critical' : 'warning',
                    detectionMethod: 'moving-avg',
                });
            }
        }
        return anomalies;
    }
    /**
     * Detect anomalies using percentile method
     */
    detectPercentile(metrics, sensitivity = 'medium') {
        if (metrics.length < 10)
            return []; // Need sufficient data
        const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
        // Sensitivity thresholds (percentiles)
        const upperPercentile = sensitivity === 'low' ? 99 : sensitivity === 'medium' ? 95 : 90;
        const threshold = this.percentile(durations, upperPercentile);
        const median = this.percentile(durations, 50);
        const anomalies = [];
        for (const metric of metrics) {
            if (metric.duration > threshold) {
                const deviation = (metric.duration - median) / median;
                anomalies.push({
                    id: randomUUID(),
                    timestamp: metric.timestamp,
                    mcpServer: metric.mcpServer,
                    toolName: metric.toolName,
                    metric: 'response_time',
                    observedValue: metric.duration,
                    expectedValue: median,
                    deviation,
                    severity: metric.duration > threshold * 1.5 ? 'critical' : 'warning',
                    detectionMethod: 'percentile',
                });
            }
        }
        return anomalies;
    }
    /**
     * Calculate standard deviation
     */
    calculateStdDev(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    /**
     * Calculate percentile
     */
    percentile(sortedValues, p) {
        const index = Math.ceil((p / 100) * sortedValues.length) - 1;
        return sortedValues[Math.max(0, index)];
    }
}
//# sourceMappingURL=anomaly-detector.js.map