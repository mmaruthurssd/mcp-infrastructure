---
type: guide
tags: [testing, validation, quality-assurance]
---

# Testing Guide - Project Management MCP Server

**Version:** 0.9.0
**Last Updated:** 2025-10-27

Comprehensive testing guide for the Project Management MCP Server orchestration system.

---

## Overview

This guide covers testing strategies, test scripts, and validation procedures for the orchestration system.

### Test Coverage

- **Unit Tests:** Core utilities (StateManager, RuleEngine, StateDetector)
- **Integration Tests:** Tool interactions and state management
- **End-to-End Tests:** Complete workflow scenarios
- **Performance Tests:** Response times and resource usage
- **MCP Integration Tests:** Handoffs with Spec-Driven and Task Executor MCPs

---

## Test Scripts

### 1. Completion Workflow Test (`test-completion-workflow.js`)

**Purpose:** Validates the full project completion workflow

**Tests:**
- validate_project_readiness
- generate_completion_checklist
- wrap_up_project

**Usage:**
```bash
# Test with auto-created project
node test-completion-workflow.js

# Test with existing project
node test-completion-workflow.js /path/to/project
```

**What It Tests:**
- ✓ Validation tool execution
- ✓ Blocker detection
- ✓ Checklist generation with all sections
- ✓ Completion report creation
- ✓ State archiving

**Expected Output:**
```
[STEP 1] Testing validate_project_readiness
✓ Validation tool executed successfully
Readiness: READY
Completion: 100%
No blockers found

[STEP 2] Testing generate_completion_checklist
✓ Checklist tool executed successfully
Created: PROJECT-WRAP-UP-CHECKLIST.md
✓ All 6 sections present

[STEP 3] Testing wrap_up_project
✓ Wrap-up tool executed successfully
Report: PROJECT-COMPLETION-REPORT.md
State archived: Yes

✓ ALL TESTS PASSED
Success Rate: 100%
```

---

### 2. MCP Handoffs Test (`test-mcp-handoffs.js`)

**Purpose:** Validates integration handoffs with Spec-Driven and Task Executor MCPs

**Tests:**
- prepare_spec_handoff
- prepare_task_executor_handoff
- Integration state tracking

**Usage:**
```bash
# Test with auto-created project
node test-mcp-handoffs.js

# Test with existing project
node test-mcp-handoffs.js /path/to/project
```

**What It Tests:**
- ✓ Goal context extraction
- ✓ Suggested tool call generation
- ✓ Task extraction from specifications
- ✓ Integration state updates (specDriven, taskExecutor)
- ✓ Parameter validation

**Expected Output:**
```
[STEP 1] Testing prepare_spec_handoff
✓ Spec handoff tool executed successfully
Goal Context:
  Name: authentication-system
  Impact: High
  Effort: Medium
✓ Suggested tool call generated
  Tool: sdd_guide
✓ State: specDriven.used = true
✓ State: Goal added to goalsWithSpecs

[STEP 2] Testing prepare_task_executor_handoff
✓ Task executor handoff tool executed successfully
✓ Extracted 15 tasks from specification
✓ Suggested tool call generated
  Tool: create_workflow
✓ State: lastCreated timestamp set

✓ ALL TESTS PASSED
```

---

### 3. Orchestration End-to-End Test (`test-orchestration-e2e.js`)

**Purpose:** Comprehensive end-to-end validation covering Tasks 21 & 22

**Tests:**
- Scenario 1: New project from scratch (Task 21)
- Scenario 2: Existing project with state reconstruction (Task 22)

**Usage:**
```bash
node test-orchestration-e2e.js
```

**What It Tests:**

**Scenario 1 (New Project):**
- ✓ Orchestration initialization
- ✓ State file creation
- ✓ Next steps suggestions
- ✓ Project status reporting
- ✓ Spec handoff preparation

**Scenario 2 (Existing Project):**
- ✓ Initialization on existing structure
- ✓ Auto-sync file detection
- ✓ State reconstruction from files
- ✓ Goal and workflow detection
- ✓ Phase advancement validation

**Expected Output:**
```
SCENARIO 1: NEW PROJECT FROM SCRATCH (TASK 21)
[1.1] Initialize project orchestration
✓ Orchestration initialized
✓ State file created
✓ Project name: Fresh Test Project
✓ Current phase: initialization

[1.2] Get next steps suggestions
✓ Next steps generated
  Phase: initialization
  Suggestions: 5
Top suggestions:
  1. [HIGH] Complete project setup conversation
  2. [HIGH] Generate project constitution
  3. [MEDIUM] Identify stakeholders

SCENARIO 1 COMPLETE

SCENARIO 2: EXISTING PROJECT WITH STATE RECONSTRUCTION (TASK 22)
[2.1] Initialize orchestration on existing project
✓ Orchestration initialized

[2.2] Get next steps with auto-sync
✓ Auto-sync detected changes:
  - Updated selected goals: 2 found
  - Updated potential goals: 1 found
  - Updated active workflows: 1 found
✓ Correctly detected 2 selected goals
✓ Correctly detected 1 potential goal

SCENARIO 2 COMPLETE

✓ ALL TESTS PASSED
Success Rate: 100%
```

---

### 4. Legacy End-to-End Test (`test-end-to-end.js`)

**Purpose:** Tests pre-orchestration tools (project setup, validation, migration)

**Usage:**
```bash
node test-end-to-end.js
```

**Tests:**
- Project creation
- Validation
- Goal evaluation and creation
- Migration detection
- Performance verification

---

## Manual Testing Procedures

### Testing with Live MCP Server

#### Prerequisites
1. Build the server: `npm run build`
2. Register with Claude Desktop (see README.md)
3. Restart Claude Desktop

#### Test Procedure

