const fs = require('fs');
const path = require('path');

const filePath = './src/tests/conversation-flow-tools.test.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Add includeDetails: false to calls missing it
content = content.replace(
  /suggestNextSteps\(\{\s*projectPath: TEST_PROJECT_PATH,\s*\}\)/g,
  'suggestNextSteps({ projectPath: TEST_PROJECT_PATH, includeDetails: false, maxSuggestions: 5 })'
);

content = content.replace(
  /suggestNextSteps\(\{\s*projectPath: TEST_PROJECT_PATH,\s*maxSuggestions: (\d+),\s*\}\)/g,
  'suggestNextSteps({ projectPath: TEST_PROJECT_PATH, includeDetails: false, maxSuggestions: $1 })'
);

content = content.replace(
  /suggestNextSteps\(\{\s*projectPath: TEST_PROJECT_PATH,\s*includeDetails: true,\s*\}\)/g,
  'suggestNextSteps({ projectPath: TEST_PROJECT_PATH, includeDetails: true, maxSuggestions: 5 })'
);

// Fix 2: Add contextType to getConversationContext calls missing it
content = content.replace(
  /getConversationContext\(\{\s*projectPath: TEST_PROJECT_PATH,\s*\}\)/g,
  "getConversationContext({ projectPath: TEST_PROJECT_PATH, contextType: 'overview' })"
);

// Fix 3: Add non-null assertions for result properties after success check
// This is more complex, so we'll add conditional checks

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed conversation-flow-tools.test.ts');
