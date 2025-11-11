---
type: guide
tags: [orchestration, developer-guide, architecture, state-schema]
---

# Workflow Orchestration - Developer Guide

**Version:** 0.9.0
**Last Updated:** 2025-10-27

Technical documentation for developers working on or extending the orchestration system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Schema](#state-schema)
3. [Rule Engine](#rule-engine)
4. [State Detector](#state-detector)
5. [Tool Implementation](#tool-implementation)
6. [Testing](#testing)
7. [Extension Points](#extension-points)

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Tool Layer                          │
│  (9 orchestration tools exposed via MCP protocol)          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   Core Components                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ StateManager │  │ RuleEngine   │  │StateDetector │    │
│  │              │  │              │  │              │    │
│  │ - Read/Write │  │ - 11 Rules   │  │ - File Scan  │    │
│  │ - Validate   │  │ - Priority   │  │ - Auto-Sync  │    │
│  │ - Backup     │  │ - Match      │  │ - Diff       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                 State File Layer                            │
│         .ai-planning/project-state.json                     │
│  (Persistent JSON state, < 50KB target size)               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Tool Called
   ↓
2. StateManager.read() → Load current state
   ↓
3. StateDetector.syncState() → Auto-sync with file system
   ↓
4. RuleEngine.evaluate() → Generate suggestions
   ↓
5. Tool Logic → Perform action
   ↓
6. StateManager.write() → Save updated state
   ↓
7. Return Result
```

---

## State Schema

### ProjectState Interface

```typescript
interface ProjectState {
  version: string;              // Schema version (currently "1.0")
  projectName: string;
  created: string;              // ISO 8601 timestamp
  lastUpdated: string;          // ISO 8601 timestamp (auto-updated)

  currentPhase: WorkflowPhase;  // Current workflow phase
  currentStep: string;          // Current step within phase

  phases: PhaseStatuses;        // Status of all 4 phases
  goals: GoalTracking;          // Goal counts and names
  integrations: IntegrationTracking; // MCP integration state
}
```

### Workflow Phases

```typescript
type WorkflowPhase =
  | 'initialization'
  | 'goal-development'
  | 'execution'
  | 'completion';

type PhaseStatus = 'pending' | 'in-progress' | 'complete';
type StepStatus = 'pending' | 'in-progress' | 'complete' | 'skipped';
```

### Phase Structure

```typescript
interface PhaseInfo {
  status: PhaseStatus;
  startedAt?: string;      // ISO 8601 (when status became in-progress)
  completedAt?: string;    // ISO 8601 (when status became complete)
  steps: StepInfo[];       // Ordered list of steps
}

interface StepInfo {
  name: string;            // Kebab-case step identifier
  status: StepStatus;
  completedAt?: string;    // ISO 8601
}
```

### Goal Tracking

```typescript
interface GoalTracking {
  potential: string[];     // Goal folder names in potential-goals/
  selected: string[];      // Goal folder names in selected-goals/
  completed: string[];     // Goal folder names in archived-goals/
}
```

### Integration Tracking

```typescript
interface IntegrationTracking {
  specDriven: {
    used: boolean;                // Ever used Spec-Driven MCP?
    lastHandoff: string | null;   // ISO 8601 of last handoff
    goalsWithSpecs: string[];     // Goals that have specs
  };
  taskExecutor: {
    activeWorkflows: string[];           // Currently active workflows
    lastCreated: string | null;          // ISO 8601 of last creation
    totalWorkflowsCreated: number;       // Lifetime count
  };
}
```

### State File Location

- Path: `.ai-planning/project-state.json`
- Encoding: UTF-8
- Format: JSON (pretty-printed with 2-space indent)
- Size target: < 50KB
- Versioning: Schema version in `version` field
- Excluded from git: Added to `.gitignore`

---

## Rule Engine

### Architecture

The `RuleEngine` class evaluates rules against current project state and file system to generate workflow suggestions.

```typescript
class RuleEngine {
  private rules: Rule[] = [];

  constructor() {
    this.initializeDefaultRules(); // Load 11 built-in rules
  }

  evaluate(context: RuleContext): RuleMatch[] {
    // Returns matches sorted by priority (highest first)
  }

  addRule(rule: Rule): void {
    // Support for custom rules
  }
}
```

### Rule Structure

```typescript
interface Rule {
  id: string;                    // Unique identifier
  priority: number;              // 1-100 (higher = more important)
  phase?: WorkflowPhase;         // Optional phase restriction
  conditions: RuleCondition[];   // All must pass
  action: RuleAction;            // What to suggest
}

interface RuleCondition {
  description: string;           // Human-readable description
  check: (context: RuleContext) => boolean;
}

interface RuleAction {
  message: string;               // User-facing action description
  reason: string | ((ctx) => string); // Why this is suggested
  tool: string;                  // MCP tool name
  paramBuilder: (ctx) => any;    // Build tool parameters
}
```

### Rule Context

```typescript
interface RuleContext {
  projectPath: string;           // Absolute path
  state: ProjectState;           // Current state
}
```

### Built-in Rules (11 Total)

**Initialization Phase (1 rule):**
- `init-start-project-setup` (priority: 90)

**Goal Development Phase (2 rules):**
- `goal-extract-ideas` (priority: 70)
- `goal-evaluate-potential` (priority: 80)

**Execution Phase (3 rules):**
- `exec-create-spec` (priority: 85)
- `exec-create-workflow` (priority: 80)
- `exec-update-progress` (priority: 60)

**Completion Phase (3 rules):**
- `complete-validate-readiness` (priority: 90)
- `complete-generate-checklist` (priority: 85)
- `complete-wrap-up` (priority: 95)

**Cross-Phase (2 rules):**
- `cross-archive-completed-goal` (priority: 75)

### Rule Priority Guidelines

- **90-100**: Critical next steps (e.g., wrap-up when ready)
- **80-89**: High priority (e.g., create spec, promote goal)
- **60-79**: Medium priority (e.g., extract ideas, update progress)
- **40-59**: Low priority (e.g., cleanup tasks)
- **1-39**: Nice-to-have

### Adding Custom Rules

```typescript
const customRule: Rule = {
  id: 'custom-my-rule',
  priority: 75,
  phase: 'execution',
  conditions: [
    {
      description: 'Custom condition',
      check: (ctx) => {
        // Your logic here
        return true;
      }
    }
  ],
  action: {
    message: 'Do something custom',
    reason: 'Because...',
    tool: 'custom_tool',
    paramBuilder: (ctx) => ({
      projectPath: ctx.projectPath,
      // Your params
    })
  }
};

ruleEngine.addRule(customRule);
```

---

## State Detector

### Purpose

Auto-detects project state from file system and syncs with state file to prevent drift.

### Architecture

```typescript
class StateDetector {
  static detectState(projectPath: string): StateDetectionResult;
  static compareWithState(projectPath: string, state: ProjectState): StateDetectionResult;
  static syncState(projectPath: string, state: ProjectState): { updated: boolean; changes: string[] };
}
```

### Detection Logic

**Goals Detection:**
- Scans `brainstorming/future-goals/potential-goals/*.md`
- Scans `02-goals-and-roadmap/selected-goals/*` (directories)
- Scans `brainstorming/future-goals/archived-goals/*` (directories)

**Workflows Detection:**
- Scans `temp/workflows/*` (directories) → active
- Scans `archive/workflows/*` (directories) → archived

**Files Detection:**
- Checks `brainstorming/future-goals/CONSTITUTION.md`
- Checks `03-resources-docs-assets-tools/STAKEHOLDERS.md`
- Checks `02-goals-and-roadmap/ROADMAP.md`

**Specifications Detection:**
- Checks `02-goals-and-roadmap/selected-goals/*/spec/specification.md`

### Sync Behavior

When `syncState()` is called:

1. Detect current file system state
2. Compare with stored state
3. Update state if differences found:
   - `goals.potential` ← detected potential goals
   - `goals.selected` ← detected selected goals
   - `goals.completed` ← detected archived goals
   - `integrations.taskExecutor.activeWorkflows` ← detected workflows
   - `integrations.specDriven.goalsWithSpecs` ← detected specs
4. Return changes made

**Note:** Sync is automatic in `get_next_steps` tool (unless `skipSync: true`).

### Array Comparison

Uses order-independent comparison:
```typescript
arraysEqual(['a', 'b'], ['b', 'a']) // true
```

---

## Tool Implementation

### Tool Class Pattern

All orchestration tools follow this pattern:

```typescript
export class ToolNameTool {
  // Execute tool logic
  static execute(input: ToolInput): ToolResult {
    // 1. Read state (if needed)
    const state = StateManager.read(projectPath);

    // 2. Validate input / state
    if (!state) return errorResult;

    // 3. Perform logic
    // ...

    // 4. Update state (if needed)
    StateManager.write(projectPath, state);

    // 5. Return result
    return successResult;
  }

  // Format result for user
  static formatResult(result: ToolResult): string {
    // Generate formatted output
  }

  // MCP tool definition
  static getToolDefinition() {
    return {
      name: 'tool_name',
      description: '...',
      inputSchema: { /* JSON Schema */ }
    };
  }
}
```

### Registration in server.ts

1. Import tool:
```typescript
import { ToolNameTool } from './tools/tool-name.js';
```

2. Add to tool list:
```typescript
ToolNameTool.getToolDefinition(),
```

3. Add handler:
```typescript
case 'tool_name':
  const result = ToolNameTool.execute(args as any);
  result = {
    ...result,
    formatted: ToolNameTool.formatResult(result)
  };
  break;
```

### State Management Best Practices

**DO:**
- Always use `StateManager.read()` to load state
- Always use `StateManager.write()` to save state
- Update `lastUpdated` automatically (StateManager does this)
- Validate state structure before operations

**DON'T:**
- Don't use `fs.readFileSync()` directly on state file
- Don't manually edit timestamps
- Don't skip validation
- Don't assume state exists (check for null)

---

## Testing

### Manual Testing

```javascript
// 1. Initialize
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/tmp/test-project",
  projectName: "Test"
});

// 2. Verify state file created
const statePath = "/tmp/test-project/.ai-planning/project-state.json";
assert(fs.existsSync(statePath));

// 3. Test get_next_steps
const nextSteps = await mcp__ai-planning__get_next_steps({
  projectPath: "/tmp/test-project"
});
assert(nextSteps.success === true);

// 4. Test phase advancement
await mcp__ai-planning__advance_workflow_phase({
  projectPath: "/tmp/test-project"
});

// 5. Verify state updated
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
assert(state.phases.initialization.status === 'complete');
```

### Unit Tests

```typescript
import { StateManager } from '../utils/state-manager.js';
import { createDefaultState } from '../types/project-state.js';

describe('StateManager', () => {
  it('should create default state', () => {
    const state = createDefaultState('Test Project');
    expect(state.projectName).toBe('Test Project');
    expect(state.currentPhase).toBe('initialization');
  });

  it('should write and read state', () => {
    const state = createDefaultState('Test');
    StateManager.write('/tmp/test', state);
    const loaded = StateManager.read('/tmp/test');
    expect(loaded).not.toBeNull();
    expect(loaded!.projectName).toBe('Test');
  });
});
```

### Integration Tests

See `tests/integration/` for complete integration test suite.

---

## Extension Points

### 1. Custom Rules

Add domain-specific rules to the RuleEngine:

```typescript
// In get-next-steps.ts or custom wrapper
const ruleEngine = new RuleEngine();

ruleEngine.addRule({
  id: 'custom-security-review',
  priority: 85,
  phase: 'execution',
  conditions: [
    {
      description: 'Goal involves authentication',
      check: (ctx) => ctx.state.goals.selected.some(g =>
        g.includes('auth') || g.includes('security')
      )
    }
  ],
  action: {
    message: 'Schedule security review',
    reason: 'Authentication changes require security review',
    tool: 'custom_security_review',
    paramBuilder: (ctx) => ({ projectPath: ctx.projectPath })
  }
});
```

### 2. Custom Phase Steps

Modify `PHASE_DEFINITIONS` in `src/types/project-state.ts`:

```typescript
export const PHASE_DEFINITIONS = {
  initialization: {
    steps: [
      'create-structure',
      'generate-constitution',
      'custom-security-setup',  // Add custom step
      'identify-stakeholders',
    ]
  },
  // ...
};
```

### 3. Custom Validation Checks

Extend `ValidateProjectReadinessTool`:

```typescript
// Add to validateCustomChecks() method
private static validateCustomChecks(projectPath: string): ValidationCheck {
  const details: string[] = [];
  const blockers: string[] = [];

  // Your validation logic
  if (!customCheckPassed) {
    blockers.push('Custom check failed');
  }

  return { category: 'Custom', passed: blockers.length === 0, details, blockers };
}
```

### 4. State Schema Versioning

To add new fields while maintaining compatibility:

```typescript
// In StateManager.read()
const state = JSON.parse(content) as ProjectState;

// Migrate old schema
if (state.version === '1.0') {
  // Add new fields with defaults
  state.newField = defaultValue;
  state.version = '1.1';
  this.write(projectPath, state); // Save migrated version
}
```

### 5. Custom Integration Tracking

Add new MCP server integration:

```typescript
interface IntegrationTracking {
  // ... existing fields

  customMCP: {
    used: boolean;
    lastHandoff: string | null;
    customData: any;
  };
}
```

---

## Performance Considerations

### State File Size

Target: < 50KB

**Why:** Fast read/write, minimal memory footprint

**How to maintain:**
- Don't store full file contents in state
- Store file paths, not file data
- Use arrays of strings, not objects when possible
- Prune old data (e.g., limit history to last 10 items)

### Rule Evaluation Speed

Target: < 500ms for `get_next_steps`

**Optimization strategies:**
- Limit file system checks in rules
- Cache repeated file existence checks
- Short-circuit rule evaluation when priority threshold met
- Limit to 5-10 most relevant suggestions

### State Detection Performance

**Optimization:**
- Use `fs.readdirSync()` with `withFileTypes` option
- Filter directories vs files in single pass
- Skip hidden folders (`.git`, `node_modules`)
- Limit depth to 2-3 levels

---

## Debugging

### Enable Debug Logging

```typescript
// In any tool
console.error('[DEBUG] State:', JSON.stringify(state, null, 2));
console.error('[DEBUG] Rule matches:', matches.length);
```

### Inspect State File

```bash
cat .ai-planning/project-state.json | jq '.'
```

### Validate State Structure

```javascript
const state = StateManager.read(projectPath);
const isValid = StateManager.validate(state);
console.log('State valid:', isValid);
```

### Check Rule Matches

```typescript
const ruleEngine = new RuleEngine();
const matches = ruleEngine.evaluate({ projectPath, state });

console.error('Matched rules:');
matches.forEach(m => {
  console.error(`  - ${m.ruleId} (priority: ${m.priority})`);
  console.error(`    Tool: ${m.tool}`);
});
```

---

## Contributing

### Adding New Tools

1. Create tool file in `src/tools/`
2. Follow tool class pattern
3. Add integration tests
4. Register in `src/server.ts`
5. Update documentation
6. Increment version in `package.json`

### Modifying State Schema

1. Update `src/types/project-state.ts`
2. Increment schema version
3. Add migration logic to `StateManager.read()`
4. Update documentation
5. Test with old and new schemas

### Adding Rules

1. Add to `RuleEngine.initializeDefaultRules()`
2. Document rule purpose and conditions
3. Add integration test
4. Update developer guide

---

## Architecture Decisions

### Why JSON State File?

**Alternatives considered:**
- SQLite database
- In-memory only
- External service

**Decision:** JSON file

**Rationale:**
- Simple, no dependencies
- Human-readable and git-friendly
- Fast for small datasets (< 50KB)
- Easy backup and restore

### Why Rule-Based Engine?

**Alternatives considered:**
- ML-based suggestions
- Fixed workflow steps
- User-defined workflows

**Decision:** Rule-based engine

**Rationale:**
- Deterministic and predictable
- Easy to debug and extend
- No training data needed
- Lightweight

### Why Auto-Sync?

**Alternatives considered:**
- Manual sync command
- Real-time file watching
- No sync (state-only)

**Decision:** Auto-sync on read

**Rationale:**
- Balance of convenience and performance
- No daemon process needed
- User initiated (via tool call)
- Prevents major drift

---

**Questions?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue on GitHub.
