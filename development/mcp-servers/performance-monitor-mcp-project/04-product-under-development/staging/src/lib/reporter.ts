/**
 * Reporter
 *
 * Generate reports and dashboards
 */

import { DataStore } from './data-store.js';
import { AlertManager } from './alert-manager.js';
import { AnomalyDetector } from './anomaly-detector.js';
import type { DashboardData, PerformanceReport, ReportFormat, PerformanceMetric } from '../types/index.js';

const dataStore = new DataStore();
const alertManager = new AlertManager();
const anomalyDetector = new AnomalyDetector();

export class Reporter {
  /**
   * Generate performance report
   */
  async generateReport(
    startTime: string,
    endTime: string,
    mcpServer?: string,
    format: ReportFormat = 'markdown',
    includeRecommendations = true
  ): Promise<string> {
    // Read metrics
    const metrics = await dataStore.readMetrics(startTime, endTime, mcpServer);

    // Get alerts
    const alerts = await alertManager.getActiveAlerts({ mcpServer });

    // Detect anomalies
    const anomalies = anomalyDetector.detectZScore(metrics, 'medium');

    // Build report data
    const report: PerformanceReport = {
      generatedAt: new Date().toISOString(),
      startTime,
      endTime,
      mcpServer,
      summary: {
        totalRequests: metrics.length,
        successRate: metrics.filter(m => m.success).length / metrics.length || 0,
        avgResponseTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0,
        p95ResponseTime: this.calculatePercentile(metrics.map(m => m.duration), 95),
        p99ResponseTime: this.calculatePercentile(metrics.map(m => m.duration), 99),
        errorCount: metrics.filter(m => !m.success).length,
      },
      topSlowTools: this.getTopSlowTools(metrics, 5),
      topErrorTools: this.getTopErrorTools(metrics, 5),
      anomalies,
      activeAlerts: alerts,
    };

    // Add recommendations after report is built
    if (includeRecommendations) {
      report.recommendations = this.generateRecommendations(report);
    }

    // Format report
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else {
      return this.formatMarkdown(report);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

    const metrics = await dataStore.readMetrics(startTime.toISOString(), endTime.toISOString());
    const alerts = await alertManager.getActiveAlerts();
    const anomalies = anomalyDetector.detectZScore(metrics, 'medium');

    // Group by server
    const serverMap = new Map<string, typeof metrics>();
    for (const metric of metrics) {
      if (!serverMap.has(metric.mcpServer)) {
        serverMap.set(metric.mcpServer, []);
      }
      serverMap.get(metric.mcpServer)!.push(metric);
    }

    const serverStatus = Array.from(serverMap.entries()).map(([server, serverMetrics]) => {
      const avgResponseTime = serverMetrics.reduce((sum, m) => sum + m.duration, 0) / serverMetrics.length;
      const errorRate = serverMetrics.filter(m => !m.success).length / serverMetrics.length;
      const requestsPerMinute = serverMetrics.length / 60;

      let status: 'healthy' | 'degraded' | 'critical';
      if (errorRate > 0.1 || avgResponseTime > 1000) {
        status = 'critical';
      } else if (errorRate > 0.05 || avgResponseTime > 500) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        mcpServer: server,
        avgResponseTime,
        errorRate,
        requestsPerMinute,
        status,
      };
    });

    // Find top metrics
    const sortedByDuration = [...metrics].sort((a, b) => b.duration - a.duration);
    const errorMetrics = metrics.filter(m => !m.success);

    return {
      timestamp: new Date().toISOString(),
      activeAlerts: alerts.length,
      recentAnomalies: anomalies.length,
      serverStatus,
      topMetrics: {
        slowestTool: sortedByDuration[0] ? { name: sortedByDuration[0].toolName, duration: sortedByDuration[0].duration } : { name: '', duration: 0 },
        mostErrors: errorMetrics.length > 0 ? { name: errorMetrics[0].toolName, count: errorMetrics.length } : { name: '', count: 0 },
        highestCPU: { server: '', usage: 0 },
        highestMemory: { server: '', usage: 0 },
      },
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private getTopSlowTools(metrics: PerformanceMetric[], count: number) {
    const toolMap = new Map<string, number[]>();

    for (const metric of metrics) {
      if (!toolMap.has(metric.toolName)) {
        toolMap.set(metric.toolName, []);
      }
      toolMap.get(metric.toolName)!.push(metric.duration);
    }

    return Array.from(toolMap.entries())
      .map(([toolName, durations]) => ({
        toolName,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        count: durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, count);
  }

  private getTopErrorTools(metrics: PerformanceMetric[], count: number) {
    const toolMap = new Map<string, { total: number; errors: number }>();

    for (const metric of metrics) {
      if (!toolMap.has(metric.toolName)) {
        toolMap.set(metric.toolName, { total: 0, errors: 0 });
      }
      const stats = toolMap.get(metric.toolName)!;
      stats.total++;
      if (!metric.success) stats.errors++;
    }

    return Array.from(toolMap.entries())
      .map(([toolName, stats]) => ({
        toolName,
        errorCount: stats.errors,
        errorRate: stats.errors / stats.total,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, count);
  }

  private formatMarkdown(report: PerformanceReport): string {
    return `# Performance Report

**Generated:** ${report.generatedAt}
**Period:** ${report.startTime} to ${report.endTime}
**Server:** ${report.mcpServer || 'All servers'}

## Summary

- **Total Requests:** ${report.summary.totalRequests}
- **Success Rate:** ${(report.summary.successRate * 100).toFixed(2)}%
- **Avg Response Time:** ${report.summary.avgResponseTime.toFixed(2)}ms
- **P95 Response Time:** ${report.summary.p95ResponseTime.toFixed(2)}ms
- **P99 Response Time:** ${report.summary.p99ResponseTime.toFixed(2)}ms
- **Error Count:** ${report.summary.errorCount}

## Top Slow Tools

${report.topSlowTools.map(t => `- **${t.toolName}**: ${t.avgDuration.toFixed(2)}ms avg (${t.count} calls)`).join('\n')}

## Top Error Tools

${report.topErrorTools.map(t => `- **${t.toolName}**: ${t.errorCount} errors (${(t.errorRate * 100).toFixed(2)}% rate)`).join('\n')}

## Anomalies

- **Total:** ${report.anomalies.length}
- **Critical:** ${report.anomalies.filter(a => a.severity === 'critical').length}
- **Warning:** ${report.anomalies.filter(a => a.severity === 'warning').length}

## Active Alerts

- **Total:** ${report.activeAlerts.length}

${report.recommendations ? `## Recommendations\n\n${report.recommendations.join('\n')}` : ''}
`;
  }

  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    if (report.summary.errorCount > report.summary.totalRequests * 0.05) {
      recommendations.push('- High error rate detected. Investigate failing tools.');
    }

    if (report.summary.p95ResponseTime > 1000) {
      recommendations.push('- P95 response time exceeds 1 second. Consider optimization.');
    }

    if (report.anomalies.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('- Critical anomalies detected. Immediate investigation recommended.');
    }

    return recommendations;
  }
}
