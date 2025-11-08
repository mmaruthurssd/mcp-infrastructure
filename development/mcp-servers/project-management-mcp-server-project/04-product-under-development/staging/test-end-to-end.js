/**
 * End-to-End Testing Script
 *
 * Tests all major workflows:
 * 1. New project creation
 * 2. Project validation
 * 3. Goal evaluation and creation
 * 4. Migration workflow (basic)
 * 5. Integration tests
 *
 * Calculates final smoothness score for Phase 4.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StartProjectSetupTool } from './dist/tools/start-project-setup.js';
import { ValidateProjectTool } from './dist/tools/validate-project.js';
import { EvaluateGoalTool } from './dist/tools/evaluate-goal.js';
import { CreatePotentialGoalTool } from './dist/tools/create-potential-goal.js';
import { MigrateExistingProjectTool } from './dist/tools/migrate-existing-project.js';

const TEMP_TEST_DIR = './test-e2e-temp';
let testResults = [];
let smoothnessScore = 100;

console.log('='.repeat(70));
console.log('  END-TO-END TESTING - Phase 4 Final Validation');
console.log('='.repeat(70));
console.log();

// Clean up any existing test directory
if (fs.existsSync(TEMP_TEST_DIR)) {
  fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
}

// ============================================================================
// Test 1: New Project Creation
// ============================================================================

console.log('TEST 1: New Project Creation');
console.log('─'.repeat(70));

try {
  const setupResult = StartProjectSetupTool.execute({
    projectPath: TEMP_TEST_DIR,
    projectName: 'Test Project E2E',
    projectType: 'software',
    constitutionMode: 'quick',
  });

  console.log(`✅ Project created successfully`);
  console.log(`   Conversation ID: ${setupResult.conversationId}`);
  console.log(`   Folders created: ${setupResult.templateStructure.foldersCreated}`);
  console.log(`   Files created: ${setupResult.templateStructure.filesCreated}`);
  console.log(`   Duration: ${setupResult.templateStructure.duration}ms`);
  testResults.push({ test: 'New Project Creation', status: 'PASS', duration: setupResult.templateStructure.duration });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'New Project Creation', status: 'FAIL', error: error.message });
  smoothnessScore -= 20;
}

console.log();

// ============================================================================
// Test 2: Project Validation
// ============================================================================

console.log('TEST 2: Project Validation');
console.log('─'.repeat(70));

try {
  const validationResult = ValidateProjectTool.execute({
    projectPath: TEMP_TEST_DIR,
    checks: ['all'],
    autoFix: false,
  });

  console.log(`✅ Validation completed`);
  console.log(`   Success: ${validationResult.success}`);
  console.log(`   Total Issues: ${validationResult.summary.totalIssues}`);
  console.log(`   Critical Issues: ${validationResult.summary.criticalIssues}`);
  console.log(`   Warnings: ${validationResult.summary.warnings}`);

  if (!validationResult.success) {
    console.log(`   ⚠️  Warning: Validation found issues in newly created project`);
    smoothnessScore -= 5;
  }

  testResults.push({ test: 'Project Validation', status: 'PASS', issues: validationResult.summary.totalIssues });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Project Validation', status: 'FAIL', error: error.message });
  smoothnessScore -= 15;
}

console.log();

// ============================================================================
// Test 3: Goal Evaluation
// ============================================================================

console.log('TEST 3: Goal Evaluation');
console.log('─'.repeat(70));

try {
  const goalEvaluation = EvaluateGoalTool.execute({
    goalDescription: 'Add user authentication with OAuth 2.0 support',
    context: 'Building a web application that needs secure user login',
  });

  console.log(`✅ Goal evaluated`);
  console.log(`   Impact: ${goalEvaluation.scores.impact.score}`);
  console.log(`   Effort: ${goalEvaluation.scores.effort.score}`);
  console.log(`   Suggested Tier: ${goalEvaluation.tier.suggested}`);
  testResults.push({ test: 'Goal Evaluation', status: 'PASS' });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Goal Evaluation', status: 'FAIL', error: error.message });
  smoothnessScore -= 10;
}

console.log();

// ============================================================================
// Test 4: Create Potential Goal
// ============================================================================

console.log('TEST 4: Create Potential Goal');
console.log('─'.repeat(70));

try {
  const createGoalResult = CreatePotentialGoalTool.execute({
    projectPath: TEMP_TEST_DIR,
    goalName: 'oauth-authentication',
    goalDescription: 'Add user authentication with OAuth 2.0 support',
    impactScore: 'High',
    impactReasoning: 'Critical security feature affecting all users',
    peopleAffected: 1000,
    problemSeverity: 'High',
    strategicValue: 'High',
    impactConfidence: 'High',
    effortScore: 'Medium',
    effortReasoning: 'Standard OAuth implementation, well-documented',
    timeEstimate: '1-2 weeks',
    technicalComplexity: 'Medium',
    dependenciesCount: 2,
    scopeClarity: 'High',
    effortConfidence: 'High',
    suggestedTier: 'Now',
    problem: 'Need secure user authentication',
    expectedValue: 'Secure user access and data protection',
    dependencies: 'OAuth provider setup, database schema',
    alternatives: 'Basic auth, API keys (both less secure)',
    decisionCriteria: 'Industry standard, secure, scalable',
    risks: 'OAuth provider downtime, complexity',
    nextSteps: ['Setup OAuth provider', 'Design auth flow', 'Implement login'],
    suggestions: ['Use established OAuth libraries', 'Add 2FA support'],
  });

  console.log(`✅ Potential goal created`);
  console.log(`   Goal folder: ${createGoalResult.goalFolder}`);
  console.log(`   Goal file: ${createGoalResult.goalFile}`);

  // Verify file actually exists
  const goalFilePath = path.join(TEMP_TEST_DIR, createGoalResult.goalFile);
  if (!fs.existsSync(goalFilePath)) {
    throw new Error('Goal file not created on disk');
  }

  testResults.push({ test: 'Create Potential Goal', status: 'PASS' });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Create Potential Goal', status: 'FAIL', error: error.message });
  smoothnessScore -= 15;
}

console.log();

// ============================================================================
// Test 5: Validation After Goal Creation
// ============================================================================

console.log('TEST 5: Validation After Goal Creation');
console.log('─'.repeat(70));

try {
  const postGoalValidation = ValidateProjectTool.execute({
    projectPath: TEMP_TEST_DIR,
    checks: ['goals'],
  });

  console.log(`✅ Goal validation completed`);
  console.log(`   Goals valid: ${postGoalValidation.checks.goals.passed}`);
  console.log(`   Issues: ${postGoalValidation.summary.totalIssues}`);

  if (postGoalValidation.checks.goals.goalsWithMissingMetadata.length > 0) {
    console.log(`   ⚠️  Warning: Goals missing metadata`);
    smoothnessScore -= 5;
  }

  testResults.push({ test: 'Post-Goal Validation', status: 'PASS' });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Post-Goal Validation', status: 'FAIL', error: error.message });
  smoothnessScore -= 10;
}

console.log();

// ============================================================================
// Test 6: Auto-Fix Capabilities
// ============================================================================

console.log('TEST 6: Auto-Fix Capabilities');
console.log('─'.repeat(70));

try {
  // Delete a root file to test auto-fix
  const nextStepsPath = path.join(TEMP_TEST_DIR, 'NEXT-STEPS.md');
  if (fs.existsSync(nextStepsPath)) {
    fs.unlinkSync(nextStepsPath);
  }

  // Run validation with auto-fix
  const autoFixResult = ValidateProjectTool.execute({
    projectPath: TEMP_TEST_DIR,
    autoFix: true,
    skipConfirmation: true,
  });

  console.log(`✅ Auto-fix completed`);
  console.log(`   Fixes applied: ${autoFixResult.summary.fixesApplied || 0}`);

  // Verify file was recreated
  if (!fs.existsSync(nextStepsPath)) {
    throw new Error('Auto-fix did not recreate deleted file');
  }

  testResults.push({ test: 'Auto-Fix Capabilities', status: 'PASS', fixes: autoFixResult.summary.fixesApplied });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Auto-Fix Capabilities', status: 'FAIL', error: error.message });
  smoothnessScore -= 10;
}

console.log();

// ============================================================================
// Test 7: Migration Detection
// ============================================================================

console.log('TEST 7: Migration Detection');
console.log('─'.repeat(70));

try {
  // Create some mock files to detect
  const mockDir = path.join(TEMP_TEST_DIR, 'legacy-files');
  fs.mkdirSync(mockDir, { recursive: true });
  fs.writeFileSync(path.join(mockDir, 'app.js'), '// Legacy app', 'utf8');
  fs.writeFileSync(path.join(mockDir, 'config.json'), '{}', 'utf8');
  fs.writeFileSync(path.join(mockDir, 'README.txt'), 'Old readme', 'utf8');

  const migrationResult = MigrateExistingProjectTool.execute({
    projectPath: TEMP_TEST_DIR,
  });

  console.log(`✅ Migration detection completed`);
  console.log(`   Files analyzed: ${migrationResult.analysis?.totalFiles || 0}`);
  console.log(`   Files needing placement: ${migrationResult.analysis?.needsPlacement || 0}`);

  testResults.push({ test: 'Migration Detection', status: 'PASS' });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Migration Detection', status: 'FAIL', error: error.message });
  smoothnessScore -= 10;
}

console.log();

// ============================================================================
// Test 8: Performance Verification
// ============================================================================

console.log('TEST 8: Performance Verification');
console.log('─'.repeat(70));

try {
  // Test validation performance
  const perfStart = Date.now();
  ValidateProjectTool.execute({ projectPath: TEMP_TEST_DIR });
  const perfDuration = Date.now() - perfStart;

  console.log(`✅ Performance test completed`);
  console.log(`   Validation time: ${perfDuration}ms`);
  console.log(`   Target: <10000ms`);
  console.log(`   Status: ${perfDuration < 10000 ? '✅ PASSED' : '❌ FAILED'}`);

  if (perfDuration >= 10000) {
    smoothnessScore -= 5;
  }

  testResults.push({ test: 'Performance Verification', status: perfDuration < 10000 ? 'PASS' : 'FAIL', duration: perfDuration });
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
  testResults.push({ test: 'Performance Verification', status: 'FAIL', error: error.message });
  smoothnessScore -= 5;
}

console.log();

// ============================================================================
// Summary & Smoothness Score
// ============================================================================

console.log('='.repeat(70));
console.log('  TEST SUMMARY');
console.log('='.repeat(70));
console.log();

const passedTests = testResults.filter(t => t.status === 'PASS').length;
const failedTests = testResults.filter(t => t.status === 'FAIL').length;
const totalTests = testResults.length;

testResults.forEach((result, index) => {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} Test ${index + 1}: ${result.test} - ${result.status}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

console.log();
console.log('─'.repeat(70));
console.log();
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log();
console.log('='.repeat(70));
console.log(`  PHASE 4 SMOOTHNESS SCORE: ${smoothnessScore}/100`);
console.log('='.repeat(70));
console.log();

// Evaluation
if (smoothnessScore >= 90) {
  console.log('🎉 EXCELLENT! Phase 4 exceeds smoothness target (90+)');
} else if (smoothnessScore >= 75) {
  console.log('✅ GOOD! Phase 4 meets acceptable smoothness (75+)');
} else {
  console.log('⚠️  WARNING! Phase 4 needs improvement (<75)');
}

console.log();

// Clean up
fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
console.log('Test directory cleaned up.');
console.log();

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
