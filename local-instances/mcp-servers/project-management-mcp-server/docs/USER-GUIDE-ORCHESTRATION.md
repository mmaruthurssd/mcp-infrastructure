---
type: guide
tags: [orchestration, user-guide, workflow, getting-started]
---

# Workflow Orchestration - User Guide

**Version:** 0.9.0
**Last Updated:** 2025-10-27

Complete guide to using the Project Management MCP Server's workflow orchestration features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Tool Reference](#tool-reference)
4. [Common Workflows](#common-workflows)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Initialize Orchestration

```javascript
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/absolute/path/to/project",
  projectName: "My Project"  // Optional
});
```

This creates `.ai-planning/project-state.json` and starts tracking your workflow.

### Get Suggested Next Steps

```javascript
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/absolute/path/to/project"
});

// Returns prioritized suggestions with ready-to-execute tool calls
console.log(nextSteps.nextActions[0]);
```

### Check Project Status

```javascript
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/absolute/path/to/project"
});

console.log(status.currentPhase);      // "initialization"
console.log(status.overallProgress);   // "25%"
console.log(status.health);            // "Good"
```

---

## Core Concepts

### Workflow Phases

The orchestration system guides you through 4 phases:

1. **Initialization** (20-30 mins)
   - Create project structure
   - Generate constitution
   - Identify stakeholders
   - Create initial roadmap

2. **Goal Development** (1-3 days)
   - Brainstorm ideas
   - Evaluate goals
   - Create potential goals
   - Promote to selected

3. **Execution** (Varies)
   - Create specifications
   - Break down into tasks
   - Execute workflows
   - Track progress

4. **Completion** (1-2 hours)
   - Validate deliverables
   - Complete documentation
   - Archive goals
   - Wrap up project

### State Tracking

Everything is tracked in `.ai-planning/project-state.json`:

- Current phase and step
- Goals (potential, selected, completed)
- Active workflows
- MCP integration history
- Phase completion status

**Important:** Don't edit this file manually. Use the tools.

### Auto-Sync

The system automatically syncs state with your file system when you use `get_next_steps`.

---

## Tool Reference

### Navigation Tools

#### initialize_project_orchestration

**Purpose:** Start orchestration tracking

**When to use:** First time setting up orchestration for a project

**Example:**
```javascript
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/path/to/project",
  projectName: "Authentication System"
});
```

#### get_next_steps

**Purpose:** Get intelligent suggestions for what to do next

**When to use:**
- After completing a task
- When unsure what to do next
- To catch up after time away

**Example:**
```javascript
const result = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project",
  maxSuggestions: 3  // Optional, default: 5
});

// Execute top suggestion
const action = result.nextActions[0];
await mcp[action.tool](action.params);
```

**Output:**
- Current phase and progress
- Prioritized action suggestions (high/medium/low)
- Ready-to-execute tool calls with parameters
- Blockers and warnings
- Auto-synced changes (if any detected)

#### get_project_status

**Purpose:** High-level project overview

**When to use:**
- Daily standup context
- Stakeholder updates
- Health check

**Example:**
```javascript
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});

console.log(`Phase: ${status.currentPhase}`);
console.log(`Progress: ${status.overallProgress}`);
console.log(`Health: ${status.health}`);
```

#### advance_workflow_phase

**Purpose:** Move to next phase after validation

**When to use:** After completing all steps in current phase

**Example:**
```javascript
// Auto-advance to next phase
await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/path/to/project"
});

// Or jump to specific phase
await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/path/to/project",
  targetPhase: "execution"
});
```

**Note:** Validates prerequisites before advancing. Use `skipValidation: true` to override (not recommended).

### Completion Tools

#### validate_project_readiness

**Purpose:** Check if project ready to wrap up

**When to use:** Before running wrap_up_project

**Example:**
```javascript
const validation = await mcp__ai-planning__validate_project_readiness({
  projectPath: "/path/to/project"
});

if (!validation.ready) {
  console.log("Blockers:");
  validation.blockers.forEach(b => console.log(`  - ${b}`));
}
```

**Checks:**
- All selected goals completed or archived
- Documentation complete (no TODO/TBD)
- All workflows archived
- Temp folder clean

#### generate_completion_checklist

**Purpose:** Create comprehensive pre-closure checklist

**When to use:** When nearing project completion

**Example:**
```javascript
await mcp__ai-planning__generate_completion_checklist({
  projectPath: "/path/to/project"
});

// Creates PROJECT-WRAP-UP-CHECKLIST.md
```

**Checklist includes:**
- Goals & deliverables
- Documentation quality
- Validation checks
- Workflow cleanup
- Handoff preparation

#### wrap_up_project

**Purpose:** Finalize project with completion report

**When to use:** After validation passes and checklist complete

**Example:**
```javascript
await mcp__ai-planning__wrap_up_project({
  projectPath: "/path/to/project",
  notes: "Deployed to production successfully"
});

// Creates PROJECT-COMPLETION-REPORT.md
```

**Note:** Runs final validation automatically. Use `skipValidation: true` to bypass (not recommended).

### Integration Tools

#### prepare_spec_handoff

**Purpose:** Prepare goal for Spec-Driven MCP

**When to use:** After promoting goal to selected, ready to create spec

**Example:**
```javascript
const handoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// Execute suggested tool call
await mcp__spec-driven__sdd_guide(handoff.suggestedToolCall.params);
```

**Extracts:**
- Goal name and description
- Impact, effort, tier
- Creates ready-to-execute tool call

#### prepare_task_executor_handoff

**Purpose:** Prepare goal for Task Executor MCP

**When to use:** After specification created, ready to break down into tasks

**Example:**
```javascript
const handoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path/to/project",
  goalId: "01"
});

// Review extracted tasks
console.log(`${handoff.tasks.length} tasks identified`);

// Execute suggested tool call
await mcp__task-executor__create_workflow(handoff.suggestedToolCall.params);
```

**Extracts:**
- Tasks from specification
- Estimates (if available)
- Creates ready-to-execute tool call

---

## Common Workflows

### Workflow 1: New Project from Scratch

```javascript
// 1. Initialize orchestration
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/path/to/project",
  projectName: "User Authentication"
});

// 2. Run project setup
await mcp__ai-planning__start_project_setup({
  projectPath: "/path/to/project",
  projectName: "User Authentication",
  projectType: "software"
});

// 3. Follow get_next_steps suggestions
let nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project"
});

// Execute suggested actions iteratively
// ...

// 4. When ready, wrap up
await mcp__ai-planning__wrap_up_project({
  projectPath: "/path/to/project"
});
```

### Workflow 2: Adding Goal with Full Pipeline

```javascript
// 1. Create potential goal
await mcp__ai-planning__create_potential_goal({
  projectPath: "/path/to/project",
  goalName: "two-factor-auth",
  goalDescription: "Add 2FA support",
  impactScore: "High",
  effortScore: "Medium",
  // ... other fields
});

// 2. Promote to selected
await mcp__ai-planning__promote_to_selected({
  projectPath: "/path/to/project",
  potentialGoalFile: "brainstorming/future-goals/potential-goals/two-factor-auth.md",
  priority: "High"
});

// 3. Create specification
const specHandoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/project",
  goalId: "two-factor-auth"
});
await mcp__spec-driven__sdd_guide(specHandoff.suggestedToolCall.params);

// 4. Create task workflow
const taskHandoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path/to/project",
  goalId: "two-factor-auth"
});
await mcp__task-executor__create_workflow(taskHandoff.suggestedToolCall.params);

// 5. Work through tasks
// ...

// 6. Archive goal
await mcp__ai-planning__archive_goal({
  projectPath: "/path/to/project",
  goalId: "two-factor-auth",
  archiveType: "implemented",
  retrospective: {
    actualImpact: "High",
    actualEffort: "2 weeks",
    whatWentWell: "Clear requirements, good testing",
    whatCouldImprove: "Earlier stakeholder feedback",
    // ...
  }
});
```

### Workflow 3: Resume After Break

```javascript
// 1. Check status
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});

console.log(`You're in ${status.currentPhase} phase`);
console.log(`Progress: ${status.overallProgress}`);

// 2. Get suggestions (auto-syncs state)
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project"
});

