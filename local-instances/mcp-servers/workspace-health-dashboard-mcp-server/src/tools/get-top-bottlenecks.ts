/**
 * Identify top bottlenecks in the workspace
 */

import { getPerformanceMetrics, getWorkflowStatuses } from '../lib/data-clients.js';
import { Bottleneck } from '../types/index.js';

export async function getTopBottlenecks(args: { limit?: number }) {
  try {
    const limit = args.limit || 5;
    const bottlenecks: Bottleneck[] = [];

    // Get data
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const metrics = await getPerformanceMetrics({ start: yesterday, end: now });
    const workflows = await getWorkflowStatuses();

    // 1. Slow MCPs (>2x baseline of 1000ms)
    const slowMcps = metrics
      .filter(m => m.avgDuration > 2000)
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 3);

    slowMcps.forEach(m => {
      bottlenecks.push({
        type: 'mcp',
        name: `${m.mcpServer}::${m.toolName}`,
        severity: m.avgDuration > 5000 ? 'high' : 'medium',
        impact: `${m.requestCount} requests affected in last 24h`,
        metric: 'avgResponseTime',
        value: m.avgDuration,
        baseline: 1000,
        recommendation: m.avgDuration > 5000
          ? 'Critical: Optimize or cache expensive operations'
          : 'Investigate slow operations and add performance monitoring',
      });
    });

    // 2. High error rate MCPs (>10%)
    const errorProneMcps = metrics
      .filter(m => m.errorRate > 0.10)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 3);

    errorProneMcps.forEach(m => {
      bottlenecks.push({
        type: 'mcp',
        name: `${m.mcpServer}::${m.toolName}`,
        severity: m.errorRate > 0.30 ? 'high' : 'medium',
        impact: `${(m.errorRate * 100).toFixed(1)}% failure rate`,
        metric: 'errorRate',
        value: m.errorRate * 100,
        baseline: 5,
        recommendation: m.errorRate > 0.30
          ? 'Critical: Fix immediately, system unstable'
          : 'Add error handling and retry logic',
      });
    });

    // 3. Stuck workflows
    const stuckWorkflows = workflows.filter(w => w.status === 'stuck');

    stuckWorkflows.forEach(w => {
      bottlenecks.push({
        type: 'workflow',
        name: w.workflowName,
        severity: (w.stuckDuration || 0) > 48 ? 'high' : 'medium',
        impact: `${w.progress.toFixed(0)}% complete, stuck for ${w.stuckDuration?.toFixed(1)}h`,
        metric: 'stuckDuration',
        value: w.stuckDuration || 0,
        baseline: 24,
        recommendation: (w.stuckDuration || 0) > 48
          ? 'Critical: Cancel or manually intervene'
          : 'Review current task and unblock dependencies',
      });
    });

    // Sort by severity and limit
    bottlenecks.sort((a, b) => {
      const severityMap = { high: 3, medium: 2, low: 1 };
      return severityMap[b.severity] - severityMap[a.severity];
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              count: bottlenecks.length,
              bottlenecks: bottlenecks.slice(0, limit),
              summary: {
                mcpIssues: bottlenecks.filter(b => b.type === 'mcp').length,
                workflowIssues: bottlenecks.filter(b => b.type === 'workflow').length,
                highSeverity: bottlenecks.filter(b => b.severity === 'high').length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
