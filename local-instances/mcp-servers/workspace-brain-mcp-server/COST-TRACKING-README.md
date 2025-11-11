# Cost Tracking & ROI System

Version 1.3.0 - CFO Integration Layer

## Overview

The Cost Tracking & ROI system extends workspace-brain MCP with comprehensive financial analytics for autonomous workflows. It tracks API token usage, calculates costs, measures time saved, and computes ROI to determine if autonomous workflows are delivering value.

## Features

### 4 New Tools

1. **track_workflow_cost** - Track individual workflow execution costs
2. **get_roi_report** - Generate comprehensive ROI reports
3. **get_cost_breakdown** - Detailed cost analysis by workflow type
4. **create_roi_dashboard** - Real-time ROI dashboard

## Storage Schema

```
~/workspace-brain/cost-tracking/
├── workflows/
│   ├── [workflow-name]-[timestamp].json
│   └── ...
└── monthly-summaries/
    ├── 2025-01.json
    └── ...
```

### Workflow Cost Record Structure

```json
{
  "id": "uuid",
  "workflow_name": "patient-data-migration",
  "timestamp": "2025-01-15T10:30:00Z",
  "api_tokens": {
    "input": 15000,
    "output": 8000
  },
  "time_saved_hours": 4.5,
  "outcome": "completed | failed | blocked",
  "api_cost": 0.825,
  "human_cost_saved": 225.0,
  "net_roi": 224.175,
  "roi_ratio": 272.73,
  "metadata": {
    "mcp_used": "task-executor-mcp",
    "complexity": 7
  }
}
```

## ROI Calculation Methodology

### Pricing Constants (Claude Sonnet 4.5)

```
Input Tokens:  $0.015 per 1,000 tokens
Output Tokens: $0.075 per 1,000 tokens
Human Rate:    $50/hour
```

### Formulas

```
API Cost = (input_tokens / 1000 × $0.015) + (output_tokens / 1000 × $0.075)

Human Cost Saved = time_saved_hours × $50

Net ROI = Human Cost Saved - API Cost

ROI Ratio = Human Cost Saved / API Cost
```

### Interpretation

- **Net ROI > 0**: Workflow is profitable
- **ROI Ratio > 1**: Workflow saves more than it costs
- **ROI Ratio > 10**: High-value workflow (scale up)
- **ROI Ratio < 1**: Workflow costs more than it saves (optimize or disable)

## Tool Usage Examples

### 1. Track Workflow Cost

```typescript
// Track a completed workflow
{
  "workflow_name": "patient-data-migration",
  "api_tokens_used": {
    "input": 15000,
    "output": 8000
  },
  "time_saved_hours": 4.5,
  "outcome": "completed",
  "metadata": {
    "mcp_used": "task-executor-mcp",
    "complexity": 7,
    "task_count": 12
  }
}

// Returns:
{
  "success": true,
  "workflow_cost": { /* full record */ },
  "summary": {
    "api_cost": "$0.8250",
    "human_cost_saved": "$225.00",
    "net_roi": "$224.18",
    "roi_ratio": "272.73x"
  }
}
```

### 2. Generate ROI Report

```typescript
// Monthly ROI report
{
  "time_range": "month",
  "workflow_filter": null  // optional: "patient-data"
}

// Returns markdown report with:
// - Total API costs
// - Total time saved
// - Net ROI
// - Breakdown by outcome (completed/failed/blocked)
// - Top 10 workflows by ROI
// - Conclusion and recommendations
```

### 3. Get Cost Breakdown

```typescript
// Analyze costs for the month
{
  "time_range": "month"
}

// Returns:
// - Most expensive workflows
// - Highest ROI workflows
// - Lowest ROI workflows (need optimization)
// - Cost breakdown by outcome
// - Actionable recommendations
```

### 4. Create ROI Dashboard

```typescript
// Real-time dashboard with trends
{
  "compare_to_previous": true
}

// Returns:
// - This month summary
// - Comparison to previous month
// - Trend analysis (improving/declining)
// - Top 5 highest value workflows
// - Top 5 most expensive workflows
```

## Example ROI Report

Based on test data (8 workflows, January 2025):

