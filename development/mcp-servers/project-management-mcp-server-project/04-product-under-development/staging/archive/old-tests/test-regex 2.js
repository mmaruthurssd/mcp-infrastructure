#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, 'test-project/brainstorming/future-goals/selected-goals/SELECTED-GOALS.md');

console.log('Reading file:', file);
console.log('Exists:', fs.existsSync(file));

const content = fs.readFileSync(file, 'utf-8');
console.log('Content length:', content.length);
console.log('Lines:', content.split('\n').length);

// Test regex
const regex = /##\s+Active Goals[\s\S]+?(?=\n##\s+[^#]|$)/;
const match = content.match(regex);

if (match) {
  console.log('\nMatch found!');
  console.log('Length:', match[0].length);
  console.log('Start:', match[0].substring(0, 100));
  console.log('End:', match[0].substring(match[0].length - 100));
} else {
  console.log('\nNo match!');

  // Try to find where "## Active Goals" is
  const index = content.indexOf('## Active Goals');
  if (index >= 0) {
    console.log('Found "## Active Goals" at index:', index);
    console.log('Content after:', content.substring(index, index + 200));
  }
}
