/**
 * Integration Tests for task-executor-mcp-server v2.0.0
 * Tests workflow-orchestrator integration and backward compatibility
 */

import { WorkflowManager } from './dist/utils/workflow-manager-v2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_PROJECT_PATH = path.join(__dirname, 'test-project');
const TEST_WORKFLOW_NAME = 'test-workflow-integration';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

// Helper to run a test
function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.log(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

// Helper to assert
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Helper to cleanup test data
function cleanup() {
  const tempDir = path.join(TEST_PROJECT_PATH, 'temp');
  const archiveDir = path.join(TEST_PROJECT_PATH, 'archive');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  if (fs.existsSync(archiveDir)) {
    fs.rmSync(archiveDir, { recursive: true, force: true });
  }
  if (fs.existsSync(TEST_PROJECT_PATH)) {
    fs.rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
  }
}

// Setup test environment
console.log('\n=== Task Executor MCP Server v2.0.0 Integration Tests ===\n');
console.log('Testing workflow-orchestrator integration...\n');

cleanup();
fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true });

// Test Suite
console.log('--- Workflow Creation Tests ---');

test('Create new workflow with tasks', () => {
  const result = WorkflowManager.create({
    name: TEST_WORKFLOW_NAME,
    projectPath: TEST_PROJECT_PATH,
    tasks: [
      { description: 'Implement authentication' },
      { description: 'Add validation logic', estimatedHours: 2 },
      { description: 'Write unit tests' }
    ],
    constraints: ['Must handle PHI securely', 'HIPAA compliant'],
    context: {
      phiHandling: true,
      category: 'feature'
    }
  });

  assert(result.success, 'Workflow creation should succeed');
  assert(result.workflow, 'Should return workflow data');
  assert(result.workflow.name === TEST_WORKFLOW_NAME, 'Workflow name should match');
  assert(result.workflow.tasks.length === 3, 'Should have 3 tasks');
  assert(result.workflow.tasks[0].complexity, 'Tasks should have complexity analysis');
  assert(result.workflow.tasks[0].complexity.score >= 1, 'Complexity score should be >= 1');
  assert(result.workflow.tasks[0].complexity.score <= 10, 'Complexity score should be <= 10');
  assert(result.workflow.tasks[0].complexity.emoji, 'Should have complexity emoji');
});

test('Workflow state file created in temp/', () => {
  const statePath = path.join(TEST_PROJECT_PATH, 'temp', 'workflows', TEST_WORKFLOW_NAME, 'state.json');
  assert(fs.existsSync(statePath), 'State file should exist in temp/workflows/');

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert(state.name === TEST_WORKFLOW_NAME, 'State should contain workflow name');
  assert(state.customData, 'State should have customData');
  assert(state.customData.tasks, 'State should have tasks in customData');
  assert(state.customData.constraints, 'State should have constraints in customData');
});

test('Plan.md generated with task details', () => {
  const planPath = path.join(TEST_PROJECT_PATH, 'temp', 'workflows', TEST_WORKFLOW_NAME, 'plan.md');
  assert(fs.existsSync(planPath), 'plan.md should be created');

  const planContent = fs.readFileSync(planPath, 'utf8');
  assert(planContent.includes('Implement authentication'), 'Plan should include task descriptions');
  assert(planContent.includes('Must handle PHI securely'), 'Plan should include constraints');
  assert(planContent.includes('## Tasks'), 'Plan should have tasks section');
  assert(planContent.includes('## Constraints'), 'Plan should have constraints section');
});

console.log('\n--- Task Completion Tests ---');

test('Complete first task', () => {
  const result = WorkflowManager.completeTask(
    TEST_PROJECT_PATH,
    TEST_WORKFLOW_NAME,
    '1',
    'Implemented JWT-based auth with PHI encryption'
  );

  assert(result.success, 'Task completion should succeed');
  assert(result.verification, 'Should return verification report');
  assert(result.verification.status === 'passed', 'Basic verification should pass');
  assert(result.progress, 'Should return progress info');
  assert(result.progress.percentComplete === 33, 'Progress should be 33% (1/3 tasks)');
});

