---
type: guide
tags: [telemetry, integration, workspace-brain, mcp-integration]
---

# Telemetry Integration Guide

**Purpose:** Guide for integrating workspace-brain telemetry logging with other MCP servers and workflows

**Version:** 1.0.0
**Status:** Production Ready

---

## Overview

Workspace-brain MCP provides persistent telemetry storage for tracking task completions, MCP usage, workflows, and learning patterns across sessions.

**Key Benefits:**
- ✅ Cross-session data persistence
- ✅ Automatic pattern detection
- ✅ Automation opportunity analysis
- ✅ Historical workflow analytics
- ✅ Learning from past executions

---

## Integration Patterns

### Pattern 1: Task Completion Logging

**When:** After completing any task workflow (task-executor, project-management, spec-driven)

**What to log:**
```javascript
{
  "event_type": "task",
  "event_data": {
    "workflow_name": "feature-implementation",
    "task_type": "feature-development",
    "duration_minutes": 45,
    "tools_used": ["task-executor", "git", "npm"],
    "complexity": 6,
    "outcome": "completed",  // or "failed", "blocked"
    "metadata": {
      "feature_name": "user-authentication",
      "files_modified": 12,
      "tests_added": 8
    }
  }
}
```

**Example usage:**
```
After completing a task-executor workflow:
1. Get workflow summary
2. Calculate duration from start to end
3. List tools used
4. Log event to workspace-brain
```

---

### Pattern 2: MCP Usage Tracking

**When:** After using an MCP tool for significant work

**What to log:**
```javascript
{
  "event_type": "mcp-usage",
  "event_data": {
    "mcp_server": "project-management",
    "tool_name": "create_potential_goal",
    "duration_minutes": 5,
    "outcome": "completed",
    "metadata": {
      "goal_created": "mobile-app-feature",
      "impact_score": "High",
      "tier": "Next"
    }
  }
}
```

---

### Pattern 3: Workflow Session Logging

**When:** At the end of a major work session

**What to log:**
```javascript
{
  "event_type": "workflow",
  "event_data": {
    "workflow_name": "mcp-deployment-session",
    "duration_minutes": 120,
    "tools_used": ["task-executor", "git", "npm", "claude mcp add"],
    "complexity": 7,
    "outcome": "completed",
    "metadata": {
      "mcps_deployed": 2,
      "tests_run": 15,
      "documentation_updated": true
    }
  }
}
```

---

## Integration with Specific MCPs

### task-executor MCP

**Integration Points:**

1. **After create_workflow:**
   - Log workflow creation
   - Record estimated complexity
   - Track parallelization recommendations

2. **After complete_task:**
   - Log task completion
   - Record actual duration
   - Track verification results

3. **After archive_workflow:**
   - Log workflow completion
   - Calculate total duration
   - Record success metrics

**Manual Pattern (Current):**
```
User prompt: "I just completed the [workflow-name] workflow"
Claude: Uses workspace-brain log_event to record the completion
```

**Example:**
```javascript
// After archive_workflow
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "bug-fix-auth-token",
    task_type: "bug-fix",
    duration_minutes: 30,
    tools_used: ["task-executor", "git", "npm test"],
    complexity: 5,
    outcome: "completed",
    metadata: {
      tasks_completed: 6,
      verification_passed: true
    }
  }
});
```

---

### project-management MCP

**Integration Points:**

1. **After promote_to_selected:**
   - Log goal promotion
   - Track goal metadata

2. **After update_goal_progress:**
   - Log progress updates
   - Track velocity metrics

3. **After wrap_up_project:**
   - Log project completion
   - Record final metrics

**Example:**
```javascript
// After wrap_up_project
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "medical-practice-automation",
    task_type: "project-completion",
    duration_minutes: 2400,  // 40 hours
    tools_used: ["project-management", "spec-driven", "task-executor"],
    complexity: 9,
    outcome: "completed",
    metadata: {
      goals_completed: 8,
      total_tasks: 45,
      documentation_complete: true
    }
  }
});
```

