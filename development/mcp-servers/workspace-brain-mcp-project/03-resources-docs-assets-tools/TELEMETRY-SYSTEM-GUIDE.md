---
type: guide
tags: [workspace-brain-mcp, telemetry, event-logging, analytics, metrics]
---

# Telemetry System Guide

**Purpose:** Complete guide to workspace-brain MCP's telemetry system for event logging, querying, and analysis.

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Overview](#overview)
2. [Event Types](#event-types)
3. [Logging Events](#logging-events)
4. [Querying Events](#querying-events)
5. [Event Statistics](#event-statistics)
6. [Data Retention](#data-retention)
7. [Best Practices](#best-practices)
8. [Integration Patterns](#integration-patterns)

---

## Overview

### What is Telemetry?

The telemetry system captures **time-series event data** from Claude Code workflows:

- **Task completions** - When tasks finish, how long they took, what tools were used
- **MCP tool usage** - Which MCP tools are called, how often, performance metrics
- **Workflow state changes** - Project phases, goal completions, workflow transitions

### Why Telemetry?

**Telemetry enables:**
- 📊 **Usage analytics** - Understand what tools/patterns are most common
- ⏱️ **Time tracking** - See where time is spent across workflows
- 🔍 **Pattern detection** - Identify repetitive tasks that could be automated
- 📈 **Performance metrics** - Track execution times and bottlenecks
- 🎯 **Continuous improvement** - Data-driven decisions about tooling

**Example insights from telemetry:**
- "You've run 'npm install' 12 times this week - consider caching node_modules"
- "Average task completion time increased 30% - investigate bottlenecks"
- "Most used tool: project-management (45 calls) - working as intended"

---

## Event Types

### 1. Task Events (`type: "task"`)

**When to log:** When a task is completed (via task-executor or manual work)

**Schema:**
```typescript
{
  id: string;              // Auto-generated UUID
  type: "task";
  timestamp: string;       // ISO 8601
  data: {
    workflow_name: string;        // "workspace-brain-smoke-tests"
    task_type: string;            // "mcp-testing", "bug-fix", "feature"
    duration_minutes: number;     // Actual time spent
    tools_used: string[];         // ["workspace-brain", "Bash", "Read"]
    complexity: number;           // 1-10 complexity score
    outcome: "completed"|"failed"|"blocked";
    metadata: {                   // Optional custom fields
      [key: string]: any;
    }
  }
}
```

**Example:**
```json
{
  "id": "17e213a8-2f84-426b-847a-c36a533eab2d",
  "type": "task",
  "timestamp": "2025-10-31T15:27:16.718Z",
  "data": {
    "workflow_name": "workspace-brain-smoke-tests",
    "task_type": "mcp-testing",
    "duration_minutes": 2,
    "tools_used": ["log_event", "query_events", "get_event_stats"],
    "complexity": 3,
    "outcome": "completed",
    "metadata": {
      "test_phase": "smoke-test",
      "mcp_server": "workspace-brain-mcp"
    }
  }
}
```

### 2. MCP Usage Events (`type: "mcp-usage"`)

**When to log:** After calling expensive MCP operations (optional, for performance tracking)

**Schema:**
```typescript
{
  id: string;
  type: "mcp-usage";
  timestamp: string;
  data: {
    mcp_server: string;           // "project-management"
    tool_name: string;            // "prepare_spec_handoff"
    duration_ms: number;          // Execution time
    success: boolean;             // Did it succeed?
    context: string;              // What triggered this call
    metadata: {
      project_path?: string;
      parameters?: object;
    }
  }
}
```

**Example:**
```json
{
  "id": "uuid",
  "type": "mcp-usage",
  "timestamp": "2025-10-31T15:00:00Z",
  "data": {
    "mcp_server": "project-management",
    "tool_name": "prepare_spec_handoff",
    "duration_ms": 125,
    "success": true,
    "context": "goal-001-patient-search",
    "metadata": {
      "project_path": "/path/to/project"
    }
  }
}
```

### 3. Workflow Events (`type: "workflow"`)

**When to log:** Major workflow milestones (project start, phase transitions, completion)

**Schema:**
```typescript
{
  id: string;
  type: "workflow";
  timestamp: string;
  data: {
    workflow_name: string;        // "patient-search-feature"
    event: string;                // "started", "phase-change", "completed"
    phase?: string;               // "planning", "execution", "testing"
    total_duration_hours?: number; // For completion events
    tasks_completed?: number;
    metadata: object;
  }
}
```

**Example:**
```json
{
  "id": "uuid",
  "type": "workflow",
  "timestamp": "2025-10-31T16:00:00Z",
  "data": {
    "workflow_name": "patient-search-feature",
    "event": "completed",
    "phase": "testing",
    "total_duration_hours": 4.5,
    "tasks_completed": 12,
    "metadata": {
      "parallel_execution": true,
      "agents_used": ["backend-implementer", "test-writer"]
    }
  }
}
```

---

## Logging Events

### Basic Usage

```typescript
// Log a completed task
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "bug-fix-123",
    task_type: "bug-fix",
    duration_minutes: 15,
    tools_used: ["Edit", "Bash", "git"],
    complexity: 5,
    outcome: "completed"
  }
});
```

**Response:**
```json
{
  "success": true,
  "event_id": "uuid",
  "logged_at": "2025-10-31T15:00:00Z",
  "file_path": "~/workspace-brain/telemetry/task-log.jsonl",
  "write_time_ms": 2
}
```

### When to Log

**✅ Good use cases:**
- After completing a task workflow
- After major workflow milestones
- When tracking performance of expensive operations
- When you want to build analytics over time

**❌ Avoid logging:**
- Individual file reads (too granular)
- Every tool call (creates noise)
- PHI or sensitive data
- Events without clear analytical value

### Automatic vs Manual Logging

**Phase 1: Manual logging**
- User/Claude explicitly calls `log_event()`
- Full control over what's logged
- Risk: Forgetting to log important events

**Phase 2 (Planned): Automatic logging**
- Hooks in task-executor, project-management
- Automatic task completion logging
- Opt-out for sensitive workflows

---

## Querying Events

### Basic Queries

#### Get all recent task events
```typescript
workspace_brain.query_events({
  filters: {
    event_type: "task"
  },
  limit: 50
});
```

**Response:**
```json
{
  "success": true,
  "events": [...],
  "count": 50,
  "total_matching": 200,
  "query_time_ms": 0
}
```

#### Filter by workflow name
```typescript
workspace_brain.query_events({
  filters: {
    event_type: "task",
    workflow_name: "workspace-brain-smoke-tests"
  }
});
```

#### Filter by time range
```typescript
workspace_brain.query_events({
  filters: {
    event_type: "task"
  },
  time_range: {
    start: "2025-10-24T00:00:00Z",
    end: "2025-10-31T23:59:59Z"
  }
});
```

#### Filter by outcome
```typescript
workspace_brain.query_events({
  filters: {
    outcome: "failed"  // Find all failed tasks
  }
});
```

#### Filter by tools used
```typescript
workspace_brain.query_events({
  filters: {
    tools_used: ["parallelization", "agent-coordinator"]
  }
});
```

### Advanced Queries

#### Sorting
```typescript
workspace_brain.query_events({
  filters: { event_type: "task" },
  sort: "desc",  // Most recent first (default)
  limit: 10
});
```

#### Pagination
```typescript
// Get first page
workspace_brain.query_events({
  filters: { event_type: "task" },
  limit: 50
});

// Get next page (manual - Phase 1)
// Need to track last timestamp and filter: time_range.end < last_timestamp
```

---

## Event Statistics

### Count Aggregations

```typescript
workspace_brain.get_event_stats({
  metric: "count",
  filters: {
    event_type: "task"
  },
  group_by: "type"
});
```

**Response:**
```json
{
  "success": true,
  "metric": "count",
  "total": 100,
  "by_group": {
    "task": 75,
    "mcp-usage": 20,
    "workflow": 5
  }
}
```

### Average Duration

```typescript
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    event_type: "task",
    time_range: {
      start: "2025-10-01T00:00:00Z"
    }
  }
});
```

**Response:**
```json
{
  "success": true,
  "metric": "avg_duration",
  "value": 12.5,
  "unit": "minutes",
  "sample_size": 100
}
```

### Tool Usage

```typescript
workspace_brain.get_event_stats({
  metric: "tool_usage",
  filters: {
    event_type: "task"
  }
});
```

**Response:**
```json
{
  "success": true,
  "metric": "tool_usage",
  "top_tools": [
    {"tool": "Edit", "count": 150},
    {"tool": "Bash", "count": 120},
    {"tool": "Read", "count": 100}
  ]
}
```

### Outcome Distribution

```typescript
workspace_brain.get_event_stats({
  metric: "outcome_distribution",
  filters: {
    event_type: "task"
  }
});
```

**Response:**
```json
{
  "success": true,
  "metric": "outcome_distribution",
  "distribution": {
    "completed": 85,
    "failed": 10,
    "blocked": 5
  },
  "percentages": {
    "completed": 85.0,
    "failed": 10.0,
    "blocked": 5.0
  }
}
```

### Grouping by Time Period

```typescript
workspace_brain.get_event_stats({
  metric: "count",
  filters: {
    event_type: "task"
  },
  group_by: "day"  // or "week", "month"
});
```

**Response:**
```json
{
  "success": true,
  "metric": "count",
  "by_group": {
    "2025-10-27": 15,
    "2025-10-28": 20,
    "2025-10-29": 18,
    "2025-10-30": 22,
    "2025-10-31": 25
  }
}
```

---

## Data Retention

### Retention Policy

| Data Type | Active Storage | Archive Storage | Total Retention |
|-----------|----------------|-----------------|-----------------|
| Task events | 90 days | 1 year | 15 months |
| MCP usage | 90 days | 1 year | 15 months |
| Workflow events | 180 days | Indefinite | Indefinite |

### Archival Process

**Phase 1:** Manual archival via `archive_old_data()`
```typescript
workspace_brain.archive_old_data({
  data_type: "telemetry",
  before_date: "2025-08-01",
  compress: true
});
```

**Phase 2 (Planned):** Automatic archival
- Runs weekly
- Archives events >90 days old
- Compresses with gzip (10:1 compression)
- Moves to `~/workspace-brain/telemetry/archives/`

### Storage Monitoring

```typescript
workspace_brain.get_storage_stats({
  include_breakdown: true
});
```

**Response:**
```json
{
  "success": true,
  "total_size_mb": 15.2,
  "breakdown": {
    "telemetry_mb": 12.5,
    "analytics_mb": 2.0,
    "learning_mb": 0.5,
    "cache_mb": 0.2
  },
  "file_counts": {
    "telemetry": 3,
    "analytics": 5,
    "cache": 10
  },
  "oldest_event": "2025-09-01T00:00:00Z",
  "newest_event": "2025-10-31T15:00:00Z"
}
```

---

## Best Practices

### 1. Log Meaningful Events

**✅ Good:**
```typescript
log_event({
  event_type: "task",
  event_data: {
    workflow_name: "patient-search-backend",
    task_type: "feature-implementation",
    duration_minutes: 45,
    tools_used: ["Edit", "Bash", "git"],
    complexity: 7,
    outcome: "completed",
    metadata: {
      files_modified: 5,
      tests_added: 3
    }
  }
});
```

**❌ Bad:**
```typescript
log_event({
  event_type: "task",
  event_data: {
    workflow_name: "stuff",  // Too vague
    task_type: "work",       // Not descriptive
    duration_minutes: 1,     // Too granular
    tools_used: [],          // Missing data
    complexity: 0,           // Invalid
    outcome: "completed"
  }
});
```

### 2. Use Consistent Naming

**Workflow names:**
- ✅ `workspace-brain-smoke-tests`
- ✅ `patient-search-backend-implementation`
- ✅ `cache-bug-fix-phase1-1`
- ❌ `test`, `project`, `work`, `stuff`

**Task types:**
- ✅ `feature-implementation`, `bug-fix`, `refactoring`, `testing`, `documentation`
- ❌ `coding`, `work`, `task`, `other`

### 3. Include Context in Metadata

```typescript
metadata: {
  // Project context
  project_type: "healthcare",
  project_phase: "development",

  // Technical context
  language: "typescript",
  framework: "express",

  // Execution context
  parallel_execution: true,
  agents_used: ["backend-implementer"],

  // Outcome context
  tests_passed: 15,
  tests_failed: 0
}
```

### 4. Log at Appropriate Granularity

**Too granular (❌):**
- Every file read
- Every bash command
- Every tool call

**Too coarse (❌):**
- One event per day
- One event per project

**Just right (✅):**
- One event per completed task
- One event per workflow milestone
- One event per major operation

### 5. Track Time Accurately

```typescript
// Start timing
const startTime = Date.now();

// Do work...

// Calculate duration
const duration_minutes = (Date.now() - startTime) / 60000;

log_event({
  event_type: "task",
  event_data: {
    duration_minutes: Math.round(duration_minutes * 10) / 10  // 1 decimal place
  }
});
```

---

## Integration Patterns

### Pattern 1: Task Completion Logging

**When:** After completing a task in task-executor workflow

```typescript
// Complete the task
task_executor.complete_task({
  taskId: "3",
  notes: "Implemented feature X"
});

// Log telemetry
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "feature-x-implementation",
    task_type: "feature-implementation",
    duration_minutes: 30,
    tools_used: ["Edit", "Bash", "task-executor"],
    complexity: 6,
    outcome: "completed",
    metadata: {
      task_id: "3",
      workflow_total_tasks: 10
    }
  }
});
```

### Pattern 2: Workflow Milestone Logging

**When:** Starting, transitioning, or completing a workflow

```typescript
// Project setup complete
project_management.initialize_project_orchestration({...});

// Log milestone
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "patient-portal-project",
    event: "started",
    phase: "initialization",
    metadata: {
      project_type: "healthcare",
      goals_count: 5
    }
  }
});
```

### Pattern 3: Performance Tracking

**When:** Tracking expensive operations for optimization

```typescript
const start = Date.now();

// Expensive operation
const result = await parallelization.execute_parallel_workflow({...});

const duration_ms = Date.now() - start;

// Log performance
workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "parallelization",
    tool_name: "execute_parallel_workflow",
    duration_ms,
    success: result.success,
    context: "feature-implementation",
    metadata: {
      agents_count: 5,
      tasks_parallelized: 8,
      speedup_factor: 2.3
    }
  }
});
```

### Pattern 4: Error Tracking

**When:** A task or operation fails

```typescript
try {
  // Operation that might fail
  await risky_operation();

  workspace_brain.log_event({
    event_type: "task",
    event_data: {
      outcome: "completed",
      // ... other fields
    }
  });
} catch (error) {
  workspace_brain.log_event({
    event_type: "task",
    event_data: {
      outcome: "failed",
      metadata: {
        error_type: error.name,
        error_message: error.message
      }
    }
  });
}
```

---

## Weekly Analytics

### Generate Weekly Summary

```typescript
workspace_brain.generate_weekly_summary({
  output_format: "markdown",  // or "json"
  include_sections: ["summary", "patterns", "opportunities"]
});
```

**Output:** `~/workspace-brain/analytics/weekly-summaries/2025-W43.md`

**Contents:**
- Total tasks completed this week
- Average task duration
- Most used tools
- Detected patterns (repeated tasks)
- Automation opportunities
- Week-over-week trends

### Automation Opportunity Detection

```typescript
workspace_brain.get_automation_opportunities({
  min_frequency: 3,      // Repeated 3+ times
  min_duration: 10,      // Takes 10+ minutes each
  sort_by: "time_savings"
});
```

**Response:**
```json
{
  "success": true,
  "opportunities": [
    {
      "task_pattern": "npm install in MCP projects",
      "frequency": 12,
      "avg_duration_minutes": 2,
      "total_time_hours": 0.4,
      "potential_savings": "80% (cache node_modules)",
      "recommendation": "Create shared node_modules cache"
    }
  ],
  "total_potential_savings_hours": 15.2
}
```

---

## Next Steps

### Phase 1 Checklist
- [x] Basic event logging (task, mcp-usage, workflow)
- [x] Event querying with filters
- [x] Event statistics and aggregations
- [x] Weekly summary generation
- [x] Automation opportunity detection
- [ ] Configure learning-optimizer integration
- [ ] Add automatic task completion logging

### Phase 2 Features
- [ ] Automatic archival with compression
- [ ] Real-time dashboard
- [ ] Predictive analytics
- [ ] Cross-MCP performance tracking
- [ ] Machine learning for pattern detection

---

## Troubleshooting

### Events not appearing in queries

**Check:**
1. Event was logged successfully (check response)
2. File exists: `ls ~/workspace-brain/telemetry/*.jsonl`
3. Filter criteria match event data
4. Time range includes event timestamp

### Slow query performance

**Solutions:**
1. Add time range filters (narrow scope)
2. Limit result count
3. Archive old data (reduce file size)
4. Use group_by instead of fetching all events

### Storage growing too large

**Solutions:**
1. Run `archive_old_data()` to compress old events
2. Export and delete non-essential events
3. Reduce logging granularity
4. Check for duplicate events

---

## References

- **External Brain Architecture:** `EXTERNAL-BRAIN-ARCHITECTURE.md`
- **MCP Integration Guide:** `MCP-INTEGRATION-PATTERNS.md` (next)
- **Source Code:** `04-product-under-development/src/index.ts`
- **Telemetry Files:** `~/workspace-brain/telemetry/`
