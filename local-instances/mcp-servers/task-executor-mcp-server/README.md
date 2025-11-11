---
type: readme
phase: stable
project: task-executor-mcp-server
tags: [MCP, deployment, documentation, mcp-server, task-executor, workflow]
category: mcp-servers
status: completed
priority: high
---

# Task Executor MCP Server

**Version**: 2.0.0
**Status**: ✅ Production Ready
**Integration**: Workflow Orchestrator v0.2.0

A lightweight MCP server for managing daily task execution workflows with built-in verification, temp-to-archive lifecycle management, documentation tracking, and **automatic parallelization analysis**.

---

## ⚡ Version 2.0.0 - Workflow Orchestrator Integration + Automatic Parallelization

**What's New:**
- ✅ Integrated with workflow-orchestrator-mcp-server for unified state management
- ✅ Removed ~200 lines of duplicate state management code
- ✅ Gained extensible workflow orchestration capabilities
- ✅ **Automatic parallelization analysis** - create_workflow() now analyzes tasks for parallel execution opportunities
- ✅ **100% backward compatibility** - all existing workflows work unchanged
- ✅ All 18 integration tests passing

**Architecture:**
```
task-executor-mcp-server
      ↓ imports
workflow-orchestrator-mcp-server v0.2.0 (library)
      ↓ provides
StateManager, WorkflowState<T>, PhaseInfo, ParallelizationAnalyzer
```

**Benefits:**
- Single source of truth for workflow state management
- Consistent workflow patterns across MCP servers
- **Automatic parallelization recommendations** with speedup estimates (<10ms overhead)
- Potential for intelligent workflow suggestions via RuleEngine
- Better state validation and error handling
- Easier maintenance and updates
- Consistent patterns with project-management-mcp-server v1.0.0 and spec-driven-mcp-server v0.2.0

---

## What is This?

A middle ground between **TodoWrite** (not persistent) and **Spec-Driven MCP** (too heavy for small tasks).

**Perfect for**:
- Bug fixes (5-8 tasks)
- Small feature implementations (3-10 tasks)
- Refactoring workflows (4-7 tasks)
- Deployment checklists (6-10 tasks)

**Key Features**:
- ✅ **Persistent** - Survives session restarts
- ✅ **Verification** - Checks tasks actually done
- ✅ **Complexity Analysis** - Auto-scores task difficulty
- ✅ **Parallelization Analysis** - Auto-detects parallel execution opportunities (NEW v2.0)
- ✅ **Temp→Archive Lifecycle** - Clean project management
- ✅ **Documentation Tracking** - Never forget to update docs

---

## Quick Start

### Installation

1. **Build the server**:
   ```bash
   cd task-executor-mcp-server
   npm install
   npm run build
   ```

2. **Add to MCP configuration** (`~/.mcp.json` or project `.mcp.json`):
   ```json
   {
     "mcpServers": {
       "task-executor": {
         "command": "node",
         "args": [
           "/absolute/path/to/task-executor-mcp-server/dist/server.js"
         ]
       }
     }
   }
   ```

3. **Restart Claude Code**

### Your First Workflow

```
YOU: I need to fix bug #123

CLAUDE: Let me create a workflow for that.

[Uses create_workflow]

create_workflow({
  name: "bug-fix-123",
  projectPath: "/path/to/your/project",
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

YOU: Task 1 done

CLAUDE: [Uses complete_task]

complete_task({
  projectPath: "/path/to/your/project",
  workflowName: "bug-fix-123",
  taskId: "1",
  notes: "Bug reproduced in dev environment"
})

✅ Task 1 verified complete
Progress: 1/5 tasks (20%)
Next: Write failing test

YOU: All done!

CLAUDE: [Uses archive_workflow]

archive_workflow({
  projectPath: "/path/to/your/project",
  workflowName: "bug-fix-123"
})

✅ Workflow archived
Location: archive/workflows/2025-10-25-bug-fix-123
```

---

## MCP Tools

### 1. `create_workflow`

Create a new task workflow.

