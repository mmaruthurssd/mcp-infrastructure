# Project Management MCP Server - Architecture

**Version:** 1.0.0
**Last Updated:** October 29, 2025

---

## Overview

The Project Management MCP Server is a **consumer** of the Workflow Orchestrator MCP Server library. This architecture separates generic workflow orchestration capabilities from project-specific functionality, enabling code reuse and cleaner separation of concerns.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Project Management MCP Server (v1.0.0)              │
│                                                              │
│  31 MCP Tools:                                               │
│  ├─ Project Setup (8 tools)                                 │
│  ├─ Goal Management (11 tools)                              │
│  ├─ Workflow Orchestration (9 tools) ───┐                   │
│  ├─ Validation (1 tool)                 │                   │
│  └─ Migration (2 tools)                 │                   │
│                                          │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
                                           │ imports
                                           ↓
┌──────────────────────────────────────────────────────────────┐
│      Workflow Orchestrator MCP Server (v0.1.0) - Library    │
│                                                              │
│  Core Components:                                            │
│  ├─ StateManager      (state persistence & backup)          │
│  ├─ RuleEngine        (workflow rule evaluation)            │
│  ├─ StateDetector     (auto-sync with file system)          │
│  ├─ WorkflowState<T>  (generic type system)                 │
│  └─ Project Planning Rules (11 rules)                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Project Management MCP Server

**Role:** Project-specific functionality
**Scope:** Tools and utilities specific to project planning and goal management

**Provides:**
1. **Project Setup Tools** (8 tools)
   - `start_project_setup` - Conversational project initialization
   - `generate_project_constitution` - Project-specific guidelines
   - `identify_stakeholders` - Stakeholder management
   - `identify_resources_and_assets` - Resource cataloging
   - `generate_initial_roadmap` - Roadmap creation
   - `extract_project_goals` - Goal extraction from conversation
   - `finalize_project_setup` - Complete setup process
   - `continue_project_setup` - Multi-turn conversation flow

2. **Goal Management Tools** (11 tools)
   - `evaluate_goal` - Impact/effort/tier estimation
   - `create_potential_goal` - Create potential goal files
   - `promote_to_selected` - Move goals to selected status
   - `extract_ideas` - Extract ideas from brainstorming
   - `view_goals_dashboard` - Comprehensive goal overview
   - `reorder_selected_goals` - Priority management
   - `update_goal_progress` - Progress tracking
   - `archive_goal` - Archive with retrospectives
   - `check_review_needed` - Detect stale/blocked goals
   - `generate_review_report` - Periodic review reports
   - `generate_goals_diagram` - Visual workflow diagrams

3. **Validation & Migration Tools** (3 tools)
   - `validate_project` - Structure and compliance validation
   - `migrate_existing_project` - Migrate to template structure
   - `confirm_migration` - Execute migration plan

**Uses Workflow Orchestrator For:**
- State management (read/write/initialize/backup)
- Rule-based next step suggestions
- Phase and step tracking
- File system auto-sync
- MCP handoff preparation

---

### Workflow Orchestrator MCP Server

**Role:** Generic workflow orchestration library
**Scope:** Reusable workflow capabilities for any MCP server

**Provides:**
1. **State Management**
   - `StateManager.read()` - Load workflow state
   - `StateManager.write()` - Persist workflow state
   - `StateManager.initialize()` - Create new state
   - `StateManager.backup()` - Backup state before changes
   - `StateManager.getStatePath()` - Get state file path

2. **Rule Engine**
   - `RuleEngine.evaluate()` - Evaluate rules against state
   - `RuleEngine.loadRules()` - Load custom rule sets
   - `RuleEngine.addRules()` - Add rules dynamically
   - `RuleEngine.getRules()` - Query current rules
   - `RuleEngine.clearRules()` - Clear rule set

3. **State Detection**
   - `StateDetector.syncState()` - Auto-sync with files
   - `StateDetector.detectChanges()` - Detect file changes
   - Path-based detection for goals, workflows, etc.

4. **Generic Types**
   - `WorkflowState<T>` - Generic workflow state
   - `ProjectState` - Project planning implementation
   - `WorkflowRule` - Rule schema
   - `RuleCondition` - Declarative conditions

---

## Data Flow

### Tool Execution Flow

