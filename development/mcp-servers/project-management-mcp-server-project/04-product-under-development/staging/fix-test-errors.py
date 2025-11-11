#!/usr/bin/env python3
"""
Systematically fix TypeScript test errors by adding missing required parameters and null checks.
"""

import re
import sys
from pathlib import Path

# Default parameters for each tool function
DEFAULT_PARAMS = {
    'suggestNextSteps': {
        'includeDetails': 'false',
        'maxSuggestions': '5'
    },
    'getConversationContext': {
        'contextType': "'overview'"
    },
    'generateHierarchyTree': {
        'outputFormat': "'ascii'",
        'maxDepth': '7',
        'showProgress': 'true',
        'filterStatus': "'all'"
    },
    'generateRoadmapTimeline': {
        'outputFormat': "'mermaid'",
        'groupBy': "'component'",
        'showMilestones': 'true',
        'timeRange': "'all'"
    },
    'generateProgressDashboard': {
        'outputFormat': "'ascii'",
        'includeVelocity': 'true',
        'includeHealth': 'true'
    },
    'generateDependencyGraph': {
        'outputFormat': "'mermaid'",
        'scope': "'all'",
        'showCriticalPath': 'true'
    },
    'generateDocumentation': {
        'format': "'markdown'",
        'includeCodeExamples': 'false',
        'includeMetrics': 'false',
        'detailLevel': "'standard'"
    }
}

def add_missing_params(content: str, func_name: str) -> str:
    """Add missing required parameters to function calls."""
    if func_name not in DEFAULT_PARAMS:
        return content

    defaults = DEFAULT_PARAMS[func_name]
    pattern = rf'{func_name}\(\{{\s*projectPath:.*?\}}\)'

    def replacer(match):
        call = match.group(0)
        # Check which parameters are missing
        missing = []
        for param, value in defaults.items():
            if param not in call:
                missing.append(f'{param}: {value}')

        if not missing:
            return call

        # Insert missing parameters before closing brace
        new_call = call.replace('}})', f', {", ".join(missing)} }})')
        return new_call

    return re.sub(pattern, replacer, content, flags=re.DOTALL)

def add_null_checks(content: str) -> str:
    """Add proper null checks using non-null assertions."""
    # Pattern: expect(result.property) -> expect(result.property!)
    # But only after success checks

    lines = content.split('\n')
    output = []
    in_success_block = False

    for i, line in enumerate(lines):
        # Track if we're inside a success check block
        if 'if (result.success)' in line or 'if (!result.success)' in line:
            in_success_block = True
        elif in_success_block and line.strip() == '}':
            in_success_block = False

        # Add non-null assertions to property access after success checks
        if in_success_block and 'expect(result.' in line and '!' not in line:
            # Add ! after property access
            line = re.sub(r'result\.(\w+)(?!\.|\!)', r'result.\1!', line)

        output.append(line)

    return '\n'.join(output)

def fix_test_file(file_path: Path):
    """Fix a single test file."""
    print(f"Fixing {file_path}")
    content = file_path.read_text()

    # Add missing parameters for each function
    for func_name in DEFAULT_PARAMS.keys():
        content = add_missing_params(content, func_name)

    # Add null checks
    content = add_null_checks(content)

    file_path.write_text(content)
    print(f"Fixed {file_path}")

def main():
    test_dir = Path('src/tests')
    test_files = list(test_dir.glob('*.test.ts'))

    for test_file in test_files:
        if test_file.name == 'conversation-flow-tools.test.ts':
            # Skip already fixed file
            continue
        try:
            fix_test_file(test_file)
        except Exception as e:
            print(f"Error fixing {test_file}: {e}", file=sys.stderr)

    print(f"\nFixed {len(test_files) - 1} test files")

if __name__ == '__main__':
    main()
