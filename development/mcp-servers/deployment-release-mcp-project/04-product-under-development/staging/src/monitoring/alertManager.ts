import type { Alert, AlertSeverity, AlertThresholds, MetricsData } from '../types.js';

export interface AlertConfig {
  thresholds: Required<AlertThresholds>;
  notifyOnIssue: boolean;
}

export class AlertManager {
  private alerts: Alert[] = [];
  private config: AlertConfig;

  constructor(thresholds: AlertThresholds = {}, notifyOnIssue: boolean = false) {
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
  checkMetrics(metrics: MetricsData): Alert[] {
    const newAlerts: Alert[] = [];
    const timestamp = new Date().toISOString();

    // Check error rate
    if (metrics.errorRate > this.config.thresholds.errorRate) {
      const alert = this.createAlert(
        timestamp,
        'errorRate',
        metrics.errorRate,
        this.config.thresholds.errorRate,
        `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds threshold (${this.config.thresholds.errorRate}%)`
      );
      newAlerts.push(alert);
    }

    // Check response time
    if (metrics.avgResponseTime > this.config.thresholds.responseTime) {
      const alert = this.createAlert(
        timestamp,
        'avgResponseTime',
        metrics.avgResponseTime,
        this.config.thresholds.responseTime,
        `Average response time (${metrics.avgResponseTime.toFixed(0)}ms) exceeds threshold (${this.config.thresholds.responseTime}ms)`
      );
      newAlerts.push(alert);
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.config.thresholds.cpuUsage) {
      const alert = this.createAlert(
        timestamp,
        'cpuUsage',
        metrics.cpuUsage,
        this.config.thresholds.cpuUsage,
        `CPU usage (${metrics.cpuUsage.toFixed(1)}%) exceeds threshold (${this.config.thresholds.cpuUsage}%)`
      );
      newAlerts.push(alert);
    }

    // Check memory usage
    if (metrics.memoryUsage > this.config.thresholds.memoryUsage) {
      const alert = this.createAlert(
        timestamp,
        'memoryUsage',
        metrics.memoryUsage,
        this.config.thresholds.memoryUsage,
        `Memory usage (${metrics.memoryUsage.toFixed(1)}%) exceeds threshold (${this.config.thresholds.memoryUsage}%)`
      );
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
  private createAlert(
    timestamp: string,
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): Alert {
    const exceedancePercent = ((value - threshold) / threshold) * 100;
    let severity: AlertSeverity;

    if (exceedancePercent > 50) {
      severity = 'critical';
    } else {
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
  private notifyAlerts(alerts: Alert[]): void {
    for (const alert of alerts) {
      const prefix = alert.severity === 'critical' ? '🚨 CRITICAL' : '⚠️  WARNING';
      console.error(`${prefix}: ${alert.message}`);
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Check if there are critical alerts
   */
  hasCriticalAlerts(): boolean {
    return this.alerts.some(a => a.severity === 'critical');
  }

  /**
   * Reset all alerts
   */
  reset(): void {
    this.alerts = [];
  }
}
