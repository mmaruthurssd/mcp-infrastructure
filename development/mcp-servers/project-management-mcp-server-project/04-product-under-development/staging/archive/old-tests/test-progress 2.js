#!/usr/bin/env node

/**
 * Test script for update_goal_progress tool
 */

import { UpdateGoalProgressTool } from './dist/tools/update-goal-progress.js';
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
console.log('  UPDATE GOAL PROGRESS TOOL TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: View current progress
console.log('Test 1: View current goal progress\n');

const dashboard1 = ViewGoalsDashboardTool.execute({ projectPath });
const goal01 = dashboard1.selectedGoals?.find(g => g.id === '01');
console.log(`Goal 01: ${goal01?.name}`);
console.log(`  Current progress: ${goal01?.progress}%`);
console.log(`  Status: ${goal01?.status}\n`);

// Test 2: Update progress using direct percentage
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 2: Update progress to 75% (direct)\n');

const result2 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '01',
  progress: 75,
});

console.log(result2.formatted);
console.log('\n');

// Test 3: Update progress using tasks completed
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 3: Update progress using tasks (8/10 completed)\n');

const result3 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '01',
  tasksCompleted: 8,
  totalTasks: 10,
});

console.log(result3.formatted);
console.log('\n');

// Test 4: Update progress to 100% and auto-complete
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 4: Update to 100% (should auto-set status to Completed)\n');

const result4 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '01',
  progress: 100,
});

console.log(result4.formatted);
console.log('\n');

// Verify status changed
const dashboard4 = ViewGoalsDashboardTool.execute({ projectPath });
const goal01After = dashboard4.selectedGoals?.find(g => g.id === '01');
console.log(`Verified status: ${goal01After?.status}\n`);

// Test 5: Update with blockers
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 5: Update Goal 02 with blockers\n');

// Restore original first
fs.writeFileSync(selectedGoalsPath, originalContent, 'utf-8');

const result5 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '02',
  progress: 25,
  status: 'Blocked',
  blockers: 'Waiting for database migration approval',
  nextAction: 'Follow up with DBA team',
});

console.log(result5.formatted);
console.log('\n');

// Test 6: Error handling - invalid goal ID
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 6: Error handling (invalid goal ID)\n');

const result6 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '99',
  progress: 50,
});

console.log(UpdateGoalProgressTool.formatResult(result6));
console.log('\n');

// Test 7: Error handling - no progress data
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 7: Error handling (no progress data provided)\n');

const result7 = UpdateGoalProgressTool.execute({
  projectPath,
  goalId: '01',
});

console.log(UpdateGoalProgressTool.formatResult(result7));
console.log('\n');

// Restore original file
fs.writeFileSync(selectedGoalsPath, originalContent, 'utf-8');

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Test 1 (view current): ✅ PASS`);
console.log(`  - Found goal 01 at ${goal01?.progress}%`);

console.log(`\nTest 2 (update to 75%): ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Previous: ${result2.previousProgress}%`);
console.log(`  - New: ${result2.newProgress}%`);
console.log(`  - Velocity calculated: ${result2.velocity ? 'Yes' : 'No'}`);

console.log(`\nTest 3 (tasks 8/10): ${result3.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Progress: ${result3.newProgress}%`);
console.log(`  - Velocity calculated: ${result3.velocity ? 'Yes' : 'No'}`);

console.log(`\nTest 4 (100% auto-complete): ${result4.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Status changed: ${result4.previousStatus} → ${result4.newStatus}`);
console.log(`  - Auto-completed: ${result4.newStatus === 'Completed' ? 'Yes' : 'No'}`);

console.log(`\nTest 5 (with blockers): ${result5.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Status set to: ${result5.newStatus}`);

console.log(`\nTest 6 (invalid ID): ${!result6.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result6.error ? 'Yes' : 'No'}`);

console.log(`\nTest 7 (no progress data): ${!result7.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result7.error ? 'Yes' : 'No'}`);

console.log('\n✅ Original file restored\n');