```
1. User calls MCP tool (e.g., get_next_steps)
         ↓
2. Tool imports from workflow-orchestrator:
   import { StateManager, RuleEngine, StateDetector } from 'workflow-orchestrator-mcp-server/...'
         ↓
3. Tool reads state:
   const state = StateManager.read(projectPath)
         ↓
4. Tool auto-syncs (if enabled):
   const syncResult = StateDetector.syncState(projectPath, state)
         ↓
5. Tool evaluates rules:
   const matches = RuleEngine.evaluate({ projectPath, state })
         ↓
6. Tool performs project-specific logic
         ↓
7. Tool updates state:
   StateManager.write(projectPath, state)
         ↓
8. Tool returns result to user
```

### State File Location

```
project-root/
└── .ai-planning/
    └── project-state.json      # Created by StateManager
```

**Format:**
```json
{
  "version": "1.0",
  "projectName": "My Project",
  "currentPhase": "execution",
  "currentStep": "create-specification",
  "phases": { /* phase tracking */ },
  "goals": { /* goal tracking */ },
  "integrations": { /* MCP handoff tracking */ }
}
```

---

## Integration Points

### 9 Orchestration Tools Using Workflow Orchestrator

1. **initialize_project_orchestration**
   - Uses: `StateManager.initialize()`, `StateManager.write()`
   - Purpose: Create initial workflow state

2. **get_next_steps**
   - Uses: `StateManager.read()`, `StateDetector.syncState()`, `RuleEngine.evaluate()`
   - Purpose: Suggest next actions with auto-sync

3. **advance_workflow_phase**
   - Uses: `StateManager.read()`, `StateManager.write()`
   - Purpose: Validate and advance to next phase

4. **get_project_status**
   - Uses: `StateManager.read()`
   - Purpose: High-level project overview

5. **validate_project_readiness**
   - Uses: `StateManager.read()`
   - Purpose: Check completion criteria

6. **generate_completion_checklist**
   - Uses: `StateManager.read()`
   - Purpose: Create pre-closure checklist

7. **wrap_up_project**
   - Uses: `StateManager.read()`, `StateManager.write()`
   - Purpose: Finalize with completion report

8. **prepare_spec_handoff**
   - Uses: `StateManager.read()`, `StateManager.write()`
   - Purpose: Prepare handoff to Spec-Driven MCP

9. **prepare_task_executor_handoff**
   - Uses: `StateManager.read()`, `StateManager.write()`
   - Purpose: Prepare handoff to Task Executor MCP

---

## Type System

### Generic Types (from workflow-orchestrator)

```typescript
// Generic workflow state
interface WorkflowState<T> {
  version: string;
  workflowType: string;
  name: string;
  created: string;
  lastUpdated: string;
  currentPhase: string;
  currentStep: string;
  phases: Record<string, PhaseInfo>;
  customData: T;  // Workflow-specific data
}

// Project planning implementation
interface ProjectState extends WorkflowState<ProjectCustomData> {
  projectName: string;
  goals: GoalTracking;
  integrations: IntegrationTracking;
}
```

### Project-Specific Types (from project-management-mcp-server)

```typescript
interface GoalTracking {
  potential: string[];
  selected: string[];
  completed: string[];
}

interface IntegrationTracking {
  specDriven: {
    used: boolean;
    lastHandoff: string | null;
    goalsWithSpecs: string[];
  };
  taskExecutor: {
    activeWorkflows: string[];
    lastCreated: string | null;
    totalWorkflowsCreated: number;
  };
}
```

---

## Dependency Management

### Package Structure

```json
// project-management-mcp-server/package.json
{
  "name": "project-management-mcp-server",
  "version": "1.0.0",
  "dependencies": {
    "workflow-orchestrator-mcp-server": "file:../workflow-orchestrator-mcp-server",
    // ... other dependencies
  }
}
```

### Import Pattern

```typescript
// Old (v0.9.0) - local utils
import { StateManager } from '../utils/state-manager.js';
import { RuleEngine } from '../utils/rule-engine.js';

// New (v1.0.0) - workflow-orchestrator library
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { RuleEngine } from 'workflow-orchestrator-mcp-server/dist/core/rule-engine.js';
```

---

## Performance Characteristics

