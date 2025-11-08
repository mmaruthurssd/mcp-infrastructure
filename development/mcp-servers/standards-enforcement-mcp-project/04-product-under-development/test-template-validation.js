#!/usr/bin/env node

import { validateTemplateExistsTool } from './dist/tools/validate-template-exists.js';

/**
 * Test script to validate template existence for task-executor-mcp
 */
async function testTemplateValidation() {
  console.log('Testing Template Validation for task-executor-mcp\n');
  console.log('='.repeat(60));

  try {
    const result = await validateTemplateExistsTool({
      mcpName: 'task-executor-mcp',
      checkMetadata: true,
      checkInstallable: true,
    });

    console.log('\n✅ Validation completed successfully!\n');
    console.log('Compliance Score:', result.summary.complianceScore);
    console.log('Status:', result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT');
    console.log('\nSummary:');
    console.log('  Total Rules:', result.summary.totalRules);
    console.log('  Passed:', result.summary.passedRules);
    console.log('  Failed:', result.summary.failedRules);
    console.log('  Critical Violations:', result.summary.criticalViolations);
    console.log('  Warnings:', result.summary.warningViolations);
    console.log('  Info:', result.summary.infoViolations);

    if (result.violations.length > 0) {
      console.log('\n⚠️  Violations Found:');
      result.violations.forEach((v, i) => {
        console.log(`\n${i + 1}. [${v.severity.toUpperCase()}] ${v.message}`);
        console.log(`   Location: ${v.location.path}`);
        if (v.suggestion) {
          console.log(`   Suggestion: ${v.suggestion}`);
        }
      });
    } else {
      console.log('\n✅ No violations - Template is fully compliant!');
    }

    console.log('\n' + '='.repeat(60));

    return result;
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    throw error;
  }
}

// Run test
testTemplateValidation()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