if (nextSteps.syncedChanges) {
  console.log("State updated:");
  nextSteps.syncedChanges.forEach(change => console.log(`  - ${change}`));
}

// 3. Continue from top suggestion
const action = nextSteps.nextActions[0];
console.log(`Next: ${action.action}`);
console.log(`Tool: ${action.tool}`);
```

---

## Troubleshooting

### Issue: "No orchestration state found"

**Cause:** Orchestration not initialized

**Solution:**
```javascript
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/path/to/project"
});
```

### Issue: State out of sync with files

**Cause:** Manual file changes not reflected in state

**Solution:** Run get_next_steps (auto-syncs):
```javascript
await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/project",
  skipSync: false  // Ensure sync enabled
});
```

### Issue: Can't advance to next phase

**Cause:** Prerequisites not met

**Solution:** Check what's missing:
```javascript
const result = await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/path/to/project"
});

if (!result.success) {
  console.log(result.message);
  console.log("Passed checks:", result.validationsPassed);
}
```

Fix issues, then retry or use `skipValidation: true`.

### Issue: Validation fails but project seems complete

**Cause:** Documentation has TODO/TBD, temp files remain, etc.

**Solution:**
```javascript
const validation = await mcp__ai-planning__validate_project_readiness({
  projectPath: "/path/to/project"
});

validation.checks.forEach(check => {
  if (!check.passed) {
    console.log(`${check.category}: ${check.blockers}`);
  }
});
```

Follow recommendations to fix each blocker.

### Issue: Integration not tracked

**Cause:** Used Spec-Driven or Task Executor directly without prepare tools

**Solution:** Always use prepare tools:
```javascript
// ❌ Don't do this
await mcp__spec-driven__sdd_guide({...});

// ✅ Do this
const handoff = await mcp__ai-planning__prepare_spec_handoff({...});
await mcp__spec-driven__sdd_guide(handoff.suggestedToolCall.params);
```

### Issue: get_next_steps returns no suggestions

**Cause:** Phase complete or state mismatch

**Solution:**
1. Check if phase is complete:
```javascript
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});
```

2. If phase complete, advance:
```javascript
await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/path/to/project"
});
```

---

## Tips & Best Practices

### 1. Run get_next_steps Frequently

Use it as your workflow guide:
- After completing tasks
- When starting work session
- When unsure what to do next

### 2. Let the System Sync Automatically

Don't manually edit `.ai-planning/project-state.json`. The system auto-syncs when needed.

### 3. Use Integration Tools

Always use `prepare_spec_handoff` and `prepare_task_executor_handoff` for proper tracking.

### 4. Validate Early

Run `validate_project_readiness` before you think you're done. Catches issues early.

### 5. Check Health Regularly

```javascript
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/project"
});

if (status.health !== "Good") {
  console.log("Health issues:", status.healthIndicators);
}
```

### 6. Review Completion Checklist

Generate it early to know what's needed:
```javascript
await mcp__ai-planning__generate_completion_checklist({
  projectPath: "/path/to/project"
});
```

---

## What's Next?

- See [INTEGRATION-PATTERNS.md](./INTEGRATION-PATTERNS.md) for advanced integration patterns
- See [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) for architecture details
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more troubleshooting

---

**Questions?** Open an issue on GitHub or check the troubleshooting guide.
