---
type: guide
tags: [orchestration, integration, mcp, patterns]
---

# Integration Patterns Guide

**Version:** 0.9.0
**Last Updated:** 2025-10-27

This guide documents how the Project Management MCP Server orchestrates with other MCP servers (Spec-Driven and Task Executor) for seamless workflow integration.

---

## Overview

The orchestration system provides two integration tools:
1. **prepare_spec_handoff** - Handoff to Spec-Driven MCP
2. **prepare_task_executor_handoff** - Handoff to Task Executor MCP

Both tools:
- Extract context from project state
- Generate ready-to-execute tool calls
- Track integration state automatically
- Update `.ai-planning/project-state.json`

---

## Pattern 1: Goal → Spec → Tasks → Execution

### Full Workflow

```
1. Brainstorm & Evaluate
   ↓
2. Create Potential Goal (create_potential_goal)
   ↓
3. Promote to Selected (promote_to_selected)
   ↓
4. Create Specification (prepare_spec_handoff → sdd_guide)
   ↓
5. Create Task Workflow (prepare_task_executor_handoff → create_workflow)
   ↓
6. Execute Tasks (complete_task as you work)
   ↓
7. Archive Goal (archive_goal)
```

### Example: Complete Flow

```javascript
// Step 1: Create and promote goal
await mcp__ai-planning__create_potential_goal({
  projectPath: "/path/to/project",
  goalName: "authentication-system",
  goalDescription: "Implement user authentication",
  // ... other fields
});

await mcp__ai-planning__promote_to_selected({
  projectPath: "/path/to/project",
  potentialGoalFile: "brainstorming/future-goals/potential-goals/authentication-system.md",
  priority: "High"
});

// Step 2: Prepare spec handoff
const specHandoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// Step 3: Execute suggested spec-driven tool call
await mcp__spec-driven__sdd_guide(specHandoff.suggestedToolCall.params);

// Step 4: After spec complete, prepare task handoff
const taskHandoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// Step 5: Execute suggested task executor tool call
await mcp__task-executor__create_workflow(taskHandoff.suggestedToolCall.params);

// Step 6: Work through tasks
await mcp__task-executor__complete_task({
  projectPath: "/path/to/project",
  workflowName: "authentication-system-implementation",
  taskId: "1"
});
// ... complete remaining tasks

// Step 7: Archive when done
await mcp__task-executor__archive_workflow({
  projectPath: "/path/to/project",
  workflowName: "authentication-system-implementation"
});

await mcp__ai-planning__archive_goal({
  projectPath: "/path/to/project",
  goalId: "01",
  archiveType: "implemented",
  retrospective: { /* ... */ }
});
```

---

## Pattern 2: Spec-Driven Integration

### When to Use
- After promoting goal to selected
- Goal needs detailed specification
- Want guided spec creation

### Tool Flow

```javascript
// 1. Check if goal needs spec
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});

// 2. Prepare handoff
const handoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// 3. Execute (copy output from handoff.suggestedToolCall)
await mcp__spec-driven__sdd_guide({
  action: "start",
  project_path: "/path/to/project",
  description: "Implement user authentication system",
  goal_context: {
    impact: "High",
    effort: "Medium",
    tier: "Now"
  }
});
```

### What Gets Tracked

State file updated with:
```json
{
  "integrations": {
    "specDriven": {
      "used": true,
      "lastHandoff": "2025-10-27T04:00:00Z",
      "goalsWithSpecs": ["authentication-system"]
    }
  }
}
```

---

## Pattern 3: Task Executor Integration

### When to Use
- After specification created
- Ready to break down into tasks
- Want persistent task tracking

### Tool Flow

```javascript
// 1. Prepare handoff (extracts tasks from spec)
const handoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// 2. Review extracted tasks
console.log(handoff.tasks);
// [
//   { description: "Design authentication flow", estimatedHours: 3 },
//   { description: "Implement JWT tokens", estimatedHours: 5 },
//   ...
// ]

// 3. Execute (copy output from handoff.suggestedToolCall)
await mcp__task-executor__create_workflow({
  name: "authentication-system-implementation",
  projectPath: "/path/to/project",
  tasks: handoff.tasks,
  context: {
    category: "feature",
    phiHandling: false
  }
});
```

### What Gets Tracked

