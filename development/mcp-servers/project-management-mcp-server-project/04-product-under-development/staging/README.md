---
type: readme
tags: [mcp-server, orchestration, workflow, ai-planning]
---

# Project Management MCP Server - Development Instance

**Version:** 1.0.3
**Status:** Production Ready (Component-Driven Framework fully functional)

MCP server for AI-assisted project planning with intelligent workflow orchestration.

---

## Overview

The Project Management MCP Server combines project initialization tools with ongoing goal management and **workflow orchestration** to guide users through the complete project lifecycle.

### Key Features

- **Project Setup** (8 tools): Initialize projects with constitution, stakeholders, and roadmap
- **Goal Management** (11 tools): Evaluate, create, promote, track, and archive goals
- **Workflow Orchestration** (9 tools - NEW v0.9.0): Intelligent workflow guidance with state tracking
- **Validation** (1 tool): Comprehensive project structure validation
- **Migration** (2 tools): Migrate existing projects to standardized structure

**Total:** 31 MCP tools

---

## What's New in v1.0.3

### Component-Driven Framework: Bug Fixes Complete ✅

**Status:** All 6 component management tools now fully functional and deployment-ready.

#### v1.0.3 - Parameter Mismatch Fix (Nov 7, 2025 - 13:17)
- **Fixed:** `update_component` tool parameter name inconsistency
- **Impact:** Component updates now work correctly (descriptions, sub-components, notes, priorities)

#### v1.0.2 - Propagation Bug Fix (Nov 7, 2025 - 12:18)
- **Fixed:** Architectural bug where components weren't written to PROJECT_OVERVIEW.md
- **Impact:** All component operations now correctly propagate to markdown files

#### v1.0.1 - Heading Level Fix (Nov 7, 2025 - 12:06)
- **Fixed:** Markdown parsing conflict with component heading levels
- **Impact:** Components properly serialized and parsed from project overview

**All Tools Tested and Verified:**
1. ✅ `create_component` - Create components in any stage
2. ✅ `update_component` - Update descriptions, sub-components, priorities, dependencies
3. ✅ `move_component` - Move between EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED
4. ✅ `split_component` - Split one component into multiple smaller ones
5. ✅ `merge_components` - Merge multiple components into one unified component
6. ✅ `component_to_goal` - Convert finalized components to trackable goals

**For full details:** See CHANGELOG.md for root cause analysis and technical fixes.

---

## What's New in v1.0.0

### Workflow Orchestrator Integration

**Major architectural improvement:** Extracted workflow orchestration into a reusable library!

- ✅ **Zero code duplication** - Removed ~28KB of duplicate orchestration code
- ✅ **Clean separation** - Orchestration logic now in `workflow-orchestrator-mcp-server`
- ✅ **Library dependency** - Uses workflow-orchestrator as local npm package
- ✅ **Production ready** - Full type safety, 100% test pass rate maintained
- ✅ **Reusable** - Other MCP servers can now use the same orchestration library

**Technical Changes:**
- Removed: `src/utils/state-manager.ts`, `rule-engine.ts`, `state-detector.ts`
- Added: `workflow-orchestrator-mcp-server` as dependency
- Updated: 9 files to import from workflow-orchestrator
- Result: Cleaner codebase, better maintainability, shared orchestration capabilities

**For Users:** No changes needed - all tools work identically with improved architecture.

### Automatic Parallelization Analysis (NEW - October 2025)

**Smart task analysis integrated into task executor handoffs!**

- ✅ **Automatic analysis** - `prepare_task_executor_handoff()` now auto-analyzes tasks for parallel execution opportunities
- ✅ **Speedup estimates** - Provides estimated speedup (e.g., "2.0x speedup possible")
- ✅ **Zero overhead** - Uses workflow-orchestrator ParallelizationAnalyzer module (<10ms)
- ✅ **Fallback heuristic** - Works without direct parallelization-mcp calls (~60% confidence)
- ✅ **Seamless integration** - Parallelization analysis included in handoff data automatically

**Technical Details:**
- Uses `ParallelizationAnalyzer` from workflow-orchestrator library
- Analyzes task dependencies and estimates parallel execution benefit
- Includes analysis in handoff response: `parallelization: { recommended: true, speedup: 2.0x, mode: 'parallel' }`
- No user action required - analysis runs automatically

**For Users:** Task executor handoffs now include parallelization recommendations automatically!

---

## What's New in v0.9.0 (Legacy)

### Workflow Orchestration System

9 new tools for intelligent workflow guidance:

1. **initialize_project_orchestration** - Start state tracking
2. **get_next_steps** - Get AI-powered suggestions with ready-to-execute tool calls
3. **get_project_status** - High-level overview with health indicators
4. **advance_workflow_phase** - Move between phases with validation
5. **validate_project_readiness** - Check completion criteria
6. **generate_completion_checklist** - Create comprehensive pre-closure checklist
7. **wrap_up_project** - Finalize with completion report
8. **prepare_spec_handoff** - Seamless handoff to Spec-Driven MCP
9. **prepare_task_executor_handoff** - Seamless handoff to Task Executor MCP