test('Verification report generated', () => {
  const result = WorkflowManager.completeTask(
    TEST_PROJECT_PATH,
    TEST_WORKFLOW_NAME,
    '2',
    'Added input validation with sanitization',
    false // Don't skip verification
  );

  assert(result.verification.evidence, 'Should have evidence array');
  assert(result.verification.concerns, 'Should have concerns array');
  assert(result.verification.recommendations, 'Should have recommendations array');
  assert(result.progress.percentComplete === 67, 'Progress should be 67% (2/3 tasks)');
});

test('Skip verification option works', () => {
  const result = WorkflowManager.completeTask(
    TEST_PROJECT_PATH,
    TEST_WORKFLOW_NAME,
    '3',
    'Added comprehensive test suite',
    true // Skip verification
  );

  assert(result.success, 'Task completion should succeed');
  assert(!result.verification, 'Should not have verification when skipped');
  assert(result.progress.percentComplete === 100, 'Progress should be 100% (3/3 tasks)');
});

console.log('\n--- Workflow Status Tests ---');

test('Get workflow status', () => {
  const result = WorkflowManager.getStatus(TEST_PROJECT_PATH, TEST_WORKFLOW_NAME);

  assert(result.success, 'Status retrieval should succeed');
  assert(result.workflow, 'Should return workflow data');
  assert(result.workflow.name === TEST_WORKFLOW_NAME, 'Workflow name should match');
  assert(result.workflow.progress === '3/3 tasks complete (100%)', 'Progress string should be correct');
  assert(result.tasks, 'Should return tasks array');
  assert(result.tasks.length === 3, 'Should have 3 tasks');
  assert(result.tasks.every(t => t.status === 'completed' || t.status === 'verified'), 'All tasks should be completed or verified');
});

test('Workflow status shows complexity scores', () => {
  const result = WorkflowManager.getStatus(TEST_PROJECT_PATH, TEST_WORKFLOW_NAME);

  result.tasks.forEach(task => {
    assert(task.complexity, `Task ${task.id} should have complexity`);
    assert(task.complexity.score, `Task ${task.id} should have complexity score`);
    assert(task.complexity.level, `Task ${task.id} should have complexity level`);
    assert(task.complexity.emoji, `Task ${task.id} should have complexity emoji`);
  });
});

console.log('\n--- Documentation Detection Tests ---');

test('Documentation detection works', () => {
  // Create some documentation files
  fs.writeFileSync(path.join(TEST_PROJECT_PATH, 'README.md'), '# Test Project');
  fs.writeFileSync(path.join(TEST_PROJECT_PATH, 'CHANGELOG.md'), '# Changelog');

  const result = WorkflowManager.getStatus(TEST_PROJECT_PATH, TEST_WORKFLOW_NAME);

  assert(result.documentation, 'Should detect documentation');
  assert(result.documentation.existing.includes('README.md'), 'Should detect README.md');
  assert(result.documentation.existing.includes('CHANGELOG.md'), 'Should detect CHANGELOG.md');
});

console.log('\n--- Workflow Archival Tests ---');

test('Archive completed workflow', () => {
  const result = WorkflowManager.archive(TEST_PROJECT_PATH, TEST_WORKFLOW_NAME);

  assert(result.success, 'Archive should succeed');
  assert(result.message.includes('archive/workflows/'), 'Message should mention archive location');
});

test('Workflow moved from temp/ to archive/', () => {
  const tempPath = path.join(TEST_PROJECT_PATH, 'temp', 'workflows', TEST_WORKFLOW_NAME);
  const archivePath = path.join(TEST_PROJECT_PATH, 'archive', 'workflows');

  assert(!fs.existsSync(tempPath), 'Workflow should be removed from temp/');
  assert(fs.existsSync(archivePath), 'Archive directory should exist');

  // Check that archived workflow has timestamp prefix
  const archivedDirs = fs.readdirSync(archivePath);
  const archivedWorkflow = archivedDirs.find(d => d.includes(TEST_WORKFLOW_NAME));
  assert(archivedWorkflow, 'Workflow should exist in archive with timestamp');
  assert(/^\d{4}-\d{2}-\d{2}-\d{6}-/.test(archivedWorkflow), 'Should have timestamp prefix (YYYY-MM-DD-HHMMSS-)');
});