---

### spec-driven MCP

**Integration Points:**

1. **After sdd_guide (specification complete):**
   - Log specification creation
   - Track scenario and feature count

2. **After update_task_status (all done):**
   - Log implementation completion
   - Record development metrics

**Example:**
```javascript
// After completing spec-driven workflow
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "auth-backend-spec",
    task_type: "specification",
    duration_minutes: 90,
    tools_used: ["spec-driven", "project-management"],
    complexity: 7,
    outcome: "completed",
    metadata: {
      features_defined: 5,
      tasks_created: 18,
      scenarios_documented: 12
    }
  }
});
```

---

## Automatic Logging (Future Enhancement)

**Concept:** MCP servers automatically log to workspace-brain without manual prompting

**Implementation Approaches:**

### Approach 1: MCP-to-MCP Direct Calls
- MCPs call workspace-brain tools directly
- Requires MCP-to-MCP communication support
- Most robust solution

### Approach 2: Event Bus Pattern
- Central event bus for all MCP events
- workspace-brain subscribes to events
- Requires infrastructure changes

### Approach 3: Claude Code Middleware
- Claude Code automatically logs MCP usage
- Built into Claude Code's MCP handling
- Requires Claude Code updates

**Current Status:** Manual logging (Approach 4)

### Approach 4: Manual Logging (Current Implementation)
- User or Claude prompts logging after significant work
- Uses workspace-brain tools explicitly
- Works with current architecture
- No changes to existing MCPs needed

**Best Practice:**
At the end of a work session, prompt:
```
"Log this workflow completion to workspace-brain:
- Workflow: [name]
- Duration: [X] minutes
- Tools used: [list]
- Outcome: completed
- Key metrics: [relevant data]"
```

---

## Analytics & Insights

### Available Analytics Tools

1. **generate_weekly_summary**
   - Weekly activity summary
   - Pattern detection
   - Automation opportunities

2. **get_automation_opportunities**
   - Identifies repetitive tasks
   - Estimates time savings
   - Suggests automation approaches

3. **get_tool_usage_stats**
   - Tool usage frequency
   - Average duration per tool
   - Common tool combinations

4. **get_similar_patterns**
   - Find similar past workflows
   - Learn from previous solutions
   - Apply proven patterns

---

## Best Practices

### Logging Frequency

**Always Log:**
- ✅ Completed workflows (task-executor, spec-driven)
- ✅ Project milestones (project-management)
- ✅ Deployments and rollouts
- ✅ Complex troubleshooting sessions (>5 min)

**Optionally Log:**
- 🟡 Individual task completions (if significant)
- 🟡 MCP tool usage (if notable)
- 🟡 Learning moments

**Don't Log:**
- ❌ Trivial single-command operations
- ❌ File reads or simple queries
- ❌ Conversational messages

### Data Quality

**Good Event Data:**
```javascript
{
  workflow_name: "user-auth-implementation",  // Specific
  task_type: "feature-development",           // Categorized
  duration_minutes: 45,                       // Accurate
  tools_used: ["task-executor", "git", "npm"], // Complete
  complexity: 6,                              // Realistic (1-10)
  outcome: "completed",                       // Clear
  metadata: {                                 // Relevant context
    feature_name: "jwt-authentication",
    tests_added: 8
  }
}
```

**Poor Event Data:**
```javascript
{
  workflow_name: "work",              // Too vague
  task_type: "stuff",                 // Not helpful
  duration_minutes: 0,                // Inaccurate
  tools_used: [],                     // Incomplete
  complexity: 10,                     // Always same
  outcome: "done"                     // Unclear
}
```

---

## Querying Telemetry Data

### Common Queries

**Get recent workflows:**
```javascript
workspace_brain.query_events({
  filters: { event_type: "workflow" },
  limit: 10,
  sort: "desc"
});
```

**Find similar past work:**
```javascript
workspace_brain.get_similar_patterns({
  query: "authentication",
  limit: 5
});
```

