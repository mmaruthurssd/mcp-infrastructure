# Workspace Health Dashboard MCP

**Version:** 1.0.0
**Status:** Production Ready

## Overview

The Workspace Health Dashboard MCP provides a unified "mission control" view of your entire workspace health. It aggregates data from 22+ MCPs, autonomous resolution frameworks, workflow systems, and performance monitors to give you a single pane of glass for workspace status.

## Features

### 7 Core Tools

1. **get_workspace_health** - Overall health score (0-100)
2. **get_mcp_status** - Status of all 22 MCPs
3. **get_autonomous_metrics** - Autonomous resolution performance
4. **get_top_bottlenecks** - Identify slowest operations
5. **get_automation_opportunities** - ROI-prioritized automation suggestions
6. **get_system_alerts** - Critical issues requiring attention
7. **create_health_dashboard** - Formatted dashboard output

### Health Scoring Algorithm

The health score starts at 100 and applies penalties/bonuses:

**Penalties:**
- -10 points per critical MCP error (>15% error rate)
- -5 points per warning MCP error (5-15% error rate)
- -3 points per slow MCP (>2s average response)
- -20 points if autonomous success rate <70%
- -10 points if autonomous success rate <80%
- -5 points per stuck workflow (>24h)
- -3 points per failed workflow

**Bonuses:**
- +5 points if autonomous success rate >95%
- +5 points if zero MCP errors
- +5 points if zero stuck/failed workflows

**Status Thresholds:**
- **Healthy (🟢):** 85-100
- **Warning (🟡):** 70-84
- **Critical (🔴):** 0-69

### Data Sources

- **performance-monitor-mcp:** MCP error rates, response times
- **workspace-brain-mcp:** Autonomous resolution metrics, telemetry
- **task-executor-mcp:** Workflow status, stuck workflows
- **project-management-mcp:** Goal completion rates
- **~/.claude.json:** Registered MCP inventory

### Caching Strategy

All data is cached for 60 seconds to prevent excessive calls to other MCPs. Cache can be invalidated manually if needed.

## Installation

### 1. Build the MCP

```bash
cd /Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/workspace-health-dashboard-mcp-server
npm install
npm run build
```

### 2. Register in Claude Config

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "workspace-health-dashboard": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/workspace-health-dashboard-mcp-server/dist/index.js"
      ]
    }
  }
}
```

### 3. Restart Claude Desktop

## Usage Examples

### Get Overall Health Score

```typescript
// Returns score, status, top issues, and breakdown
const health = await get_workspace_health({});

// Example response:
{
  "success": true,
  "score": 87,
  "status": "healthy",
  "topIssues": [
    "parallelization-mcp: 8.2% error rate (warning)",
    "task-executor: 2.3s avg response (slow)"
  ],
  "breakdown": {
    "mcpHealth": 92,
    "autonomousResolution": 95,
    "workflowCompletion": 88,
    "systemResources": 100
  },
  "timestamp": "2025-11-07T00:00:00.000Z"
}
```

### Get MCP Status

```typescript
// Query all 22 MCPs for health
const status = await get_mcp_status({});

// Returns:
{
  "summary": {
    "total": 22,
    "healthy": 19,
    "warning": 2,
    "critical": 0,
    "inactive": 1
  },
  "statuses": [...],
  "deprecationCandidates": ["old-mcp-not-used"],
  "needsInvestigation": [
    { "name": "parallelization-mcp", "errorRate": 8.2 }
  ]
}
```

### Get Autonomous Metrics

```typescript
// Get autonomous resolution performance
const metrics = await get_autonomous_metrics({});

// Returns:
{
  "totalResolutions": 47,
  "successRate7d": 94.5,
  "successRate30d": 91.2,
  "avgResolutionTime": 28,
  "trend": "improving",
  "recentResolutions": [...]
}
```

### Get Top Bottlenecks

```typescript
// Identify slowest operations
const bottlenecks = await get_top_bottlenecks({ limit: 5 });

