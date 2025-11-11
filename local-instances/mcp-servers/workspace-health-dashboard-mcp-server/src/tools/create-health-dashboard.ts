/**
 * Create formatted health dashboard
 */

import { calculateHealthScore, getMcpStatuses } from '../lib/health-scoring.js';
import { getAutonomousResolutionMetrics, getWorkflowStatuses, getAutomationOpportunities as getOpps } from '../lib/data-clients.js';

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}

export async function createHealthDashboard(args: { format?: 'markdown' | 'json' }) {
  try {
    const format = args.format || 'markdown';

    // Gather all data
    const health = await calculateHealthScore();
    const mcpStatuses = await getMcpStatuses();
    const autoMetrics = await getAutonomousResolutionMetrics();
    const workflows = await getWorkflowStatuses();
    const opportunities = await getOpps();

    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                health,
                mcpStatuses,
                autoMetrics,
                workflows,
                opportunities: opportunities.slice(0, 5),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Generate markdown dashboard
    const statusEmoji = getStatusEmoji(health.status);
    const healthyMcps = mcpStatuses.filter(m => m.status === 'healthy').length;
    const warningMcps = mcpStatuses.filter(m => m.status === 'warning').length;
    const criticalMcps = mcpStatuses.filter(m => m.status === 'critical').length;
    const inactiveMcps = mcpStatuses.filter(m => m.status === 'inactive').length;

    const stuckWorkflows = workflows.filter(w => w.status === 'stuck');
    const runningWorkflows = workflows.filter(w => w.status === 'running');

    let dashboard = `# Workspace Health Dashboard\n\n`;
    dashboard += `Generated: ${new Date().toLocaleString()}\n\n`;
    dashboard += `---\n\n`;

    // Overall Health
    dashboard += `## Overall Health: ${health.score}/100 ${statusEmoji}\n\n`;
    dashboard += `**Status:** ${health.status.toUpperCase()}\n\n`;

    if (health.topIssues.length > 0) {
      dashboard += `### Top Issues\n`;
      health.topIssues.forEach((issue, i) => {
        dashboard += `${i + 1}. ${issue}\n`;
      });
      dashboard += `\n`;
    }

    // Health Breakdown
    dashboard += `### Health Breakdown\n`;
    dashboard += `- MCP Health: ${health.breakdown.mcpHealth}/100\n`;
    dashboard += `- Autonomous Resolution: ${health.breakdown.autonomousResolution}/100\n`;
    dashboard += `- Workflow Completion: ${health.breakdown.workflowCompletion}/100\n`;
    dashboard += `- System Resources: ${health.breakdown.systemResources}/100\n\n`;

    // MCP Status
    dashboard += `## MCP Status (${mcpStatuses.length} total)\n\n`;
    dashboard += `🟢 ${healthyMcps} healthy | `;
    dashboard += `🟡 ${warningMcps} warnings | `;
    dashboard += `🔴 ${criticalMcps} critical | `;
    dashboard += `⚪ ${inactiveMcps} inactive\n\n`;

    // Show warnings and critical
    const problemMcps = mcpStatuses.filter(m => m.status === 'warning' || m.status === 'critical');
    if (problemMcps.length > 0) {
      dashboard += `### Issues Detected\n`;
      problemMcps.slice(0, 5).forEach(m => {
        const emoji = getStatusEmoji(m.status);
        dashboard += `${emoji} **${m.name}**: `;
        if (m.errorRate > 5) {
          dashboard += `${m.errorRate.toFixed(1)}% error rate`;
        }
        if (m.avgResponseTime > 2000) {
          dashboard += ` | ${(m.avgResponseTime / 1000).toFixed(1)}s avg response`;
        }
        dashboard += `\n`;
      });
      dashboard += `\n`;
    }

    // Autonomous Resolution
    dashboard += `## Autonomous Resolution\n\n`;
    dashboard += `- **Total Resolutions:** ${autoMetrics.totalResolutions}\n`;
    dashboard += `- **Success Rate (7d):** ${autoMetrics.successRate7d.toFixed(1)}% `;
    dashboard += `${autoMetrics.trend === 'improving' ? '📈' : autoMetrics.trend === 'declining' ? '📉' : '➡️'}\n`;
    dashboard += `- **Success Rate (30d):** ${autoMetrics.successRate30d.toFixed(1)}%\n`;
    dashboard += `- **Avg Resolution Time:** ${autoMetrics.avgResolutionTime.toFixed(0)} min\n`;

    if (autoMetrics.roiMetrics && autoMetrics.roiMetrics.netValue > 0) {
      dashboard += `- **ROI:** $${autoMetrics.roiMetrics.netValue.toFixed(0)} net value\n`;
    }
    dashboard += `\n`;

    // Workflows
    if (workflows.length > 0) {
      dashboard += `## Active Workflows\n\n`;
      dashboard += `- Running: ${runningWorkflows.length}\n`;
      dashboard += `- Stuck: ${stuckWorkflows.length}\n\n`;

      if (stuckWorkflows.length > 0) {
        dashboard += `### Stuck Workflows (Action Required)\n`;
        stuckWorkflows.forEach(w => {
          dashboard += `- **${w.workflowName}**: ${w.progress.toFixed(0)}% complete, stuck ${w.stuckDuration?.toFixed(1)}h\n`;
        });
        dashboard += `\n`;
      }
    }

    // Top Bottlenecks
    const bottlenecks = [];
    const slowMcps = mcpStatuses
      .filter(m => m.avgResponseTime > 2000 && m.status !== 'inactive')
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 3);

    if (slowMcps.length > 0 || stuckWorkflows.length > 0) {
      dashboard += `## Top Bottlenecks\n\n`;
      let rank = 1;

      stuckWorkflows.forEach(w => {
        dashboard += `${rank++}. **Workflow stuck:** ${w.workflowName} (${w.stuckDuration?.toFixed(1)}h)\n`;
      });

      slowMcps.forEach(m => {
        dashboard += `${rank++}. **Slow MCP:** ${m.name} (${(m.avgResponseTime / 1000).toFixed(1)}s avg)\n`;
      });

      dashboard += `\n`;
    }

    // Automation Opportunities
    if (opportunities.length > 0) {
      dashboard += `## Automation Opportunities\n\n`;
      opportunities.slice(0, 3).forEach((opp, i) => {
        dashboard += `${i + 1}. **${opp.pattern}** (${opp.frequency}x/week, ${opp.avgDuration.toFixed(0)}min each)\n`;
        dashboard += `   - ROI: $${opp.potentialRoi.toFixed(0)}/month | Effort: ${opp.effortEstimate}\n`;
      });
      dashboard += `\n`;
    }

    // Quick Actions
    dashboard += `## Recommended Actions\n\n`;
    if (health.score < 70) {
      dashboard += `⚠️ **Critical health score** - Immediate attention required\n`;
    }
    if (criticalMcps > 0) {
      dashboard += `🔴 Fix ${criticalMcps} critical MCP${criticalMcps > 1 ? 's' : ''}\n`;
    }
    if (stuckWorkflows.length > 0) {
      dashboard += `🔧 Unblock ${stuckWorkflows.length} stuck workflow${stuckWorkflows.length > 1 ? 's' : ''}\n`;
    }
    if (autoMetrics.successRate7d < 80) {
      dashboard += `📊 Investigate autonomous resolution decline\n`;
    }
    if (health.score >= 85) {
      dashboard += `✅ System healthy - continue monitoring\n`;
    }

    dashboard += `\n---\n\n`;
    dashboard += `*Refresh every 60 seconds for real-time updates*\n`;

    return {
      content: [
        {
          type: 'text',
          text: dashboard,
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
