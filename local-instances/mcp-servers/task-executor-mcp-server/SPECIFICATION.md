---
type: specification
phase: stable
project: task-executor-mcp-server
tags: [MCP, documentation, mcp-server, specification, task-executor, workflow]
category: mcp-servers
status: completed
priority: high
---

# Task Executor MCP Server - Specification

**Version**: 1.0.0
**Created**: 2025-10-25
**Status**: Draft

---

## Executive Summary

A lightweight MCP server for managing daily task execution workflows with built-in verification, temp-to-archive lifecycle management, and documentation tracking. Designed for 3-10 task workflows that need structure without the overhead of full specification-driven development.

---

## Problem Statement

**Current gap**: Developers need a middle ground between:
- **TodoWrite tool**: Not persistent, no verification, lost on session end
- **Spec-Driven MCP**: Too heavy, designed for permanent features, no temp→archive lifecycle

**Daily scenarios**:
- Bug fixes (5-8 tasks)
- Small feature implementations (3-10 tasks)
- Refactoring workflows (4-7 tasks)
- Deployment checklists (6-10 tasks)

**Pain points**:
1. Tasks get lost between sessions
2. No verification that tasks are actually done
3. Temp files accumulate in project
4. Documentation updates forgotten
5. No cleanup validation before considering work "done"

---

## User Stories

### Story 1: Bug Fix Workflow
**As a** developer fixing a bug
**I want** a structured workflow with verification
**So that** I don't skip important steps like tests and documentation

**Acceptance Criteria**:
- [ ] Create workflow with 5-8 tasks
- [ ] Mark tasks complete sequentially
- [ ] System verifies each task actually done
- [ ] System checks documentation updated
- [ ] Archive workflow when complete

### Story 2: Feature Implementation
**As a** developer implementing a small feature
**I want** constraints tracked throughout workflow
**So that** I don't violate requirements (e.g., backward compatibility)

**Acceptance Criteria**:
- [ ] Define constraints upfront
- [ ] System reminds of constraints at each task
- [ ] Verification checks constraints satisfied
- [ ] Can't archive if constraints violated

### Story 3: Cleanup and Archive
**As a** developer finishing a workflow
**I want** automatic cleanup validation
**So that** no temp files or unfinished work remains

**Acceptance Criteria**:
- [ ] System detects temp files in project
- [ ] System checks all tasks completed
- [ ] System verifies documentation updated
- [ ] Moves workflow from temp/ to archive/
- [ ] Timestamps archive for history

---

## Functional Requirements

### FR1: Workflow Creation
**Priority**: P0 (Must Have)

Create a new task workflow with:
- Workflow name
- Task list (3-20 tasks)
- Optional constraints
- Optional estimated time
- Automatic complexity scoring per task

**Location**: `temp/workflows/{workflow-name}/`

**Files created**:
- `plan.md` - Task list and constraints
- `state.json` - Progress tracking
- `artifacts/` - Directory for workflow-specific files

### FR2: Task Completion with Verification
**Priority**: P0 (Must Have)

Mark tasks complete with:
- Task ID
- Completion notes
- Automatic verification check
- Evidence collection

**Verification includes**:
- Did task actually get done?
- Is there evidence (files changed, tests passing, etc.)?
- Are constraints still satisfied?
- Does documentation need updating?

### FR3: Status Monitoring
**Priority**: P0 (Must Have)

View workflow status:
- Progress percentage
- Completed vs remaining tasks
- Next task to work on
- Constraints status
- Documentation update status

### FR4: Archive Management
**Priority**: P0 (Must Have)

Archive completed workflows:
- Validate all tasks done
- Validate all constraints met
- Validate documentation updated
- Validate no temp files in project
- Move from `temp/workflows/` to `archive/workflows/YYYY-MM-DD-{name}/`

### FR5: Documentation Intelligence
**Priority**: P1 (Should Have)

Track documentation needs:
- Detect existing docs in project
- Identify which docs might need updates
- Verify docs were actually updated
- Flag missing documentation

### FR6: Verification Agent Integration
**Priority**: P1 (Should Have)

Sub-agent verification:
- Spawn verification agent when task marked complete
- Agent checks evidence and completeness
- Agent provides verification report
- User can override if agent wrong

---

## Non-Functional Requirements

### NFR1: Performance
- Workflow creation: < 1 second
- Task completion: < 2 seconds (including verification)
- Status check: < 0.5 seconds

### NFR2: Storage
- Use JSON for state files (human-readable)
- Use Markdown for plans (easy to read/edit)
- Minimal storage footprint (< 100KB per workflow)

### NFR3: Reliability
- Graceful handling of missing files
- Clear error messages
- No data loss on verification failure

### NFR4: Usability
- Simple, intuitive tool names
- Clear progress indicators
- Helpful verification messages

---

## System Architecture

### High-Level Components

```
task-executor-mcp-server/
├── MCP Server (Entry point)
├── Workflow Manager (Core logic)
├── Verification Agent (Task verification)
├── Documentation Checker (Doc intelligence)
└── Tools (MCP tool implementations)
```