// Returns:
{
  "count": 5,
  "bottlenecks": [
    {
      "type": "workflow",
      "name": "implement-X",
      "severity": "high",
      "impact": "45% complete, stuck for 18.0h",
      "metric": "stuckDuration",
      "value": 18,
      "baseline": 24,
      "recommendation": "Review current task and unblock dependencies"
    },
    {
      "type": "mcp",
      "name": "parallelization-mcp::analyze",
      "severity": "high",
      "impact": "45% failure rate",
      "metric": "errorRate",
      "value": 45,
      "baseline": 5,
      "recommendation": "Critical: Fix immediately, system unstable"
    }
  ]
}
```

### Get Automation Opportunities

```typescript
// Find repetitive tasks worth automating
const opportunities = await get_automation_opportunities({
  minRoi: 100,
  limit: 5
});

// Returns:
{
  "count": 3,
  "totalPotentialValue": 1840,
  "opportunities": [
    {
      "pattern": "Export patient data",
      "frequency": 15,
      "avgDuration": 20,
      "potentialRoi": 600,
      "effortEstimate": "medium",
      "priority": 6,
      "description": "Automate Export patient data task"
    }
  ]
}
```

### Get System Alerts

```typescript
// Get critical alerts
const alerts = await get_system_alerts({});

// Returns:
{
  "alertCount": 3,
  "criticalAlerts": 1,
  "warningAlerts": 2,
  "alerts": [
    {
      "id": "ALERT-001",
      "severity": "critical",
      "type": "WORKFLOW_STUCK",
      "message": "Workflow stuck: implement-X",
      "details": "Progress: 45%, stuck for 48.0 hours",
      "action": "Critical: Manual intervention required",
      "timestamp": "2025-11-07T00:00:00.000Z",
      "acknowledged": false
    }
  ]
}
```

### Create Health Dashboard

```typescript
// Generate formatted markdown dashboard
const dashboard = await create_health_dashboard({ format: 'markdown' });
```

**Output:**

```markdown
# Workspace Health Dashboard

Generated: 11/7/2025, 12:00:00 AM

---

## Overall Health: 87/100 🟢

**Status:** HEALTHY

### Top Issues
1. parallelization-mcp: 8.2% error rate (warning)
2. task-executor: 2.3s avg response (slow)

### Health Breakdown
- MCP Health: 92/100
- Autonomous Resolution: 95/100
- Workflow Completion: 88/100
- System Resources: 100/100

## MCP Status (22 total)

🟢 19 healthy | 🟡 2 warnings | 🔴 0 critical | ⚪ 1 inactive

### Issues Detected
🟡 **parallelization-mcp**: 8.2% error rate
🟡 **task-executor**: 2.3s avg response

## Autonomous Resolution

- **Total Resolutions:** 47
- **Success Rate (7d):** 94.5% 📈
- **Success Rate (30d):** 91.2%
- **Avg Resolution Time:** 28 min

## Active Workflows

- Running: 2
- Stuck: 1

### Stuck Workflows (Action Required)
- **implement-X**: 45% complete, stuck 18.0h

## Top Bottlenecks

1. **Workflow stuck:** implement-X (18.0h)
2. **Slow MCP:** parallelization-mcp (2.3s avg)

## Automation Opportunities

1. **Export patient data** (15x/week, 20min each)
   - ROI: $600/month | Effort: medium
2. **Update invoice template** (8x/week, 15min each)
   - ROI: $240/month | Effort: low

## Recommended Actions

✅ System healthy - continue monitoring

---