### Core Components (via workflow-orchestrator-mcp-server)

- **StateManager**: Persistent state tracking in `.ai-planning/project-state.json`
- **RuleEngine**: 11 intelligent rules for workflow suggestions
- **StateDetector**: Auto-sync state with file system changes

**Note:** These components are now provided by the `workflow-orchestrator-mcp-server` library dependency, eliminating code duplication and enabling reuse across multiple MCP servers.

### Features

- ✅ **Stateful workflow tracking** across 4 phases
- ✅ **Intelligent next-step suggestions** with priority ranking
- ✅ **Auto-sync** with file system to prevent state drift
- ✅ **MCP integration** with ready-to-execute tool calls
- ✅ **Completion validation** with comprehensive checks
- ✅ **Health monitoring** and progress tracking

---

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Register with Claude Desktop

Add to your MCP settings:

```json
{
  "mcpServers": {
    "ai-planning": {
      "command": "node",
      "args": ["/path/to/dev-instance/dist/server.js"]
    }
  }
}
```

### Configuration Notes

**For Claude Code CLI Users:**
- **Global config:** `~/.claude.json` (user-wide servers)
- **Workspace config:** `<workspace>/.mcp.json` (project-specific servers)
- **Use absolute paths only** - Claude Code CLI doesn't expand `${workspaceFolder}`
- **Recommended:** Register as project scope for workspace-specific functionality

**Example with mcp-config-manager:**
```bash
# Using mcp-config-manager MCP (recommended)
mcp__mcp-config-manager__register_mcp_server({
  serverName: "project-management-mcp-server",
  scope: "project"
})
```

**Important:** This server is registered in workspace config (`.mcp.json`) because it's project-specific. For more details about config file locations and naming, see: `templates-and-patterns/mcp-server-templates/CONFIG_FILE_NAMING_GUIDE.md`

### Usage

```javascript
// 1. Initialize orchestration
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/path/to/your/project",
  projectName: "My Project"
});

// 2. Get intelligent suggestions
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/your/project"
});

// 3. Execute suggested action
const action = nextSteps.nextActions[0];
await mcp[action.tool](action.params);

// 4. Check status anytime
const status = await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/your/project"
});
```

---

## Documentation

### User Guides
- **[USER-GUIDE-ORCHESTRATION.md](./docs/USER-GUIDE-ORCHESTRATION.md)** - Complete user guide with examples
- **[INTEGRATION-PATTERNS.md](./docs/INTEGRATION-PATTERNS.md)** - 6 integration patterns and best practices

### Developer Guides
- **[DEVELOPER-GUIDE-ORCHESTRATION.md](./docs/DEVELOPER-GUIDE-ORCHESTRATION.md)** - Architecture, state schema, and extension points

### Legacy Guides
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Original developer guide (pre-orchestration)
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Original user guide (pre-orchestration)

---

## Project Structure

```
project-management-mcp-server/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── types/
│   │   └── project-state.ts   # Project-specific types
│   ├── utils/                 # Project-specific utilities
│   │   ├── alert-detector.ts
│   │   ├── constitution-generator.ts
│   │   └── ... (other project utils)
│   └── tools/                 # 31 MCP tools
│       ├── initialize-project-orchestration.ts  # Uses workflow-orchestrator
│       ├── get-next-steps.ts                    # Uses workflow-orchestrator
│       ├── advance-workflow-phase.ts            # Uses workflow-orchestrator
│       ├── get-project-status.ts                # Uses workflow-orchestrator
│       ├── validate-project-readiness.ts        # Uses workflow-orchestrator
│       ├── generate-completion-checklist.ts     # Uses workflow-orchestrator
│       ├── wrap-up-project.ts                   # Uses workflow-orchestrator
│       ├── prepare-spec-handoff.ts              # Uses workflow-orchestrator
│       ├── prepare-task-executor-handoff.ts     # Uses workflow-orchestrator
│       └── ... (22 other project-specific tools)
├── docs/
│   ├── USER-GUIDE-ORCHESTRATION.md
│   ├── INTEGRATION-PATTERNS.md
│   └── DEVELOPER-GUIDE-ORCHESTRATION.md
├── node_modules/
│   └── workflow-orchestrator-mcp-server/  # Orchestration library
│       ├── dist/
│       │   ├── core/
│       │   │   ├── state-manager.js       # Imported by 9 tools
│       │   │   ├── rule-engine.js         # Imported by get-next-steps
│       │   │   └── state-detector.js      # Imported by get-next-steps
│       │   ├── types/
│       │   │   └── project-state.js       # Type definitions
│       │   └── workflows/
│       │       └── project-planning-rules.js
└── dist/                      # Compiled output

```

**Key Changes in v1.0.0:**
- ✅ Removed: `src/utils/state-manager.ts`, `rule-engine.ts`, `state-detector.ts` (now in workflow-orchestrator)
- ✅ Added: `workflow-orchestrator-mcp-server` as dependency
- ✅ Updated: 9 orchestration tools to import from workflow-orchestrator

---

## Workflow Phases

### 1. Initialization (20-30 mins)
- Create project structure
- Generate constitution
- Identify stakeholders
- Create roadmap