test('Archived workflow contains all files', () => {
  const archivePath = path.join(TEST_PROJECT_PATH, 'archive', 'workflows');
  const archivedDirs = fs.readdirSync(archivePath);
  const archivedWorkflow = archivedDirs.find(d => d.includes(TEST_WORKFLOW_NAME));
  const workflowPath = path.join(archivePath, archivedWorkflow);

  assert(fs.existsSync(path.join(workflowPath, 'state.json')), 'Archived workflow should have state.json');
  assert(fs.existsSync(path.join(workflowPath, 'plan.md')), 'Archived workflow should have plan.md');
});

console.log('\n--- Error Handling Tests ---');

test('Error when workflow not found', () => {
  const result = WorkflowManager.getStatus(TEST_PROJECT_PATH, 'nonexistent-workflow');
  assert(!result.success, 'Should fail for nonexistent workflow');
  assert(result.error, 'Should have error message');
});

test('Error when completing invalid task ID', () => {
  // Create a new workflow for this test
  WorkflowManager.create({
    name: 'test-error-workflow',
    projectPath: TEST_PROJECT_PATH,
    tasks: [{ description: 'Test task' }]
  });

  const result = WorkflowManager.completeTask(
    TEST_PROJECT_PATH,
    'test-error-workflow',
    '999' // Invalid task ID
  );

  assert(!result.success, 'Should fail for invalid task ID');
  assert(result.error, 'Should have error message');
});

test('Error when archiving incomplete workflow', () => {
  const result = WorkflowManager.archive(TEST_PROJECT_PATH, 'test-error-workflow');

  assert(!result.success, 'Should fail for incomplete workflow');
  assert(result.error.includes('not all tasks are completed'), 'Error should mention incomplete tasks');
});

test('Force archive works for incomplete workflow', () => {
  const result = WorkflowManager.archive(TEST_PROJECT_PATH, 'test-error-workflow', true);

  assert(result.success, 'Force archive should succeed');
  assert(result.warnings, 'Should have warnings array');
  assert(result.warnings.length > 0, 'Should have warnings for incomplete tasks');
});

console.log('\n--- Backward Compatibility Tests ---');

test('State format compatible with workflow-orchestrator', () => {
  // Create a workflow and check state structure
  WorkflowManager.create({
    name: 'compat-test',
    projectPath: TEST_PROJECT_PATH,
    tasks: [{ description: 'Test compatibility' }]
  });

  const statePath = path.join(TEST_PROJECT_PATH, 'temp', 'workflows', 'compat-test', 'state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  // Check workflow-orchestrator WorkflowState<T> structure
  assert(state.name, 'State should have name');
  assert(state.phase, 'State should have phase');
  assert(state.currentStep, 'State should have currentStep');
  assert(state.created, 'State should have created timestamp');
  assert(state.lastUpdated, 'State should have lastUpdated timestamp');
  assert(state.customData, 'State should have customData');

  // Check task-executor specific customData
  assert(state.customData.tasks, 'customData should have tasks');
  assert(state.customData.constraints, 'customData should have constraints');
  assert(state.customData.context, 'customData should have context');
  assert(state.customData.metadata, 'customData should have metadata');
  assert(state.customData.documentation, 'customData should have documentation');
});

test('Legacy tools still work with new state format', () => {
  // Test that all CRUD operations work
  const createResult = WorkflowManager.create({
    name: 'legacy-test',
    projectPath: TEST_PROJECT_PATH,
    tasks: [{ description: 'Test legacy compatibility' }]
  });
  assert(createResult.success, 'Create should work');

  const statusResult = WorkflowManager.getStatus(TEST_PROJECT_PATH, 'legacy-test');
  assert(statusResult.success, 'Get status should work');

  const completeResult = WorkflowManager.completeTask(TEST_PROJECT_PATH, 'legacy-test', '1');
  assert(completeResult.success, 'Complete task should work');

  const archiveResult = WorkflowManager.archive(TEST_PROJECT_PATH, 'legacy-test');
  assert(archiveResult.success, 'Archive should work');
});

// Cleanup
cleanup();

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed! task-executor-mcp-server v2.0.0 integration successful.');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed. Please review the errors above.');
  process.exit(1);
}
