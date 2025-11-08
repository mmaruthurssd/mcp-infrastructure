#!/usr/bin/env node

/**
 * Test script for extract_ideas tool
 */

import { ExtractIdeasTool } from './dist/tools/extract-ideas.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('═══════════════════════════════════════════════════════');
console.log('  EXTRACT IDEAS TOOL TEST');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Extract ideas from sample brainstorming file
console.log('Test 1: Extract ideas with default confidence (0.6)\n');

const result1 = ExtractIdeasTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
});

console.log(result1.formatted);
console.log('\n');

// Test 2: Extract only high confidence ideas
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 2: Extract high confidence ideas only (0.75+)\n');

const result2 = ExtractIdeasTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  minConfidence: 0.75,
});

console.log(result2.formatted);
console.log('\n');

// Test 3: Test with non-existent file
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test 3: Error handling (non-existent file)\n');

const result3 = ExtractIdeasTool.execute({
  projectPath: path.join(__dirname, 'test-project'),
  filePath: 'non-existent-file.md',
});

console.log(ExtractIdeasTool.formatResult(result3));

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Test 1 (default): ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Found ${result1.ideasFound} ideas`);
console.log(`  - Expected: 6-9 ideas (varies by pattern matching)`);

console.log(`\nTest 2 (high conf): ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Found ${result2.ideasFound} ideas`);
console.log(`  - Expected: 4-6 high confidence ideas`);

console.log(`\nTest 3 (error): ${!result3.success ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  - Error handled: ${result3.error ? 'Yes' : 'No'}`);

console.log('\n');
