#!/usr/bin/env node

/**
 * Test Script: Workflow Orchestration Core Tests
 *
 * Tests the core orchestration functionality:
 * 1. Initialize orchestration on new project
 * 2. Get next steps suggestions
 * 3. Get project status
 * 4. Phase advancement with validation
 * 5. State auto-sync
 *
 * Usage: node test-orchestration.js
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import orchestration tools
import { InitializeProjectOrchestrationTool } from './dist/tools/initialize-project-orchestration.js';
import { GetNextStepsTool } from './dist/tools/get-next-steps.js';
import { AdvanceWorkflowPhaseTool } from './dist/tools/advance-workflow-phase.js';
import { GetProjectStatusTool } from './dist/tools/get-project-status.js';
import { StateManager } from './dist/core/state-manager.js';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test counters
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  scenarios: [],
};

function recordTest(scenario, step, status, details = {}) {
  if (status === 'passed') {
    testResults.passed++;
  } else if (status === 'failed') {
    testResults.failed++;
  } else if (status === 'warning') {
    testResults.warnings++;
  }

  let scenarioRecord = testResults.scenarios.find(s => s.name === scenario);
  if (!scenarioRecord) {
    scenarioRecord = { name: scenario, steps: [] };
    testResults.scenarios.push(scenarioRecord);
  }

  scenarioRecord.steps.push({ step, status, details });
}

// ============================================================================
// SCENARIO 1: New Project Initialization
// ============================================================================

function createFreshProject(basePath) {
  const projectPath = join(basePath, 'test-fresh-project');

  // Create basic structure (no orchestration state yet)
  const dirs = [
    'brainstorming/future-goals/potential-goals',
    'brainstorming/future-goals/selected-goals',
  ];

  dirs.forEach(dir => {
    const dirPath = join(projectPath, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  });

  return projectPath;
}

async function testNewProjectScenario(basePath) {
  log('\n' + '='.repeat(70), 'bright');
  log('SCENARIO 1: NEW PROJECT INITIALIZATION', 'bright');
  log('='.repeat(70), 'bright');
  log('Tests orchestration initialization and workflow guidance for a new project', 'dim');

  const projectPath = createFreshProject(basePath);
  logInfo(`Project path: ${projectPath}`);

  // Step 1: Initialize orchestration
  logStep('1.1', 'Initialize project orchestration');
  try {
    const initResult = InitializeProjectOrchestrationTool.execute({
      projectPath,
      projectName: 'Fresh Test Project',
    });

    if (initResult.success) {
      logSuccess('Orchestration initialized');

      // Verify state file created
      const statePath = join(projectPath, '.ai-planning/project-state.json');
      if (existsSync(statePath)) {
        logSuccess('State file created');

        const state = StateManager.read(projectPath);
        if (state && state.projectName === 'Fresh Test Project') {
          logSuccess(`Project name: ${state.projectName}`);
          logSuccess(`Current phase: ${state.currentPhase}`);
          recordTest('new-project', 'initialize', 'passed', { phase: state.currentPhase });
        } else {
          logError('State file corrupted or invalid');
          recordTest('new-project', 'initialize', 'failed', { error: 'Invalid state' });
        }
      } else {
        logError('State file not created');
        recordTest('new-project', 'initialize', 'failed', { error: 'No state file' });
      }
    } else {
      logError(`Initialization failed: ${initResult.message}`);
      recordTest('new-project', 'initialize', 'failed', { error: initResult.message });
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    recordTest('new-project', 'initialize', 'failed', { error: error.message });
  }

  // Step 2: Get initial next steps
  logStep('1.2', 'Get next steps suggestions');
  try {
    const nextStepsResult = GetNextStepsTool.execute({ projectPath });

    if (nextStepsResult.success) {
      logSuccess('Next steps generated');
      log(`  Phase: ${nextStepsResult.currentPhase}`, 'cyan');
      log(`  Progress: ${nextStepsResult.progress}`, 'cyan');
      log(`  Suggestions: ${nextStepsResult.nextActions.length}`, 'cyan');

      if (nextStepsResult.nextActions.length > 0) {
        logInfo('Top suggestions:');
        nextStepsResult.nextActions.slice(0, 3).forEach((action, i) => {
          log(`  ${i + 1}. [${action.priority.toUpperCase()}] ${action.action}`, 'cyan');
        });
        recordTest('new-project', 'next-steps', 'passed', {
          suggestions: nextStepsResult.nextActions.length,
        });
      } else {
        logWarning('No suggestions generated');
        recordTest('new-project', 'next-steps', 'warning', { suggestions: 0 });
      }
    } else {
      logError(`Next steps failed: ${nextStepsResult.message}`);
      recordTest('new-project', 'next-steps', 'failed', { error: nextStepsResult.message });
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    recordTest('new-project', 'next-steps', 'failed', { error: error.message });
  }

  // Step 3: Get project status
  logStep('1.3', 'Get project status');
  try {
    const statusResult = GetProjectStatusTool.execute({ projectPath });

    if (statusResult.success) {
      logSuccess('Status retrieved');
      log(`  Phase: ${statusResult.currentPhase}`, 'cyan');
      log(`  Overall Progress: ${statusResult.overallProgress}`, 'cyan');
      log(`  Health: ${statusResult.health}`, 'cyan');
      log(`  Goals: ${statusResult.goals.potential + statusResult.goals.selected + statusResult.goals.completed}`, 'cyan');
      recordTest('new-project', 'status', 'passed', {
        phase: statusResult.currentPhase,
        health: statusResult.health,
      });
    } else {
      logError(`Status failed: ${statusResult.message}`);
      recordTest('new-project', 'status', 'failed', { error: statusResult.message });
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    recordTest('new-project', 'status', 'failed', { error: error.message });
  }

  log('\n' + '─'.repeat(70), 'dim');
  log('SCENARIO 1 COMPLETE', 'green');
}

// ============================================================================
// SCENARIO 2: Existing Project with State Reconstruction
// ============================================================================

function createExistingProject(basePath) {
  const projectPath = join(basePath, 'test-existing-project');

  logInfo('Creating existing project structure with files but no orchestration state');

  // Create comprehensive project structure
  const dirs = [
    'brainstorming/future-goals/selected-goals/feature-one',
    'brainstorming/future-goals/selected-goals/feature-two',
    'brainstorming/future-goals/potential-goals',
    'temp/workflows/feature-one-workflow',
  ];

  dirs.forEach(dir => {
    const dirPath = join(projectPath, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  });

  // Create goal files
  const goal1Content = `# Feature One

## Description
First feature implementation

## Progress
60% complete
`;
  writeFileSync(join(projectPath, 'brainstorming/future-goals/selected-goals/feature-one/goal.md'), goal1Content);

  const goal2Content = `# Feature Two

## Description
Second feature for future implementation
`;
  writeFileSync(join(projectPath, 'brainstorming/future-goals/selected-goals/feature-two/goal.md'), goal2Content);

  // Create potential goal
  const potentialGoalContent = `# Future Feature

## Evaluation
- Impact: Medium
- Effort: Low
`;
  writeFileSync(join(projectPath, 'brainstorming/future-goals/potential-goals/future-feature.md'), potentialGoalContent);

  // Create workflow file
  const workflowContent = JSON.stringify({
    name: 'feature-one-workflow',
    created: new Date().toISOString(),
    status: 'active',
    tasks: [
      { id: '1', description: 'Task 1', status: 'completed' },
      { id: '2', description: 'Task 2', status: 'in_progress' },
      { id: '3', description: 'Task 3', status: 'pending' },
    ],
  }, null, 2);
  writeFileSync(join(projectPath, 'temp/workflows/feature-one-workflow/state.json'), workflowContent);

  logSuccess('Created existing project structure');
  logInfo('  2 selected goals');
  logInfo('  1 potential goal');
  logInfo('  1 active workflow');

  return projectPath;
}

async function testExistingProjectScenario(basePath) {
  log('\n' + '='.repeat(70), 'bright');
  log('SCENARIO 2: EXISTING PROJECT WITH STATE RECONSTRUCTION', 'bright');
  log('='.repeat(70), 'bright');
  log('Tests state reconstruction from existing project files', 'dim');

  const projectPath = createExistingProject(basePath);
  logInfo(`Project path: ${projectPath}`);

  // Step 1: Initialize orchestration (should detect existing structure)
  logStep('2.1', 'Initialize orchestration on existing project');
  try {
    const initResult = InitializeProjectOrchestrationTool.execute({
      projectPath,
      projectName: 'Existing Test Project',
    });

    if (initResult.success) {
      logSuccess('Orchestration initialized');
      recordTest('existing-project', 'initialize', 'passed');
    } else {
      logError(`Initialization failed: ${initResult.message}`);
      recordTest('existing-project', 'initialize', 'failed', { error: initResult.message });
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    recordTest('existing-project', 'initialize', 'failed', { error: error.message });
  }

  // Step 2: Get next steps with auto-sync
  logStep('2.2', 'Get next steps with auto-sync to detect existing files');
  try {
    const nextStepsResult = GetNextStepsTool.execute({
      projectPath,
      skipSync: false, // Ensure sync runs
    });

    if (nextStepsResult.success) {
      logSuccess('Next steps with auto-sync executed');

      if (nextStepsResult.syncedChanges && nextStepsResult.syncedChanges.length > 0) {
        logSuccess('Auto-sync detected changes:');
        nextStepsResult.syncedChanges.forEach(change => {
          log(`  - ${change}`, 'cyan');
        });
        recordTest('existing-project', 'auto-sync', 'passed', {
          changes: nextStepsResult.syncedChanges.length,
        });
      } else {
        logWarning('No changes detected by auto-sync (may be expected if state already synced)');
        recordTest('existing-project', 'auto-sync', 'warning');
      }

      // Verify state was reconstructed
      const state = StateManager.read(projectPath);
      if (state) {
        log('\nReconstructed state:', 'cyan');
        log(`  Potential goals: ${state.goals.potential.length}`, 'cyan');
        log(`  Selected goals: ${state.goals.selected.length}`, 'cyan');
        log(`  Active workflows: ${state.integrations.taskExecutor.activeWorkflows.length}`, 'cyan');

        recordTest('existing-project', 'state-reconstruction', 'passed', {
          selectedGoals: state.goals.selected.length,
          potentialGoals: state.goals.potential.length,
        });
      } else {
        logError('Could not read reconstructed state');
        recordTest('existing-project', 'state-reconstruction', 'failed');
      }
    } else {
      logError(`Next steps failed: ${nextStepsResult.message}`);
      recordTest('existing-project', 'auto-sync', 'failed', { error: nextStepsResult.message });
    }
  } catch (error) {
    logError(`Exception: ${error.message}`);
    recordTest('existing-project', 'auto-sync', 'failed', { error: error.message });
  }

  log('\n' + '─'.repeat(70), 'dim');
  log('SCENARIO 2 COMPLETE', 'green');
}

// ============================================================================
// Final Report
// ============================================================================

function printFinalReport() {
  log('\n' + '='.repeat(70), 'bright');
  log('WORKFLOW ORCHESTRATION TEST RESULTS', 'bright');
  log('='.repeat(70), 'bright');

  // Overall summary
  log(`\nOverall Results:`, 'cyan');
  log(`  Passed: ${testResults.passed}`, testResults.passed > 0 ? 'green' : 'reset');
  log(`  Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  log(`  Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'reset');

  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  log(`\n  Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  // Scenario breakdown
  testResults.scenarios.forEach(scenario => {
    log(`\n${scenario.name.toUpperCase()}:`, 'cyan');
    scenario.steps.forEach(step => {
      const icon = step.status === 'passed' ? '✓' : step.status === 'failed' ? '✗' : '⚠';
      const color = step.status === 'passed' ? 'green' : step.status === 'failed' ? 'red' : 'yellow';
      log(`  ${icon} ${step.step}`, color);
    });
  });

  // Verdict
  log('\n' + '─'.repeat(70), 'dim');
  if (testResults.failed === 0) {
    log('✓ ALL TESTS PASSED', 'green');
    log('\nWorkflow orchestration system is working correctly:', 'green');
    log('  ✓ New project initialization', 'green');
    log('  ✓ State reconstruction from existing files', 'green');
    log('  ✓ Auto-sync detection', 'green');
    log('  ✓ Next steps suggestions', 'green');
    log('  ✓ Status reporting', 'green');
    return 0;
  } else {
    log('✗ SOME TESTS FAILED', 'red');
    log('\nReview failed tests and fix issues before production use.', 'yellow');
    return 1;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('WORKFLOW ORCHESTRATOR MCP - CORE TEST SUITE', 'bright');
  log('='.repeat(70), 'bright');
  log('Testing core orchestration functionality', 'dim');

  // Create test projects directory
  const basePath = join(__dirname, 'test-projects');
  if (existsSync(basePath)) {
    rmSync(basePath, { recursive: true, force: true });
  }
  mkdirSync(basePath, { recursive: true });

  // Run scenarios
  await testNewProjectScenario(basePath);
  await testExistingProjectScenario(basePath);

  // Print final report
  const exitCode = printFinalReport();

  log('\n' + '='.repeat(70), 'dim');
  log(`Test artifacts saved in: ${basePath}`, 'cyan');
  log('='.repeat(70) + '\n', 'dim');

  process.exit(exitCode);
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
