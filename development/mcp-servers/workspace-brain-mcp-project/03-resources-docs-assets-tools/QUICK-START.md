---
type: guide
tags: [workspace-brain-mcp, quick-start, getting-started, tutorial]
---

# Workspace Brain MCP - Quick Start

**Get started with workspace-brain MCP in 5 minutes.**

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Prerequisites

✅ **Required:**
- Claude Code installed and running
- workspace-brain MCP deployed to `~/.claude.json`
- External brain directory at `~/workspace-brain/`

✅ **Verify installation:**
```bash
ls ~/workspace-brain/
# Should show: README.md  analytics  backups  cache  learning  telemetry
```

---

## 5-Minute Tutorial

### Step 1: Log Your First Event (1 min)

**Tell workspace-brain about a task you completed:**

```typescript
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "workspace-brain-tutorial",
    task_type: "learning",
    duration_minutes: 5,
    tools_used: ["workspace-brain"],
    complexity: 2,
    outcome: "completed",
    metadata: {
      tutorial_step: "first-event"
    }
  }
});
```

**Expected response:**
```json
{
  "success": true,
  "event_id": "uuid",
  "logged_at": "2025-10-31T16:00:00Z",
  "file_path": "~/workspace-brain/telemetry/task-log.jsonl",
  "write_time_ms": 2
}
```

✅ **Success!** Your first event is logged.

---

### Step 2: Query Your Events (1 min)

**See what you've logged:**

```typescript
workspace_brain.query_events({
  filters: {
    event_type: "task"
  },
  limit: 10
});
```

**You should see:**
```json
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "type": "task",
      "timestamp": "2025-10-31T16:00:00Z",
      "data": {
        "workflow_name": "workspace-brain-tutorial",
        ...
      }
    }
  ],
  "count": 1,
  "total_matching": 1,
  "query_time_ms": 0
}
```

✅ **Success!** You can retrieve your events.

---

### Step 3: Record a Pattern (1 min)

**Save knowledge for future use:**

```typescript
workspace_brain.record_pattern({
  name: "My first pattern",
  category: "workflow",
  description: "How to use workspace-brain MCP for telemetry",
  steps: [
    "Log events with log_event()",
    "Query events with query_events()",
    "Record patterns with record_pattern()",
    "Generate reports with generate_weekly_summary()"
  ],
  tools_involved: ["workspace-brain"],
  frequency: 1,
  notes: "Learned during quick start tutorial"
});
```

**Expected response:**
```json
{
  "success": true,
  "pattern_id": "uuid",
  "stored_at": "~/workspace-brain/learning/issue-patterns.json"
}
```

✅ **Success!** Your pattern is stored.

---

### Step 4: Find Similar Patterns (1 min)

**Retrieve your stored knowledge:**

```typescript
workspace_brain.get_similar_patterns({
  query: "workspace-brain",
  limit: 5,
  similarity_threshold: 0.3
});
```

**You should see your pattern:**
```json
{
  "success": true,
  "patterns": [
    {
      "pattern_id": "uuid",
      "name": "My first pattern",
      "category": "workflow",
      "description": "How to use workspace-brain MCP...",
      "similarity_score": 1,
      "steps": [...]
    }
  ]
}
```

✅ **Success!** You can find stored patterns.

---

### Step 5: Check Storage Stats (1 min)

**See what's in your external brain:**

```typescript
workspace_brain.get_storage_stats({
  include_breakdown: true
});
```

**Expected response:**
```json
{
  "success": true,
  "total_size_mb": 0,
  "breakdown": {
    "telemetry_mb": 0,
    "analytics_mb": 0,
    "learning_mb": 0,
    "cache_mb": 0
  },
  "file_counts": {
    "telemetry": 1,
    "analytics": 0,
    "cache": 0
  },
  "oldest_event": "2025-10-31T16:00:00Z",
  "newest_event": "2025-10-31T16:00:00Z"
}
```

✅ **Success!** You've completed the tutorial!

---

## Common Use Cases

### Use Case 1: Track Daily Work

**At the end of each task:**

```typescript
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "patient-search-feature",
    task_type: "feature-implementation",
    duration_minutes: 45,
    tools_used: ["Edit", "Bash", "git"],
    complexity: 7,
    outcome: "completed"
  }
});
```

### Use Case 2: Weekly Review

**Every Friday:**

```typescript
workspace_brain.generate_weekly_summary({
  output_format: "markdown"
});
```

**Then review:**
```bash
cat ~/workspace-brain/analytics/weekly-summaries/2025-W43.md
```

### Use Case 3: Save Solutions

**After troubleshooting:**

```typescript
workspace_brain.record_pattern({
  name: "Solution to X",
  category: "bug-fix",
  description: "How I fixed X",
  steps: ["Step 1", "Step 2", "Step 3"],
  tools_involved: ["Edit", "Bash"]
});
```

### Use Case 4: Find Past Solutions

**Before troubleshooting:**

```typescript
workspace_brain.get_similar_patterns({
  query: "MCP not loading"
});
// Check if we've solved this before
```

### Use Case 5: Detect Automation Opportunities

**Monthly review:**

```typescript
workspace_brain.get_automation_opportunities({
  min_frequency: 3,
  sort_by: "time_savings"
});
// See what can be automated
```