**Input**:
```typescript
{
  name: string;              // "bug-fix-123"
  projectPath: string;       // Absolute path
  tasks: Array<{
    description: string;
    estimatedHours?: number;
  }>;
  constraints?: string[];    // Requirements to maintain
  context?: {
    phiHandling?: boolean;
    category?: string;
  };
}
```

**Output**:
```json
{
  "success": true,
  "workflowPath": "temp/workflows/bug-fix-123",
  "summary": {
    "totalTasks": 5,
    "estimatedHours": 4.25,
    "complexityScores": [2, 3, 5, 2, 1],
    "parallelization": {
      "recommended": true,
      "speedup": 2.0,
      "mode": "parallel"
    }
  }
}
```

---

### 2. `complete_task`

Mark a task complete with verification.

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
```json
{
  "success": true,
  "verification": {
    "status": "verified",
    "evidence": ["Task notes provided", "..."],
    "concerns": [],
    "recommendations": []
  },
  "progress": {
    "completed": 2,
    "total": 5,
    "percentComplete": 40
  }
}
```

---

### 3. `get_workflow_status`

Check workflow progress.

**Input**:
```typescript
{
  projectPath: string;
  workflowName: string;
}
```

**Output**:
```json
{
  "success": true,
  "workflow": {
    "name": "bug-fix-123",
    "progress": "40% (2/5 tasks)",
    "nextTask": "3. Implement fix",
    "constraintsStatus": "1 constraints to maintain"
  },
  "tasks": [
    { "id": "1", "description": "...", "status": "verified" },
    { "id": "2", "description": "...", "status": "completed" }
  ]
}
```

---

### 4. `archive_workflow`

Archive completed workflow (temp → archive).

**Input**:
```typescript
{
  projectPath: string;
  workflowName: string;
  force?: boolean;  // Skip validation
}
```

**Output**:
```json
{
  "success": true,
  "validation": {
    "allTasksComplete": true,
    "allConstraintsMet": true,
    "documentationUpdated": false,
    "noTempFiles": true
  },
  "archivePath": "archive/workflows/2025-10-25-bug-fix-123"
}
```

---

## Project Structure

After creating workflows:

```
your-project/
├── temp/
│   └── workflows/
│       └── bug-fix-123/
│           ├── plan.md           # Human-readable plan
│           ├── state.json        # Workflow state
│           └── artifacts/        # Workflow files
├── archive/
│   └── workflows/
│       └── 2025-10-25-bug-fix-123/  # Archived workflows
└── [your project files]
```

---

## Features in Detail

### Automatic Complexity Analysis

Tasks are auto-scored (1-10) based on:
- Dependencies
- Unknown factors
- Integration points
- Testing scope
- PHI handling
- Estimated hours

**Output**:
- 🟢 Trivial/Simple (1-4)
- 🟠 Moderate (5-6)
- 🔴 Complex (7-8)
- 🟣 Very Complex (9-10)

### Automatic Parallelization Analysis (NEW v2.0)

When you create a workflow, the system automatically analyzes tasks for parallel execution opportunities.

**Analysis includes:**
- Counts tasks without dependencies
- Estimates speedup potential (e.g., "2.0x speedup")
- Recommends parallel vs sequential execution
- Identifies independent task batches

**How it works:**
- Uses ParallelizationAnalyzer from workflow-orchestrator library
- Fallback heuristic (~60% confidence) when full analysis unavailable
- No performance impact (<10ms overhead)
- Analysis stored in workflow state

**Example output:**
```json
{
  "parallelization": {
    "recommended": true,
    "speedup": 2.0,
    "mode": "parallel",
    "reasoning": "4 independent tasks detected, parallel execution recommended"
  }
}
```

**Note:** This provides recommendations only - actual parallel execution requires manual coordination (future enhancement).

### Task Verification

When you mark a task complete:
1. System checks for completion notes
2. Looks for evidence of work
3. Verifies constraints still met
4. Provides verification report

**Statuses**:
- ✅ **Verified** - Task fully complete
- ⚠️ **Partial** - Some concerns remain
- ❌ **Failed** - Task not actually done

### Documentation Tracking

System auto-detects:
- README.md
- CHANGELOG.md
- API.md
- Other common docs

Tracks which docs need updates based on task types.