**1. Test Tool Discovery**
```javascript
// In Claude Desktop, tools should be listed:
// - initialize_project_orchestration
// - get_next_steps
// - advance_workflow_phase
// - get_project_status
// - validate_project_readiness
// - generate_completion_checklist
// - wrap_up_project
// - prepare_spec_handoff
// - prepare_task_executor_handoff
```

**2. Test Basic Orchestration**
```javascript
// Initialize
await mcp__ai-planning__initialize_project_orchestration({
  projectPath: "/path/to/test-project",
  projectName: "Manual Test"
});

// Get suggestions
await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/test-project"
});

// Check status
await mcp__ai-planning__get_project_status({
  projectPath: "/path/to/test-project"
});
```

**3. Test Auto-Sync**
```javascript
// Create a goal file manually
// Then run get_next_steps to trigger auto-sync

await mcp__ai-planning__get_next_steps({
  projectPath: "/path/to/test-project"
});

// Should report syncedChanges if new files detected
```

**4. Test Integration Handoffs**
```javascript
// Prepare spec handoff
const handoff = await mcp__ai-planning__prepare_spec_handoff({
  projectPath: "/path/to/test-project",
  goalId: "01"
});

// Execute suggested tool (requires Spec-Driven MCP)
await mcp__spec-driven__sdd_guide(handoff.suggestedToolCall.params);

// Prepare task executor handoff
const taskHandoff = await mcp__ai-planning__prepare_task_executor_handoff({
  projectPath: "/path/to/test-project",
  goalId: "01"
});

// Execute suggested tool (requires Task Executor MCP)
await mcp__task-executor__create_workflow(taskHandoff.suggestedToolCall.params);
```

---

## Performance Testing

### Response Time Targets

| Tool | Target | Acceptable |
|------|--------|-----------|
| initialize_project_orchestration | < 100ms | < 200ms |
| get_next_steps | < 500ms | < 1000ms |
| get_project_status | < 200ms | < 400ms |
| validate_project_readiness | < 1000ms | < 2000ms |
| prepare_spec_handoff | < 100ms | < 200ms |
| prepare_task_executor_handoff | < 500ms | < 1000ms |

### State File Size

- **Target:** < 50KB
- **Acceptable:** < 100KB
- **Warning:** > 100KB (may indicate issues)

### Testing Performance

```bash
# Run all test scripts with timing
time node test-completion-workflow.js
time node test-mcp-handoffs.js
time node test-orchestration-e2e.js
```

Expected times:
- test-completion-workflow.js: < 5 seconds
- test-mcp-handoffs.js: < 5 seconds
- test-orchestration-e2e.js: < 10 seconds

---

## Regression Testing

### Before Each Release

Run all test scripts:
```bash
# 1. Build
npm run build

# 2. Run legacy tests
node test-end-to-end.js

# 3. Run orchestration tests
node test-completion-workflow.js
node test-mcp-handoffs.js
node test-orchestration-e2e.js

# 4. Verify all pass
echo "All tests passed!" || echo "Tests failed!"
```

### Critical Test Cases

1. **State Persistence**
   - Create state
   - Modify state
   - Read state
   - Verify accuracy

2. **Auto-Sync**
   - Add files manually
   - Run get_next_steps
   - Verify detection

3. **Phase Advancement**
   - Attempt advance without prerequisites
   - Complete prerequisites
   - Advance successfully

4. **Validation**
   - Empty project
   - Partial project
   - Complete project

5. **Integration Tracking**
   - Spec handoff
   - Task executor handoff
   - Verify state updates

---

## Troubleshooting Test Failures

### State File Issues

**Symptom:** Tests fail with "Cannot read state file"

**Solutions:**
1. Check `.ai-planning` directory exists
2. Verify JSON is valid
3. Check file permissions
4. Try deleting and recreating

### Build Issues

**Symptom:** "Cannot find module" errors

**Solutions:**
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Verify build output
ls -la dist/tools/
ls -la dist/utils/
```

### Integration Test Failures

**Symptom:** MCP handoff tests fail

**Solutions:**
1. Ensure project has selected goals
2. Verify goal files have required metadata
3. Check goal folder structure
4. Review state file for goal entries

### Performance Issues

**Symptom:** Tests timeout or run slowly

**Solutions:**
1. Check state file size (should be < 50KB)
2. Reduce number of goals in test
3. Clear test-projects directory
4. Check system resources

---

## Test Artifacts

All test scripts create artifacts in `test-projects/`:
- `test-fresh-project/` - Created by orchestration-e2e
- `test-existing-project/` - Created by orchestration-e2e
- `test-completion-project/` - Created by completion-workflow
- `test-handoff-project/` - Created by mcp-handoffs

Clean up:
```bash
rm -rf test-projects/
```

---

## Continuous Integration

### Automated Testing

For CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: node test-end-to-end.js
      - run: node test-completion-workflow.js
      - run: node test-mcp-handoffs.js
      - run: node test-orchestration-e2e.js
```

---

## Adding New Tests

### Test File Template

```javascript
#!/usr/bin/env node
import { /* tools */ } from './dist/tools/...';

function log(message, color) {
  // Color logging helper
}

async function testFeature() {
  try {
    const result = await ToolName.execute({ /* params */ });

    if (result.success) {
      log('✓ Test passed', 'green');
      return true;
    } else {
      log('✗ Test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Exception: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const passed = await testFeature();
  process.exit(passed ? 0 : 1);
}

main();
```

---

## Questions?

- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- See [DEVELOPER-GUIDE-ORCHESTRATION.md](./DEVELOPER-GUIDE-ORCHESTRATION.md)
- Open an issue on GitHub

---

**Next Steps:**
- Run all test scripts before deploying
- Add tests for new features
- Monitor performance metrics
- Review test coverage regularly