```markdown
# ROI Report (month)

## Summary
- **Total Workflows**: 8
- **Total API Cost**: $4.59
- **Total Time Saved**: 20.0 hours
- **Total Human Cost Saved**: $1,000.00
- **Net ROI**: $995.42
- **Average ROI Ratio**: 229.04x

## Breakdown by Outcome

| Outcome   | Count | API Cost | Time Saved | Net ROI    |
|-----------|-------|----------|------------|------------|
| Completed | 6     | $3.82    | 16.5h      | $821.18    |
| Failed    | 1     | $0.68    | 2.5h       | $124.33    |
| Blocked   | 1     | $0.75    | 1.0h       | $49.25     |

## Top 10 Workflows by Net ROI

| Workflow                  | API Cost | Time Saved | Net ROI   | ROI Ratio |
|---------------------------|----------|------------|-----------|-----------|
| patient-data-migration    | $1.0200  | 5.0h       | $248.98   | 245.10x   |
| patient-data-migration    | $0.8250  | 4.5h       | $224.18   | 272.73x   |
| report-generation         | $0.6300  | 3.0h       | $149.37   | 238.10x   |
| code-review               | $0.6750  | 2.5h       | $124.33   | 185.19x   |
| hipaa-compliance-check    | $0.3450  | 2.0h       | $99.66    | 289.86x   |
| appointment-sync          | $0.2250  | 1.5h       | $74.78    | 333.33x   |
| deployment-rollback       | $0.7500  | 1.0h       | $49.25    | 66.67x    |
| backup-validation         | $0.1200  | 0.5h       | $24.88    | 208.33x   |

## Conclusion
Autonomous workflows are delivering positive ROI of $995.42 over month.
```

## Cost Breakdown Analysis

```markdown
# Cost Breakdown Analysis (month)

## Most Expensive Workflows

| Workflow                  | Executions | Total API Cost | Avg Cost/Run | Success Rate |
|---------------------------|------------|----------------|--------------|--------------|
| patient-data-migration    | 2          | $1.85          | $0.9225      | 100%         |
| code-review               | 1          | $0.68          | $0.6750      | 0%           |
| deployment-rollback       | 1          | $0.75          | $0.7500      | 0%           |
| report-generation         | 1          | $0.63          | $0.6300      | 100%         |
| hipaa-compliance-check    | 1          | $0.35          | $0.3450      | 100%         |

## Highest ROI Workflows

| Workflow                  | Executions | Net ROI   | Avg ROI Ratio | Recommendation |
|---------------------------|------------|-----------|---------------|----------------|
| patient-data-migration    | 2          | $473.16   | 258.92x       | Scale up       |
| report-generation         | 1          | $149.37   | 238.10x       | Scale up       |
| code-review               | 1          | $124.33   | 185.19x       | Scale up       |
| hipaa-compliance-check    | 1          | $99.66    | 289.86x       | Scale up       |
| appointment-sync          | 1          | $74.78    | 333.33x       | Scale up       |

## Lowest ROI Workflows (Need Optimization)

| Workflow                  | Executions | Net ROI   | Avg ROI Ratio | Recommendation |
|---------------------------|------------|-----------|---------------|----------------|
| deployment-rollback       | 1          | $49.25    | 66.67x        | Monitor        |
| backup-validation         | 1          | $24.88    | 208.33x       | Monitor        |

## Cost Breakdown by Outcome

| Outcome    | Workflows | API Cost | Wasted Cost |
|------------|-----------|----------|-------------|
| Successful | 6         | $3.82    | N/A         |
| Failed     | 1         | $0.68    | $0.68       |
| Blocked    | 1         | $0.75    | $0.75       |

## Recommendations

1. **Scale Up**: Focus on high-ROI workflows (patient-data-migration)
2. **Optimize**: Improve success rate for expensive workflows
3. **Review**: 0 workflows have negative ROI
4. **Wasted Cost**: $1.43 spent on failed/blocked workflows
```

## ROI Dashboard

