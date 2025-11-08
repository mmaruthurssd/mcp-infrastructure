#!/bin/bash

# Comprehensive test file fixer
# Adds required parameters and null checks to all test files

echo "🔧 Fixing all test files..."

cd "$(dirname "$0")"

# List of test files to fix (excluding already-fixed conversation-flow-tools.test.ts)
TEST_FILES=(
  "src/tests/visualization-tools.test.ts"
  "src/tests/documentation-tools.test.ts"
  "src/tests/migration-tools.test.ts"
  "src/tests/file-organization-tools.test.ts"
  "src/tests/major-goal-workflow.test.ts"
  "src/tests/integration-tests.test.ts"
  "src/tests/backward-compatibility.test.ts"
  "src/tests/version-detection-tools.test.ts"
)

# Create backups
echo "📦 Creating backups..."
for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$file.bak"
    echo "  ✓ Backed up $file"
  fi
done

# Apply fixes using Node.js script
cat > fix-tests.mjs << 'EOF'
import fs from 'fs';

const fixes = {
  // Add missing parameters to function calls
  patterns: [
    // generateHierarchyTree calls
    {
      match: /generateHierarchyTree\(\{([^}]*projectPath:[^}]*)\}\)/g,
      check: (match) => {
        const hasFormat = match.includes('outputFormat:');
        const hasDepth = match.includes('maxDepth:');
        const hasProgress = match.includes('showProgress:');
        const hasFilter = match.includes('filterStatus:');
        return { hasFormat, hasDepth, hasProgress, hasFilter };
      },
      fix: (match, checks) => {
        let additions = [];
        if (!checks.hasFormat) additions.push("outputFormat: 'ascii'");
        if (!checks.hasDepth) additions.push('maxDepth: 7');
        if (!checks.hasProgress) additions.push('showProgress: true');
        if (!checks.hasFilter) additions.push("filterStatus: 'all'");

        if (additions.length === 0) return match;
        return match.replace('}})', `, ${additions.join(', ')} })`);
      }
    },
    // generateRoadmapTimeline calls
    {
      match: /generateRoadmapTimeline\(\{([^}]*projectPath:[^}]*)\}\)/g,
      check: (match) => {
        const hasFormat = match.includes('outputFormat:');
        const hasGroup = match.includes('groupBy:');
        const hasMilestones = match.includes('showMilestones:');
        const hasRange = match.includes('timeRange:');
        return { hasFormat, hasGroup, hasMilestones, hasRange };
      },
      fix: (match, checks) => {
        let additions = [];
        if (!checks.hasFormat) additions.push("outputFormat: 'mermaid'");
        if (!checks.hasGroup) additions.push("groupBy: 'component'");
        if (!checks.hasMilestones) additions.push('showMilestones: true');
        if (!checks.hasRange) additions.push("timeRange: 'all'");

        if (additions.length === 0) return match;
        return match.replace('}})', `, ${additions.join(', ')} })`);
      }
    },
    // generateProgressDashboard calls
    {
      match: /generateProgressDashboard\(\{([^}]*projectPath:[^}]*)\}\)/g,
      check: (match) => {
        const hasFormat = match.includes('outputFormat:');
        const hasVelocity = match.includes('includeVelocity:');
        const hasHealth = match.includes('includeHealth:');
        return { hasFormat, hasVelocity, hasHealth };
      },
      fix: (match, checks) => {
        let additions = [];
        if (!checks.hasFormat) additions.push("outputFormat: 'ascii'");
        if (!checks.hasVelocity) additions.push('includeVelocity: true');
        if (!checks.hasHealth) additions.push('includeHealth: true');

        if (additions.length === 0) return match;
        return match.replace('}})', `, ${additions.join(', ')} })`);
      }
    },
    // generateDependencyGraph calls
    {
      match: /generateDependencyGraph\(\{([^}]*projectPath:[^}]*)\}\)/g,
      check: (match) => {
        const hasFormat = match.includes('outputFormat:');
        const hasScope = match.includes('scope:');
        const hasCritical = match.includes('showCriticalPath:');
        return { hasFormat, hasScope, hasCritical };
      },
      fix: (match, checks) => {
        let additions = [];
        if (!checks.hasFormat) additions.push("outputFormat: 'mermaid'");
        if (!checks.hasScope) additions.push("scope: 'all'");
        if (!checks.hasCritical) additions.push('showCriticalPath: true');

        if (additions.length === 0) return match;
        return match.replace('}})', `, ${additions.join(', ')} })`);
      }
    },
    // generateDocumentation calls
    {
      match: /generateDocumentation\(\{([^}]*projectPath:[^}]*)\}\)/g,
      check: (match) => {
        const hasFormat = match.includes('format:');
        const hasExamples = match.includes('includeCodeExamples:');
        const hasMetrics = match.includes('includeMetrics:');
        const hasDetail = match.includes('detailLevel:');
        return { hasFormat, hasExamples, hasMetrics, hasDetail };
      },
      fix: (match, checks) => {
        let additions = [];
        if (!checks.hasFormat) additions.push("format: 'markdown'");
        if (!checks.hasExamples) additions.push('includeCodeExamples: false');
        if (!checks.hasMetrics) additions.push('includeMetrics: false');
        if (!checks.hasDetail) additions.push("detailLevel: 'standard'");

        if (additions.length === 0) return match;
        return match.replace('}})', `, ${additions.join(', ')} })`);
      }
    }
  ]
};

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Apply pattern fixes
  for (const pattern of fixes.patterns) {
    const matches = [...content.matchAll(pattern.match)];

    for (const match of matches) {
      const checks = pattern.check(match[0]);
      const fixed = pattern.fix(match[0], checks);
      if (fixed !== match[0]) {
        content = content.replace(match[0], fixed);
      }
    }
  }

  // Add non-null assertions after success checks
  const lines = content.split('\n');
  const output = [];
  let inSuccessBlock = false;
  let blockDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track success block
    if (line.includes('if (result.success)') || line.includes('if (!result.success)')) {
      inSuccessBlock = true;
      blockDepth = 0;
    }

    if (inSuccessBlock) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      blockDepth += openBraces - closeBraces;

      if (blockDepth <= 0 && closeBraces > 0) {
        inSuccessBlock = false;
      }
    }

    // Add ! to property access in success blocks
    let processedLine = line;
    if (inSuccessBlock && line.includes('result.')) {
      // Add ! after result.property but not if already present
      processedLine = line.replace(/result\.(\w+)(?!\!)/g, (match, prop) => {
        // Don't add ! to success property itself or if already has !
        if (prop === 'success' || match.includes('!')) return match;
        return `result.${prop}!`;
      });
    }

    output.push(processedLine);
  }

  content = output.join('\n');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✓ Fixed ${filePath}`);
}

// Fix each test file
const testFiles = [
  'src/tests/visualization-tools.test.ts',
  'src/tests/documentation-tools.test.ts',
  'src/tests/migration-tools.test.ts',
  'src/tests/file-organization-tools.test.ts',
  'src/tests/major-goal-workflow.test.ts',
  'src/tests/integration-tests.test.ts',
  'src/tests/backward-compatibility.test.ts',
  'src/tests/version-detection-tools.test.ts',
];

for (const file of testFiles) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
}

console.log('\n✅ All test files processed');
EOF

# Run the Node script
node fix-tests.mjs

# Cleanup
rm fix-tests.mjs

echo ""
echo "✅ Test file fixes complete!"
echo ""
echo "📊 Checking remaining errors..."
npm run build 2>&1 | grep "^src/" | wc -l | xargs echo "Remaining errors:"
