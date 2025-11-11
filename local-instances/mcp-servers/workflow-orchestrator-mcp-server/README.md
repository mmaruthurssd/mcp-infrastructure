---
type: readme
tags: [mcp-server, orchestration, workflow, state-management]
---

# Workflow Orchestrator MCP Server

**Version:** 0.2.0
**Status:** ✅ Complete - Production Ready

General-purpose workflow orchestration MCP server extracted and generalized from Project Management MCP Server v0.9.0.

**NEW in v0.2.0 (October 2025):** Added ParallelizationAnalyzer module for automatic task parallelization analysis.

---

## Overview

The Workflow Orchestrator MCP Server provides reusable workflow orchestration capabilities that can be used by any MCP server or workflow type. It includes state management, rule engine, workflow phase tracking, and cross-MCP handoff patterns.

### Key Features

- **Generic State Management** - WorkflowState<T> supports any workflow type
- **Pluggable Rule System** - Rules defined via configuration, not code
- **Workflow Phase Tracking** - Manages transitions through configurable phases
- **MCP Handoff Protocol** - Standard protocol for workflow handoffs between MCPs
- **Automatic Parallelization Analysis** - ParallelizationAnalyzer module for task dependency analysis and speedup estimation
- **Performance** - < 500ms for workflow operations, <10ms for parallelization analysis

---

## Architecture

### Core Components

1. **StateManager** - Persists and manages workflow state
2. **WorkflowEngine** - Loads and executes workflow configurations
3. **RuleEngine** - Evaluates rules and suggests next actions
4. **StateDetector** - Auto-syncs state with file system
5. **ParallelizationAnalyzer** - Analyzes tasks for parallel execution opportunities (v0.2.0)

### Extracted From

**Source:** Project Management MCP Server v0.9.0
**Location:** `/local-instances/mcp-servers/project-management-mcp-server/`

**Components extracted:**
- `src/utils/state-manager.ts` (200 lines)
- `src/utils/rule-engine.ts` (150 lines)
- `src/utils/state-detector.ts` (100 lines)
- `src/tools/` (9 orchestration tools, ~1,500 lines)
- `src/types/project-state.ts` (type definitions)

**Total:** ~1,950 lines extracted and generalized

---

## ParallelizationAnalyzer Module (v0.2.0)

### Purpose

Provides automatic task parallelization analysis for workflow MCPs. Analyzes task dependencies, estimates speedup potential, and recommends parallel vs sequential execution.

### Integration

**Used by:**
- project-management-mcp-server v1.0.0 (`prepare_task_executor_handoff()`)
- task-executor-mcp-server v2.0.0 (`create_workflow()`)

**How It Works:**
1. Import ParallelizationAnalyzer from workflow-orchestrator library
2. Create analyzer instance with configuration options
3. Call `analyzeTasks()` with task description and task array
4. Returns parallelization analysis with speedup estimate

### Configuration Options

```typescript
interface ParallelizationConfig {
  enabled: boolean;              // Enable/disable analysis (default: true)
  minSpeedupThreshold: number;   // Minimum speedup to recommend (default: 1.5x)
  maxParallelAgents: number;     // Max parallel agents (default: 3)
  executionStrategy: 'conservative' | 'aggressive';  // default: 'conservative'
  autoExecute: boolean;          // Auto-execute parallel workflows (default: false)
}
```

### Analysis Output

```typescript
interface ParallelizationAnalysis {
  shouldParallelize: boolean;
  confidence: number;            // 0-100
  estimatedSpeedup: number;      // e.g., 2.0 = 2x speedup
  reasoning: string;
  mode: 'parallel' | 'sequential';
  suggestedBatches?: number;
  risks?: string[];
}
```

### Fallback Heuristic

When parallelization-mcp-server is not directly callable (MCP-to-MCP limitation):
- Counts tasks without dependencies
- Estimates speedup: `min(independentTasks / 2, 2.0)`
- Confidence: ~60%
- Performance: <10ms overhead

### Example Usage

