#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const selectedGoalsPath = path.join(__dirname, 'test-project/brainstorming/future-goals/selected-goals/SELECTED-GOALS.md');

const content = fs.readFileSync(selectedGoalsPath, 'utf-8');

console.log('File length:', content.length);
console.log('\nSearching for Active Goals section...\n');

const activeSection = content.match(/##\s+Active Goals[\s\S]+?(?=\n##|$)/);

if (activeSection) {
  console.log('✅ Found Active Goals section');
  console.log('Section length:', activeSection[0].length);
  console.log('\nFirst 500 chars:');
  console.log(activeSection[0].substring(0, 500));

  console.log('\n\nTrying regex to find goals...\n');

  const goalRegex = /###\s+(?:✅\s+)?(?:❌\s+)?Goal\s+(\d+):[^\n]+[\s\S]+?(?=\n---\n|$)/g;

  let match;
  let count = 0;

  while ((match = goalRegex.exec(activeSection[0])) !== null) {
    count++;
    console.log(`Goal ${count}: ID = ${match[1]}`);
    console.log(`  Match length: ${match[0].length}`);
    console.log(`  First 100 chars: ${match[0].substring(0, 100)}...`);
    console.log('');
  }

  if (count === 0) {
    console.log('❌ No goals matched with regex');
    console.log('\nTrying simpler regex...\n');

    const simpleRegex = /###\s+Goal\s+(\d+):/g;
    let simpleMatch;
    let simpleCount = 0;

    while ((simpleMatch = simpleRegex.exec(activeSection[0])) !== null) {
      simpleCount++;
      console.log(`Found: Goal ${simpleMatch[1]}`);
    }

    console.log(`\nSimple regex found ${simpleCount} goals`);
  } else {
    console.log(`✅ Found ${count} goals with full regex`);
  }
} else {
  console.log('❌ Active Goals section not found');
}