### Data Flow

```
1. create_workflow
   → WorkflowManager.create()
   → Writes to temp/workflows/{name}/

2. complete_task
   → WorkflowManager.completeTask()
   → VerificationAgent.verify()
   → DocumentationChecker.check()
   → Updates state.json

3. get_workflow_status
   → WorkflowManager.getStatus()
   → Returns progress + next steps

4. archive_workflow
   → WorkflowManager.validate()
   → DocumentationChecker.verifyAllUpdated()
   → Moves temp/ → archive/
```

### File Structure

```
project-root/
├── temp/
│   └── workflows/
│       └── bug-fix-123/
│           ├── plan.md
│           ├── state.json
│           ├── verification.md
│           └── artifacts/
│               └── notes.md
├── archive/
│   └── workflows/
│       └── 2025-10-25-bug-fix-123/
│           └── [same structure]
└── [project files]
```

---

## API Design

### Tool 1: `create_workflow`

**Purpose**: Create new task workflow

**Input**:
```typescript
{
  name: string;              // "bug-fix-123"
  projectPath: string;       // Absolute path
  tasks: Array<{
    description: string;
    estimatedHours?: number;
  }>;
  constraints?: string[];    // Optional requirements
  context?: {
    phiHandling?: boolean;
    category?: string;
  };
}
```

**Output**:
```typescript
{
  success: boolean;
  workflowPath: string;
  summary: {
    totalTasks: number;
    estimatedHours: number;
    complexityScores: number[];
  };
}
```

### Tool 2: `complete_task`

**Purpose**: Mark task complete with verification

**Input**:
```typescript
{
  projectPath: string;
  workflowName: string;
  taskId: string;           // "1", "2", etc.
  notes?: string;
  skipVerification?: boolean;
}
```

**Output**:
```typescript
{
  success: boolean;
  verification: {
    status: "verified" | "partial" | "failed";
    evidence: string[];
    concerns: string[];
    recommendations: string[];
  };
  progress: {
    completed: number;
    total: number;
    percentComplete: number;
  };
}
```

### Tool 3: `get_workflow_status`

**Purpose**: Check workflow progress

**Input**:
```typescript
{
  projectPath: string;
  workflowName: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  workflow: {
    name: string;
    created: Date;
    progress: string;      // "40% (2/5 tasks)"
    nextTask: string;
    constraintsStatus: string;
  };
  documentation: {
    existing: string[];
    needsUpdate: string[];
    updated: string[];
  };
}
```

### Tool 4: `archive_workflow`

**Purpose**: Archive completed workflow

**Input**:
```typescript
{
  projectPath: string;
  workflowName: string;
  force?: boolean;  // Skip validation
}
```

**Output**:
```typescript
{
  success: boolean;
  validation: {
    allTasksComplete: boolean;
    allConstraintsMet: boolean;
    documentationUpdated: boolean;
    noTempFiles: boolean;
  };
  archivePath: string;
}
```

---

## Data Models

### WorkflowState (state.json)
```typescript
interface WorkflowState {
  name: string;
  created: Date;
  projectPath: string;
  status: "active" | "completed" | "archived";
  tasks: Task[];
  constraints: string[];
  context: {
    phiHandling: boolean;
    category?: string;
    estimatedHours?: number;
  };
  documentation: {
    existing: string[];
    needsUpdate: string[];
    updated: string[];
  };
  metadata: {
    totalTasks: number;
    completedTasks: number;
    percentComplete: number;
    lastUpdated: Date;
  };
}

interface Task {
  id: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "verified";
  complexity?: {
    score: number;
    level: string;
  };
  estimatedHours?: number;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  notes?: string;
  verification?: {
    status: "verified" | "partial" | "failed";
    evidence: string[];
    concerns: string[];
  };
}
```

### Plan Template (plan.md)
```markdown
# Workflow: {NAME}

**Created**: {DATE}
**Status**: {STATUS}
**Location**: temp/workflows/{name}

## Constraints
{LIST_OF_CONSTRAINTS}

## Tasks

- [ ] 1. {TASK_1} (🟢 Complexity: {SCORE})
- [ ] 2. {TASK_2} (🟡 Complexity: {SCORE})
...

## Documentation
**Needs updating**:
- {DOC_1}
- {DOC_2}

**Updated**:
- [ ] {DOC_1}
- [ ] {DOC_2}

## Verification Checklist
- [ ] All tasks completed
- [ ] All constraints satisfied
- [ ] Documentation updated
- [ ] No temporary files left
- [ ] Ready to archive
```

---

## Verification Logic

### Verification Agent Prompt Template
```
Task: "{TASK_DESCRIPTION}"
Workflow: "{WORKFLOW_NAME}"
Constraints: {CONSTRAINTS_LIST}

Your role: Verify this task was actually completed.

Check for:
1. Evidence of completion (files changed, tests run, etc.)
2. Task meets description requirements
3. Constraints still satisfied
4. Side effects handled (documentation, tests, etc.)

Provide:
- Status: verified | partial | failed
- Evidence: List of proof found
- Concerns: Any issues or missing pieces
- Recommendations: What should be done next

Be thorough but fair. If task is genuinely done, mark verified.
If partially done, explain what's missing.
If failed, explain why.
```

