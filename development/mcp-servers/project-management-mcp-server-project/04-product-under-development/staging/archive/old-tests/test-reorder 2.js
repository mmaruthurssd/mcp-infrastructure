#!/usr/bin/env node

/**
 * Test script for reorder_selected_goals tool
 */

import { ReorderSelectedGoalsTool } from './dist/tools/reorder-selected-goals.js';
import { ViewGoalsDashboardTool } from './dist/tools/view-goals-dashboard.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectPath = path.join(__dirname, 'test-project');
const selectedGoalsPath = path.join(projectPath, 'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md');

// Backup original file
const originalContent = fs.readFileSync(selectedGoalsPath, 'utf-8');

console.log('═══════════════════════════════════════════════════════');
console.log('  REORDER SELECTED GOALS TOOL TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: View current order
console.log('Test 1: View current goal order\n');

const dashboard1 = ViewGoalsDashboardTool.execute({ projectPath });
console.log('Current order:');
dashboard1.selectedGoals?.forEach((goal, idx) => {
  console.log(`  ${idx + 1}. Goal ${goal.id}: ${goal.name} [Priority: ${goal.priority}]`);
});
console.log('\n');

// Test 2: Reorder goals without updating priorities
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 2: Reorder goals (03, 01, 02) without priority update\n');

const result2 = ReorderSelectedGoalsTool.execute({
  projectPath,
  goalOrder: ['03', '01', '02'],
  updatePriorities: false,
});

console.log(result2.formatted);
console.log('\n');

// Verify the new order
const dashboard2 = ViewGoalsDashboardTool.execute({ projectPath });
console.log('New order (priorities unchanged):');
dashboard2.selectedGoals?.forEach((goal, idx) => {
  console.log(`  ${idx + 1}. Goal ${goal.id}: ${goal.name} [Priority: ${goal.priority}]`);
});
console.log('\n');

// Restore original for next test
fs.writeFileSync(selectedGoalsPath, originalContent, 'utf-8');

// Test 3: Reorder with automatic priority update
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 3: Reorder goals (02, 03, 01) WITH priority update\n');

const result3 = ReorderSelectedGoalsTool.execute({
  projectPath,
  goalOrder: ['02', '03', '01'],
  updatePriorities: true,
});

console.log(result3.formatted);
console.log('\n');

// Verify priorities updated
const dashboard3 = ViewGoalsDashboardTool.execute({ projectPath });
console.log('New order (priorities auto-updated):');
dashboard3.selectedGoals?.forEach((goal, idx) => {
  console.log(`  ${idx + 1}. Goal ${goal.id}: ${goal.name} [Priority: ${goal.priority}]`);
});
console.log('\n');

// Restore original for next test
fs.writeFileSync(selectedGoalsPath, originalContent, 'utf-8');

// Test 4: Error handling - invalid goal ID
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 4: Error handling (invalid goal ID)\n');

const result4 = ReorderSelectedGoalsTool.execute({
  projectPath,
  goalOrder: ['01', '99', '02'],
});

console.log(ReorderSelectedGoalsTool.formatResult(result4));
console.log('\n');

// Test 5: Error handling - missing goal in order
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 5: Error handling (missing goal 03 from order)\n');

const result5 = ReorderSelectedGoalsTool.execute({
  projectPath,
  goalOrder: ['01', '02'],  // Missing 03
});

console.log(ReorderSelectedGoalsTool.formatResult(result5));
console.log('\n');

// Test 6: Error handling - duplicate ID
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 6: Error handling (duplicate goal ID)\n');

const result6 = ReorderSelectedGoalsTool.execute({
  projectPath,
  goalOrder: ['01', '02', '01'],  // Duplicate 01
});

console.log(ReorderSelectedGoalsTool.formatResult(result6));
console.log('\n');

// Restore original file
fs.writeFileSync(selectedGoalsPath, originalContent, 'utf-8');

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Test 1 (view order): ✅ PASS`);
console.log(`  - Found ${dashboard1.selectedGoals?.length || 0} goals`);

console.log(`\nTest 2 (reorder, no priority update): ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Reordered: ${result2.reordered} goals`);
console.log(`  - Priorities updated: ${result2.prioritiesUpdated ? 'Yes' : 'No'}`);

console.log(`\nTest 3 (reorder WITH priority update): ${result3.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Reordered: ${result3.reordered} goals`);
console.log(`  - Priorities updated: ${result3.prioritiesUpdated ? 'Yes' : 'No'}`);

console.log(`\nTest 4 (invalid ID): ${!result4.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result4.error ? 'Yes' : 'No'}`);

console.log(`\nTest 5 (missing goal): ${!result5.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result5.error ? 'Yes' : 'No'}`);

console.log(`\nTest 6 (duplicate ID): ${!result6.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result6.error ? 'Yes' : 'No'}`);

console.log('\n✅ Original file restored\n');
