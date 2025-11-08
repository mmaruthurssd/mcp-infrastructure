---
type: guide
tags: [workspace-brain-mcp, integration, mcp-coordination, learning-optimizer, project-management]
---

# MCP Integration Patterns

**Purpose:** Comprehensive guide to integrating workspace-brain MCP with other MCP servers for enhanced functionality.

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Overview](#overview)
2. [Integration Architecture](#integration-architecture)
3. [learning-optimizer Integration](#learning-optimizer-integration)
4. [project-management Integration](#project-management-integration)
5. [task-executor Integration](#task-executor-integration)
6. [parallelization Integration](#parallelization-integration)
7. [Future Integrations](#future-integrations)
8. [Implementation Patterns](#implementation-patterns)

---

## Overview

### Why MCP Integration?

workspace-brain MCP is designed as a **foundational persistence layer** that other MCPs can leverage:

```
┌─────────────────────────────────────────────────────────┐
│ High-Level MCPs (Business Logic)                       │
│ - project-management: Project orchestration             │
│ - learning-optimizer: Issue tracking and learning       │
│ - task-executor: Task workflow management               │
│ - parallelization: Multi-agent coordination             │
└─────────────────────────────────────────────────────────┘
                           ↓
              Cross-session telemetry
              Pattern learning
              Performance analytics
                           ↓
┌─────────────────────────────────────────────────────────┐
│ workspace-brain MCP (Persistence Layer)                 │
│ - Telemetry storage                                     │
│ - Event querying                                        │
│ - Pattern recording                                     │
│ - Analytics generation                                  │
└─────────────────────────────────────────────────────────┘
                           ↓
              ~/workspace-brain/
              (External Brain Storage)
```

### Integration Principles

1. **Loose Coupling** - MCPs work independently, integration is optional
2. **One-Way Data Flow** - High-level MCPs → workspace-brain (write), workspace-brain → analytics (read)
3. **No Direct MCP-to-MCP Calls** - All coordination through Claude Code (Phase 1)
4. **Explicit Logging** - Manual telemetry calls, not automatic (Phase 1)

---

## Integration Architecture

### Current State (Phase 1)

**Manual Coordination Pattern:**
```typescript
// Claude orchestrates integration manually

// 1. Complete task in task-executor
task_executor.complete_task({...});

// 2. Manually log to workspace-brain
workspace_brain.log_event({
  event_type: "task",
  event_data: {...}
});

// 3. Query analytics later
workspace_brain.generate_weekly_summary({...});
```

**Limitations:**
- ❌ Easy to forget to log events
- ❌ No automatic integration
- ❌ Manual coordination required
- ❌ No real-time analytics

### Future State (Phase 2)

**Automatic Integration Pattern:**
```typescript
// task-executor automatically logs to workspace-brain

task_executor.complete_task({...});
// → Internally calls workspace_brain.log_event()
// → No manual coordination needed
```

**Benefits:**
- ✅ Automatic telemetry
- ✅ Consistent logging
- ✅ Real-time analytics
- ✅ Less manual work

---

## learning-optimizer Integration

### Purpose

**learning-optimizer** tracks domain-specific issues and learns from resolutions.
**workspace-brain** provides the persistence layer for pattern storage.

### Integration Points

#### 1. Issue Pattern Storage

**Current Flow (Phase 1 - Separate):**
```
learning-optimizer stores → domain-specific JSON files
workspace-brain stores → learning/issue-patterns.json
```

**Future Flow (Phase 2 - Integrated):**
```
learning-optimizer.track_issue()
    ↓
workspace_brain.record_pattern()
    ↓
Unified pattern storage
```

#### 2. Pattern Retrieval

**Use Case:** When troubleshooting, retrieve similar issues

```typescript
// learning-optimizer provides domain logic
learning_optimizer.get_issues({
  domain: "mcp-installation",
  filter: "high-frequency"
});

// workspace-brain provides pattern matching
workspace_brain.get_similar_patterns({
  query: "cache not working",
  category: "mcp-installation",
  similarity_threshold: 0.6
});
```

#### 3. Preventive Checks

**Use Case:** Before operations, check for known issues

```typescript
// learning-optimizer: Domain-specific checks
learning_optimizer.get_promotion_candidates({
  domain: "mcp-installation"
});

// workspace-brain: Generic preventive checks
workspace_brain.get_preventive_checks({
  context: "pre-commit",
  category: "workflow"
});
```

### Integration Pattern: Post-Resolution Workflow

**After troubleshooting (manual pattern - Phase 1):**

```typescript
// 1. Log to learning-optimizer (domain-specific)
learning_optimizer.track_issue({
  domain: "mcp-installation",
  title: "Cache retrieval bug in workspace-brain",
  symptom: "cache_get returns null despite file existing",
  solution: "Check path resolution in handleCacheGet()",
  root_cause: "Category subdirectory not included in read path"
});

// 2. Log generic pattern to workspace-brain
workspace_brain.record_pattern({
  name: "MCP cache retrieval bug pattern",
  category: "bug-fix",
  description: "Path resolution mismatch between set and get",
  steps: [
    "Verify file exists at expected path",
    "Check path construction logic in both functions",
    "Test with absolute paths",
    "Add debug logging"
  ],
  tools_involved: ["Read", "Bash", "grep"],
  frequency: 1
});

// 3. Log task completion telemetry
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "workspace-brain-phase1-1-cache-fix",
    task_type: "bug-fix",
    duration_minutes: 45,
    outcome: "completed",
    tools_used: ["learning-optimizer", "workspace-brain"]
  }
});
```

**Future (Phase 2 - Automatic):**
```typescript
// learning-optimizer automatically logs to workspace-brain
learning_optimizer.track_issue({...});
// → Internally calls workspace_brain.record_pattern()
// → Automatically logs telemetry event
```

### Configuration Required

**Phase 2: Domain Configuration**
```json
{
  "domains": [
    {
      "name": "mcp-installation",
      "workspace_brain_category": "workflow",
      "auto_log_patterns": true,
      "pattern_frequency_threshold": 3
    }
  ]
}
```

---

## project-management Integration

### Purpose

**project-management** orchestrates project workflows and goal management.
**workspace-brain** tracks project metrics and workflow analytics.

### Integration Points

#### 1. Project Lifecycle Telemetry

**Events to log:**
- Project initialization
- Goal promotion to selected
- Spec-driven handoff
- Task-executor handoff
- Project completion

**Example Integration:**

```typescript
// User completes project setup
project_management.finalize_project_setup({...});

// Log workflow event
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "patient-portal-initialization",
    event: "started",
    phase: "initialization",
    metadata: {
      project_type: "healthcare",
      goals_count: 5,
      constitution_mode: "deep"
    }
  }
});
```

#### 2. Goal Completion Tracking

**Use Case:** Track time spent per goal, success rate

```typescript
// Goal completed
project_management.update_goal_progress({
  goalId: "01",
  progress: 100,
  status: "Completed"
});

// Log task event
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "goal-01-patient-search",
    task_type: "feature-implementation",
    duration_minutes: 180,  // 3 hours
    complexity: 8,
    outcome: "completed",
    metadata: {
      goal_id: "01",
      goal_tier: "Now",
      spec_driven: true,
      parallel_execution: true
    }
  }
});
```

#### 3. Workflow Analytics

**Use Case:** Generate project completion reports with historical data

```typescript
// Generate project completion report
project_management.wrap_up_project({
  projectPath: "/path/to/project"
});

// Query telemetry for project metrics
workspace_brain.query_events({
  filters: {
    event_type: "workflow",
    metadata: {
      project_path: "/path/to/project"
    }
  }
});

// Calculate project-wide statistics
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    workflow_name_prefix: "patient-portal"
  }
});
```

#### 4. MCP Handoff Tracking

**Use Case:** Track handoff success rate and timing

```typescript
// Prepare spec-driven handoff
const handoff = project_management.prepare_spec_handoff({
  goalId: "01"
});

// Log MCP usage
workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "project-management",
    tool_name: "prepare_spec_handoff",
    duration_ms: handoff.duration,
    success: true,
    context: "goal-01",
    metadata: {
      goal_context: handoff.goal_context
    }
  }
});

// Later: Invoke spec-driven
spec_driven.sdd_guide({
  action: "start",
  project_path: handoff.project_path,
  goal_context: handoff.goal_context
});

// Log workflow transition
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "goal-01-spec-creation",
    event: "phase-change",
    phase: "specification",
    metadata: {
      handoff_from: "project-management",
      handoff_to: "spec-driven"
    }
  }
});
```

### Analytics Queries

**Track project velocity:**
```typescript
// Average time per goal
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    event_type: "task",
    task_type: "feature-implementation"
  },
  group_by: "week"
});

// Success rate by tier
workspace_brain.query_events({
  filters: {
    metadata: {
      goal_tier: "Now"
    }
  }
});
```

---

## task-executor Integration

### Purpose

**task-executor** manages persistent task workflows.
**workspace-brain** tracks task execution metrics and patterns.

### Integration Points

#### 1. Workflow Creation

```typescript
// Create workflow
task_executor.create_workflow({
  name: "cache-bug-fix",
  tasks: [...]
});

// Log workflow start
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "cache-bug-fix",
    event: "started",
    phase: "planning",
    metadata: {
      total_tasks: 7,
      estimated_hours: 1.2,
      parallelization_recommended: true
    }
  }
});
```

#### 2. Task Completion

```typescript
// Complete task
task_executor.complete_task({
  taskId: "3",
  notes: "Fixed cache_get path resolution"
});

// Log task telemetry
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "cache-bug-fix",
    task_type: "bug-fix",
    duration_minutes: 15,
    tools_used: ["Edit", "Read", "Bash"],
    complexity: 5,
    outcome: "completed",
    metadata: {
      task_id: "3",
      verification_passed: true
    }
  }
});
```

#### 3. Workflow Archival

```typescript
// Archive workflow
task_executor.archive_workflow({
  workflowName: "cache-bug-fix"
});

// Log workflow completion
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "cache-bug-fix",
    event: "completed",
    phase: "completion",
    total_duration_hours: 1.5,
    tasks_completed: 7,
    metadata: {
      validation_passed: true,
      documentation_updated: true
    }
  }
});
```

### Analytics: Task Complexity Calibration

**Use Case:** Improve complexity scoring accuracy over time

```typescript
// Query actual vs estimated duration
const tasks = workspace_brain.query_events({
  filters: {
    event_type: "task"
  }
});

// Calculate accuracy
tasks.forEach(task => {
  const estimated = task.data.metadata.estimated_hours * 60;
  const actual = task.data.duration_minutes;
  const accuracy = 1 - Math.abs(estimated - actual) / estimated;

  // Track: complexity X tasks typically take Y minutes
});

// Use data to improve future estimates
```

---

## parallelization Integration

### Purpose

**parallelization** coordinates multi-agent parallel execution.
**workspace-brain** tracks parallel execution efficiency and patterns.

### Integration Points

#### 1. Parallel Execution Metrics

```typescript
// Execute parallel workflow
const result = parallelization.execute_parallel_workflow({
  analysisResult: {...},
  executionStrategy: "aggressive",
  maxParallelAgents: 5
});

// Log execution telemetry
workspace_brain.log_event({
  event_type: "mcp-usage",
  event_data: {
    mcp_server: "parallelization",
    tool_name: "execute_parallel_workflow",
    duration_ms: result.total_duration_ms,
    success: result.success,
    context: "feature-implementation",
    metadata: {
      agents_deployed: 5,
      tasks_parallelized: 8,
      conflicts_detected: 0,
      speedup_factor: 2.3,
      strategy: "aggressive"
    }
  }
});
```

#### 2. Conflict Rate Tracking

```typescript
// Detect conflicts
const conflicts = parallelization.detect_conflicts({
  agentResults: [...]
});

// Log conflict data
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "parallel-feature-build",
    task_type: "conflict-resolution",
    duration_minutes: 10,
    outcome: conflicts.conflicts.length === 0 ? "completed" : "blocked",
    metadata: {
      conflicts_count: conflicts.conflicts.length,
      conflict_types: conflicts.conflicts.map(c => c.type)
    }
  }
});
```

#### 3. Efficiency Analysis

**Use Case:** Track parallel execution ROI

```typescript
// Query parallel execution events
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    mcp_server: "parallelization"
  }
});

// Calculate average speedup
const parallelEvents = workspace_brain.query_events({
  filters: {
    metadata: {
      speedup_factor: { $exists: true }
    }
  }
});

const avgSpeedup = parallelEvents.reduce((sum, e) =>
  sum + e.data.metadata.speedup_factor, 0) / parallelEvents.length;

console.log(`Average parallel speedup: ${avgSpeedup}x`);
```

---

## Future Integrations

### 1. performance-monitor MCP

**Purpose:** Track MCP tool performance metrics

**Integration:**
```typescript
// performance-monitor logs to workspace-brain
performance_monitor.track_performance({...});
// → workspace_brain.log_event({ type: "mcp-usage" })

// workspace-brain provides aggregation
workspace_brain.get_tool_usage_stats({
  group_by: "tool"
});
```

### 2. deployment-release MCP

**Purpose:** Track deployment success rate and rollback frequency

**Integration:**
```typescript
deployment_release.deploy_application({...});
// → workspace_brain.log_event({ type: "workflow", event: "deployment" })

// Analytics: deployment success rate over time
workspace_brain.get_event_stats({
  metric: "outcome_distribution",
  filters: {
    event_type: "workflow",
    metadata: { event: "deployment" }
  }
});
```

### 3. test-generator MCP

**Purpose:** Track test coverage improvements over time

**Integration:**
```typescript
test_generator.generate_unit_tests({...});
// → workspace_brain.log_event({ type: "task", task_type: "testing" })

// Analytics: test generation velocity
workspace_brain.query_events({
  filters: {
    task_type: "testing"
  },
  time_range: { start: "2025-10-01" }
});
```

---

## Implementation Patterns

### Pattern 1: Wrapper Functions

**Create helper functions for common integrations:**

```typescript
// helpers/workspace-brain-helpers.ts

export async function logTaskCompletion(params: {
  workflowName: string;
  taskType: string;
  durationMinutes: number;
  toolsUsed: string[];
  complexity: number;
  outcome: "completed" | "failed" | "blocked";
  metadata?: object;
}) {
  return workspace_brain.log_event({
    event_type: "task",
    event_data: params
  });
}

export async function logWorkflowMilestone(params: {
  workflowName: string;
  event: "started" | "phase-change" | "completed";
  phase: string;
  metadata?: object;
}) {
  return workspace_brain.log_event({
    event_type: "workflow",
    event_data: params
  });
}

export async function logMCPUsage(params: {
  mcpServer: string;
  toolName: string;
  durationMs: number;
  success: boolean;
  context: string;
  metadata?: object;
}) {
  return workspace_brain.log_event({
    event_type: "mcp-usage",
    event_data: params
  });
}
```

**Usage:**
```typescript
// Instead of verbose log_event calls
logTaskCompletion({
  workflowName: "cache-fix",
  taskType: "bug-fix",
  durationMinutes: 15,
  toolsUsed: ["Edit"],
  complexity: 5,
  outcome: "completed"
});
```

### Pattern 2: Timing Wrapper

**Automatically track operation duration:**

```typescript
async function withTelemetry<T>(
  operation: () => Promise<T>,
  context: {
    workflowName: string;
    taskType: string;
    toolsUsed: string[];
    complexity: number;
  }
): Promise<T> {
  const start = Date.now();
  let outcome: "completed" | "failed" = "completed";

  try {
    const result = await operation();
    return result;
  } catch (error) {
    outcome = "failed";
    throw error;
  } finally {
    const durationMinutes = (Date.now() - start) / 60000;

    await logTaskCompletion({
      ...context,
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      outcome
    });
  }
}

// Usage
await withTelemetry(
  async () => {
    // Do work
    return task_executor.complete_task({...});
  },
  {
    workflowName: "cache-fix",
    taskType: "bug-fix",
    toolsUsed: ["task-executor"],
    complexity: 5
  }
);
```

### Pattern 3: Batch Logging

**Log multiple events efficiently:**

```typescript
async function logBatch(events: Array<{
  event_type: string;
  event_data: object;
}>) {
  // Phase 1: Sequential
  for (const event of events) {
    await workspace_brain.log_event(event);
  }

  // Phase 2: Batch write API
  // await workspace_brain.log_events_batch(events);
}

// Usage: Log all task completions at once
await logBatch([
  { event_type: "task", event_data: {...} },
  { event_type: "task", event_data: {...} },
  { event_type: "workflow", event_data: {...} }
]);
```

### Pattern 4: Conditional Logging

**Only log when threshold met:**

```typescript
function shouldLog(durationMinutes: number, complexity: number): boolean {
  // Don't log trivial tasks
  if (durationMinutes < 1 && complexity < 3) return false;

  // Always log long or complex tasks
  if (durationMinutes > 30 || complexity > 7) return true;

  // Sample 10% of medium tasks
  return Math.random() < 0.1;
}

// Usage
if (shouldLog(duration, complexity)) {
  await logTaskCompletion({...});
}
```

---

## Best Practices

### 1. Consistent Event Schemas

**Use the same field names across all integrations:**

✅ **Good:**
```typescript
// Consistent naming
workflow_name: "patient-search-backend"
task_type: "feature-implementation"
duration_minutes: 45
```

❌ **Bad:**
```typescript
// Inconsistent naming
workflowName: "patient-search-backend"  // camelCase
task_category: "feature-implementation"  // different field name
time_spent: 45  // different field name
```

### 2. Structured Metadata

**Use consistent metadata structure:**

```typescript
metadata: {
  // Project context
  project_path?: string;
  project_type?: string;

  // Execution context
  parallel_execution?: boolean;
  agents_used?: string[];

  // Performance context
  speedup_factor?: number;
  conflicts_count?: number;

  // Outcome context
  verification_passed?: boolean;
  tests_passed?: number;
}
```

### 3. Error Handling

**Always handle logging errors gracefully:**

```typescript
try {
  await workspace_brain.log_event({...});
} catch (error) {
  // Don't fail the operation if logging fails
  console.warn("Failed to log telemetry:", error);
}
```

### 4. Privacy by Default

**Never log sensitive data:**

```typescript
// ❌ BAD - Contains PHI
workspace_brain.log_event({
  metadata: {
    patient_name: "John Doe",  // PHI!
    mrn: "12345"  // PHI!
  }
});

// ✅ GOOD - Generic context only
workspace_brain.log_event({
  metadata: {
    feature: "patient-search",
    record_count: 100  // Aggregated metric, no PHI
  }
});
```

---

## Monitoring Integration Health

### Check Integration Status

```typescript
// Query recent events by MCP
workspace_brain.get_tool_usage_stats({
  group_by: "tool"
});

// Expected integrations present?
const stats = result.tool_stats;
const hasTaskExecutor = stats.some(s => s.tool_name.includes("task-executor"));
const hasProjectMgmt = stats.some(s => s.tool_name.includes("project-management"));

if (!hasTaskExecutor) {
  console.warn("task-executor not logging to workspace-brain");
}
```

### Detect Missing Telemetry

```typescript
// Check for gaps in telemetry
workspace_brain.get_event_stats({
  metric: "count",
  group_by: "day"
});

// Look for days with 0 events (suspicious)
```

---

## Next Steps

### Phase 1 (Current)
- [x] Define integration patterns
- [x] Document manual integration workflows
- [ ] Create helper functions for common integrations
- [ ] Add integration health checks

### Phase 2 (Automatic Integration)
- [ ] Add hooks to task-executor for auto-logging
- [ ] Add hooks to project-management for workflow tracking
- [ ] Implement learning-optimizer → workspace-brain pattern sync
- [ ] Create shared integration library

### Phase 3 (Advanced)
- [ ] Real-time integration monitoring dashboard
- [ ] Automatic issue detection and alerting
- [ ] Cross-MCP performance correlation
- [ ] Predictive analytics across all MCPs

---

## References

- **External Brain Architecture:** `EXTERNAL-BRAIN-ARCHITECTURE.md`
- **Telemetry System Guide:** `TELEMETRY-SYSTEM-GUIDE.md`
- **learning-optimizer MCP:** `mcp-server-development/learning-optimizer-mcp-project/`
- **project-management MCP:** `local-instances/mcp-servers/project-management-mcp-server/`
- **task-executor MCP:** `local-instances/mcp-servers/task-executor-mcp-server/`
