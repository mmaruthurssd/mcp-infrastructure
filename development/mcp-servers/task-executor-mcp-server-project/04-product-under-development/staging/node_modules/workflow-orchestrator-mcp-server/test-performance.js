#!/usr/bin/env node

/**
 * Performance Test Suite
 *
 * Measures execution time of all orchestration tools
 * Target: < 500ms for get_next_steps, < 100ms for other operations
 */

import { InitializeProjectOrchestrationTool } from './dist/tools/initialize-project-orchestration.js';
import { GetNextStepsTool } from './dist/tools/get-next-steps.js';
import { AdvanceWorkflowPhaseTool } from './dist/tools/advance-workflow-phase.js';
import { GetProjectStatusTool } from './dist/tools/get-project-status.js';
import { StateManager } from './dist/core/state-manager.js';
import * as fs from 'fs';
import * as path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Performance targets (in ms)
const TARGETS = {
  initialize: 100,
  get_next_steps: 500,
  advance_phase: 50,
  get_status: 100,
  state_read: 50,
  state_write: 100,
};

// Test results storage
const results = {
  passed: [],
  warnings: [],
  failed: [],
};

/**
 * Measure execution time of a function
 */
function measure(fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  return { result, duration };
}

/**
 * Run performance test with threshold checking
 */
function runTest(name, fn, target) {
  console.log(`\n${COLORS.cyan}[${name}]${COLORS.reset}`);

  // Run 5 iterations and take average
  const iterations = [];
  for (let i = 0; i < 5; i++) {
    const { result, duration } = measure(fn);
    iterations.push(duration);
    console.log(`${COLORS.dim}  Run ${i + 1}: ${duration.toFixed(2)}ms${COLORS.reset}`);
  }

  const avg = iterations.reduce((a, b) => a + b, 0) / iterations.length;
  const min = Math.min(...iterations);
  const max = Math.max(...iterations);

  console.log(`${COLORS.bright}  Average: ${avg.toFixed(2)}ms${COLORS.reset}`);
  console.log(`${COLORS.dim}  Range: ${min.toFixed(2)}ms - ${max.toFixed(2)}ms${COLORS.reset}`);

  // Check against target
  if (avg < target) {
    const margin = ((target - avg) / target * 100).toFixed(1);
    console.log(`${COLORS.green}  ✓ PASS${COLORS.reset} (${margin}% under target of ${target}ms)`);
    results.passed.push({ name, avg, target, margin });
  } else if (avg < target * 1.2) {
    const overage = ((avg - target) / target * 100).toFixed(1);
    console.log(`${COLORS.yellow}  ⚠ WARN${COLORS.reset} (${overage}% over target of ${target}ms)`);
    results.warnings.push({ name, avg, target, overage });
  } else {
    const overage = ((avg - target) / target * 100).toFixed(1);
    console.log(`${COLORS.red}  ✗ FAIL${COLORS.reset} (${overage}% over target of ${target}ms)`);
    results.failed.push({ name, avg, target, overage });
  }

  return { avg, min, max };
}

/**
 * Create test project
 */
function setupTestProject() {
  const testPath = path.join(process.cwd(), 'test-projects/perf-test');

  // Clean up existing
  if (fs.existsSync(testPath)) {
    fs.rmSync(testPath, { recursive: true, force: true });
  }

  // Create project structure
  fs.mkdirSync(testPath, { recursive: true });
  fs.mkdirSync(path.join(testPath, 'brainstorming/future-goals/potential-goals'), { recursive: true });
  fs.mkdirSync(path.join(testPath, '02-goals-and-roadmap/selected-goals'), { recursive: true });
  fs.mkdirSync(path.join(testPath, 'temp/workflows'), { recursive: true });

  // Create some test files to make auto-sync more realistic
  fs.writeFileSync(
    path.join(testPath, 'brainstorming/future-goals/potential-goals/test-goal-1.md'),
    '# Test Goal 1'
  );
  fs.writeFileSync(
    path.join(testPath, 'brainstorming/future-goals/potential-goals/test-goal-2.md'),
    '# Test Goal 2'
  );

  return testPath;
}

/**
 * Main test execution
 */
