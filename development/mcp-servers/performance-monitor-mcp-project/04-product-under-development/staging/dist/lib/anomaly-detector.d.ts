/**
 * Anomaly Detector
 *
 * Statistical analysis for anomaly detection
 */
import type { Anomaly, SensitivityLevel, PerformanceMetric } from '../types/index.js';
export declare class AnomalyDetector {
    /**
     * Detect anomalies using z-score method
     */
    detectZScore(metrics: PerformanceMetric[], sensitivity?: SensitivityLevel): Anomaly[];
    /**
     * Detect anomalies using moving average method
     */
    detectMovingAverage(metrics: PerformanceMetric[], sensitivity?: SensitivityLevel): Anomaly[];
    /**
     * Detect anomalies using percentile method
     */
    detectPercentile(metrics: PerformanceMetric[], sensitivity?: SensitivityLevel): Anomaly[];
    /**
     * Calculate standard deviation
     */
    private calculateStdDev;
    /**
     * Calculate percentile
     */
    private percentile;
}
//# sourceMappingURL=anomaly-detector.d.ts.map