```markdown
# ROI Dashboard - January 2025

## This Month Summary

| Metric              | Value       |
|---------------------|-------------|
| Total Workflows     | 8           |
| API Costs           | $4.59       |
| Time Saved          | 20.0 hours  |
| Human Cost Saved    | $1,000.00   |
| **Net Value**       | **$995.42** |

## Trend vs Previous Month

| Metric   | Current  | Previous | Change  |
|----------|----------|----------|---------|
| API Cost | $4.59    | $0.00    | N/A     |
| Net ROI  | $995.42  | $0.00    | N/A     |

### ROI Trend: IMPROVING

## Top 5 Highest Value Workflows

| Workflow                  | Net ROI   | ROI Ratio | Time Saved |
|---------------------------|-----------|-----------|------------|
| patient-data-migration    | $248.98   | 245.10x   | 5.0h       |
| patient-data-migration    | $224.18   | 272.73x   | 4.5h       |
| report-generation         | $149.37   | 238.10x   | 3.0h       |
| code-review               | $124.33   | 185.19x   | 2.5h       |
| hipaa-compliance-check    | $99.66    | 289.86x   | 2.0h       |

## Top 5 Most Expensive Workflows

| Workflow                  | API Cost  | Outcome   | ROI Ratio |
|---------------------------|-----------|-----------|-----------|
| patient-data-migration    | $1.0200   | completed | 245.10x   |
| patient-data-migration    | $0.8250   | completed | 272.73x   |
| deployment-rollback       | $0.7500   | blocked   | 66.67x    |
| code-review               | $0.6750   | failed    | 185.19x   |
| report-generation         | $0.6300   | completed | 238.10x   |

---
**Last Updated**: 11/7/2025, 6:16:00 PM
```

## Integration with Other MCPs

### Automatic Cost Tracking

When other MCPs complete workflows, they should call `track_workflow_cost`:

```typescript
// Example: Task Executor MCP completes a workflow
await workspace_brain.track_workflow_cost({
  workflow_name: "patient-intake-automation",
  api_tokens_used: {
    input: estimatedInputTokens,
    output: estimatedOutputTokens
  },
  time_saved_hours: 3.0,  // Compared to manual process
  outcome: "completed",
  metadata: {
    mcp_used: "task-executor-mcp",
    task_count: 8,
    complexity: 6
  }
});
```

### Token Estimation

If exact token counts aren't available, estimate using:

```typescript
// Rough estimation (1 token ≈ 4 characters)
const estimatedInputTokens = inputText.length / 4;
const estimatedOutputTokens = outputText.length / 4;
```

For more accurate tracking, integrate with Claude API response headers:
- `anthropic-input-tokens`
- `anthropic-output-tokens`

## Monthly Maintenance

The system automatically updates monthly summaries when `track_workflow_cost` is called. Monthly summaries contain:

```json
{
  "year_month": "2025-01",
  "total_workflows": 8,
  "total_api_cost": 4.585,
  "total_time_saved": 20.0,
  "total_human_cost_saved": 1000.0,
  "total_net_roi": 995.415,
  "avg_roi_ratio": 229.04,
  "updated_at": "2025-01-22T18:00:00Z"
}
```

## Recommendations Based on ROI

### High ROI (>100x)
- **Action**: Scale up, automate more
- **Priority**: High
- **Investment**: Increase usage

### Medium ROI (10x-100x)
- **Action**: Continue current usage
- **Priority**: Medium
- **Investment**: Maintain

### Low ROI (1x-10x)
- **Action**: Optimize or review
- **Priority**: Low
- **Investment**: Reduce or improve

### Negative ROI (<1x)
- **Action**: Disable or completely redesign
- **Priority**: Critical
- **Investment**: Stop immediately

## Success Metrics

Track these KPIs monthly:

1. **Total Net ROI** - Should be positive and growing
2. **Average ROI Ratio** - Should be >50x for healthy automation
3. **Success Rate** - % of completed workflows (target: >80%)
4. **Wasted Cost** - Failed/blocked workflow costs (target: <10% of total)
5. **Cost Per Hour Saved** - API cost / time saved (target: <$1/hour)

## Troubleshooting

### No data showing in reports
- Check `~/workspace-brain/cost-tracking/workflows/` exists
- Verify JSON files are valid
- Ensure timestamps are ISO 8601 format

### ROI calculations seem wrong
- Verify token counts are accurate
- Check time saved estimates are realistic
- Review pricing constants match current Claude pricing

### Monthly summaries not updating
- Check file permissions on `monthly-summaries/` directory
- Verify `track_workflow_cost` is being called
- Review error logs

## Future Enhancements

Planned for v1.4.0:
- Token usage forecasting
- Cost alerts when budgets exceeded
- Integration with billing systems
- Multi-model pricing support
- Historical trend analysis
- Automated optimization suggestions

## Testing

Run the test script to create sample data:

```bash
cd /path/to/workspace-brain-mcp-server
./test-cost-tracking.sh
```

This creates 8 sample workflow cost records with realistic data.

## Support

For issues or questions:
1. Check test data generation works correctly
2. Verify storage directory permissions
3. Review calculation formulas
4. Check MCP server logs for errors

---

**Version**: 1.3.0
**Last Updated**: November 7, 2025
**Maintainer**: Workspace Team