### Temp→Archive Lifecycle

**Temp**: Active workflows (work in progress)
**Archive**: Completed workflows (timestamped history)

Clean separation between active and historical work.

---

## Example Workflows

### Bug Fix
```typescript
create_workflow({
  name: "bug-fix-memory-leak",
  projectPath: "/path/to/project",
  tasks: [
    { description: "Reproduce and document leak" },
    { description: "Add memory profiling" },
    { description: "Identify leak source" },
    { description: "Implement fix" },
    { description: "Verify fix with profiler" },
    { description: "Update CHANGELOG" }
  ],
  constraints: ["No breaking changes"]
})
```

### Feature Implementation
```typescript
create_workflow({
  name: "add-dark-mode",
  projectPath: "/path/to/project",
  tasks: [
    { description: "Design dark mode color scheme", estimatedHours: 2 },
    { description: "Implement theme toggle UI", estimatedHours: 3 },
    { description: "Update all components for theming", estimatedHours: 8 },
    { description: "Add theme persistence", estimatedHours: 1 },
    { description: "Test across browsers", estimatedHours: 2 },
    { description: "Update user documentation", estimatedHours: 1 }
  ],
  constraints: ["Must support system preference"],
  context: { category: "feature" }
})
```

### Deployment Checklist
```typescript
create_workflow({
  name: "production-deploy-v2.1",
  projectPath: "/path/to/project",
  tasks: [
    { description: "Run full test suite" },
    { description: "Build production bundle" },
    { description: "Update version numbers" },
    { description: "Generate CHANGELOG entry" },
    { description: "Create git tag" },
    { description: "Deploy to staging" },
    { description: "Run smoke tests" },
    { description: "Deploy to production" },
    { description: "Verify production health" },
    { description: "Notify team" }
  ],
  constraints: ["Zero downtime deployment"]
})
```

---

## Verification Logic (MVP)

Current verification is basic:
- ✅ Checks if notes provided
- ✅ Marks timestamp
- ✅ Validates task marked complete

**Future enhancements** (Phase 2):
- Sub-agent verification with AI
- File change detection
- Test result checking
- More sophisticated evidence gathering

---

## Integration with Spec-Driven MCP

Use task-executor TO IMPLEMENT tasks from specs:

```typescript
// 1. Create spec with spec-driven MCP
sdd_guide({ ... })
// Generates specs/001-feature/tasks.md

// 2. Implement using task-executor
create_workflow({
  name: "implement-feature-001",
  tasks: [ /* tasks from spec */ ]
})

// 3. Track progress with task-executor
complete_task({ ... })

// 4. Archive when done
archive_workflow({ ... })
```

---

## Roadmap

### Phase 1: MVP ✅ (COMPLETE)
- [x] Core workflow management
- [x] Complexity analysis
- [x] Basic verification
- [x] Temp→Archive lifecycle
- [x] Documentation detection

### Phase 2: Enhanced Verification
- [ ] Sub-agent AI verification
- [ ] File change detection
- [ ] Test result integration
- [ ] Evidence collection

### Phase 3: Advanced Features
- [ ] Workflow templates
- [ ] Team collaboration
- [ ] Time tracking
- [ ] Dependency graphs
- [ ] Integration with CI/CD

---

## Troubleshooting

### "Workflow not found"
**Cause**: Workflow doesn't exist in temp/workflows/
**Fix**: Check workflow name spelling, verify it wasn't already archived

### "Cannot archive: tasks still pending"
**Cause**: Not all tasks completed
**Fix**: Complete remaining tasks or use `force: true`

### Build errors
**Cause**: Missing dependencies or TypeScript issues
**Fix**: Run `npm install && npm run build`

---

## Contributing

This server was built to fill a specific gap in the development workflow. Feel free to:
- Report bugs
- Suggest features
- Submit PRs

---

## License

MIT

---

## Credits

- **Inspired by**: Taskmaster AI's task management approach
- **Complexity Analysis**: Reused from spec-driven MCP server
- **Built for**: Daily development workflows at all scales

---

**Questions?** See [SPECIFICATION.md](./SPECIFICATION.md) for full technical details.
