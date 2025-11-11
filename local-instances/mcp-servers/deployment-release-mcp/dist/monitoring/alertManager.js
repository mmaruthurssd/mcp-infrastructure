export class AlertManager {
    alerts = [];
    config;
    constructor(thresholds = {}, notifyOnIssue = false) {
        // Set default thresholds
        this.config = {
            thresholds: {
                errorRate: thresholds.errorRate ?? 5,
                responseTime: thresholds.responseTime ?? 1000,
                cpuUsage: thresholds.cpuUsage ?? 80,
                memoryUsage: thresholds.memoryUsage ?? 85,
            },
            notifyOnIssue,
        };
    }
    /**
     * Check metrics against thresholds and generate alerts
     */
    checkMetrics(metrics) {
        const newAlerts = [];
        const timestamp = new Date().toISOString();
        // Check error rate
        if (metrics.errorRate > this.config.thresholds.errorRate) {
            const alert = this.createAlert(timestamp, 'errorRate', metrics.errorRate, this.config.thresholds.errorRate, `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds threshold (${this.config.thresholds.errorRate}%)`);
            newAlerts.push(alert);
        }
        // Check response time
        if (metrics.avgResponseTime > this.config.thresholds.responseTime) {
            const alert = this.createAlert(timestamp, 'avgResponseTime', metrics.avgResponseTime, this.config.thresholds.responseTime, `Average response time (${metrics.avgResponseTime.toFixed(0)}ms) exceeds threshold (${this.config.thresholds.responseTime}ms)`);
            newAlerts.push(alert);
        }
        // Check CPU usage
        if (metrics.cpuUsage > this.config.thresholds.cpuUsage) {
            const alert = this.createAlert(timestamp, 'cpuUsage', metrics.cpuUsage, this.config.thresholds.cpuUsage, `CPU usage (${metrics.cpuUsage.toFixed(1)}%) exceeds threshold (${this.config.thresholds.cpuUsage}%)`);
            newAlerts.push(alert);
        }
        // Check memory usage
        if (metrics.memoryUsage > this.config.thresholds.memoryUsage) {
            const alert = this.createAlert(timestamp, 'memoryUsage', metrics.memoryUsage, this.config.thresholds.memoryUsage, `Memory usage (${metrics.memoryUsage.toFixed(1)}%) exceeds threshold (${this.config.thresholds.memoryUsage}%)`);
            newAlerts.push(alert);
        }
        // Store and notify
        this.alerts.push(...newAlerts);
        if (this.config.notifyOnIssue && newAlerts.length > 0) {
            this.notifyAlerts(newAlerts);
        }
        return newAlerts;
    }
    /**
     * Create an alert with appropriate severity
     */
    createAlert(timestamp, metric, value, threshold, message) {
        const exceedancePercent = ((value - threshold) / threshold) * 100;
        let severity;
        if (exceedancePercent > 50) {
            severity = 'critical';
        }
        else {
            severity = 'warning';
        }
        return {
            timestamp,
            severity,
            metric,
            value,
            threshold,
            message,
        };
    }
    /**
     * Notify about alerts (log to console)
     */
    notifyAlerts(alerts) {
        for (const alert of alerts) {
            const prefix = alert.severity === 'critical' ? '🚨 CRITICAL' : '⚠️  WARNING';
            console.error(`${prefix}: ${alert.message}`);
        }
    }
    /**
     * Get all alerts
     */
    getAlerts() {
        return [...this.alerts];
    }
    /**
     * Get alerts by severity
     */
    getAlertsBySeverity(severity) {
        return this.alerts.filter(a => a.severity === severity);
    }
    /**
     * Check if there are critical alerts
     */
    hasCriticalAlerts() {
        return this.alerts.some(a => a.severity === 'critical');
    }
    /**
     * Reset all alerts
     */
    reset() {
        this.alerts = [];
    }
}
//# sourceMappingURL=alertManager.js.map