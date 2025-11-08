# Workspace Brain MCP Server

External storage and intelligence layer for workspace data with advanced analytics and cost tracking.

**Version**: 1.3.0
**Phase**: 1.3 (Cost Tracking & ROI - CFO integration)

## Overview

Workspace Brain MCP provides persistent external storage for telemetry, analytics, learning patterns, and financial data. It serves as the "memory and intelligence" layer for autonomous AI workflows.

### Key Capabilities

- **Telemetry**: Event logging and querying (JSONL-based)
- **Analytics**: Workflow efficiency, automation opportunities, insights generation
- **Learning**: Pattern recognition, preventive checks, knowledge base
- **Caching**: Fast data retrieval with TTL support
- **Cost Tracking**: API cost tracking, ROI calculation, financial analytics
- **Maintenance**: Data archival, export, storage management

## New in v1.3.0: Cost Tracking & ROI

Track API costs and measure ROI for autonomous workflows. Determine if automation is worth the investment.

### 4 New Tools

1. **track_workflow_cost** - Track individual workflow costs and ROI
2. **get_roi_report** - Generate comprehensive ROI reports
3. **get_cost_breakdown** - Analyze costs by workflow type and outcome
4. **create_roi_dashboard** - Real-time ROI dashboard with trends

See [COST-TRACKING-README.md](./COST-TRACKING-README.md) for detailed documentation.

## Tools (19 Total)

### Telemetry (3 tools)
- `log_event` - Log telemetry events (tasks, MCP usage, workflows)
- `query_events` - Query events with filters and time ranges
- `get_event_stats` - Get statistics for specific metrics

### Analytics (9 tools)
- `generate_weekly_summary` - Create weekly analytics reports
- `get_automation_opportunities` - Find high-value automation targets
- `get_tool_usage_stats` - Tool usage statistics
- `analyze_workflow_efficiency` - Detect bottlenecks
- `identify_high_value_automations` - High-ROI automation opportunities
- `generate_insights_report` - Actionable insights across categories
- `track_goal_velocity` - Goal completion velocity and trends
- `analyze_mcp_usage_patterns` - MCP effectiveness metrics
- `create_custom_dashboard` - Custom analytics dashboards

### Learning (3 tools)
- `record_pattern` - Record discovered patterns
- `get_similar_patterns` - Find similar patterns by query
- `get_preventive_checks` - Get preventive check recommendations

### Cache (3 tools)
- `cache_set` - Store cached values with TTL
- `cache_get` - Retrieve cached values
- `cache_invalidate` - Invalidate cache by pattern

### Cost Tracking (4 tools) 🆕
- `track_workflow_cost` - Track API costs and ROI
- `get_roi_report` - Generate ROI reports
- `get_cost_breakdown` - Detailed cost breakdown
- `create_roi_dashboard` - Real-time ROI dashboard

### Maintenance (3 tools)
- `archive_old_data` - Archive old data with compression
- `export_data` - Export data to various formats
- `get_storage_stats` - Storage usage statistics

## Quick Start

### Installation

```bash
cd local-instances/mcp-servers/workspace-brain-mcp-server
npm install
npm run build
```

### Configuration

The MCP server uses `~/workspace-brain` as the default storage location. Override with:

```bash
export WORKSPACE_BRAIN_PATH="/custom/path"
```

### Testing

Generate test cost tracking data:

```bash
./test-cost-tracking.sh
```

## Usage Examples

### 1. Track Workflow Cost

```typescript
await track_workflow_cost({
  workflow_name: "patient-data-migration",
  api_tokens_used: {
    input: 15000,
    output: 8000
  },
  time_saved_hours: 4.5,
  outcome: "completed",
  metadata: {
    mcp_used: "task-executor-mcp",
    complexity: 7
  }
});

// Returns:
// {
//   "api_cost": "$0.8250",
//   "human_cost_saved": "$225.00",
//   "net_roi": "$224.18",
//   "roi_ratio": "272.73x"
// }
```

### 2. Generate ROI Report

```typescript
await get_roi_report({
  time_range: "month",
  workflow_filter: null
});

// Returns markdown report with:
// - Total API costs
// - Total time saved
// - Net ROI and ROI ratio
// - Breakdown by outcome
// - Top 10 workflows by ROI
```

### 3. Create ROI Dashboard

```typescript
await create_roi_dashboard({
  compare_to_previous: true
});

// Returns:
// - This month summary
// - Comparison to previous month
// - Trend analysis
// - Top 5 highest value workflows
// - Top 5 most expensive workflows
```

### 4. Log Telemetry Event

```typescript
await log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "patient-intake",
    duration_minutes: 45,
    outcome: "completed",
    tools_used: ["task-executor-mcp", "google-sheets-integration"]
  }
});
```

### 5. Generate Weekly Summary

```typescript
await generate_weekly_summary({
  week_start: "2025-01-01",
  include_sections: ["summary", "patterns", "opportunities"],
  output_format: "markdown"
});
```

## ROI Calculation

### Pricing (Claude Sonnet 4.5)

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

- **ROI Ratio > 100x**: Excellent - scale up aggressively
- **ROI Ratio > 10x**: Good - continue and expand
- **ROI Ratio > 1x**: Acceptable - monitor and optimize
- **ROI Ratio < 1x**: Poor - optimize or disable

