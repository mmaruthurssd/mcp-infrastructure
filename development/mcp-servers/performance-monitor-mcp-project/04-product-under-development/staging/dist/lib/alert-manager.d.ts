/**
 * Alert Manager
 *
 * Threshold-based alerting with lifecycle management
 */
import type { Alert, AlertThreshold, AlertSeverity, AlertStatus } from '../types/index.js';
export declare class AlertManager {
    private dataDir;
    /**
     * Create a new alert threshold
     */
    createThreshold(threshold: Omit<AlertThreshold, 'id' | 'createdAt'>): Promise<AlertThreshold>;
    /**
     * Get all active alerts
     */
    getActiveAlerts(filters?: {
        mcpServer?: string;
        severity?: AlertSeverity;
        status?: AlertStatus;
    }): Promise<Alert[]>;
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<void>;
    /**
     * Create alert
     */
    createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Promise<Alert>;
    /**
     * Check if metric value exceeds threshold
     */
    checkThreshold(value: number, threshold: AlertThreshold): boolean;
}
//# sourceMappingURL=alert-manager.d.ts.map