import { exec } from 'child_process';
import { promisify } from 'util';
import * as http from 'http';
import * as https from 'https';
import type { MetricsData } from '../types.js';

const execAsync = promisify(exec);

export interface MetricsSnapshot {
  timestamp: string;
  errorRate: number;
  avgResponseTime: number;
  requestRate: number;
  cpuUsage: number;
  memoryUsage: number;
  serviceHealthy: boolean;
  errors: string[];
}

export class MetricsCollector {
  private snapshots: MetricsSnapshot[] = [];
  private errorCount = 0;
  private requestCount = 0;
  private responseTimes: number[] = [];

  /**
   * Collect a single snapshot of all metrics
   */
  async collectSnapshot(healthCheckUrl?: string): Promise<MetricsSnapshot> {
    const timestamp = new Date().toISOString();
    const errors: string[] = [];

    // Collect system metrics
    const cpuUsage = await this.getCpuUsage().catch(err => {
      errors.push(`CPU metric failed: ${err.message}`);
      return 0;
    });

    const memoryUsage = await this.getMemoryUsage().catch(err => {
      errors.push(`Memory metric failed: ${err.message}`);
      return 0;
    });

    // Collect application metrics
    const serviceHealth = healthCheckUrl
      ? await this.checkServiceHealth(healthCheckUrl).catch(err => {
          errors.push(`Health check failed: ${err.message}`);
          return { healthy: false, responseTime: 0 };
        })
      : { healthy: true, responseTime: 0 };

    if (serviceHealth.responseTime > 0) {
      this.responseTimes.push(serviceHealth.responseTime);
      this.requestCount++;
      if (!serviceHealth.healthy) {
        this.errorCount++;
      }
    }

    // Calculate application metrics
    const errorRate = this.requestCount > 0
      ? (this.errorCount / this.requestCount) * 100
      : 0;

    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    const requestRate = this.requestCount; // Simplified: total requests

    const snapshot: MetricsSnapshot = {
      timestamp,
      errorRate,
      avgResponseTime,
      requestRate,
      cpuUsage,
      memoryUsage,
      serviceHealthy: serviceHealth.healthy,
      errors,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    if (process.platform === 'darwin') {
      // macOS
      const { stdout } = await execAsync('ps -A -o %cpu | awk \'{s+=$1} END {print s}\'');
      return parseFloat(stdout.trim()) || 0;
    } else if (process.platform === 'linux') {
      // Linux
      const { stdout } = await execAsync('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
      return parseFloat(stdout.trim()) || 0;
    } else {
      // Windows or other - return 0
      return 0;
    }
  }

  /**
   * Get memory usage percentage
   */
  private async getMemoryUsage(): Promise<number> {
    if (process.platform === 'darwin') {
      // macOS
      const { stdout } = await execAsync('vm_stat | grep "Pages active" | awk \'{print $3}\' | sed \'s/\\.$//\'');
      const activePages = parseFloat(stdout.trim()) || 0;
      const { stdout: totalOut } = await execAsync('sysctl -n hw.memsize');
      const totalMemory = parseFloat(totalOut.trim()) || 1;
      const pageSize = 4096; // bytes
      return (activePages * pageSize / totalMemory) * 100;
    } else if (process.platform === 'linux') {
      // Linux
      const { stdout } = await execAsync('free | grep Mem | awk \'{print ($3/$2) * 100.0}\'');
      return parseFloat(stdout.trim()) || 0;
    } else {
      // Windows or other - return 0
      return 0;
    }
  }

  /**
   * Check service health via HTTP/HTTPS endpoint
   */
  private async checkServiceHealth(url: string): Promise<{ healthy: boolean; responseTime: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        const responseTime = Date.now() - startTime;
        const healthy = res.statusCode ? res.statusCode >= 200 && res.statusCode < 400 : false;

        // Consume response data
        res.on('data', () => {});
        res.on('end', () => {
          resolve({ healthy, responseTime });
        });
      });

      req.on('error', (err) => {
        const responseTime = Date.now() - startTime;
        reject(new Error(`Health check request failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });
  }

  /**
   * Calculate aggregated metrics from all snapshots
   */
  getAggregatedMetrics(): MetricsData {
    if (this.snapshots.length === 0) {
      return {
        errorRate: 0,
        avgResponseTime: 0,
        requestRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      };
    }

    const sum = this.snapshots.reduce(
      (acc, snapshot) => ({
        errorRate: acc.errorRate + snapshot.errorRate,
        avgResponseTime: acc.avgResponseTime + snapshot.avgResponseTime,
        requestRate: acc.requestRate + snapshot.requestRate,
        cpuUsage: acc.cpuUsage + snapshot.cpuUsage,
        memoryUsage: acc.memoryUsage + snapshot.memoryUsage,
      }),
      { errorRate: 0, avgResponseTime: 0, requestRate: 0, cpuUsage: 0, memoryUsage: 0 }
    );

    const count = this.snapshots.length;

    return {
      errorRate: sum.errorRate / count,
      avgResponseTime: sum.avgResponseTime / count,
      requestRate: this.requestCount, // Total requests across all snapshots
      cpuUsage: sum.cpuUsage / count,
      memoryUsage: sum.memoryUsage / count,
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get all errors from snapshots
   */
  getAllErrors(): string[] {
    return this.snapshots.flatMap(s => s.errors);
  }

  /**
   * Reset all collected data
   */
  reset(): void {
    this.snapshots = [];
    this.errorCount = 0;
    this.requestCount = 0;
    this.responseTimes = [];
  }
}