### Documentation Checker Logic
```
On workflow creation:
1. Scan project for .md files
2. Identify likely documentation (README, API, CHANGELOG)
3. Add to "existing" list

On task completion:
1. Check if task involves API changes → flag API docs
2. Check if task involves new features → flag README
3. Check if task is bug fix → flag CHANGELOG

Before archive:
1. Verify all flagged docs actually updated
2. Check file modification times
3. Require manual confirmation for each doc
```

---

## Implementation Phases

### Phase 1: Core Workflow (MVP)
**Time**: 1-2 hours

- [x] Project setup
- [ ] WorkflowManager class
- [ ] create_workflow tool
- [ ] complete_task tool (no verification yet)
- [ ] get_workflow_status tool
- [ ] archive_workflow tool
- [ ] Basic plan.md template

**Deliverable**: Working workflow system without verification

### Phase 2: Verification Integration
**Time**: 1 hour

- [ ] VerificationAgent class
- [ ] Integration with complete_task
- [ ] Verification report generation
- [ ] Manual override option

**Deliverable**: Automated verification on task completion

### Phase 3: Documentation Intelligence
**Time**: 30 mins

- [ ] DocumentationChecker class
- [ ] Auto-detect docs
- [ ] Flag docs needing updates
- [ ] Verify updates before archive

**Deliverable**: Smart documentation tracking

### Phase 4: Polish & Docs
**Time**: 30 mins

- [ ] Error handling
- [ ] User documentation
- [ ] Quick start guide
- [ ] Example workflows

**Deliverable**: Production-ready server

---

## Success Metrics

### User Experience
- [ ] Can create workflow in < 30 seconds
- [ ] Clear progress visibility
- [ ] Helpful verification messages
- [ ] No manual temp file cleanup needed

### Reliability
- [ ] 100% of completed workflows archived correctly
- [ ] 0% data loss on failures
- [ ] Clear error messages on all failures

### Adoption
- [ ] Used daily for small tasks
- [ ] Reduces forgotten documentation updates
- [ ] Reduces incomplete task completion

---

## Risks & Mitigations

### Risk 1: Verification too strict
**Impact**: Users frustrated by false negatives
**Mitigation**: Always allow manual override, improve agent prompts over time

### Risk 2: Temp files accumulate
**Impact**: Cluttered temp/ directory
**Mitigation**: Add cleanup tool, warn if >10 active workflows

### Risk 3: Performance of verification
**Impact**: Slow task completion
**Mitigation**: Run verification async, show progress indicator

---

## Future Enhancements

- [ ] Workflow templates (bug-fix, deployment, refactoring)
- [ ] Team collaboration (assign tasks)
- [ ] Time tracking (actual vs estimated)
- [ ] Integration with spec-driven MCP (implement spec tasks)
- [ ] Dependency graphs between tasks
- [ ] Rollback capability

---

## Appendix

### Example Workflow Session

```
USER: I need to fix bug #123

CLAUDE: Let me create a workflow for that.

[Uses create_workflow]
create_workflow({
  name: "bug-fix-123",
  projectPath: "/path/to/project",
  tasks: [
    { description: "Reproduce bug locally", estimatedHours: 0.5 },
    { description: "Write failing test", estimatedHours: 1 },
    { description: "Implement fix", estimatedHours: 2 },
    { description: "Verify all tests pass", estimatedHours: 0.5 },
    { description: "Update CHANGELOG", estimatedHours: 0.25 }
  ],
  constraints: ["Must maintain backward compatibility"]
})

✅ Workflow created: temp/workflows/bug-fix-123
📊 5 tasks, ~4.25 hours estimated
🟢🟢🟡🟢🟢 Complexity scores

USER: Task 1 done, bug reproduced

CLAUDE: [Uses complete_task]
complete_task({
  projectPath: "/path/to/project",
  workflowName: "bug-fix-123",
  taskId: "1",
  notes: "Bug occurs when user submits form twice quickly"
})

🔍 Verifying task completion...

✅ Task verified complete
Evidence:
- Added notes to artifacts/reproduction.md
- Screenshot saved
- Steps to reproduce documented

Progress: 1/5 tasks (20%)
Next: Write failing test

USER: All tasks done

CLAUDE: [Uses get_workflow_status]
✅ All 5 tasks completed
⚠️ Documentation needs verification:
- CHANGELOG.md (last updated: yesterday)

Did you update CHANGELOG.md?

USER: Yes

CLAUDE: [Uses archive_workflow]
archive_workflow({
  projectPath: "/path/to/project",
  workflowName: "bug-fix-123"
})

✅ Workflow archived successfully
Location: archive/workflows/2025-10-25-bug-fix-123

All done! Workflow complete and archived.
```

---

**End of Specification**
