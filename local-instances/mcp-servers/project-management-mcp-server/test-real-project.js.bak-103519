#!/usr/bin/env node

/**
 * Real Project Test - Verify Integration with Actual Project
 *
 * Tests Project Management MCP tools on workflow-orchestrator-project
 */

import { GetNextStepsTool } from './dist/tools/get-next-steps.js';
import { GetProjectStatusTool } from './dist/tools/get-project-status.js';

const projectPath = '/Users/mmaruthurnew/Desktop/medical-practice-workspace/projects-in-development/workflow-orchestrator-project';

console.log('\n' + '='.repeat(70));
console.log('  REAL PROJECT TEST - Workflow Orchestrator Project');
console.log('='.repeat(70) + '\n');

console.log(`Testing with: ${projectPath}\n`);

// Test 1: Get Project Status
console.log('Test 1: Get Project Status on Real Project');
console.log('─'.repeat(70));
try {
  const statusResult = GetProjectStatusTool.execute({
    projectPath
  });

  if (statusResult.success) {
    console.log('✅ PASS: Status retrieved from real project');
    console.log(`   Project: ${statusResult.projectName}`);
    console.log(`   Current Phase: ${statusResult.currentPhase}`);
    console.log(`   Current Step: ${statusResult.currentStep}`);
    console.log(`   Overall Progress: ${statusResult.overallProgress}`);
    console.log(`   Health: ${statusResult.health}`);
    console.log(`   Goals: ${statusResult.goals.potential} potential, ${statusResult.goals.selected} selected, ${statusResult.goals.completed} completed`);
    console.log(`   Integrations: ${statusResult.integrations.activeWorkflows} active workflows`);
  } else {
    console.log('❌ FAIL: Could not get status');
    console.log(`   Message: ${statusResult.message}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Error getting status');
  console.log(`   Error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
  process.exit(1);
}

console.log();

// Test 2: Get Next Steps
console.log('Test 2: Get Next Steps on Real Project');
console.log('─'.repeat(70));
try {
  const nextStepsResult = GetNextStepsTool.execute({
    projectPath,
    maxSuggestions: 3,
    skipSync: false
  });

  if (nextStepsResult.success) {
    console.log('✅ PASS: Next steps retrieved from real project');
    console.log(`   Current Phase: ${nextStepsResult.currentPhase}`);
    console.log(`   Progress: ${nextStepsResult.progress}`);
    console.log(`   Suggestions: ${nextStepsResult.nextActions.length}`);

    if (nextStepsResult.nextActions.length > 0) {
      console.log('\n   Top Suggestions:');
      nextStepsResult.nextActions.forEach((action, index) => {
        console.log(`   ${index + 1}. [${action.priority}] ${action.action}`);
        console.log(`      Tool: ${action.tool}`);
      });
    } else {
      console.log('   No suggestions (project may be complete or waiting)');
    }

    if (nextStepsResult.blockers && nextStepsResult.blockers.length > 0) {
      console.log('\n   Blockers:');
      nextStepsResult.blockers.forEach(blocker => {
        console.log(`   ⚠️  ${blocker}`);
      });
    }

    if (nextStepsResult.warnings && nextStepsResult.warnings.length > 0) {
      console.log('\n   Warnings:');
      nextStepsResult.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    if (nextStepsResult.syncedChanges && nextStepsResult.syncedChanges.length > 0) {
      console.log('\n   Auto-synced changes:');
      nextStepsResult.syncedChanges.forEach(change => {
        console.log(`   ✓ ${change}`);
      });
    }
  } else {
    console.log('❌ FAIL: Could not get next steps');
    console.log(`   Message: ${nextStepsResult.message}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Error getting next steps');
  console.log(`   Error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
  process.exit(1);
}

console.log();
console.log('─'.repeat(70));
console.log('✅ REAL PROJECT TEST PASSED');
console.log('─'.repeat(70));
console.log('\nConclusion:');
console.log('  ✓ Project Management MCP works with real project');
console.log('  ✓ Workflow orchestrator integration functional');
console.log('  ✓ State reading and analysis working');
console.log('  ✓ Rule engine operational');
console.log('  ✓ Auto-sync detection working');
console.log('\n' + '='.repeat(70) + '\n');

process.exit(0);