## Storage Schema

```
~/workspace-brain/
├── telemetry/
│   └── events.jsonl
├── analytics/
│   └── weekly-summaries/
├── learning/
│   └── patterns/
├── cache/
│   └── entries/
├── cost-tracking/              🆕
│   ├── workflows/
│   │   └── [workflow]-[timestamp].json
│   └── monthly-summaries/
│       └── YYYY-MM.json
└── backups/
    ├── archives/
    └── manual-exports/
```

## Example Results

From test data (8 workflows, January 2025):

```
Total Workflows:     8
Total API Cost:      $4.59
Time Saved:          20.0 hours
Human Cost Saved:    $1,000.00
Net ROI:             $995.42
Average ROI Ratio:   229.04x

VERDICT: Autonomous workflows are highly profitable ✓
```

See [EXAMPLE-ROI-REPORT.md](./EXAMPLE-ROI-REPORT.md) for detailed analysis.

## Integration with Other MCPs

Other MCPs can track their workflow costs:

```typescript
// Example: Task Executor MCP
await workspace_brain.track_workflow_cost({
  workflow_name: "bug-fix-workflow",
  api_tokens_used: {
    input: estimatedInputTokens,
    output: estimatedOutputTokens
  },
  time_saved_hours: 2.0,
  outcome: "completed",
  metadata: {
    mcp_used: "task-executor-mcp",
    task_count: 5
  }
});
```

## Token Estimation

If exact token counts aren't available:

```typescript
// Rough estimation (1 token ≈ 4 characters)
const estimatedInputTokens = inputText.length / 4;
const estimatedOutputTokens = outputText.length / 4;
```

For accurate tracking, use Claude API response headers:
- `anthropic-input-tokens`
- `anthropic-output-tokens`

## Success Metrics

Track these KPIs monthly:

1. **Total Net ROI** - Should be positive and growing
2. **Average ROI Ratio** - Target: >50x for healthy automation
3. **Success Rate** - Target: >80% completed workflows
4. **Wasted Cost** - Failed/blocked costs (target: <10% of total)
5. **Cost Per Hour Saved** - Target: <$1/hour

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

## Architecture

### Tool Categories

```
workspace-brain-mcp (19 tools)
├── Telemetry (3)
│   ├── Event logging
│   └── Event querying
├── Analytics (9)
│   ├── Weekly summaries
│   ├── Automation opportunities
│   ├── Workflow efficiency
│   └── Custom dashboards
├── Learning (3)
│   ├── Pattern recording
│   └── Preventive checks
├── Cache (3)
│   └── Fast data retrieval
├── Cost Tracking (4) 🆕
│   ├── Workflow cost tracking
│   ├── ROI reports
│   ├── Cost breakdown
│   └── ROI dashboard
└── Maintenance (3)
    ├── Data archival
    └── Export/backup
```

### File Structure

```
workspace-brain-mcp-server/
├── src/
│   ├── index.ts                 # Main server
│   └── tools/
│       ├── telemetry.ts        # Event logging
│       ├── analytics.ts        # Advanced analytics
│       ├── learning.ts         # Pattern learning
│       ├── cache.ts            # Caching layer
│       ├── cost-tracking.ts    # Cost & ROI 🆕
│       └── maintenance.ts      # Data management
├── build/                       # Compiled output
├── package.json
├── tsconfig.json
├── README.md                    # This file
├── COST-TRACKING-README.md     # Cost tracking docs
├── EXAMPLE-ROI-REPORT.md       # Example analysis
└── test-cost-tracking.sh       # Test data generator
```

## Troubleshooting

### No cost data showing
- Check `~/workspace-brain/cost-tracking/workflows/` exists
- Verify JSON files are valid
- Run `./test-cost-tracking.sh` to generate test data

### ROI calculations incorrect
- Verify token counts are accurate
- Check time saved estimates are realistic
- Review pricing constants match Claude Sonnet 4.5

### Build errors
```bash
rm -rf build/
npm install
npm run build
```

## Roadmap

### v1.4.0 (Planned)
- Token usage forecasting
- Cost alerts and budgets
- Multi-model pricing support
- Historical trend analysis
- Automated optimization suggestions
- Integration with billing systems

### v1.5.0 (Planned)
- Machine learning for ROI prediction
- Anomaly detection in costs
- Workflow cost optimization engine
- Cross-MCP cost attribution
- Real-time cost streaming

## Contributing

When adding new tools:

1. Create tool file in `src/tools/`
2. Export functions with proper types
3. Add tool definition to `index.ts` ListToolsRequestSchema
4. Add case handler in CallToolRequestSchema
5. Update README.md
6. Add tests if applicable

## License

MIT

## Support

For issues or questions:
1. Check documentation in `COST-TRACKING-README.md`
2. Review `EXAMPLE-ROI-REPORT.md` for expected output
3. Run test script to verify installation
4. Check MCP server logs for errors

---

**Version**: 1.3.0
**Last Updated**: November 7, 2025
**Maintainer**: Workspace Team
**Tools**: 19 (4 new in v1.3.0)
**Storage**: `~/workspace-brain`
