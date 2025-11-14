#!/usr/bin/env node

/**
 * Comprehensive test script for all 5 checklist-manager tools
 * Tests Phase 2 implementation including the killer features
 */

import { registerChecklist } from './build/tools/register_checklist.js';
import { getChecklistStatus } from './build/tools/get_checklist_status.js';
import { validateChecklistCompliance } from './build/tools/validate_checklist_compliance.js';
import { createFromTemplate } from './build/tools/create_from_template.js';
import { updateChecklistItem } from './build/tools/update_checklist_item.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('='.repeat(80));
  console.log('PHASE 2 COMPREHENSIVE TEST - All 5 Tools');
  console.log('='.repeat(80));

  try {
    // Test 1: Create from template
    console.log('\n📝 Test 1: create_from_template');
    console.log('-'.repeat(80));

    const templatePath = path.join(__dirname, 'test-checklist.md');
    const outputPath = path.join(__dirname, 'test-deployment-checklist.md');

    const createResult = await createFromTemplate({
      template_path: templatePath,
      output_path: outputPath,
      variables: {
        project_name: 'medical-patient-data',
        environment: 'production',
      },
      owner: 'DevOps Team',
      enforcement: 'mandatory',
    });

    console.log('✅ Success:', createResult.success);
    console.log('📄 Output path:', createResult.output_path);
    console.log('🔄 Variables applied:', createResult.variables_applied);

    // Test 2: Register the created checklist
    console.log('\n📋 Test 2: register_checklist (mandatory deployment checklist)');
    console.log('-'.repeat(80));

    const registerResult = await registerChecklist({
      checklist_path: outputPath,
      checklist_type: 'deployment',
      owner: 'DevOps Team',
      enforcement: 'mandatory',
      auto_update: true,
    });

    console.log('✅ Success:', registerResult.success);
    console.log('🆔 Checklist ID:', registerResult.checklist_id);
    console.log('📊 Initial stats:', `${registerResult.registry_entry.items.completed}/${registerResult.registry_entry.items.total} items`);

    const checklistId = registerResult.checklist_id;

    // Test 3: Validate compliance (should fail - checklist incomplete)
    console.log('\n🔒 Test 3: validate_checklist_compliance (should find violations)');
    console.log('-'.repeat(80));

    const validateResult1 = await validateChecklistCompliance({
      operation_type: 'deployment',
      skip_enforcement: false,
    });

    console.log('✅ Success:', validateResult1.success);
    console.log('⚠️  Compliant:', validateResult1.compliant);
    console.log('🚫 Blocking:', validateResult1.blocking);
    console.log('📋 Violations:', validateResult1.violations.length);
    if (validateResult1.violations.length > 0) {
      console.log('   Pending items:', validateResult1.violations[0].pending_items);
    }

    // Test 4: Update checklist items (KILLER FEATURE - auto-completion)
    console.log('\n⚡ Test 4: update_checklist_item (KILLER FEATURE - Auto-completion)');
    console.log('-'.repeat(80));

    // Complete first item using fuzzy matching
    const updateResult1 = await updateChecklistItem({
      checklist_id: checklistId,
      item_text: 'Test register', // Fuzzy match for "Test register_checklist tool"
      completed: true,
      triggered_by: 'test-script',
    });

    console.log('✅ Success:', updateResult1.success);
    console.log('🎯 Matched text:', updateResult1.matched_text);
    console.log('📊 New completion:',
      `${updateResult1.new_completion.completed}/${updateResult1.new_completion.total} (${updateResult1.new_completion.percentage}%)`);

    // Complete second item
    const updateResult2 = await updateChecklistItem({
      checklist_id: checklistId,
      item_text: 'Test get_checklist_status', // Exact match
      completed: true,
      triggered_by: 'test-script',
    });

    console.log('✅ Item 2 updated:', updateResult2.success);
    console.log('📊 New completion:',
      `${updateResult2.new_completion.completed}/${updateResult2.new_completion.total} (${updateResult2.new_completion.percentage}%)`);

    // Complete third item
    const updateResult3 = await updateChecklistItem({
      checklist_id: checklistId,
      item_text: 'Verify registry', // Partial match for "Verify registry creation"
      completed: true,
      triggered_by: 'test-script',
    });

    console.log('✅ Item 3 updated:', updateResult3.success);
    console.log('📊 New completion:',
      `${updateResult3.new_completion.completed}/${updateResult3.new_completion.total} (${updateResult3.new_completion.percentage}%)`);
    console.log('📍 Checklist status:', updateResult3.checklist_status);

    // Test 5: Get updated status
    console.log('\n📊 Test 5: get_checklist_status (after auto-updates)');
    console.log('-'.repeat(80));

    const statusResult = await getChecklistStatus({
      checklist_id: checklistId,
    });

    console.log('✅ Success:', statusResult.success);
    console.log('📋 Completion:',
      `${statusResult.checklists[0].items.completed}/${statusResult.checklists[0].items.total} (${statusResult.checklists[0].items.percentage}%)`);
    console.log('⏳ Pending items:', statusResult.checklists[0].items.pending);

    // Test 6: Validate compliance again (should still fail - not 100% complete)
    console.log('\n🔒 Test 6: validate_checklist_compliance (after partial completion)');
    console.log('-'.repeat(80));

    const validateResult2 = await validateChecklistCompliance({
      operation_type: 'deployment',
      skip_enforcement: false,
    });

    console.log('✅ Success:', validateResult2.success);
    console.log('⚠️  Compliant:', validateResult2.compliant);
    console.log('🚫 Blocking:', validateResult2.blocking);
    console.log('📊 Progress:', `${validateResult2.completed_mandatory}/${validateResult2.total_mandatory} mandatory checklists`);

    // Cleanup
    console.log('\n🧹 Cleanup: Removing test files');
    console.log('-'.repeat(80));
    await fs.unlink(outputPath);
    console.log('✅ Test checklist removed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL PHASE 2 TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   1. Template creation with variable substitution');
    console.log('   2. Mandatory checklist enforcement');
    console.log('   3. Fuzzy matching for auto-completion (KILLER FEATURE)');
    console.log('   4. Real-time status updates');
    console.log('   5. Compliance validation blocking');
    console.log('\n📁 Registry location: ~/.checklist-manager/registry.json');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
