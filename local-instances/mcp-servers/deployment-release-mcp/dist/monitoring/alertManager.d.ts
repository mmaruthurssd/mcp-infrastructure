import type { Alert, AlertSeverity, AlertThresholds, MetricsData } from '../types.js';
export interface AlertConfig {
    thresholds: Required<AlertThresholds>;
    notifyOnIssue: boolean;
}
export declare class AlertManager {
    private alerts;
    private config;
    constructor(thresholds?: AlertThresholds, notifyOnIssue?: boolean);
    /**
     * Check metrics against thresholds and generate alerts
     */
    checkMetrics(metrics: MetricsData): Alert[];
    /**
     * Create an alert with appropriate severity
     */
    private createAlert;
    /**
     * Notify about alerts (log to console)
     */
    private notifyAlerts;
    /**
     * Get all alerts
     */
    getAlerts(): Alert[];
    /**
     * Get alerts by severity
     */
    getAlertsBySeverity(severity: AlertSeverity): Alert[];
    /**
     * Check if there are critical alerts
     */
    hasCriticalAlerts(): boolean;
    /**
     * Reset all alerts
     */
    reset(): void;
}
//# sourceMappingURL=alertManager.d.ts.map