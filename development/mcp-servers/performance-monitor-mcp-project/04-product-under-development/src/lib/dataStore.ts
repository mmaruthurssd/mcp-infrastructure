import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PerformanceMetric,
  MetricFilter,
  Anomaly,
  AnomalyFilter,
  Alert,
  AlertFilter,
  HourlyAggregate,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DataStore - Handles persistence of metrics, anomalies, and alerts
 *
 * Storage structure:
 * .performance-data/
 * ├── metrics/[date]/[mcpServer]/[toolName].jsonl
 * ├── aggregates/hourly/[date-hour].json
 * ├── aggregates/daily/[date].json
 * ├── anomalies/[date].jsonl
 * ├── alerts/active-alerts.json
 * └── config/thresholds.json
 */
export class DataStore {
  private dataDir: string;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_INTERVAL = 1000; // 1 second

  constructor(dataDir?: string) {
    // Default to workspace root .performance-data/
    this.dataDir = dataDir || path.join(
      __dirname,
      '../../../../../../.performance-data'
    );
  }

  /**
   * Initialize data directories
   */
  async initialize(): Promise<void> {
    const dirs = [
      path.join(this.dataDir, 'metrics'),
      path.join(this.dataDir, 'aggregates/hourly'),
      path.join(this.dataDir, 'aggregates/daily'),
      path.join(this.dataDir, 'anomalies'),
      path.join(this.dataDir, 'alerts'),
      path.join(this.dataDir, 'config'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Write metrics (batched for performance)
   */
  async writeMetrics(metrics: PerformanceMetric[]): Promise<void> {
    this.metricsBuffer.push(...metrics);

    // Flush if batch size reached
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      await this.flush();
    } else {
      // Schedule flush after interval
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), this.BATCH_INTERVAL);
      }
    }
  }

  /**
   * Flush metrics buffer to disk
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.metricsBuffer.length === 0) return;

    const metricsToWrite = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Group metrics by date, MCP server, and tool name
    const grouped = new Map<string, PerformanceMetric[]>();

    for (const metric of metricsToWrite) {
      const date = metric.timestamp.split('T')[0];
      const key = `${date}/${metric.mcpServer}/${metric.toolName}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Write each group to its file
    for (const [key, metrics] of grouped) {
      const filePath = path.join(this.dataDir, 'metrics', `${key}.jsonl`);
      await this.ensureDir(path.dirname(filePath));

      const lines = metrics.map((m: PerformanceMetric) => JSON.stringify(m)).join('\n') + '\n';
      await fs.appendFile(filePath, lines, 'utf8');
    }
  }

  /**
   * Read metrics with filtering
   */
  async readMetrics(filter: MetricFilter): Promise<PerformanceMetric[]> {
    // Flush any pending writes first
    await this.flush();

    const startDate = new Date(filter.startTime);
    const endDate = new Date(filter.endTime);
    const metrics: PerformanceMetric[] = [];

    // Iterate through dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const datePath = path.join(this.dataDir, 'metrics', dateStr);

      try {
        // If MCP server specified, only check that directory
        if (filter.mcpServer) {
          const mcpPath = path.join(datePath, filter.mcpServer);
          const toolMetrics = await this.readMetricsFromDirectory(
            mcpPath,
            filter,
            dateStr
          );
          metrics.push(...toolMetrics);
        } else {
          // Read all MCP servers
          const mcpDirs = await fs.readdir(datePath).catch(() => []);
          for (const mcpDir of mcpDirs) {
            const mcpPath = path.join(datePath, mcpDir);
            const toolMetrics = await this.readMetricsFromDirectory(
              mcpPath,
              filter,
              dateStr
            );
            metrics.push(...toolMetrics);
          }
        }
      } catch (error) {
        // Directory doesn't exist - no metrics for this date
        continue;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter by time range
    return metrics.filter((m: PerformanceMetric) => {
      const timestamp = new Date(m.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
  }

  /**
   * Read metrics from a directory (MCP server directory)
   */
  private async readMetricsFromDirectory(
    dirPath: string,
    filter: MetricFilter,
    dateStr: string
  ): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        // If tool name specified, only read matching files
        if (filter.toolName && !file.startsWith(filter.toolName)) {
          continue;
        }

        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          if (!line) continue;
          try {
            const metric = JSON.parse(line) as PerformanceMetric;
            metrics.push(metric);
          } catch (error) {
            console.error(`Error parsing metric line: ${line}`, error);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
      return [];
    }

    return metrics;
  }

  /**
   * Write anomaly
   */
  async writeAnomaly(anomaly: Anomaly): Promise<void> {
    const date = anomaly.timestamp.split('T')[0];
    const filePath = path.join(this.dataDir, 'anomalies', `${date}.jsonl`);

    await this.ensureDir(path.dirname(filePath));
    await fs.appendFile(filePath, JSON.stringify(anomaly) + '\n', 'utf8');
  }

  /**
   * Read anomalies with filtering
   */
  async readAnomalies(filter: AnomalyFilter): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const anomaliesPath = path.join(this.dataDir, 'anomalies');

    try {
      const files = await fs.readdir(anomaliesPath);

      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue;

        const filePath = path.join(anomaliesPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          if (!line) continue;
          try {
            const anomaly = JSON.parse(line) as Anomaly;

            // Apply filters
            if (filter.mcpServer && anomaly.mcpServer !== filter.mcpServer) continue;
            if (filter.toolName && anomaly.toolName !== filter.toolName) continue;
            if (filter.startTime && anomaly.timestamp < filter.startTime) continue;
            if (filter.endTime && anomaly.timestamp > filter.endTime) continue;

            anomalies.push(anomaly);
          } catch (error) {
            console.error(`Error parsing anomaly line: ${line}`, error);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
      return [];
    }

    return anomalies;
  }

  /**
   * Write alert
   */
  async writeAlert(alert: Alert): Promise<void> {
    const filePath = path.join(this.dataDir, 'alerts', 'active-alerts.json');

    // Read existing alerts
    const alerts = await this.readAlerts({});

    // Add or update alert
    const existingIndex = alerts.findIndex((a: Alert) => a.alertId === alert.alertId);
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.push(alert);
    }

    // Write back
    await this.ensureDir(path.dirname(filePath));
    await this.writeAtomic(filePath, JSON.stringify({ lastUpdated: new Date().toISOString(), alerts }, null, 2));
  }

  /**
   * Read alerts with filtering
   */
  async readAlerts(filter: AlertFilter): Promise<Alert[]> {
    const filePath = path.join(this.dataDir, 'alerts', 'active-alerts.json');

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      let alerts = data.alerts as Alert[];

      // Apply filters
      if (filter.severity) {
        alerts = alerts.filter((a: Alert) => a.severity === filter.severity);
      }
      if (filter.mcpServer) {
        alerts = alerts.filter((a: Alert) => a.mcpServer === filter.mcpServer);
      }
      if (filter.status) {
        alerts = alerts.filter((a: Alert) => a.status === filter.status);
      }

      return alerts;
    } catch (error) {
      // File doesn't exist
      return [];
    }
  }

  /**
   * Delete metrics before a certain date
   */
  async deleteMetricsBefore(date: Date): Promise<void> {
    const metricsPath = path.join(this.dataDir, 'metrics');
    const threshold = date.toISOString().split('T')[0];

    try {
      const dates = await fs.readdir(metricsPath);

      for (const dateDir of dates) {
        if (dateDir < threshold) {
          const dirPath = path.join(metricsPath, dateDir);
          await fs.rm(dirPath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.error('Error deleting old metrics:', error);
    }
  }

  /**
   * Delete aggregates before a certain date
   */
  async deleteAggregatesBefore(date: Date, type: 'hourly' | 'daily'): Promise<void> {
    const aggregatesPath = path.join(this.dataDir, 'aggregates', type);
    const threshold = date.toISOString().split('T')[0];

    try {
      const files = await fs.readdir(aggregatesPath);

      for (const file of files) {
        const fileDate = file.split('.')[0].split('-').slice(0, 3).join('-');
        if (fileDate < threshold) {
          const filePath = path.join(aggregatesPath, file);
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting old aggregates:', error);
    }
  }

  /**
   * Delete anomalies before a certain date
   */
  async deleteAnomaliesBefore(date: Date): Promise<void> {
    const anomaliesPath = path.join(this.dataDir, 'anomalies');
    const threshold = date.toISOString().split('T')[0];

    try {
      const files = await fs.readdir(anomaliesPath);

      for (const file of files) {
        const fileDate = file.replace('.jsonl', '');
        if (fileDate < threshold) {
          const filePath = path.join(anomaliesPath, file);
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting old anomalies:', error);
    }
  }

  /**
   * Archive resolved alerts before a certain date
   */
  async archiveAlertsBefore(date: Date): Promise<void> {
    const alerts = await this.readAlerts({});
    const threshold = date.getTime();

    const activeAlerts = alerts.filter((a: Alert) => {
      if (a.status !== 'resolved') return true;
      if (!a.resolvedAt) return true;
      return new Date(a.resolvedAt).getTime() >= threshold;
    });

    // Archive old resolved alerts
    const archivedAlerts = alerts.filter((a: Alert) => {
      if (a.status !== 'resolved') return false;
      if (!a.resolvedAt) return false;
      return new Date(a.resolvedAt).getTime() < threshold;
    });

    if (archivedAlerts.length > 0) {
      const archivePath = path.join(this.dataDir, 'alerts', 'history');
      await this.ensureDir(archivePath);

      const archiveFile = path.join(archivePath, `${date.toISOString().split('T')[0]}.jsonl`);
      const lines = archivedAlerts.map((a: Alert) => JSON.stringify(a)).join('\n') + '\n';
      await fs.appendFile(archiveFile, lines, 'utf8');
    }

    // Update active alerts file
    const filePath = path.join(this.dataDir, 'alerts', 'active-alerts.json');
    await this.writeAtomic(filePath, JSON.stringify({ lastUpdated: new Date().toISOString(), alerts: activeAlerts }, null, 2));
  }

  /**
   * Write hourly aggregate
   */
  async writeAggregate(aggregate: HourlyAggregate, type: 'hourly' | 'daily'): Promise<void> {
    const date = aggregate.timestamp.split('T')[0];
    const hour = type === 'hourly' ? aggregate.timestamp.split('T')[1].split(':')[0] : '';
    const filename = type === 'hourly' ? `${date}-${hour}.json` : `${date}.json`;

    const filePath = path.join(this.dataDir, 'aggregates', type, filename);
    await this.ensureDir(path.dirname(filePath));

    await this.writeAtomic(filePath, JSON.stringify(aggregate, null, 2));
  }

  /**
   * Atomic write (write to temp file, then rename)
   */
  private async writeAtomic(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, { mode: 0o600 });
    await fs.rename(tempPath, filePath);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
  }

  /**
   * Cleanup on shutdown
   */
  async close(): Promise<void> {
    await this.flush();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }
}
