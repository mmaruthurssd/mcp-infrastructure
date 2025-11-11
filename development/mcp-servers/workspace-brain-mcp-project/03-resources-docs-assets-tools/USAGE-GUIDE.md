---
type: guide
tags: [workspace-brain-mcp, usage, examples, workflows, best-practices]
---

# Workspace Brain MCP - Usage Guide

**Purpose:** Practical guide with real-world examples for using workspace-brain MCP in daily workflows.

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Common Workflows](#common-workflows)
3. [Real-World Examples](#real-world-examples)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [Tips and Tricks](#tips-and-tricks)

---

## Quick Start

### Verify Installation

```bash
# Check external brain directory exists
ls ~/workspace-brain/

# Expected output:
# README.md  analytics  backups  cache  learning  telemetry
```

### Your First Event

**Log a simple task completion:**

```typescript
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "my-first-workflow",
    task_type: "testing",
    duration_minutes: 5,
    tools_used: ["workspace-brain"],
    complexity: 2,
    outcome: "completed"
  }
});
```

**Response:**
```json
{
  "success": true,
  "event_id": "uuid",
  "logged_at": "2025-10-31T16:00:00Z",
  "file_path": "~/workspace-brain/telemetry/task-log.jsonl",
  "write_time_ms": 2
}
```

### Query Your Events

```typescript
workspace_brain.query_events({
  filters: {
    event_type: "task"
  },
  limit: 10
});
```

### Generate Your First Report

```typescript
workspace_brain.generate_weekly_summary({
  output_format: "markdown"
});
```

**Output:** `~/workspace-brain/analytics/weekly-summaries/2025-W43.md`

---

## Common Workflows

### Workflow 1: Bug Fix Tracking

**Scenario:** You're fixing a bug and want to track the time and tools used.

#### Step 1: Start Timing
```typescript
const startTime = Date.now();
```

#### Step 2: Do the work
```bash
# Read code, edit files, test changes
```

#### Step 3: Log completion
```typescript
const duration_minutes = (Date.now() - startTime) / 60000;

workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "cache-retrieval-bug-fix",
    task_type: "bug-fix",
    duration_minutes: Math.round(duration_minutes * 10) / 10,
    tools_used: ["Read", "Edit", "Bash", "git"],
    complexity: 6,
    outcome: "completed",
    metadata: {
      bug_severity: "medium",
      files_modified: 2,
      tests_added: 1
    }
  }
});
```

#### Step 4: Record the pattern (for future reference)
```typescript
workspace_brain.record_pattern({
  name: "Cache path resolution bug",
  category: "bug-fix",
  description: "Path mismatch between cache_set and cache_get",
  steps: [
    "Verify file exists at expected path",
    "Compare path construction in set vs get",
    "Add debug logging to trace path",
    "Update path logic to match",
    "Test round-trip (set → get → verify)"
  ],
  tools_involved: ["Read", "Edit", "Bash"],
  frequency: 1,
  notes: "Common pattern: write/read path mismatches"
});
```

---

### Workflow 2: Feature Implementation Tracking

**Scenario:** Implementing a new feature across multiple tasks.

#### Phase 1: Log workflow start
```typescript
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "patient-search-feature",
    event: "started",
    phase: "planning",
    metadata: {
      estimated_hours: 8,
      total_tasks: 10,
      complexity: 7
    }
  }
});
```

#### Phase 2: Log each task completion
```typescript
// Task 1: Backend implementation
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "patient-search-feature",
    task_type: "backend-implementation",
    duration_minutes: 45,
    tools_used: ["Edit", "Bash", "git"],
    complexity: 7,
    outcome: "completed",
    metadata: {
      task_id: "1",
      api_endpoints_added: 3
    }
  }
});

// Task 2: Frontend integration
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "patient-search-feature",
    task_type: "frontend-implementation",
    duration_minutes: 30,
    tools_used: ["Edit"],
    complexity: 5,
    outcome: "completed",
    metadata: {
      task_id: "2",
      components_added: 2
    }
  }
});
```

#### Phase 3: Log workflow completion
```typescript
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "patient-search-feature",
    event: "completed",
    phase: "deployment",
    total_duration_hours: 7.5,
    tasks_completed: 10,
    metadata: {
      estimated_hours: 8,
      actual_hours: 7.5,
      variance: -0.5
    }
  }
});
```

---

### Workflow 3: MCP Performance Tracking

**Scenario:** Track expensive MCP operations to identify bottlenecks.

```typescript
// Before expensive operation
const start = Date.now();

// Expensive operation
const result = await parallelization.execute_parallel_workflow({
  analysisResult: {...},
  executionStrategy: "aggressive",
  maxParallelAgents: 5
});

// Calculate duration
const duration_ms = Date.now() - start;

// Log performance
workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "parallelization",
    tool_name: "execute_parallel_workflow",
    duration_ms,
    success: result.success,
    context: "patient-search-backend",
    metadata: {
      agents_deployed: 5,
      tasks_parallelized: 8,
      conflicts_detected: 0,
      speedup_factor: result.speedup_factor,
      strategy: "aggressive"
    }
  }
});
```

---

### Workflow 4: Weekly Review

**Scenario:** End of week, review what you accomplished.

#### Step 1: Generate weekly summary
```typescript
workspace_brain.generate_weekly_summary({
  output_format: "markdown",
  include_sections: ["summary", "patterns", "opportunities"]
});
```

#### Step 2: Review the report
```bash
cat ~/workspace-brain/analytics/weekly-summaries/2025-W43.md
```

**Example output:**
```markdown
# Weekly Summary - Week 43, 2025

## Summary
- **Total Tasks:** 42
- **Total Time:** 18.5 hours
- **Average Task Duration:** 26 minutes
- **Success Rate:** 95% (40 completed, 2 failed)

## Top Tools Used
1. Edit (120 uses)
2. Bash (85 uses)
3. Read (75 uses)
4. git (50 uses)

## Patterns Detected
- "npm install" repeated 8 times (16 minutes total)
  → **Opportunity:** Cache node_modules

## This Week vs Last Week
- Tasks: +15% (42 vs 36)
- Duration: -10% (more efficient)
- Tool diversity: Same (10 tools)
```

#### Step 3: Check automation opportunities
```typescript
workspace_brain.get_automation_opportunities({
  min_frequency: 3,
  min_duration: 5,
  sort_by: "time_savings"
});
```

---

### Workflow 5: Pattern Learning

**Scenario:** You solved a tricky issue and want to remember the solution.

#### Step 1: Record the pattern
```typescript
workspace_brain.record_pattern({
  name: "MCP TypeScript build configuration",
  category: "configuration",
  description: "Standard tsconfig.json for MCP servers with proper module resolution",
  steps: [
    "Set target to ES2020",
    "Set module to commonjs for Node.js compatibility",
    "Enable esModuleInterop for better imports",
    "Set outDir to build/",
    "Include src/ directory"
  ],
  tools_involved: ["Edit", "Bash", "tsc"],
  frequency: 1,
  notes: "Use this template for all new MCP servers"
});
```

#### Step 2: Later, find similar patterns
```typescript
workspace_brain.get_similar_patterns({
  query: "typescript configuration",
  category: "configuration",
  limit: 5,
  similarity_threshold: 0.5
});
```

**Response:**
```json
{
  "success": true,
  "patterns": [
    {
      "pattern_id": "uuid",
      "name": "MCP TypeScript build configuration",
      "category": "configuration",
      "description": "Standard tsconfig.json for MCP servers...",
      "similarity_score": 0.95,
      "steps": [...]
    }
  ]
}
```

---

## Real-World Examples

### Example 1: Task-Executor Integration

**Context:** You completed a task in a task-executor workflow.

```typescript
// Complete task via task-executor
await task_executor.complete_task({
  projectPath: "/path/to/project",
  workflowName: "workspace-brain-documentation",
  taskId: "3",
  notes: "Created MCP integration guide"
});

// Log to workspace-brain
await workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "workspace-brain-documentation",
    task_type: "documentation",
    duration_minutes: 20,
    tools_used: ["Write", "task-executor"],
    complexity: 3,
    outcome: "completed",
    metadata: {
      task_id: "3",
      document_type: "guide",
      word_count: 5000
    }
  }
});
```

### Example 2: Project-Management Handoff

**Context:** Handing off from project-management to spec-driven.

```typescript
// Prepare handoff
const handoff = await project_management.prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// Log the handoff event
await workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "goal-01-patient-search",
    event: "phase-change",
    phase: "specification",
    metadata: {
      handoff_from: "project-management",
      handoff_to: "spec-driven",
      goal_tier: "Now",
      goal_impact: "High"
    }
  }
});

// Invoke spec-driven (handoff complete)
await spec_driven.sdd_guide({
  action: "start",
  project_path: handoff.project_path,
  goal_context: handoff.goal_context
});
```

### Example 3: Parallel Execution Tracking

**Context:** Running multiple agents in parallel.

```typescript
// Execute parallel workflow
const result = await parallelization.execute_parallel_workflow({
  analysisResult: {
    batches: [
      { agents: ["backend-implementer"], tasks: ["1", "2"] },
      { agents: ["test-writer"], tasks: ["3", "4"] }
    ]
  },
  executionStrategy: "conservative",
  maxParallelAgents: 3
});

// Log each agent's performance
result.agentResults.forEach(async (agentResult) => {
  await workspace_brain.log_event({
    event_type: "task",
    event_data: {
      workflow_name: "parallel-feature-build",
      task_type: "parallel-execution",
      duration_minutes: agentResult.duration / 60000,
      tools_used: ["parallelization", agentResult.agentId],
      complexity: 5,
      outcome: agentResult.success ? "completed" : "failed",
      metadata: {
        agent_id: agentResult.agentId,
        files_modified: agentResult.filesModified.length,
        conflicts: agentResult.conflicts?.length || 0
      }
    }
  });
});

// Log overall parallel execution
await workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "parallelization",
    tool_name: "execute_parallel_workflow",
    duration_ms: result.totalDuration,
    success: result.success,
    context: "feature-implementation",
    metadata: {
      agents_count: result.agentResults.length,
      total_speedup: result.speedup,
      strategy: "conservative"
    }
  }
});
```

---

## Best Practices

### 1. Log at the Right Granularity

**Too granular (❌):**
```typescript
// Don't log every file read
workspace_brain.log_event({
  workflow_name: "reading-file",
  task_type: "file-read",
  duration_minutes: 0.001
});
```

**Too coarse (❌):**
```typescript
// Don't log entire day as one task
workspace_brain.log_event({
  workflow_name: "daily-work",
  task_type: "work",
  duration_minutes: 480  // 8 hours
});
```

**Just right (✅):**
```typescript
// Log meaningful task completions
workspace_brain.log_event({
  workflow_name: "patient-search-backend",
  task_type: "feature-implementation",
  duration_minutes: 45
});
```

### 2. Use Consistent Naming

**Bad naming (❌):**
```typescript
workflow_name: "stuff"
workflow_name: "project"
workflow_name: "work123"
workflow_name: "asdfasdf"
```

**Good naming (✅):**
```typescript
workflow_name: "patient-search-backend-implementation"
workflow_name: "workspace-brain-phase1-cache-fix"
workflow_name: "goal-03-appointment-scheduling"
```

**Naming convention:**
```
[component]-[feature]-[phase]

Examples:
- patient-search-backend-implementation
- workspace-brain-documentation-creation
- goal-01-spec-driven-planning
```

### 3. Include Meaningful Metadata

**Minimal metadata (❌):**
```typescript
metadata: {
  test: true
}
```

**Rich metadata (✅):**
```typescript
metadata: {
  // Project context
  project_type: "healthcare",
  component: "backend",

  // Technical details
  language: "typescript",
  framework: "express",

  // Execution details
  parallel_execution: true,
  agents_used: ["backend-implementer"],

  // Outcome metrics
  files_modified: 5,
  tests_added: 3,
  tests_passed: 15,

  // Performance
  speedup_factor: 2.3
}
```

### 4. Track Failures Too

**Only success (❌):**
```typescript
if (success) {
  workspace_brain.log_event({
    outcome: "completed"
  });
}
// Failures not tracked!
```

**Track everything (✅):**
```typescript
try {
  await doWork();
  await workspace_brain.log_event({
    outcome: "completed"
  });
} catch (error) {
  await workspace_brain.log_event({
    outcome: "failed",
    metadata: {
      error_type: error.name,
      error_message: error.message
    }
  });
  throw error;
}
```

### 5. Use Time Ranges in Queries

**Unbounded query (❌):**
```typescript
// Reads all telemetry files (slow)
workspace_brain.query_events({
  filters: { event_type: "task" }
});
```

**Bounded query (✅):**
```typescript
// Only reads recent data (fast)
workspace_brain.query_events({
  filters: { event_type: "task" },
  time_range: {
    start: "2025-10-24T00:00:00Z",
    end: "2025-10-31T23:59:59Z"
  }
});
```

### 6. Archive Old Data

**Never archive (❌):**
```bash
# Telemetry grows forever
~/workspace-brain/telemetry/task-log.jsonl  # 500MB!
```

**Regular archival (✅):**
```typescript
// Monthly cleanup
workspace_brain.archive_old_data({
  data_type: "telemetry",
  before_date: "2025-08-01",  // 90 days ago
  compress: true
});
```

---

## Troubleshooting

### Issue: Events not appearing in queries

**Check 1: Was event logged successfully?**
```typescript
const result = await workspace_brain.log_event({...});
console.log(result);  // Check success: true
```

**Check 2: Does file exist?**
```bash
ls -lh ~/workspace-brain/telemetry/task-log.jsonl
cat ~/workspace-brain/telemetry/task-log.jsonl | tail -5
```

**Check 3: Are filters correct?**
```typescript
// Try broad query first
workspace_brain.query_events({
  filters: {},  // No filters
  limit: 10
});
```

### Issue: Queries are slow

**Solution 1: Add time range**
```typescript
workspace_brain.query_events({
  filters: { event_type: "task" },
  time_range: {
    start: "2025-10-01T00:00:00Z"  // Last 30 days
  }
});
```

**Solution 2: Limit results**
```typescript
workspace_brain.query_events({
  filters: { event_type: "task" },
  limit: 50  // Don't fetch all events
});
```

**Solution 3: Archive old data**
```typescript
workspace_brain.archive_old_data({
  data_type: "telemetry",
  before_date: "2025-08-01"
});
```

### Issue: Storage growing too large

**Check storage:**
```typescript
workspace_brain.get_storage_stats({
  include_breakdown: true
});
```

**Archive old data:**
```typescript
workspace_brain.archive_old_data({
  data_type: "all",
  before_date: "2025-08-01",
  compress: true
});
```

**Export and delete:**
```typescript
// Export first
workspace_brain.export_data({
  data_type: "telemetry",
  format: "json"
});

// Then manually delete old files
rm ~/workspace-brain/telemetry/task-log-2025-Q2.jsonl
```

---

## Tips and Tricks

### Tip 1: Create Workflow Templates

**Save common log patterns:**

```typescript
// template: bug-fix
const logBugFix = (workflowName, duration, tools) =>
  workspace_brain.log_event({
    event_type: "task",
    event_data: {
      workflow_name: workflowName,
      task_type: "bug-fix",
      duration_minutes: duration,
      tools_used: tools,
      complexity: 5,  // Default
      outcome: "completed"
    }
  });

// Usage
await logBugFix("cache-fix", 20, ["Edit", "Bash"]);
```

### Tip 2: Batch Query for Analytics

**Instead of multiple queries:**
```typescript
const tasks = await query_events({ event_type: "task" });
const workflows = await query_events({ event_type: "workflow" });
const mcpUsage = await query_events({ event_type: "mcp-usage" });
```

**Query once, filter in memory:**
```typescript
const allEvents = await query_events({});
const tasks = allEvents.filter(e => e.type === "task");
const workflows = allEvents.filter(e => e.type === "workflow");
const mcpUsage = allEvents.filter(e => e.type === "mcp-usage");
```

### Tip 3: Use get_event_stats for Aggregations

**Instead of:**
```typescript
const events = await query_events({});
const total = events.length;
const avgDuration = events.reduce((sum, e) =>
  sum + e.data.duration_minutes, 0) / total;
```

**Use:**
```typescript
const stats = await get_event_stats({
  metric: "avg_duration",
  filters: { event_type: "task" }
});
```

### Tip 4: Export Before Major Changes

**Before workspace migration:**
```typescript
workspace_brain.export_data({
  data_type: "all",
  format: "json"
});
```

Backup saved to: `~/workspace-brain/backups/manual-exports/`

### Tip 5: Check Storage Weekly

**Add to weekly review:**
```typescript
const stats = await workspace_brain.get_storage_stats({
  include_breakdown: true
});

if (stats.total_size_mb > 50) {
  console.warn("Storage over 50MB, consider archiving");
}
```

---

## Next Steps

### Learn More
- **Architecture:** `EXTERNAL-BRAIN-ARCHITECTURE.md`
- **Telemetry Details:** `TELEMETRY-SYSTEM-GUIDE.md`
- **MCP Integration:** `MCP-INTEGRATION-PATTERNS.md`
- **Analytics:** `ANALYTICS-AND-LEARNING-GUIDE.md`

### Try It Out
1. Log your next task completion
2. Generate a weekly summary
3. Record a pattern you learned
4. Query your telemetry data

### Get Help
- Check smoke test results: `temp/workflows/workspace-brain-smoke-tests/SMOKE-TEST-RESULTS.md`
- Review known issues
- Ask Claude for help with specific use cases

---

## Feedback

workspace-brain MCP is actively developed. If you have:
- Feature requests
- Bug reports
- Usage questions
- Integration ideas

Document them in the project's temp/ directory for tracking.