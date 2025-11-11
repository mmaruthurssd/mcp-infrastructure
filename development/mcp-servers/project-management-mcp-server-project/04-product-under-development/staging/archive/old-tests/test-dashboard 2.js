#!/usr/bin/env node

/**
 * Test script for view_goals_dashboard tool
 */

import { ViewGoalsDashboardTool } from './dist/tools/view-goals-dashboard.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('═══════════════════════════════════════════════════════');
console.log('  VIEW GOALS DASHBOARD TOOL TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: View all goals with default settings
console.log('Test 1: View all goals with statistics and alerts\n');

const result1 = ViewGoalsDashboardTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
});

console.log(result1.formatted);
console.log('\n');

// Test 2: Filter by tier
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 2: Filter by tier = "Next"\n');

const result2 = ViewGoalsDashboardTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  tier: 'Next',
});

console.log(result2.formatted);
console.log('\n');

// Test 3: Sort by impact
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 3: Sort by impact (High first)\n');

const result3 = ViewGoalsDashboardTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  sortBy: 'impact',
});

console.log(result3.formatted);
console.log('\n');

// Test 4: Filter by priority
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 4: Filter by priority = "High"\n');

const result4 = ViewGoalsDashboardTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  priority: 'High',
});

console.log(result4.formatted);
console.log('\n');

// Test 5: No stats or alerts
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 5: Disable stats and alerts\n');

const result5 = ViewGoalsDashboardTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  includeStats: false,
  includeAlerts: false,
});

console.log(result5.formatted);
console.log('\n');

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Test 1 (all goals): ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Potential: ${result1.potentialGoals?.length || 0}`);
console.log(`  - Selected: ${result1.selectedGoals?.length || 0}`);
console.log(`  - Stats included: ${result1.stats ? 'Yes' : 'No'}`);
console.log(`  - Alerts included: ${result1.alerts ? 'Yes' : 'No'}`);

console.log(`\nTest 2 (tier filter): ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Goals shown: ${(result2.selectedGoals?.length || 0) + (result2.potentialGoals?.length || 0)}`);

console.log(`\nTest 3 (sort by impact): ${result3.success ? '✅ PASS' : '❌ FAIL'}`);

console.log(`\nTest 4 (priority filter): ${result4.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Selected goals: ${result4.selectedGoals?.length || 0}`);

console.log(`\nTest 5 (no stats/alerts): ${result5.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Stats excluded: ${!result5.stats ? 'Yes' : 'No'}`);
console.log(`  - Alerts excluded: ${!result5.alerts ? 'Yes' : 'No'}`);

console.log('\n');
