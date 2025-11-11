/**
 * Performance Testing Script
 *
 * Tests validation and structure creation performance targets:
 * - Structure creation: < 5 seconds
 * - Validation: < 10 seconds
 * - Migration detection: < 30 seconds
 */

import { TemplateStructureCreator } from './dist/utils/template-structure-creator.js';
import { ValidateProjectTool } from './dist/tools/validate-project.js';
import { MigrateExistingProjectTool } from './dist/tools/migrate-existing-project.js';
import * as fs from 'fs';
import * as path from 'path';

const TEMP_TEST_DIR = './test-performance-temp';

console.log('='.repeat(70));
console.log('  PERFORMANCE TESTING');
console.log('='.repeat(70));
console.log();

// Clean up any existing test directory
if (fs.existsSync(TEMP_TEST_DIR)) {
  fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
}

// ============================================================================
// Test 1: Structure Creation Performance
// ============================================================================

console.log('Test 1: Structure Creation Performance');
console.log('Target: < 5 seconds (5000ms)');
console.log();

const structureStart = Date.now();
const structureResult = TemplateStructureCreator.create(TEMP_TEST_DIR, {
  projectName: 'Performance Test Project',
  projectType: 'software',
  includeRootFiles: true,
  includePlaceholders: true,
});
const structureDuration = Date.now() - structureStart;

console.log(`✅ Structure created in ${structureDuration}ms`);
console.log(`   Folders: ${structureResult.foldersCreated.length}`);
console.log(`   Files: ${structureResult.filesCreated.length}`);
console.log(`   Status: ${structureDuration < 5000 ? '✅ PASSED' : '❌ FAILED'} (${(structureDuration / 1000).toFixed(2)}s / 5.00s)`);
console.log();

// ============================================================================
// Test 2: Validation Performance
// ============================================================================

console.log('Test 2: Validation Performance');
console.log('Target: < 10 seconds (10000ms)');
console.log();

const validationStart = Date.now();
const validationResult = ValidateProjectTool.execute({
  projectPath: TEMP_TEST_DIR,
  checks: ['all'],
  autoFix: false,
});
const validationDuration = Date.now() - validationStart;

console.log(`✅ Validation completed in ${validationDuration}ms`);
console.log(`   Checks: ${Object.keys(validationResult.checks).length}`);
console.log(`   Issues: ${validationResult.summary.totalIssues}`);
console.log(`   Status: ${validationDuration < 10000 ? '✅ PASSED' : '❌ FAILED'} (${(validationDuration / 1000).toFixed(2)}s / 10.00s)`);
console.log();

// ============================================================================
// Test 3: Migration Detection Performance
// ============================================================================

console.log('Test 3: Migration Detection Performance');
console.log('Target: < 30 seconds (30000ms)');
console.log();

// Create some mock files to detect
const mockFilesDir = path.join(TEMP_TEST_DIR, 'mock-files');
fs.mkdirSync(mockFilesDir, { recursive: true });

// Create 50 files for migration detection
for (let i = 0; i < 50; i++) {
  const fileName = `file-${i}.js`;
  const content = `// Mock file ${i}\nconsole.log('test ${i}');`;
  fs.writeFileSync(path.join(mockFilesDir, fileName), content, 'utf8');
}

const migrationStart = Date.now();
const migrationResult = MigrateExistingProjectTool.execute({
  projectPath: TEMP_TEST_DIR,
});
const migrationDuration = Date.now() - migrationStart;

console.log(`✅ Migration detection completed in ${migrationDuration}ms`);
console.log(`   Files analyzed: ${migrationResult.analysis?.totalFiles || 0}`);
console.log(`   Status: ${migrationDuration < 30000 ? '✅ PASSED' : '❌ FAILED'} (${(migrationDuration / 1000).toFixed(2)}s / 30.00s)`);
console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(70));
console.log('  PERFORMANCE SUMMARY');
console.log('='.repeat(70));
console.log();

const allPassed =
  structureDuration < 5000 &&
  validationDuration < 10000 &&
  migrationDuration < 30000;

console.log(`Structure Creation:   ${(structureDuration / 1000).toFixed(2)}s / 5.00s   ${structureDuration < 5000 ? '✅' : '❌'}`);
console.log(`Validation:           ${(validationDuration / 1000).toFixed(2)}s / 10.00s  ${validationDuration < 10000 ? '✅' : '❌'}`);
console.log(`Migration Detection:  ${(migrationDuration / 1000).toFixed(2)}s / 30.00s  ${migrationDuration < 30000 ? '✅' : '❌'}`);
console.log();
console.log(`Overall: ${allPassed ? '✅ ALL TARGETS MET' : '❌ SOME TARGETS MISSED'}`);
console.log();

// Clean up
fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
console.log('Test directory cleaned up.');
console.log();
