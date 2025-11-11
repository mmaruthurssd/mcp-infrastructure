#!/bin/bash

# Script to fix common TypeScript errors in test files

echo "Fixing test file TypeScript errors..."

# Navigate to dev-instance
cd "$(dirname "$0")"

# Fix 1: Add null assertions for result properties in test files
# Pattern: expect(result.property) -> expect(result.success).toBe(true); if (result.success) { expect(result.property) }

echo "Step 1: Fixing test files with proper null checks..."

# We'll use a more surgical approach - let's just build and see the remaining errors
npm run build 2>&1 | tee build-errors.log

echo "Build errors saved to build-errors.log"
echo "Total errors:"
npm run build 2>&1 | grep "^src/" | wc -l
