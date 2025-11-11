---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, automation, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# Quick Start Guide - Spec-Driven MCP v0.2.0

**New to v0.2.0?** This guide shows you how to use the new Taskmaster AI-inspired features.

---

## What's New in v0.2.0?

Three new capabilities:
1. **Complexity Analysis** - Automated task scoring
2. **Task Status Tracking** - Progress monitoring
3. **Research Guidance** - Technology decision support

---

## Quick Start: 3 New Tools

### 1. Research Best Practices (Before Planning)

**When to use**: Before making technology decisions in the planning phase.

**Example**:
```
You: I need to choose a state management solution for a React app that handles patient data.

Claude: Let me help you research that.

[Uses research_best_practices tool]

research_best_practices({
  topic: "React state management",
  context: "medical practice app with PHI",
  constraints: ["TypeScript", "HIPAA compliant"]
})

Claude: Here's your research guide:

## Search Queries
1. "React state management best practices 2024 2025"
2. "React state management security HIPAA"
3. "Redux vs Zustand vs Context API comparison"

## Evaluation Criteria
- HIPAA Compliance: Must support audit logging
- TypeScript Support: First-class types required

⚠️ CRITICAL: Verify HIPAA compliance before production use
```

**Result**: Structured research plan instead of random Googling.

---

### 2. Update Task Status (During Implementation)

**When to use**: As you implement tasks from your generated `tasks.md`.

**Example Workflow**:

```
# Step 1: Start working on a task
You: I'm starting task 1.1 - Set up authentication

Claude: Let me mark that as in-progress.

[Uses update_task_status tool]

update_task_status({
  projectPath: "/Users/you/project",
  featureId: "001",
  taskId: "1.1",
  status: "in-progress"
})

✅ Task 1.1 updated to in-progress
Progress: 0% → 5% complete


# Step 2: Complete the task
You: Task 1.1 is done, all tests passing

Claude: Great! Let me mark it complete.

update_task_status({
  projectPath: "/Users/you/project",
  featureId: "001",
  taskId: "1.1",
  status: "done",
  notes: "Implemented with 100% test coverage"
})

✅ Task 1.1 completed
Progress: 5% → 10% complete


# Step 3: Handle blocked tasks
You: Task 2.3 is blocked - waiting for API key from vendor

Claude: Let me mark that as blocked.

update_task_status({
  projectPath: "/Users/you/project",
  featureId: "001",
  taskId: "2.3",
  status: "blocked",
  blockedReason: "Waiting for vendor API key"
})

🚫 Task 2.3 marked as blocked
Reason: Waiting for vendor API key
```

**Result**: Always know where you are in implementation.

---

### 3. Get Task Progress (Anytime)

**When to use**: Check overall progress or review specific task status.

**Example**:

```
You: What's the progress on feature 001?

Claude: Let me check.

[Uses get_task_progress tool]

get_task_progress({
  projectPath: "/Users/you/project",
  featureId: "001"
})

# Task Progress: Google Sheets Version Control

**Feature ID**: 001
**Progress**: 35% complete
**Last Updated**: 2025-10-25

## Summary
- Total Tasks: 20
- ✅ Completed: 7
- 🔄 In Progress: 2
- 🚫 Blocked: 1
- ⬜ Backlog: 10

## Tasks
[x] Task 1.1 - Set up authentication (Completed: 2025-10-25)
[~] Task 1.2 - Implement authorization (In Progress)
[ ] Task 1.3 - Add session management (Backlog)
[!] Task 2.3 - API integration (Blocked: Waiting for API key)
```

**Result**: Clear visibility into what's done, what's in progress, what's blocked.

---

## Complexity Analysis (Automatic)

**When it happens**: Automatically when tasks are generated.

**What you see in tasks.md**:

```markdown
### [ ] Task 1.1: Implement authentication
**Type**: [S]
**Complexity**: 🟢 3/10 - Simple
**File**: src/auth/login.ts
**Dependencies**: []
**Estimated Effort**: 2 hours

**Complexity Reasoning**:
- 0 dependencies add 0.0 points
- Unit testing scope adds 0.5 points
- PHI handling adds 1.5 points

**Recommendations**:
- Ensure clear acceptance criteria

---

### [ ] Task 3.5: Migrate legacy data with validation
**Type**: [S]
**Complexity**: 🔴 8/10 - Complex
**File**: src/migration/data-migrator.ts
**Dependencies**: [3.1, 3.2, 3.3, 3.4]
**Estimated Effort**: 12 hours

**Complexity Reasoning**:
- 4 dependencies add 6.0 points
- Integration testing scope adds 1.5 points
- PHI handling adds 1.5 points
- Estimated effort >8 hours adds 2.0 points

**Recommendations**:
- High complexity - strongly consider decomposing
- Review with team before implementation
- Task is too large - decompose into <8 hour tasks
```

**How to use**:
- 🟢🟡 (1-4): Safe to proceed
- 🟠 (5-6): Review carefully
- 🔴🟣 (7-10): Decompose or get team review