State file updated with:
```json
{
  "integrations": {
    "taskExecutor": {
      "activeWorkflows": ["authentication-system-implementation"],
      "lastCreated": "2025-10-27T04:00:00Z",
      "totalWorkflowsCreated": 1
    }
  }
}
```

---

## Pattern 4: Auto-Sync with State Detection

The `get_next_steps` tool automatically syncs state with file system:

```javascript
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project"
});

// If new goals or workflows detected, state is auto-synced:
// nextSteps.syncedChanges: [
//   "Updated selected goals: 2 found",
//   "Updated active workflows: 1 found"
// ]
```

### How It Works

1. Scans file system for:
   - Potential goals in `brainstorming/future-goals/potential-goals/`
   - Selected goals in `02-goals-and-roadmap/selected-goals/`
   - Active workflows in `temp/workflows/`
   - Archived content

2. Compares with state file

3. Updates state automatically

4. Reports changes

---

## Pattern 5: Guided Workflow with get_next_steps

Let the system suggest what to do next:

```javascript
// Check current status
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});

// Get intelligent suggestions
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project",
  maxSuggestions: 5
});

// Execute top suggestion
const topAction = nextSteps.nextActions[0];
console.log(topAction.tool);     // "prepare_spec_handoff"
console.log(topAction.params);   // Ready-to-execute parameters

// Execute it
await mcp[topAction.tool](topAction.params);
```

### Rule Engine

The system uses 11 built-in rules to suggest next actions based on:
- Current phase
- File system state
- Goals status
- Workflow state
- Integration history

---

## Pattern 6: Completion Validation

Before wrapping up a project:

```javascript
// 1. Validate readiness
const validation = await mcp__ai-planning__validate_project_readiness({
  projectPath: "/path/to/project"
});

if (!validation.ready) {
  console.log("Blockers:", validation.blockers);
  // Fix blockers...
}

// 2. Generate checklist
await mcp__ai-planning__generate_completion_checklist({
  projectPath: "/path/to/project"
});

// 3. Complete checklist items manually

// 4. Wrap up
await mcp__ai-planning__wrap_up_project({
  projectPath: "/path/to/project",
  notes: "Project completed successfully"
});
```

---

## Best Practices

### 1. Always Use prepare_* Tools

❌ **Don't manually construct handoff calls:**
```javascript
await mcp__spec-driven__sdd_guide({
  action: "start",
  project_path: "/path/to/project",
  description: "some description"
});
```

✅ **Do use prepare tools:**
```javascript
const handoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

await mcp__spec-driven__sdd_guide(handoff.suggestedToolCall.params);
```

**Why:** Ensures context is extracted correctly and state is tracked.

### 2. Check get_next_steps Regularly

Use `get_next_steps` to stay on track:
- After completing major tasks
- When unsure what to do next
- To catch state drift

### 3. Let State Sync Automatically

Don't manually edit `.ai-planning/project-state.json`. The system auto-syncs when you:
- Run `get_next_steps`
- Use prepare tools
- Advance phases

### 4. Use validate_project_readiness Early

Run validation before you think you're done:
```javascript
const validation = await mcp__ai-planning__validate_project_readiness({
  projectPath: "/path/to/project"
});
```

Catches missing documentation, incomplete goals, etc.

---

## Troubleshooting

### State Out of Sync

**Symptom:** State file shows different data than file system

**Solution:**
```javascript
// Force sync
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project",
  skipSync: false  // Explicitly enable sync
});
```

### Integration Not Tracked

**Symptom:** Used Spec-Driven but state shows `specDriven.used: false`

**Solution:** Use `prepare_spec_handoff` tool instead of calling directly. It updates tracking.

### Missing Suggested Tool Call

**Symptom:** Handoff tool doesn't suggest what to do

**Solution:** Check if goal exists in selected-goals folder and has required files.

---

## State File Schema

### Integration Tracking Structure

```typescript
interface IntegrationTracking {
  specDriven: {
    used: boolean;
    lastHandoff: string | null;  // ISO timestamp
    goalsWithSpecs: string[];     // Goal folder names
  };
  taskExecutor: {
    activeWorkflows: string[];           // Workflow names
    lastCreated: string | null;          // ISO timestamp
    totalWorkflowsCreated: number;
  };
}
```

---

## Examples Repository

See `examples/` directory for:
- Complete project walkthrough
- Integration test scripts
- Common workflow patterns

---

**Questions?** See TROUBLESHOOTING.md or open an issue on GitHub.
