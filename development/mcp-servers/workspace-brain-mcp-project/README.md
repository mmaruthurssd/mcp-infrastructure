---
type: readme
tags: [mcp-server, workspace-brain, intelligence-layer, telemetry, analytics]
---

# Workspace Brain MCP Server

**Status:** 🟢 Active - Phase 1.2 Complete (21/21 tools working) - DEPLOYED
**Version:** 1.2.0
**Category:** Intelligence Layer / Data Storage / Advanced Analytics
**Deployed:** ✅ User scope (~/.claude.json) - Registered 2025-10-31
**Location:** `~/local-instances/mcp-servers/workspace-brain-mcp-server/`

## Purpose

External storage and intelligence layer for workspace data, keeping the git repository lean while maintaining rich analytics capabilities.

**Key Features:**
- ✅ Cross-session telemetry logging
- ✅ Advanced analytics and insights (BI Analyst integration)
- ✅ Workflow efficiency analysis with bottleneck detection
- ✅ High-ROI automation opportunity identification
- ✅ Goal velocity tracking and trend analysis
- ✅ MCP usage pattern analysis
- ✅ Custom dashboard generation
- ✅ Pattern learning and retrieval
- ✅ External brain at ~/workspace-brain/
- ✅ Cache management with TTL support

## What This MCP Does

Provides tools to:
- Log and query telemetry events (tasks, MCP usage, workflows)
- Generate analytics reports and insights
- Store and retrieve learning data (patterns, solutions)
- Manage cache data with TTL
- Maintain external brain storage

## Storage Architecture

**External Brain Location:** `~/workspace-brain/` (outside git repo)

**Phase 1 (Current):** File-based storage using JSONL
**Phase 2 (Future):** SQLite database for performance

## Tools (21 total)

### Telemetry Tools
1. `log_event` - Log telemetry event to external brain
2. `query_events` - Query events with filters and time range
3. `get_event_stats` - Get statistics for specific metrics

### Analytics Tools (9 tools - BI Analyst integration)
4. `generate_weekly_summary` - Create weekly analytics report
5. `get_automation_opportunities` - Find automation targets
6. `get_tool_usage_stats` - Tool usage statistics
7. `analyze_workflow_efficiency` - Analyze workflow efficiency and detect bottlenecks
8. `identify_high_value_automations` - Identify high-ROI automation opportunities
9. `generate_insights_report` - Generate actionable insights across categories
10. `track_goal_velocity` - Track goal completion velocity and trends
11. `analyze_mcp_usage_patterns` - Analyze MCP tool usage and effectiveness
12. `create_custom_dashboard` - Create custom analytics dashboards

### Learning Tools
13. `record_pattern` - Record discovered pattern
14. `get_similar_patterns` - Find similar patterns by query
15. `get_preventive_checks` - Get preventive check recommendations

### Cache Tools
16. `cache_set` - Store cached value with TTL
17. `cache_get` - Retrieve cached value
18. `cache_invalidate` - Invalidate cache by pattern

### Maintenance Tools
19. `archive_old_data` - Archive data older than specified date
20. `export_data` - Export data in specified format
21. `get_storage_stats` - Get storage usage statistics

## Integration Points

- **Performance Monitor MCP** → Logs metrics to workspace-brain
- **Task Executor MCP** → Logs workflow data to workspace-brain
- **BI Analyst MCP** → Queries workspace-brain for insights
- **Learning Optimizer MCP** → Cross-references with workspace-brain patterns

## Quick Start

**Status:** ✅ Already deployed and active

```bash
# Verify deployment
claude mcp list | grep workspace-brain

# Test functionality
# Use workspace-brain tools via Claude Code
# See TELEMETRY-INTEGRATION-GUIDE.md for usage examples

# Original deployment (already completed):
# ln -s [dev-instance] local-instances/mcp-servers/workspace-brain-mcp-server
# claude mcp add --scope user --transport stdio workspace-brain-mcp -- \
#   node /absolute/path/to/local-instances/mcp-servers/workspace-brain-mcp-server/build/index.js
```

## Project Structure

```
workspace-brain-mcp-project/
├── 01-planning/           # Specifications and planning docs
├── 04-product-under-development/
│   ├── src/              # TypeScript source
│   ├── build/            # Compiled JavaScript
│   └── tests/            # Test files
├── 05-deliverables/      # Final deployment artifacts
└── README.md             # This file
```

## Documentation

### Getting Started
- **[Quick Start Guide](03-resources-docs-assets-tools/QUICK-START.md)** - 5-minute tutorial to get started
- **[Usage Guide](03-resources-docs-assets-tools/USAGE-GUIDE.md)** - Real-world examples and workflows
- **[Telemetry Integration Guide](03-resources-docs-assets-tools/TELEMETRY-INTEGRATION-GUIDE.md)** - Integrate with other MCPs

### Technical Documentation
- **[External Brain Architecture](03-resources-docs-assets-tools/EXTERNAL-BRAIN-ARCHITECTURE.md)** - System design and storage
- **[Telemetry System Guide](03-resources-docs-assets-tools/TELEMETRY-SYSTEM-GUIDE.md)** - Event logging and querying
- **[Analytics and Learning Guide](03-resources-docs-assets-tools/ANALYTICS-AND-LEARNING-GUIDE.md)** - Insights and patterns

### Integration
- **[MCP Integration Patterns](03-resources-docs-assets-tools/MCP-INTEGRATION-PATTERNS.md)** - Connect with other MCPs

### Testing
- **[Smoke Test Results](archive/workflows/2025-10-31-103216-workspace-brain-smoke-tests/SMOKE-TEST-RESULTS.md)** - Phase 1 validation

## Known Issues

None - All 21 tools fully operational as of Phase 1.2.

## Development Timeline

- ✅ **Phase 1:** File-based storage (JSONL) - Complete (2025-10-31)
  - 15 tools implemented
  - External brain operational
  - Comprehensive documentation
- ✅ **Phase 1.1:** Bug fixes - Complete (2025-10-31)
  - Fixed cache_get and cache_invalidate path resolution
  - All 15 tools fully functional
  - Validated with round-trip testing
- ✅ **Phase 1.2:** BI Analyst Integration - Complete (2025-10-31)
  - Added 6 advanced analytics tools (15 → 21 tools)
  - Workflow efficiency analysis
  - High-ROI automation identification
  - Insights report generation
  - Goal velocity tracking
  - MCP usage pattern analysis
  - Custom dashboard creation
- 📅 **Phase 2:** Enhancements - Future (2-3 weeks)
  - Automatic telemetry logging
  - Real-time dashboard updates
  - Advanced pattern detection
  - SQLite migration (optional)
- 📅 **Phase 3:** Advanced Analytics - Future (3-4 weeks)
  - Machine learning for automation opportunities
  - Predictive analytics
  - Cross-MCP correlation analysis

---

**Created:** 2025-10-31
**Last Updated:** 2025-10-31 (Phase 1.2 Complete - All 21 tools working)
**Next Milestone:** Phase 2 (Enhancements)
