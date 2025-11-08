# Workflow Orchestrator MCP - API Documentation

**Version:** 0.1.0
**Status:** Development
**Last Updated:** October 29, 2025

---

## Overview

The Workflow Orchestrator MCP Server provides 4 core tools for managing workflow orchestration state, tracking progress, and suggesting next actions. This document provides complete API reference for all tools.

---

## Table of Contents

1. [initialize_project_orchestration](#initialize_project_orchestration)
2. [get_next_steps](#get_next_steps)
3. [advance_workflow_phase](#advance_workflow_phase)
4. [get_project_status](#get_project_status)
5. [Data Types](#data-types)
6. [State Management](#state-management)
7. [Usage Examples](#usage-examples)

---

## Tools

### initialize_project_orchestration

Initialize workflow orchestration and state tracking for a project. Creates `.ai-planning/project-state.json` to track phases, steps, goals, and MCP integrations.

**Input Schema:**
```typescript
{
  projectPath: string;        // REQUIRED: Absolute path to project directory
  projectName?: string;       // Optional: Project name (defaults to directory name)
  workflowType?: string;      // Optional: Type of workflow (default: "project-planning")
  force?: boolean;            // Optional: Force reinitialization (creates backup)
}
```

**Output:**
```typescript
{
  success: boolean;
  statePath: string;          // Path to created state file
  state: ProjectState;        // Initial state object
  message: string;            // Success/error message
  wasExisting: boolean;       // True if state already existed
}
```

**Behavior:**
- Creates `.ai-planning/` directory if it doesn't exist
- Initializes `project-state.json` with default phase structure
- If state exists and `force: false`, returns existing state
- If `force: true`, backs up existing state before reinitializing
- Sets initial phase to "initialization" with first step "create-structure"

**Example:**
```typescript
const result = InitializeProjectOrchestrationTool.execute({
  projectPath: '/path/to/project',
  projectName: 'My Project',
  workflowType: 'project-planning'
});

if (result.success) {
  console.log(`State file created: ${result.statePath}`);
}
```

**Error Handling:**
- Returns `success: false` if directory doesn't exist
- Creates backup with timestamp if forcing reinit
- Validates write permissions before creating files

---

### get_next_steps

Analyze project state and suggest next actions with ready-to-execute tool calls.

**Input Schema:**
```typescript
{
  projectPath: string;        // REQUIRED: Absolute path to project directory
  maxSuggestions?: number;    // Optional: Limit suggestions (default: 5)
  skipSync?: boolean;         // Optional: Skip file system auto-sync (default: false)
}
```

**Output:**
```typescript
{
  success: boolean;
  currentPhase: string;       // Current workflow phase
  currentStep: string;        // Current step within phase
  progress: string;           // Overall progress percentage (e.g., "45%")
  nextActions: NextStepSuggestion[];  // Prioritized action list
  blockers: string[];         // Detected blockers
  warnings: string[];         // Warnings about project state
  syncedChanges?: string[];   // Auto-sync changes detected (if any)
  message?: string;           // Error message if success: false
}

interface NextStepSuggestion {
  priority: 'high' | 'medium' | 'low';  // Priority level
  action: string;             // Human-readable action description
  reason: string;             // Why this action is suggested
  tool: string;               // MCP tool name to execute
  params: any;                // Ready-to-use tool parameters
  ruleId: string;             // Rule that triggered this suggestion
}
```

**Behavior:**
- Reads current project state from `.ai-planning/project-state.json`
- Auto-syncs with file system (detects goals, workflows) unless `skipSync: true`
- Evaluates all rules against current state
- Returns top N suggestions ordered by priority
- Detects blockers (missing prerequisites, conflicts)
- Identifies warnings (stale state, phase mismatches)

**Example:**
```typescript
const result = GetNextStepsTool.execute({
  projectPath: '/path/to/project',
  maxSuggestions: 3
});

result.nextActions.forEach(action => {
  console.log(`${action.priority}: ${action.action}`);
  console.log(`  Tool: ${action.tool}`);
  console.log(`  Params: ${JSON.stringify(action.params)}`);
});
```

**Auto-Sync Behavior:**
- Scans `brainstorming/future-goals/potential-goals/` for potential goals
- Scans `02-goals-and-roadmap/selected-goals/` for selected goals
- Scans `temp/workflows/` for active workflows
- Scans `archive/workflows/` for archived workflows
- Updates state file if changes detected

---

### advance_workflow_phase

Advance project to next workflow phase after validating prerequisites.

**Input Schema:**
```typescript
{
  projectPath: string;        // REQUIRED: Absolute path to project directory
  targetPhase?: WorkflowPhase;  // Optional: Specific phase (auto-advances if not specified)
  skipValidation?: boolean;   // Optional: Skip validation (default: false)
}

type WorkflowPhase = 'initialization' | 'goal-development' | 'execution' | 'completion';
```

**Output:**
```typescript
{
  success: boolean;
  previousPhase: string;      // Phase before transition
  currentPhase: string;       // Phase after transition
  message: string;            // Success/error message
  validationsPassed: string[];  // List of passed validations
  warnings: string[];         // Warnings (non-blocking issues)
}
```

**Behavior:**
- Validates current phase is complete (all steps done)
- Checks phase-specific prerequisites:
  - **initialization → goal-development:** Constitution and stakeholders exist
  - **goal-development → execution:** At least one selected goal exists
  - **execution → completion:** All selected goals complete, no active workflows
- Marks current phase as complete with timestamp
- Starts next phase, sets first step as in-progress
- Updates state file atomically

**Phase Order:**
1. initialization
2. goal-development
3. execution
4. completion (final phase)

**Example:**
```typescript
// Auto-advance to next phase
const result = AdvanceWorkflowPhaseTool.execute({
  projectPath: '/path/to/project'
});

if (result.success) {
  console.log(`Advanced from ${result.previousPhase} to ${result.currentPhase}`);
}

// Jump to specific phase (with validation)
const result2 = AdvanceWorkflowPhaseTool.execute({
  projectPath: '/path/to/project',
  targetPhase: 'execution'
});
```

**Validation Errors:**
- Returns `success: false` if current phase incomplete
- Lists passed validations for transparency
- Provides specific reason for failure
- Can override with `skipValidation: true` (not recommended)

---

### get_project_status

Get high-level project overview with phase status, goals, and health indicators.

**Input Schema:**
```typescript
{
  projectPath: string;        // REQUIRED: Absolute path to project directory
}
```

**Output:**
```typescript
{
  success: boolean;
  projectName: string;        // Project name from state
  currentPhase: string;       // Current workflow phase
  currentStep: string;        // Current step within phase
  overallProgress: string;    // Overall progress percentage
  phases: PhaseStatus[];      // Status of all phases
  goals: {
    potential: number;        // Count of potential goals
    selected: number;         // Count of selected goals
    completed: number;        // Count of completed goals
  };
  integrations: {
    specDrivenUsed: boolean;  // Has Spec-Driven MCP been used?
    activeWorkflows: number;  // Count of active Task Executor workflows
  };
  health: 'Good' | 'Warning' | 'Blocked';  // Overall project health
  healthIndicators: string[]; // Health status messages
  message?: string;           // Error message if success: false
}

interface PhaseStatus {
  name: string;               // Phase name
  status: string;             // 'pending' | 'in-progress' | 'complete'
  statusEmoji: string;        // Visual indicator
  progress: string;           // "X/Y steps"
  startedAt?: string;         // ISO 8601 timestamp
  completedAt?: string;       // ISO 8601 timestamp
}
```

**Behavior:**
- Provides snapshot of current project state
- Calculates overall progress across all phases
- Assesses project health based on:
  - Selected goals without active workflows (warning)
  - Stale state (no updates >30 days) (warning)
  - Phase mismatches (selected goals in initialization) (warning)
- Returns phase-by-phase progress breakdown
- Shows MCP integration usage

**Example:**
```typescript
const result = GetProjectStatusTool.execute({
  projectPath: '/path/to/project'
});

console.log(`Project: ${result.projectName}`);
console.log(`Progress: ${result.overallProgress}`);
console.log(`Health: ${result.health}`);
console.log(`Goals: ${result.goals.selected} selected, ${result.goals.completed} completed`);

result.phases.forEach(phase => {
  console.log(`${phase.statusEmoji} ${phase.name}: ${phase.progress}`);
});
```

**Health Assessment:**
- **Good:** No blockers, no warnings, progressing normally
- **Warning:** Non-critical issues detected (stale state, inactive workflows)
- **Blocked:** Critical issues preventing progress

---

## Data Types

### ProjectState

Main state object stored in `.ai-planning/project-state.json`:

```typescript
interface ProjectState {
  version: string;            // State schema version (currently "1.0")
  workflowType?: string;      // Workflow type (e.g., "project-planning")
  projectName: string;        // Human-readable project name
  created: string;            // ISO 8601 creation timestamp
  lastUpdated: string;        // ISO 8601 last update timestamp

  currentPhase: WorkflowPhase;  // Active phase
  currentStep: string;        // Active step within phase

  phases: PhaseStatuses;      // All phase statuses
  goals: GoalTracking;        // Goal counts and lists
  integrations: IntegrationTracking;  // MCP integration state
}

type WorkflowPhase = 'initialization' | 'goal-development' | 'execution' | 'completion';

interface PhaseStatuses {
  initialization: PhaseInfo;
  'goal-development': PhaseInfo;
  execution: PhaseInfo;
  completion: PhaseInfo;
}

interface PhaseInfo {
  status: 'pending' | 'in-progress' | 'complete';
  startedAt?: string;         // ISO 8601 timestamp
  completedAt?: string;       // ISO 8601 timestamp
  steps: StepInfo[];          // All steps in this phase
}

interface StepInfo {
  name: string;               // Step identifier
  status: 'pending' | 'in-progress' | 'complete' | 'skipped';
  completedAt?: string;       // ISO 8601 timestamp
}

interface GoalTracking {
  potential: string[];        // Goal folder names in potential-goals/
  selected: string[];         // Goal folder names in selected-goals/
  completed: string[];        // Goal folder names in archived-goals/
}

interface IntegrationTracking {
  specDriven: {
    used: boolean;            // Has Spec-Driven MCP been used?
    lastHandoff: string | null;  // ISO 8601 timestamp
    goalsWithSpecs: string[];  // Goal names with specifications
  };
  taskExecutor: {
    activeWorkflows: string[];  // Workflow folder names
    lastCreated: string | null;  // ISO 8601 timestamp
    totalWorkflowsCreated: number;
  };
}
```

### Phase Definitions

Default phase structure for project-planning workflow:

```typescript
const PHASE_DEFINITIONS = {
  initialization: {
    steps: [
      'create-structure',
      'generate-constitution',
      'identify-stakeholders',
      'identify-resources',
      'generate-roadmap'
    ]
  },
  'goal-development': {
    steps: [
      'brainstorm-ideas',
      'evaluate-goals',
      'create-potential-goals',
      'promote-to-selected'
    ]
  },
  execution: {
    steps: [
      'create-specification',
      'create-tasks',
      'execute-workflow',
      'update-progress'
    ]
  },
  completion: {
    steps: [
      'validate-deliverables',
      'complete-documentation',
      'archive-goals',
      'wrap-up-project'
    ]
  }
};
```

---

## State Management

### StateManager

Core state persistence class:

```typescript
class StateManager {
  // Read project state
  static read(projectPath: string): ProjectState | null;

  // Write project state (updates lastUpdated timestamp)
  static write(projectPath: string, state: ProjectState): boolean;

  // Initialize new project state
  static initialize(projectPath: string, projectName: string): ProjectState;

  // Backup existing state (creates timestamped backup)
  static backup(projectPath: string): string;

  // Get path to state file
  static getStatePath(projectPath: string): string;

  // Generic workflow state methods (for future workflow types)
  static readWorkflow<T>(projectPath: string): WorkflowState<T> | null;
  static writeWorkflow<T>(projectPath: string, state: WorkflowState<T>): boolean;
}
```

### StateDetector

Auto-sync functionality:

```typescript
class StateDetector {
  // Detect current state from file system
  static detectState(projectPath: string): StateDetectionResult;

  // Compare detected state with stored state
  static compareWithState(projectPath: string, state: ProjectState): StateDetectionResult;

  // Auto-sync state with file system changes
  static syncState(projectPath: string, state: ProjectState): {
    updated: boolean;
    changes: string[];
  };
}
```

**Auto-Sync File Paths:**
- Potential goals: `brainstorming/future-goals/potential-goals/*.md`
- Selected goals: `02-goals-and-roadmap/selected-goals/*/`
- Completed goals: `brainstorming/future-goals/archived-goals/*/`
- Active workflows: `temp/workflows/*/`
- Archived workflows: `archive/workflows/*/`
- Key files: `CONSTITUTION.md`, `STAKEHOLDERS.md`, `ROADMAP.md`

---

## Usage Examples

### Example 1: Initialize New Project

```typescript
// Initialize orchestration
const initResult = InitializeProjectOrchestrationTool.execute({
  projectPath: '/projects/my-new-project',
  projectName: 'My New Project'
});

if (!initResult.success) {
  console.error('Failed to initialize:', initResult.message);
  return;
}

console.log('✓ Project initialized');
console.log('State file:', initResult.statePath);
console.log('Current phase:', initResult.state.currentPhase);
```

### Example 2: Get Next Steps and Execute

```typescript
// Get suggestions
const stepsResult = GetNextStepsTool.execute({
  projectPath: '/projects/my-project',
  maxSuggestions: 3
});

console.log(`Current: ${stepsResult.currentPhase} (${stepsResult.progress})`);

// Display top 3 suggestions
stepsResult.nextActions.forEach((action, index) => {
  console.log(`\n${index + 1}. [${action.priority}] ${action.action}`);
  console.log(`   Tool: ${action.tool}`);
  console.log(`   Why: ${action.reason}`);
});

// Execute first suggestion
const firstAction = stepsResult.nextActions[0];
if (firstAction) {
  // Call the suggested tool with provided params
  // Example: start_project_setup(firstAction.params)
}
```

### Example 3: Monitor Progress Through Phases

```typescript
// Check status
const statusResult = GetProjectStatusTool.execute({
  projectPath: '/projects/my-project'
});

console.log('='.repeat(50));
console.log(`Project: ${statusResult.projectName}`);
console.log(`Progress: ${statusResult.overallProgress}`);
console.log(`Health: ${statusResult.health}`);
console.log('='.repeat(50));

// Show phase breakdown
statusResult.phases.forEach(phase => {
  console.log(`${phase.statusEmoji} ${phase.name.padEnd(20)} ${phase.progress}`);
  if (phase.startedAt) {
    console.log(`  Started: ${new Date(phase.startedAt).toLocaleString()}`);
  }
});

// Show goals
console.log('\nGoals:');
console.log(`  Potential: ${statusResult.goals.potential}`);
console.log(`  Selected: ${statusResult.goals.selected}`);
console.log(`  Completed: ${statusResult.goals.completed}`);
```

### Example 4: Advance Phase

```typescript
// Try to advance to next phase
const advanceResult = AdvanceWorkflowPhaseTool.execute({
  projectPath: '/projects/my-project'
});

if (advanceResult.success) {
  console.log('✓ Phase advanced successfully');
  console.log(`  From: ${advanceResult.previousPhase}`);
  console.log(`  To: ${advanceResult.currentPhase}`);

  advanceResult.validationsPassed.forEach(v => {
    console.log(`  ✓ ${v}`);
  });
} else {
  console.error('✗ Cannot advance phase:', advanceResult.message);

  console.log('\nValidations that passed:');
  advanceResult.validationsPassed.forEach(v => {
    console.log(`  ✓ ${v}`);
  });

  console.log('\nTo advance, address this issue:');
  console.log(`  ${advanceResult.message}`);
}
```

---

## Best Practices

### 1. Always Check Success Status

```typescript
const result = SomeTool.execute({ ... });
if (!result.success) {
  console.error(result.message);
  return;
}
// Proceed with result
```

### 2. Use Auto-Sync Regularly

```typescript
// Let StateDetector keep state in sync
const result = GetNextStepsTool.execute({
  projectPath: '/path/to/project',
  skipSync: false  // default - enables auto-sync
});

if (result.syncedChanges) {
  console.log('Changes detected:', result.syncedChanges);
}
```

### 3. Monitor Health Indicators

```typescript
const status = GetProjectStatusTool.execute({ projectPath });

if (status.health === 'Warning') {
  console.warn('Project health warnings:');
  status.healthIndicators.forEach(indicator => {
    console.warn(`  ${indicator}`);
  });
}
```

### 4. Validate Before Phase Transitions

```typescript
// Don't skip validation unless absolutely necessary
const result = AdvanceWorkflowPhaseTool.execute({
  projectPath: '/path/to/project',
  skipValidation: false  // recommended default
});
```

### 5. Use Suggested Actions

```typescript
const steps = GetNextStepsTool.execute({ projectPath });

// Execute high-priority suggestions first
const highPriority = steps.nextActions.filter(a => a.priority === 'high');
highPriority.forEach(action => {
  console.log(`Execute: ${action.tool}(${JSON.stringify(action.params)})`);
  // Call the tool with ready-to-use params
});
```

---

## Error Handling

All tools follow consistent error handling:

1. **Return Format:** Always return `{ success: boolean, ...data, message?: string }`
2. **Validation:** Check `success` before accessing result data
3. **Error Messages:** Human-readable messages in `message` field
4. **Partial Results:** Some data may be available even when `success: false`

**Example:**
```typescript
const result = InitializeProjectOrchestrationTool.execute({ projectPath });

if (!result.success) {
  // Error case
  console.error('Initialization failed:', result.message);
  // Some fields may still be available (e.g., statePath)
  return;
}

// Success case
console.log('Success:', result.state);
```

---

## Performance

Target performance metrics:

| Operation | Target | Current |
|-----------|--------|---------|
| Initialize | < 100ms | ~50ms |
| Get Next Steps | < 500ms | ~200ms |
| Advance Phase | < 50ms | ~20ms |
| Get Status | < 100ms | ~30ms |
| State Read | < 50ms | ~20ms |
| State Write | < 100ms | ~30ms |
| Auto-Sync | < 200ms | ~100ms |

*Note: Performance may vary based on project size and file system speed.*

---

## Future Enhancements

Planned API improvements for v0.2.0+:

1. **Workflow Loader:** Load workflow definitions from YAML
2. **Generic Workflows:** Support custom workflow types beyond project-planning
3. **Async Operations:** Non-blocking state operations for large projects
4. **Batch Updates:** Update multiple state fields atomically
5. **Event Hooks:** Subscribe to state change events
6. **Validation API:** Validate state structure and consistency
7. **Migration Tools:** Migrate between state schema versions

---

## Support

For issues, questions, or contributions:
- **Project:** `/local-instances/mcp-servers/workflow-orchestrator-mcp-server/`
- **Documentation:** This file and `EXTRACTION-PROGRESS.md`
- **Tests:** `test-orchestration.js`

---

**Generated:** October 29, 2025
**Extracted from:** Project Management MCP Server v0.9.0