---

## All 15 Tools at a Glance

### Telemetry (3 tools)
1. **log_event** - Log task completions, workflow events, MCP usage
2. **query_events** - Search and filter logged events
3. **get_event_stats** - Aggregate metrics (count, avg duration, distribution)

### Analytics (3 tools)
4. **generate_weekly_summary** - Auto-generate weekly reports
5. **get_automation_opportunities** - Find repetitive tasks to automate
6. **get_tool_usage_stats** - Track which tools you use most

### Learning (3 tools)
7. **record_pattern** - Save solutions and knowledge
8. **get_similar_patterns** - Find stored patterns by keyword
9. **get_preventive_checks** - Get proactive checks for contexts

### Cache (3 tools)
10. **cache_set** - Store expensive computation results
11. **cache_get** - Retrieve cached values (⚠️ Phase 1: has bug)
12. **cache_invalidate** - Clear cache entries (⚠️ Phase 1: has bug)

### Data Management (3 tools)
13. **get_storage_stats** - Check external brain storage usage
14. **export_data** - Export telemetry/analytics to JSON/CSV
15. **archive_old_data** - Move old data to archives

---

## Next Steps

### Explore More
- 📖 **Full documentation:** `03-resources-docs-assets-tools/` directory
  - `EXTERNAL-BRAIN-ARCHITECTURE.md` - Technical architecture
  - `TELEMETRY-SYSTEM-GUIDE.md` - Deep dive on telemetry
  - `MCP-INTEGRATION-PATTERNS.md` - Integrate with other MCPs
  - `USAGE-GUIDE.md` - Real-world examples
  - `ANALYTICS-AND-LEARNING-GUIDE.md` - Analytics features

### Start Using Daily
1. **Log tasks** as you complete them
2. **Generate weekly summaries** every Friday
3. **Record patterns** when you solve issues
4. **Query telemetry** to understand your workflow

### Get Help
- 🔍 **Smoke test results:** `temp/workflows/workspace-brain-smoke-tests/SMOKE-TEST-RESULTS.md`
- 🐛 **Known issues:** Cache retrieval/invalidation bug (Phase 1.1 fix planned)
- 💡 **Ask Claude:** "How do I use workspace-brain to track X?"

---

## Cheat Sheet

### Essential Commands

```typescript
// Log a task
log_event({ event_type: "task", event_data: {...} })

// Query recent tasks
query_events({ filters: { event_type: "task" }, limit: 10 })

// Generate weekly report
generate_weekly_summary({ output_format: "markdown" })

// Save a solution
record_pattern({ name: "...", category: "...", steps: [...] })

// Find past solutions
get_similar_patterns({ query: "..." })

// Check storage
get_storage_stats({ include_breakdown: true })
```

### File Locations

```
~/workspace-brain/
├── telemetry/task-log.jsonl       # Your logged events
├── analytics/weekly-summaries/    # Generated reports
├── learning/issue-patterns.json   # Saved patterns
└── backups/manual-exports/        # Data exports
```

---

## Tips for Success

### ✅ Do's
- **Log meaningful events** - Task completions, workflow milestones
- **Use consistent naming** - `project-feature-phase` format
- **Include rich metadata** - Context helps future analysis
- **Generate weekly summaries** - Track progress over time
- **Record patterns** - Save solutions for reuse

### ❌ Don'ts
- **Don't log every tool call** - Too granular, creates noise
- **Don't include PHI** - Privacy violation
- **Don't use vague names** - "work", "stuff", "task" are not descriptive
- **Don't forget to archive** - Storage management important
- **Don't skip queries** - Data is only useful if you review it

---

## Troubleshooting

### Events not appearing?

**Check:**
1. Event logged successfully? `result.success === true`
2. File exists? `cat ~/workspace-brain/telemetry/task-log.jsonl`
3. Correct filters? Try `query_events({ filters: {} })` (no filters)

### Storage growing too large?

**Solution:**
```typescript
workspace_brain.archive_old_data({
  data_type: "telemetry",
  before_date: "2025-08-01"  // 90 days ago
});
```

### Need to export data?

**Solution:**
```typescript
workspace_brain.export_data({
  data_type: "all",
  format: "json"
});
```

Files saved to: `~/workspace-brain/backups/manual-exports/`

---

## What's Next?

### Phase 1.1 (Immediate)
- Fix cache_get and cache_invalidate bugs
- Add integration tests
- Configure learning-optimizer domains

### Phase 2 (Short-term)
- Automatic telemetry logging
- Real-time dashboard
- Advanced pattern detection
- Machine learning for automation opportunities

### Phase 3 (Long-term)
- Cross-MCP analytics
- Predictive insights
- Automatic issue resolution

---

## Support

**Documentation:**
- Full guides in `03-resources-docs-assets-tools/`
- Smoke test results in `temp/workflows/workspace-brain-smoke-tests/`

**Get Help:**
- Ask Claude: "How do I use workspace-brain for X?"
- Check known issues in smoke test results

**Feedback:**
- Document issues in project's temp/ directory
- Suggest features for Phase 2

---

**🎉 Congratulations!** You're now ready to use workspace-brain MCP.

Start logging your work and build your external brain!