*Refresh every 60 seconds for real-time updates*
```

## Health Scoring Methodology

### Calculation Details

```typescript
function calculateHealthScore(): number {
  let score = 100;

  // MCP health (max -40 points)
  const criticalErrors = await getMcpErrors();
  score -= criticalErrors.filter(e => e.severity === 'critical').length * 10;
  score -= criticalErrors.filter(e => e.severity === 'high').length * 5;

  // Autonomous resolution (max -30 points)
  const autoMetrics = await getAutonomousMetrics();
  if (autoMetrics.successRate < 0.80) score -= 20;
  if (autoMetrics.successRate < 0.70) score -= 10;

  // Workflow health (max -20 points)
  const stuckWorkflows = await getStuckWorkflows();
  score -= stuckWorkflows.length * 5;

  // Positive signals (max +15 points)
  if (autoMetrics.successRate > 0.95) score += 5;
  if (mcpErrors.length === 0) score += 5;
  if (stuckWorkflows.length === 0) score += 5;

  return Math.max(0, Math.min(100, score));
}
```

### Breakdown Categories

1. **MCP Health (40% weight)**
   - Error rates
   - Response times
   - Availability

2. **Autonomous Resolution (30% weight)**
   - Success rate
   - Trend direction
   - Resolution time

3. **Workflow Completion (20% weight)**
   - Stuck workflows
   - Failed workflows
   - Progress rates

4. **System Resources (10% weight)**
   - Disk space
   - Memory usage
   - Cache efficiency

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│         Workspace Health Dashboard MCP                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Health Scoring Engine                 │    │
│  │  • Calculate score (0-100)                     │    │
│  │  • Determine status (healthy/warning/critical) │    │
│  │  • Identify top issues                         │    │
│  └────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │            Data Aggregation Layer               │    │
│  │  • performance-monitor-mcp client              │    │
│  │  • workspace-brain-mcp client                  │    │
│  │  • task-executor-mcp client                    │    │
│  │  • project-management-mcp client               │    │
│  └────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │              Caching Layer                      │    │
│  │  • 60s TTL for performance data                │    │
│  │  • 5min TTL for automation opportunities       │    │
│  │  • Graceful degradation on cache miss          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### No Data Showing

**Problem:** Dashboard shows zeros or empty data

**Solution:**
1. Check that source MCPs are registered and running
2. Verify workspace-brain directory exists: `~/workspace-brain`
3. Check for telemetry data: `~/workspace-brain/telemetry/events.jsonl`
4. Ensure performance metrics exist in workspace-brain

### High Health Score Despite Issues

**Problem:** Score is high but you see problems

**Solution:**
1. Check if issues are recent (only last 24h counted)
2. Verify error rate thresholds (5% warning, 10% critical)
3. Review health breakdown to see which category is affected
4. Check if cached data is stale - wait 60s for refresh

### MCP Not Listed

**Problem:** Your MCP doesn't appear in status

**Solution:**
1. Ensure MCP is registered in `~/.claude.json`
2. Check that MCP has been used at least once
3. Verify MCP is logging to performance-monitor-mcp
4. Restart Claude Desktop to refresh MCP list

### Alerts Not Triggering

**Problem:** Expected alerts not showing

**Solution:**
1. Check alert thresholds:
   - MCP error rate: >10% for warning, >20% for critical
   - Autonomous success: <80% for warning, <70% for critical
   - Stuck workflow: >24h for warning, >48h for critical
2. Verify source data exists (workspace-brain telemetry)
3. Check that autonomous resolutions are being logged

## Integration with Other MCPs

### Performance Monitor MCP
- Provides: Error rates, response times, request counts
- Format: JSONL in `workspace-brain/telemetry/performance-metrics.jsonl`

### Workspace Brain MCP
- Provides: Autonomous resolution metrics, event telemetry
- Format: JSONL in `workspace-brain/telemetry/events.jsonl`

### Task Executor MCP
- Provides: Workflow status, task completion
- Format: JSON state files in `task-executor-mcp-server/data/*-state.json`

### Project Management MCP
- Provides: Goal progress, project status
- Format: Markdown and JSON in project directories

## Future Enhancements

### Phase 2 (After Agent 2 Completes)
- [ ] ROI metrics from autonomous framework
- [ ] Cost/benefit analysis
- [ ] Value tracking over time

### Phase 3 (After Agent 3 Completes)
- [ ] Confidence calibration metrics
- [ ] Calibration drift detection
- [ ] Accuracy tracking

### Phase 4 (Future)
- [ ] Historical trending (7d, 30d, 90d)
- [ ] Predictive alerts (ML-based)
- [ ] Automated remediation suggestions
- [ ] Integration with notification systems

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Support

For issues or questions:
1. Check this README first
2. Review source code in `src/`
3. Check logs in workspace-brain directory
4. Verify MCP configuration in `~/.claude.json`

## License

MIT

---

**Last Updated:** 2025-11-07
**Agent:** Agent 4 (Multi-Agent System Optimization)
