---
type: reference
tags: [archive, cleanup, documentation]
---

# Dev Instance Archive

**Purpose:** Historical files from development that are no longer needed in the active workspace.

**Archived:** 2025-10-27

---

## What's Archived Here

### old-tests/
Ad-hoc test scripts from development phases - superseded by comprehensive test suites.

**Superseded by:**
- `test-end-to-end.js` (comprehensive integration testing)
- `test-performance.js` (automated performance testing)

**Files:**
- `test-dashboard.js` - Ad-hoc dashboard testing
- `test-extract-ideas.js` - Extract ideas feature testing
- `test-parse-debug.js` - Debugging script for parsing
- `test-progress.js` - Progress tracking testing
- `test-regex.js` - Regex debugging
- `test-reorder.js` - Goal reordering testing

### pre-template-docs/
Documentation from before template structure adoption (v2.1).

**Superseded by:**
- Project root README.md
- `02-goals-and-roadmap/ROADMAP.md`
- `01-planning/CONSTITUTION.md`
- `03-resources-docs-assets-tools/docs/DEV-SETUP.md`
- `FIRST-RUN-LEARNINGS.md`
- `EVENT-LOG.md`

**Files:**
- `CRITICAL-FIX-APPLIED.md` - Phase 1 fix documentation
- `ITERATION_ROADMAP.md` - Old roadmap format
- `PHASE2-DESIGN.md` through `PHASE6-KICKOFF.md` - Old phase planning
- `PROJECT-MANAGEMENT-VISION.md` - Original vision document
- `QUICK_START.md` - Old quick start guide
- `TESTING_REPORT.md` - Old test reports
- `DEV-INSTANCE-README.md` - Redundant dev-instance README

---

## Cleanup Impact

**Files archived:** 16 total
- 6 test files
- 9 documentation files
- 1 redundant README

**Token efficiency:** ~35-40% reduction in dev-instance root clutter

**Active files remaining in dev-instance root:**
- `package.json` - Project dependencies
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript config
- `test-end-to-end.js` - Active comprehensive testing
- `test-performance.js` - Active performance testing
- `src/` - Source code
- `dist/` - Compiled output
- `node_modules/` - Dependencies

---

## Why These Were Archived

1. **Test files:** Ad-hoc scripts created during feature development. Once features were complete and comprehensive test suites created, these became redundant.

2. **Documentation:** Pre-template structure docs that were consolidated into the standardized project structure (8 numbered folders). Information preserved in current documentation.

3. **README:** Dev-instance-specific README was redundant with main project README and docs in 03-resources-docs-assets-tools/.

---

## Safe to Delete?

These files are safe to delete if you need to free up space:
- All content is either superseded by better documentation
- Or represented in git history
- Or no longer relevant after template migration

**Recommendation:** Keep for 30 days, then delete if no issues arise.

---

**Last Updated:** 2025-10-27
**Archived By:** AI Planning MCP Server Development Team