async function runPerformanceTests() {
  console.log(`${COLORS.bright}
======================================================================
  WORKFLOW ORCHESTRATOR MCP - PERFORMANCE TEST SUITE
======================================================================
${COLORS.reset}`);
  console.log(`${COLORS.dim}Testing performance against target benchmarks${COLORS.reset}`);

  const testPath = setupTestProject();
  console.log(`${COLORS.cyan}ℹ Test project: ${testPath}${COLORS.reset}`);

  // Test 1: Initialize
  const initResult = runTest(
    'Initialize Project',
    () => InitializeProjectOrchestrationTool.execute({
      projectPath: testPath,
      projectName: 'Performance Test',
      force: true
    }),
    TARGETS.initialize
  );

  // Test 2: Get Next Steps (no sync)
  const nextStepsNoSync = runTest(
    'Get Next Steps (no sync)',
    () => GetNextStepsTool.execute({
      projectPath: testPath,
      maxSuggestions: 5,
      skipSync: true
    }),
    TARGETS.get_next_steps
  );

  // Test 3: Get Next Steps (with sync)
  const nextStepsWithSync = runTest(
    'Get Next Steps (with auto-sync)',
    () => GetNextStepsTool.execute({
      projectPath: testPath,
      maxSuggestions: 5,
      skipSync: false
    }),
    TARGETS.get_next_steps
  );

  // Test 4: Get Status
  const statusResult = runTest(
    'Get Project Status',
    () => GetProjectStatusTool.execute({
      projectPath: testPath
    }),
    TARGETS.get_status
  );

  // Test 5: State Read/Write (direct operations)
  console.log(`\n${COLORS.cyan}[State Read/Write Operations]${COLORS.reset}`);

  // Read
  const readTimes = [];
  for (let i = 0; i < 10; i++) {
    const { duration } = measure(() => {
      return StateManager.read(testPath);
    });
    readTimes.push(duration);
  }
  const avgRead = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
  console.log(`${COLORS.bright}  Read avg: ${avgRead.toFixed(2)}ms${COLORS.reset} ${avgRead < TARGETS.state_read ? COLORS.green + '✓' : COLORS.yellow + '⚠'} ${COLORS.reset}`);

  // Write
  const writeTimes = [];
  for (let i = 0; i < 10; i++) {
    const { duration } = measure(() => {
      const state = StateManager.read(testPath);
      return StateManager.write(testPath, state);
    });
    writeTimes.push(duration);
  }
  const avgWrite = writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length;
  console.log(`${COLORS.bright}  Write avg: ${avgWrite.toFixed(2)}ms${COLORS.reset} ${avgWrite < TARGETS.state_write ? COLORS.green + '✓' : COLORS.yellow + '⚠'} ${COLORS.reset}`);

  const stateOpsResult = { avgRead, avgWrite };

  // Print summary
  console.log(`\n${COLORS.bright}
======================================================================
  PERFORMANCE TEST RESULTS
======================================================================
${COLORS.reset}`);

  console.log(`\n${COLORS.green}✓ PASSED: ${results.passed.length}${COLORS.reset}`);
  results.passed.forEach(r => {
    console.log(`  ${r.name}: ${r.avg.toFixed(2)}ms (${r.margin}% under target)`);
  });

  if (results.warnings.length > 0) {
    console.log(`\n${COLORS.yellow}⚠ WARNINGS: ${results.warnings.length}${COLORS.reset}`);
    results.warnings.forEach(r => {
      console.log(`  ${r.name}: ${r.avg.toFixed(2)}ms (${r.overage}% over target)`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n${COLORS.red}✗ FAILED: ${results.failed.length}${COLORS.reset}`);
    results.failed.forEach(r => {
      console.log(`  ${r.name}: ${r.avg.toFixed(2)}ms (${r.overage}% over target)`);
    });
  }

  // Overall result
  console.log(`\n${COLORS.dim}${'─'.repeat(70)}${COLORS.reset}\n`);
  if (results.failed.length === 0) {
    console.log(`${COLORS.bright}${COLORS.green}✓ ALL PERFORMANCE TARGETS MET${COLORS.reset}\n`);
    console.log('Workflow orchestration performance is within acceptable limits:');
    console.log(`  ✓ Initialize: ${initResult.avg.toFixed(1)}ms < ${TARGETS.initialize}ms`);
    console.log(`  ✓ Get Next Steps: ${nextStepsWithSync.avg.toFixed(1)}ms < ${TARGETS.get_next_steps}ms`);
    console.log(`  ✓ Get Status: ${statusResult.avg.toFixed(1)}ms < ${TARGETS.get_status}ms`);
  } else {
    console.log(`${COLORS.red}✗ PERFORMANCE ISSUES DETECTED${COLORS.reset}\n`);
    console.log('Some operations exceeded performance targets.');
    console.log('Consider optimization for production use.');
  }

  console.log(`\n${COLORS.dim}${'='.repeat(70)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}Performance test complete${COLORS.reset}`);
  console.log(`${COLORS.dim}${'='.repeat(70)}${COLORS.reset}\n`);

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runPerformanceTests().catch(err => {
  console.error(`${COLORS.red}Error running performance tests:${COLORS.reset}`, err);
  process.exit(1);
});