**Calculate time spent on category:**
```javascript
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    event_type: "task",
    task_type: "bug-fix"
  }
});
```

---

## Integration Checklist

### For New MCP Servers

When building a new MCP server that should log telemetry:

- [ ] Identify key completion events (workflow done, task done)
- [ ] Define event_type (task, workflow, mcp-usage)
- [ ] Design event_data schema
- [ ] Document integration in MCP README
- [ ] Add examples to this guide
- [ ] Test telemetry logging
- [ ] Verify data appears in workspace-brain

### For Existing MCP Usage

When using existing MCPs with workspace-brain:

- [ ] Complete significant work (workflow, project, deployment)
- [ ] Calculate duration
- [ ] List tools used
- [ ] Determine complexity (1-10)
- [ ] Log event to workspace-brain
- [ ] Verify event logged successfully

---

## Examples from Real Usage

### Example 1: MCP Deployment (This Document)

```javascript
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "workspace-brain-mcp-deployment",
    task_type: "mcp-deployment",
    duration_minutes: 15,
    tools_used: ["claude mcp add", "ln", "jq", "task-executor"],
    complexity: 4,
    outcome: "completed",
    metadata: {
      mcp_server: "workspace-brain-mcp",
      tools_deployed: 15,
      smoke_tests_passed: true,
      telemetry_configured: true
    }
  }
});
```

### Example 2: Project Management Workflow

```javascript
workspace_brain.log_event({
  event_type: "workflow",
  event_data: {
    workflow_name: "project-initialization",
    task_type: "project-setup",
    duration_minutes: 60,
    tools_used: ["project-management", "spec-driven"],
    complexity: 6,
    outcome: "completed",
    metadata: {
      project_name: "medical-billing-system",
      goals_created: 12,
      constitution_generated: true
    }
  }
});
```

### Example 3: Bug Fix Workflow

```javascript
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    workflow_name: "auth-token-expiry-fix",
    task_type: "bug-fix",
    duration_minutes: 45,
    tools_used: ["task-executor", "git", "npm test"],
    complexity: 5,
    outcome: "completed",
    metadata: {
      issue_number: "GH-123",
      files_modified: 4,
      tests_added: 3,
      root_cause: "Token TTL not validated"
    }
  }
});
```

---

## Troubleshooting

### Issue: Events not showing in queries

**Diagnosis:**
```javascript
workspace_brain.get_storage_stats({ include_breakdown: true });
```

**Solutions:**
- Verify event was logged successfully (check return value)
- Check file permissions on ~/workspace-brain/
- Verify JSONL file exists and is valid

### Issue: Duplicate events

**Cause:** Logging same event multiple times

**Solution:**
- Log only once per workflow completion
- Use unique workflow names
- Check event_id in log response

### Issue: Query returns no results

**Diagnosis:**
```javascript
workspace_brain.query_events({ limit: 100, sort: "desc" });
```

**Solutions:**
- Check filters are correct
- Verify event_type matches
- Check time_range if specified

---

## Future Enhancements

### Phase 2 (Planned)
- Automatic logging from MCPs
- Real-time analytics dashboard
- Pattern detection algorithms
- Predictive analytics

### Phase 3 (Future)
- Machine learning for automation suggestions
- Cross-workspace analytics
- Team collaboration metrics
- Performance benchmarking

---

## Related Documentation

- **[QUICK-START.md](QUICK-START.md)** - Getting started with workspace-brain
- **[USAGE-GUIDE.md](USAGE-GUIDE.md)** - Real-world usage examples
- **[TELEMETRY-SYSTEM-GUIDE.md](TELEMETRY-SYSTEM-GUIDE.md)** - Telemetry architecture
- **[MCP-INTEGRATION-PATTERNS.md](MCP-INTEGRATION-PATTERNS.md)** - MCP integration patterns

---

**Created:** 2025-10-31
**Last Updated:** 2025-10-31
**Maintained By:** Medical Practice Workspace
**Status:** Production Ready
