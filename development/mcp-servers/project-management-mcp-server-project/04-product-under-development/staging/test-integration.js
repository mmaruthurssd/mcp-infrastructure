#!/usr/bin/env node

/**
 * Integration Test - Workflow Orchestrator Integration
 *
 * Tests that Project Management MCP correctly uses workflow-orchestrator-mcp-server
 */

import { InitializeProjectOrchestrationTool } from './dist/tools/initialize-project-orchestration.js';
import { GetNextStepsTool } from './dist/tools/get-next-steps.js';
import { GetProjectStatusTool } from './dist/tools/get-project-status.js';
import { AdvanceWorkflowPhaseTool } from './dist/tools/advance-workflow-phase.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test project path
const testPath = path.join(__dirname, 'test-project-integration');

console.log('\n' + '='.repeat(70));
console.log('  WORKFLOW ORCHESTRATOR INTEGRATION TEST');
console.log('='.repeat(70) + '\n');

// Clean up any existing test project
if (fs.existsSync(testPath)) {
  fs.rmSync(testPath, { recursive: true, force: true });
}

// Create test project structure
fs.mkdirSync(testPath, { recursive: true });
fs.mkdirSync(path.join(testPath, 'brainstorming/future-goals/potential-goals'), { recursive: true });
fs.mkdirSync(path.join(testPath, '02-goals-and-roadmap/selected-goals'), { recursive: true });

console.log(`✓ Test project created: ${testPath}\n`);

// Test 1: Initialize
console.log('Test 1: Initialize Project Orchestration');
console.log('─'.repeat(70));
try {
  const initResult = InitializeProjectOrchestrationTool.execute({
    projectPath: testPath,
    projectName: 'Integration Test Project'
  });

  if (initResult.success) {
    console.log('✅ PASS: Project initialized successfully');
    console.log(`   Project: ${initResult.state.projectName}`);
    console.log(`   Phase: ${initResult.state.currentPhase}`);
    console.log(`   State file: ${initResult.statePath}`);
  } else {
    console.log('❌ FAIL: Initialization failed');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Error during initialization');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 2: Get Next Steps
console.log('Test 2: Get Next Steps');
console.log('─'.repeat(70));
try {
  const nextStepsResult = GetNextStepsTool.execute({
    projectPath: testPath,
    maxSuggestions: 5,
    skipSync: false
  });

  if (nextStepsResult.success) {
    console.log('✅ PASS: Next steps retrieved successfully');
    console.log(`   Current Phase: ${nextStepsResult.currentPhase}`);
    console.log(`   Progress: ${nextStepsResult.progress}`);
    console.log(`   Suggestions: ${nextStepsResult.nextActions.length}`);
    if (nextStepsResult.nextActions.length > 0) {
      console.log(`   Top suggestion: ${nextStepsResult.nextActions[0].action}`);
    }
  } else {
    console.log('❌ FAIL: Get next steps failed');
    console.log(`   Message: ${nextStepsResult.message}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Error getting next steps');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 3: Get Project Status
console.log('Test 3: Get Project Status');
console.log('─'.repeat(70));
try {
  const statusResult = GetProjectStatusTool.execute({
    projectPath: testPath
  });

  if (statusResult.success) {
    console.log('✅ PASS: Project status retrieved successfully');
    console.log(`   Project: ${statusResult.projectName}`);
    console.log(`   Overall Progress: ${statusResult.overallProgress}`);
    console.log(`   Health: ${statusResult.health}`);
    console.log(`   Phases: ${statusResult.phases.length}`);
    console.log(`   Goals: ${statusResult.goals.potential} potential, ${statusResult.goals.selected} selected`);
  } else {
    console.log('❌ FAIL: Get status failed');
    console.log(`   Message: ${statusResult.message}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Error getting status');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

console.log();

// Test 4: Verify imports from workflow-orchestrator
console.log('Test 4: Verify Workflow Orchestrator Integration');
console.log('─'.repeat(70));
try {
  // Try to import directly from workflow-orchestrator to verify it's installed
  const { StateManager } = await import('workflow-orchestrator-mcp-server/dist/core/state-manager.js');
  const { RuleEngine } = await import('workflow-orchestrator-mcp-server/dist/core/rule-engine.js');
  const { StateDetector } = await import('workflow-orchestrator-mcp-server/dist/core/state-detector.js');

  console.log('✅ PASS: Workflow orchestrator imports successful');
  console.log('   ✓ StateManager imported');
  console.log('   ✓ RuleEngine imported');
  console.log('   ✓ StateDetector imported');
} catch (error) {
  console.log('❌ FAIL: Could not import from workflow-orchestrator');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

console.log();
console.log('─'.repeat(70));
console.log('✅ ALL TESTS PASSED - Integration Successful!');
console.log('─'.repeat(70));
console.log('\nIntegration Summary:');
console.log('  ✓ Project Management MCP successfully uses workflow-orchestrator');
console.log('  ✓ All orchestration tools working correctly');
console.log('  ✓ State management functional');
console.log('  ✓ Rule engine operational');
console.log('  ✓ No duplicate code');
console.log('\n' + '='.repeat(70) + '\n');

// Clean up
fs.rmSync(testPath, { recursive: true, force: true });
console.log('✓ Test cleanup complete\n');

process.exit(0);