```typescript
import { ParallelizationAnalyzer } from 'workflow-orchestrator-mcp-server/dist/core/parallelization-analyzer.js';

const analyzer = new ParallelizationAnalyzer({
  enabled: true,
  minSpeedupThreshold: 1.5,
  maxParallelAgents: 3,
  executionStrategy: 'conservative',
  autoExecute: false
});

const analysis = await analyzer.analyzeTasks('Bug fix workflow', tasks);

if (analysis.shouldParallelize) {
  console.log(`Parallelization recommended: ${analysis.estimatedSpeedup}x speedup`);
  console.log(`Reasoning: ${analysis.reasoning}`);
}
```

### Future Enhancements

When MCP-to-MCP calls become supported:
- Full dependency graph analysis (~90% confidence)
- Implicit dependency detection
- Conflict prediction
- Batch optimization strategies
- Critical path analysis

---

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test
```

---

## Project Structure

```
workflow-orchestrator-mcp-server/
├── src/
│   ├── core/              # Core orchestration components
│   │   ├── state-manager.ts
│   │   ├── workflow-engine.ts
│   │   ├── rule-engine.ts
│   │   ├── state-detector.ts
│   │   └── parallelization-analyzer.ts  # NEW (v0.2.0)
│   ├── tools/             # MCP tools
│   │   ├── initialize-workflow.ts
│   │   ├── get-workflow-status.ts
│   │   ├── get-next-steps.ts
│   │   └── advance-workflow-phase.ts
│   ├── types/             # Type definitions
│   │   ├── workflow-state.ts
│   │   ├── workflow-config.ts
│   │   └── rule-schema.ts
│   ├── workflows/         # Workflow configurations
│   │   └── project-planning.yaml
│   └── server.ts          # Main MCP server
├── dist/                  # Compiled output
├── docs/                  # Documentation
├── package.json
└── tsconfig.json
```

---

## Status

**Completion:** ✅ 100% Complete (18 of 18 tasks)

### ✅ All Phases Complete

#### Phase 1: Foundation (Tasks 1-4)
- [x] Project structure created
- [x] Source files copied (62KB, 8 files)
- [x] Build configuration working (zero errors)
- [x] Tests adapted (test-orchestration.js, 100% pass rate)

#### Phase 2: Generalization (Tasks 5-10)
- [x] StateManager refactored with `WorkflowState<T>` generics
- [x] WorkflowState interface created (185 lines)
- [x] WorkflowRule interface and rule schema (265 lines)
- [x] RuleEngine refactored for pluggable rules
- [x] Extracted 10 project-planning rules to config file (292 lines)

#### Phase 3: Tool Refactoring (Tasks 11-13)
- [x] Refactored initialize-project-orchestration for workflowType parameter
- [x] Updated get-next-steps with proper type annotations
- [x] Updated advance-workflow-phase and get-project-status with proper types

#### Phase 4: Validation & Documentation (Tasks 14-18)
- [x] Full test suite - 100% pass rate (5/5 tests)
- [x] Workflow config YAML - project-planning.yaml (200+ lines)
- [x] API documentation - docs/API.md (600+ lines)
- [x] Performance testing - All operations 100x-2,500x faster than targets
- [x] Integration validation - Verified through extraction source

### Key Achievements
- ✅ Zero breaking changes throughout extraction
- ✅ 100% test pass rate (5/5 tests passing)
- ✅ Exceptional performance (100x-2,500x faster than targets)
- ✅ Comprehensive documentation (API docs, YAML definitions, examples)
- ✅ Production-ready orchestration system

**See:** [EXTRACTION-PROGRESS.md](./EXTRACTION-PROGRESS.md) for detailed progress report

---

## Links

- **Project:** `projects-in-development/workflow-orchestrator-project/`
- **Specification:** `02-goals-and-roadmap/selected-goals/extract-and-generalize-orchestration-components/spec/SPECIFICATION.md`
- **Tasks:** `temp/workflows/extract-orchestration-goal-01/`

---

**Created:** 2025-10-29
**Extracted from:** Project Management MCP Server v0.9.0
