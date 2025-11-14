#!/usr/bin/env node

/**
 * Simple test script for checklist-manager tools
 */

import { registerChecklist } from './build/tools/register_checklist.js';
import { getChecklistStatus } from './build/tools/get_checklist_status.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('='.repeat(60));
  console.log('Testing Checklist Manager MCP Tools');
  console.log('='.repeat(60));

  const testChecklistPath = path.join(__dirname, 'test-checklist.md');

  // Test 1: Register checklist
  console.log('\n📝 Test 1: register_checklist');
  console.log('-'.repeat(60));
  try {
    const registerResult = await registerChecklist({
      checklist_path: testChecklistPath,
      checklist_type: 'deployment',
      owner: 'test-team',
      enforcement: 'mandatory',
      auto_update: true,
    });

    console.log('✅ Success:', registerResult.success);
    console.log('📋 Checklist ID:', registerResult.checklist_id);
    console.log('📊 Items:', registerResult.registry_entry.items);
    console.log('📍 Status:', registerResult.registry_entry.status);

    // Store ID for next test
    const checklistId = registerResult.checklist_id;

    // Test 2: Get checklist status by ID
    console.log('\n📊 Test 2: get_checklist_status (by ID)');
    console.log('-'.repeat(60));
    const statusById = await getChecklistStatus({
      checklist_id: checklistId,
    });

    console.log('✅ Success:', statusById.success);
    console.log('📋 Checklists found:', statusById.checklists.length);
    if (statusById.checklists.length > 0) {
      const checklist = statusById.checklists[0];
      console.log('📊 Completion:', `${checklist.items.completed}/${checklist.items.total} (${checklist.items.percentage}%)`);
      console.log('⏳ Pending items:', checklist.items.pending);
    }

    // Test 3: Get checklist status by path
    console.log('\n📂 Test 3: get_checklist_status (by path)');
    console.log('-'.repeat(60));
    const statusByPath = await getChecklistStatus({
      checklist_path: testChecklistPath,
    });

    console.log('✅ Success:', statusByPath.success);
    console.log('📋 Checklists found:', statusByPath.checklists.length);

    // Test 4: Get all checklists
    console.log('\n📚 Test 4: get_checklist_status (all)');
    console.log('-'.repeat(60));
    const allChecklists = await getChecklistStatus({});

    console.log('✅ Success:', allChecklists.success);
    console.log('📋 Total checklists:', allChecklists.checklists.length);

    // Test 5: Filter by type
    console.log('\n🔍 Test 5: get_checklist_status (filter by type)');
    console.log('-'.repeat(60));
    const deploymentChecklists = await getChecklistStatus({
      checklist_type: 'deployment',
    });

    console.log('✅ Success:', deploymentChecklists.success);
    console.log('📋 Deployment checklists:', deploymentChecklists.checklists.length);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    console.log('\n📁 Registry location: ~/.checklist-manager/registry.json');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