### 2. Goal Development (1-3 days)
- Brainstorm ideas
- Evaluate goals
- Create potential goals
- Promote to selected

### 3. Execution (Varies)
- Create specifications → Handoff to **Spec-Driven MCP**
- Break down tasks → Handoff to **Task Executor MCP**
- Execute workflows
- Track progress

### 4. Completion (1-2 hours)
- Validate deliverables
- Complete documentation
- Archive goals
- Wrap up with report

---

## State File

Orchestration state tracked in `.ai-planning/project-state.json`:

```json
{
  "version": "1.0",
  "projectName": "My Project",
  "currentPhase": "execution",
  "currentStep": "create-specification",
  "phases": { /* 4 phases with steps */ },
  "goals": {
    "potential": [...],
    "selected": [...],
    "completed": [...]
  },
  "integrations": {
    "specDriven": { /* tracking */ },
    "taskExecutor": { /* tracking */ }
  }
}
```

**Note:** Added to `.gitignore` - user-specific workflow state.

---

## Development

### Build

```bash
npm run build
```

### Test

```bash
# Manual testing
node test-end-to-end.js

# Performance testing
node test-performance.js
```

### Add New Tool

1. Create `src/tools/my-tool.ts`
2. Follow tool class pattern
3. Register in `src/server.ts`
4. Build and test

See [DEVELOPER-GUIDE-ORCHESTRATION.md](./docs/DEVELOPER-GUIDE-ORCHESTRATION.md) for details.

---

## Architecture

### State Management (via workflow-orchestrator-mcp-server)

```
Tool Call
  ↓
StateManager.read()         (from workflow-orchestrator)
  ↓
StateDetector.syncState()   (from workflow-orchestrator, auto-sync with files)
  ↓
RuleEngine.evaluate()       (from workflow-orchestrator, generate suggestions)
  ↓
Tool Logic                  (project-management-mcp-server)
  ↓
StateManager.write()        (from workflow-orchestrator)
  ↓
Return Result
```

**Integration Architecture:**
```
Project Management MCP Server
       ↓ (imports)
Workflow Orchestrator MCP Server (library)
       ↓ (provides)
- StateManager
- RuleEngine
- StateDetector
- WorkflowState<T> types
- Project planning rules
```

### Rule Engine

11 built-in rules across all phases:
- Priority-based matching (1-100 scale)
- Phase-specific and cross-phase rules
- File system checks
- State analysis

---

## Integration with Other MCPs

### Spec-Driven MCP

```javascript
const handoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path",
  goalId: "01"
});

await mcp__spec-driven__sdd_guide(handoff.suggestedToolCall.params);
```

### Task Executor MCP

```javascript
const handoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path",
  goalId: "01"
});

// Handoff includes automatic parallelization analysis
console.log(handoff.parallelizationAnalysis);
// {
//   shouldParallelize: true,
//   estimatedSpeedup: 2.0,
//   mode: 'parallel',
//   reasoning: '4 independent tasks detected, parallel execution recommended'
// }

await mcp__task-executor__create_workflow(handoff.suggestedToolCall.params);
```

---

## Performance

- **State file size:** < 50KB target
- **get_next_steps:** < 500ms target
- **Rule evaluation:** O(n) where n = number of rules
- **State sync:** O(m) where m = number of files scanned

---

## Troubleshooting

### State out of sync

```javascript
// Force sync
await mcp__ai-planning__get_next_steps({
  projectPath: "/path",
  skipSync: false
});
```

### Can't advance phase

```javascript
// Check what's blocking
const result = await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/path"
});

if (!result.success) {
  console.log(result.validationsPassed);
  console.log(result.warnings);
}
```

See [USER-GUIDE-ORCHESTRATION.md](./docs/USER-GUIDE-ORCHESTRATION.md) for more troubleshooting.

---

## Contributing

1. Read [DEVELOPER-GUIDE-ORCHESTRATION.md](./docs/DEVELOPER-GUIDE-ORCHESTRATION.md)
2. Create feature branch
3. Add tests
4. Update documentation
5. Submit PR

---

## License

MIT

---

## Links

- **Project Specification:** `../../02-goals-and-roadmap/selected-goals/workflow-orchestration-and-guidance/spec/specification.md`
- **Workflow Tasks:** `../../temp/workflows/workflow-orchestration-implementation/`
- **GitHub:** [anthropics/project-management-mcp-server](https://github.com/anthropics/project-management-mcp-server) (placeholder)

---

**Version History:**
- **v1.0.0** (2025-10-29): **Workflow Orchestrator Integration** + **Automatic Parallelization** - Extracted orchestration into reusable library, removed duplicate code (~28KB), updated 9 tools to use workflow-orchestrator-mcp-server as dependency. Added automatic parallelization analysis to prepare_task_executor_handoff via ParallelizationAnalyzer module. Production ready.
- v0.9.0 (2025-10-27): Added workflow orchestration system (9 tools, state tracking, rule engine)
- v0.8.1 (2025-10-25): Added migration and validation tools
- v0.8.0 (2025-10-23): Initial project setup tools
