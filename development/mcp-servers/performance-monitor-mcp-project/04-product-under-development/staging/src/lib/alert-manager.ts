/**
 * Alert Manager
 *
 * Threshold-based alerting with lifecycle management
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Alert, AlertThreshold, AlertSeverity, AlertStatus } from '../types/index.js';

export class AlertManager {
  private dataDir = '.performance-data';

  /**
   * Create a new alert threshold
   */
  async createThreshold(threshold: Omit<AlertThreshold, 'id' | 'createdAt'>): Promise<AlertThreshold> {
    const newThreshold: AlertThreshold = {
      ...threshold,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    // Save to file
    const thresholdsPath = join(this.dataDir, 'alerts', 'thresholds.jsonl');
    await fs.mkdir(join(this.dataDir, 'alerts'), { recursive: true });
    await fs.appendFile(thresholdsPath, JSON.stringify(newThreshold) + '\n', 'utf-8');

    return newThreshold;
  }

  /**
   * Get all active alerts
   */
  async getActiveAlerts(filters?: {
    mcpServer?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
  }): Promise<Alert[]> {
    const alertsPath = join(this.dataDir, 'alerts', 'active.jsonl');

    try {
      const content = await fs.readFile(alertsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      let alerts: Alert[] = lines.map(line => JSON.parse(line));

      // Apply filters
      if (filters?.mcpServer) {
        alerts = alerts.filter(a => a.mcpServer === filters.mcpServer);
      }
      if (filters?.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters?.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }

      return alerts;
    } catch {
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<void> {
    const alertsPath = join(this.dataDir, 'alerts', 'active.jsonl');

    try {
      const content = await fs.readFile(alertsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      const updatedLines = lines.map(line => {
        const alert: Alert = JSON.parse(line);
        if (alert.id === alertId) {
          return JSON.stringify({
            ...alert,
            status: 'acknowledged' as AlertStatus,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy,
            notes,
          });
        }
        return line;
      });

      await fs.writeFile(alertsPath, updatedLines.join('\n') + '\n', 'utf-8');
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error}`);
    }
  }

  /**
   * Create alert
   */
  async createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: randomUUID(),
      triggeredAt: new Date().toISOString(),
    };

    const alertsPath = join(this.dataDir, 'alerts', 'active.jsonl');
    await fs.mkdir(join(this.dataDir, 'alerts'), { recursive: true });
    await fs.appendFile(alertsPath, JSON.stringify(newAlert) + '\n', 'utf-8');

    return newAlert;
  }

  /**
   * Check if metric value exceeds threshold
   */
  checkThreshold(value: number, threshold: AlertThreshold): boolean {
    return value > threshold.threshold;
  }
}