---

## Complete Example: Full Workflow

### Step 1: Create Specification
```
You: I want to build a patient visit tracker for Google Sheets

Claude: [Uses sdd_guide tool]
... interactive questions ...

✅ Created:
- specs/.specify/memory/constitution.md
- specs/001-patient-visit-tracker/spec.md
- specs/001-patient-visit-tracker/plan.md
- specs/001-patient-visit-tracker/tasks.md
```

### Step 2: Research Technology (NEW!)
```
You: I need to decide between PostgreSQL and MongoDB for storing visit data

Claude: [Uses research_best_practices tool]

Here's your research guide for "PostgreSQL vs MongoDB healthcare data":
- Search queries optimized for 2024/2025
- HIPAA compliance criteria
- Performance benchmarks
- Security considerations
```

### Step 3: Review Complexity (NEW!)
```
You: Show me the tasks.md

Claude: [Opens tasks.md]

You see:
- 🟢 15 simple tasks (proceed)
- 🟠 3 moderate tasks (review)
- 🔴 2 complex tasks (needs decomposition)

Claude: Tasks 3.5 and 4.2 are complex (8/10). Should I help decompose them?
```

### Step 4: Track Implementation (NEW!)
```
# Day 1
You: Starting task 1.1
Claude: [Updates status to in-progress]

You: Task 1.1 done
Claude: [Marks complete] Progress: 5% complete

# Day 2
You: What's our progress?
Claude: [Shows progress] 3/20 tasks done (15%)

# Day 3
You: Task 2.3 is blocked - waiting for API key
Claude: [Marks blocked with reason]
```

---

## State Files (Automatic)

When you use task tracking, the system creates:

```
your-project/
└── specs/
    └── .specify/
        └── state/
            └── 001-tasks.json
```

**What's inside**:
```json
{
  "featureId": "001",
  "featureName": "Patient Visit Tracker",
  "lastUpdated": "2025-10-25T14:30:00Z",
  "tasks": [
    {
      "id": "1.1",
      "status": "done",
      "startedAt": "2025-10-25T10:00:00Z",
      "completedAt": "2025-10-25T11:30:00Z",
      "notes": "Implemented with tests"
    }
  ],
  "metadata": {
    "totalTasks": 20,
    "completedTasks": 3,
    "percentComplete": 15
  }
}
```

**You don't edit this manually** - use the MCP tools.

---

## Common Workflows

### Solo Developer
```
1. Create spec with sdd_guide
2. Research technology decisions
3. Review complexity scores
4. Implement, marking status as you go
5. Check progress daily
```

### Team Lead
```
1. Create spec with sdd_guide
2. Review complexity with team
3. Decompose complex tasks (≥7)
4. Assign tasks to developers
5. Track progress via get_task_progress
6. Identify blockers early
```

### Healthcare Projects
```
1. Create spec (PHI questions answered)
2. Research HIPAA-compliant solutions
3. Extra scrutiny on PHI-handling tasks
4. Track implementation with audit trail
5. Verify compliance before marking done
```

---

## Tips & Best Practices

### Complexity Analysis
- **Trust the scores**: ≥7 is genuinely risky
- **Decompose early**: Break down complex tasks before starting
- **PHI awareness**: Medical projects auto-get +1.5 points

### Task Tracking
- **Update frequently**: Mark in-progress before starting
- **Document blocks**: Always explain why a task is blocked
- **Notes are valuable**: Future you will thank current you

### Research Tool
- **Before planning**: Research during spec phase
- **Cross-reference**: Use multiple search queries
- **HIPAA focus**: Tool auto-adds compliance queries for medical contexts

---

## Troubleshooting

### "Task state not found"
**Cause**: State file doesn't exist yet
**Fix**: First `update_task_status` call creates it automatically

### "Task ID not found"
**Cause**: Typo in task ID
**Fix**: Check tasks.md for correct ID (e.g., "1.1" not "1-1")

### "Complexity seems wrong"
**Cause**: Automated scoring may miss context
**Solution**: Complexity is a guide, not gospel. Use judgment.

---

## What's NOT Changed

✅ Existing `sdd_guide` workflow - unchanged
✅ Question types and flow - unchanged
✅ Constitution, spec, plan generation - unchanged
✅ Template structure - enhanced, not replaced
✅ Medical/PHI features - enhanced, not changed

**Bottom line**: Everything from v0.1.0 works exactly the same. New features are additive.

---

## Next Steps

1. **Read**: [ENHANCEMENTS.md](./docs/ENHANCEMENTS.md) for deep dive
2. **Try**: Create a test spec and track a few tasks
3. **Explore**: Use research tool for a tech decision
4. **Adapt**: Integrate into your workflow

**Questions?** See [README.md](./docs/README.md) or open an issue.

---

**Version**: 0.2.0
**Status**: Production Ready
**Healthcare Focus**: Enhanced ✅