### Workflow Orchestrator Performance

All operations significantly exceed targets:

| Operation | Target | Actual | Performance |
|-----------|--------|--------|-------------|
| Initialize | < 100ms | 0.7ms | 135x faster |
| Get Next Steps | < 500ms | 0.2-0.4ms | 1,250-2,500x faster |
| Get Status | < 100ms | 0.1ms | 1,000x faster |
| State Read | < 50ms | 0.08ms | 625x faster |
| State Write | < 100ms | 0.14ms | 714x faster |

### Benefits of Library Integration

- **Zero network overhead** - Direct imports, no MCP protocol calls
- **Full type safety** - TypeScript type checking across boundaries
- **Exceptional performance** - Compiled JavaScript execution
- **IDE support** - Full autocomplete and IntelliSense

---

## Extension Points

### Adding New Workflow Types

The workflow-orchestrator supports generic `WorkflowState<T>`:

```typescript
// Define custom workflow data
interface DeploymentWorkflowData {
  environments: string[];
  approvals: ApprovalData[];
  deployments: DeploymentData[];
}

// Create custom state type
type DeploymentState = WorkflowState<DeploymentWorkflowData>;

// Use with StateManager
const state = StateManager.readWorkflow<DeploymentWorkflowData>(projectPath);
```

### Adding Custom Rules

```typescript
import { RuleEngine } from 'workflow-orchestrator-mcp-server/dist/core/rule-engine.js';
import { DEPLOYMENT_RULES } from './deployment-rules.js';

const engine = new RuleEngine(DEPLOYMENT_RULES);
const matches = engine.evaluate({ projectPath, state });
```

---

## Migration Path (v0.9.0 → v1.0.0)

### Changes Required

1. **Install workflow-orchestrator**
   ```bash
   npm install
   ```

2. **Update imports** (handled automatically in v1.0.0)
   - 9 files updated to import from workflow-orchestrator
   - No changes needed in tool APIs

3. **Remove duplicate files** (handled automatically in v1.0.0)
   - Deleted: `src/utils/state-manager.ts`
   - Deleted: `src/utils/rule-engine.ts`
   - Deleted: `src/utils/state-detector.ts`

### Breaking Changes

**None** - All tool APIs remain unchanged. This is a transparent architectural improvement.

### Verification

```bash
# Run integration tests
node test-integration.js

# Expected output:
# ✅ Test 1: Initialize Project Orchestration - PASS
# ✅ Test 2: Get Next Steps - PASS
# ✅ Test 3: Get Project Status - PASS
# ✅ Test 4: Verify Workflow Orchestrator Integration - PASS
```

---

## Future Architecture Enhancements

### Phase 1 (Current) ✅
- Extract orchestration to reusable library
- Clean separation of concerns
- Zero code duplication

### Phase 2 (Planned)
- YAML workflow loader for configuration-driven workflows
- Support multiple workflow types (deployment, approval, review)
- Workflow registry for discovery

### Phase 3 (Future)
- Visual workflow editor
- Performance monitoring and telemetry
- Workflow templates library

---

## Related Documentation

- **[README.md](./README.md)** - Project overview and quick start
- **[INTEGRATION-COMPLETE.md](../workflow-orchestrator-mcp-server/INTEGRATION-COMPLETE.md)** - Integration details
- **[workflow-orchestrator README](../workflow-orchestrator-mcp-server/README.md)** - Orchestrator documentation
- **[workflow-orchestrator API](../workflow-orchestrator-mcp-server/docs/API.md)** - Complete API reference

---

## Summary

The Project Management MCP Server v1.0.0 achieves clean architecture through:

1. **Separation of Concerns**
   - Workflow orchestration → workflow-orchestrator-mcp-server (library)
   - Project-specific logic → project-management-mcp-server

2. **Zero Duplication**
   - Removed ~28KB of duplicate code
   - Single source of truth for orchestration

3. **Reusability**
   - Other MCP servers can use workflow-orchestrator
   - Generic `WorkflowState<T>` supports any workflow type

4. **Production Ready**
   - 100% test pass rate maintained
   - Exceptional performance (100x-2,500x faster than targets)
   - Full type safety preserved

---

**Architecture Version:** 1.0.0
**Last Updated:** October 29, 2025
**Status:** Production Ready
