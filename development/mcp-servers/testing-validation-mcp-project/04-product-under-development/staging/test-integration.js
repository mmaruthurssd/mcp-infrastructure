/**
 * Integration test for Testing & Validation MCP
 */

import { QualityGateValidator } from './dist/utils/quality-gate-validator.js';
import { StandardsValidator } from './dist/utils/standards-validator.js';
import { SmokeTester } from './dist/utils/smoke-tester.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE_ROOT = join(__dirname, '../../../..');
const TESTING_MCP_PROJECT = join(WORKSPACE_ROOT, 'mcp-server-development/testing-validation-mcp-project');
const SPEC_DRIVEN_MCP = join(WORKSPACE_ROOT, 'local-instances/mcp-servers/spec-driven-mcp-server');

async function runTests() {
  console.log('Testing & Validation MCP - Integration Tests');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Test 1: check_quality_gates on testing-validation-mcp-project
    console.log('📋 Test 1: Quality Gates on Testing & Validation MCP');
    console.log('-'.repeat(70));
    const gateValidator = new QualityGateValidator(TESTING_MCP_PROJECT, 'all');
    const gateResult = await gateValidator.validate();

    console.log(`Status: ${gateResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall: ${gateResult.overall.percentComplete}% complete`);
    console.log(`Gates: ${gateResult.overall.passed} passed, ${gateResult.overall.failed} failed`);
    console.log(`Ready for Rollout: ${gateResult.overall.readyForRollout ? 'YES ✅' : 'NO ❌'}`);

    if (gateResult.blockers.length > 0) {
      console.log('\nBlockers:');
      gateResult.blockers.forEach(b => console.log(`  • ${b}`));
    }
    console.log('');

    // Test 2: validate_mcp_implementation on spec-driven-mcp
    console.log('📋 Test 2: Standards Validation on Spec-Driven MCP');
    console.log('-'.repeat(70));
    const standardsValidator = new StandardsValidator(SPEC_DRIVEN_MCP);
    const standardsResult = await standardsValidator.validate();

    console.log(`Status: ${standardsResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall Compliance: ${standardsResult.compliance.overall}%`);

    Object.entries(standardsResult.compliance.categories).forEach(([category, results]) => {
      console.log(`  ${category}: ${results.score}% (${results.passed} passed, ${results.failed} failed)`);
    });
    console.log('');

    // Test 3: run_smoke_tests on testing-validation-mcp
    console.log('📋 Test 3: Smoke Tests on Testing & Validation MCP');
    console.log('-'.repeat(70));
    const smokeTester = new SmokeTester(TESTING_MCP_PROJECT);
    const smokeResult = await smokeTester.run();

    console.log(`Status: ${smokeResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Tools: ${smokeResult.summary.passed}/${smokeResult.summary.total} passed`);

    smokeResult.results.forEach(tool => {
      const icon = (tool.available && tool.schemaValid && tool.basicInvocation === 'pass' && tool.responseValid) ? '✅' : '❌';
      console.log(`  ${icon} ${tool.toolName}`);
    });
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ All integration tests completed successfully!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Integration tests failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
