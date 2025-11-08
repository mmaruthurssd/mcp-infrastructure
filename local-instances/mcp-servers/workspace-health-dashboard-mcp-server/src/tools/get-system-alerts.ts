/**
 * Get critical system alerts
 */

import { getMcpStatuses } from '../lib/health-scoring.js';
import { getAutonomousResolutionMetrics, getWorkflowStatuses } from '../lib/data-clients.js';
import { SystemAlert } from '../types/index.js';
import { existsSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export async function getSystemAlerts(_args: any) {
  try {
    const alerts: SystemAlert[] = [];
    let alertId = 1;

    // 1. Check MCP error rates
    const mcpStatuses = await getMcpStatuses();
    const criticalMcps = mcpStatuses.filter(m => m.errorRate > 10);

    criticalMcps.forEach(m => {
      alerts.push({
        id: `ALERT-${String(alertId++).padStart(3, '0')}`,
        severity: m.errorRate > 20 ? 'critical' : 'warning',
        type: 'MCP_ERROR_RATE',
        message: `${m.name} has ${m.errorRate.toFixed(1)}% error rate`,
        details: `${m.requestCount24h} requests in last 24h, ${m.errorRate.toFixed(1)}% failed`,
        action: m.errorRate > 20
          ? 'Immediate investigation required - disable MCP if unstable'
          : 'Review error logs and add error handling',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    });

    // 2. Check autonomous resolution success rate
    const autoMetrics = await getAutonomousResolutionMetrics();
    if (autoMetrics.successRate7d < 70) {
      alerts.push({
        id: `ALERT-${String(alertId++).padStart(3, '0')}`,
        severity: 'critical',
        type: 'AUTONOMOUS_SUCCESS_RATE',
        message: `Autonomous success rate critically low: ${autoMetrics.successRate7d.toFixed(1)}%`,
        details: `7-day success rate: ${autoMetrics.successRate7d.toFixed(1)}%, 30-day: ${autoMetrics.successRate30d.toFixed(1)}%`,
        action: 'Review recent failures, check confidence calibration, investigate root causes',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    } else if (autoMetrics.successRate7d < 80) {
      alerts.push({
        id: `ALERT-${String(alertId++).padStart(3, '0')}`,
        severity: 'warning',
        type: 'AUTONOMOUS_SUCCESS_RATE',
        message: `Autonomous success rate below target: ${autoMetrics.successRate7d.toFixed(1)}%`,
        details: `Target: 80%, Current 7-day: ${autoMetrics.successRate7d.toFixed(1)}%`,
        action: 'Monitor trend, review recent failures, consider retraining',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // 3. Check stuck workflows
    const workflows = await getWorkflowStatuses();
    const stuckWorkflows = workflows.filter(w => w.status === 'stuck' && (w.stuckDuration || 0) > 24);

    stuckWorkflows.forEach(w => {
      alerts.push({
        id: `ALERT-${String(alertId++).padStart(3, '0')}`,
        severity: (w.stuckDuration || 0) > 48 ? 'critical' : 'warning',
        type: 'WORKFLOW_STUCK',
        message: `Workflow stuck: ${w.workflowName}`,
        details: `Progress: ${w.progress.toFixed(0)}%, stuck for ${w.stuckDuration?.toFixed(1)} hours`,
        action: (w.stuckDuration || 0) > 48
          ? 'Critical: Manual intervention required - cancel or fix blocking issues'
          : 'Review current task, check dependencies, consider timeout',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    });

    // 4. Check disk space (workspace-brain directory)
    try {
      const workspaceBrainPath = join(homedir(), 'workspace-brain');
      if (existsSync(workspaceBrainPath)) {
        // Simple check - in production would use df or similar
        const stats = statSync(workspaceBrainPath);
        // Placeholder - would need actual disk usage calculation
      }
    } catch (err) {
      // Ignore disk check errors
    }

    // 5. Check calibration drift (placeholder for Agent 3)
    // This will be populated when confidence calibration is implemented
    if (false) { // Disabled until Agent 3 completes
      alerts.push({
        id: `ALERT-${String(alertId++).padStart(3, '0')}`,
        severity: 'warning',
        type: 'CALIBRATION_DRIFT',
        message: 'Confidence calibration drift detected',
        details: 'Predicted confidence diverging from actual success rates',
        action: 'Run calibration analysis and retrain confidence model',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Sort by severity
    alerts.sort((a, b) => {
      const severityMap = { critical: 3, warning: 2, info: 1 };
      return severityMap[b.severity] - severityMap[a.severity];
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              alertCount: alerts.length,
              criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
              warningAlerts: alerts.filter(a => a.severity === 'warning').length,
              alerts,
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
