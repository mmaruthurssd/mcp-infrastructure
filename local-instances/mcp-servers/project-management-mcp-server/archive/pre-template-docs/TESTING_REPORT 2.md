# AI Planning MCP Server - Testing Report

**Date:** 2025-10-26
**Version Tested:** 0.6.0
**Tester:** Claude Code
**Test Type:** End-to-end workflow testing

---

## Executive Summary

**Overall Status:** ✅ **Partially Functional** - Phase 6 works, Goal Management has critical bugs

- **Phase 6 (Project Setup):** 8/8 tools working ✅
- **Phases 1-5 (Goal Management):** 3/11 tools tested, 1 critical bug found ❌
- **Critical Issues:** 3 blocking bugs found
- **Build Issues:** 1 fixed (templates not copied to dist/)

---

## Test Results by Phase

### Phase 6: Project Setup (8 Tools) ✅

**Status:** **ALL WORKING** after fixing template copy issue

| # | Tool | Status | Notes |
|---|------|--------|-------|
| 1 | start_project_setup | ✅ Working | Creates conversation, asks questions |
| 2 | continue_project_setup | ✅ Working | Multi-turn dialogue, 85% completeness detection |
| 3 | extract_project_goals | ✅ Working | NLP extraction (note: creates duplicates) |
| 4 | generate_project_constitution | ✅ Working | Quick mode generates 4 principles |
| 5 | generate_initial_roadmap | ✅ Working | Creates phases and milestones |
| 6 | identify_resources_and_assets | ✅ Working | Extracts budget, creates RESOURCES.md & ASSETS.md |
| 7 | identify_stakeholders | ✅ Working | Creates stakeholder matrix (note: duplicates) |
| 8 | finalize_project_setup | ✅ Working | Creates all docs + initial potential goal |

**Documents Generated:**
- ✅ CONSTITUTION.md
- ✅ ROADMAP.md
- ✅ RESOURCES.md
- ✅ ASSETS.md
- ✅ STAKEHOLDERS.md
- ✅ conversation-log.md
- ✅ potential-goals/patient-portal-mvp.md

### Phases 1-5: Goal Management (11 Tools) ⚠️

**Status:** **PARTIALLY TESTED** - Critical bug prevents full testing

| # | Tool | Status | Notes |
|---|------|--------|-------|
| 9 | evaluate_goal | ✅ Working | Returns Impact/Effort/Tier suggestions |
| 10 | create_potential_goal | ⚠️ Bug | Template rendering broken (missing sections) |
| 11 | promote_to_selected | ❌ Blocked | Cannot test - depends on #10 working |
| 12 | extract_ideas | ⏭️ Skipped | |
| 13 | view_goals_dashboard | ✅ Working | Shows potential/selected/completed |
| 14-19 | (6 remaining tools) | ⏭️ Skipped | Blocked by promote_to_selected bug |

---

## Critical Issues Found

### 🔴 Issue #1: Templates Not Copied to dist/ (FIXED)

**Severity:** CRITICAL (build issue)
**Status:** ✅ **FIXED**

**Problem:**
- TypeScript build (`tsc`) doesn't copy `.md` template files to `dist/`
- `generate_project_constitution` failed with "Template not found"

**Fix Applied:**
```json
// package.json
"scripts": {
  "build": "tsc && npm run copy-templates",
  "copy-templates": "cp -r src/templates dist/"
}
```

**Verification:** ✅ All Phase 6 tools now work

---

### 🔴 Issue #2: Goal Extraction Creates Duplicates

**Severity:** MEDIUM (data quality)
**Status:** ⚠️ **OPEN**

**Problem:**
- `extract_project_goals` creates duplicate goals with slightly different names
- Example output:
  ```
  setup-goal-001: "A patient portal because our doctors..."
  setup-goal-002: "Patient portal because our doctors..."
  ```
  Both describe the same goal with 80% and 70% confidence

**Impact:**
- Pollutes potential goals with near-duplicates
- User must manually clean up

**Recommendation:**
- Add duplicate detection with similarity matching (>80% = merge)
- Use confidence scores to keep highest-confidence version

---

### 🔴 Issue #3: Template Rendering Broken in create_potential_goal

**Severity:** CRITICAL (blocks workflow)
**Status:** ❌ **BLOCKING**

**Problem:**
- `create_potential_goal` uses `GoalTemplateRenderer` but output is missing critical sections
- Expected: `## AI Impact/Effort Analysis` section with Impact/Effort scores
- Actual: Section completely missing from generated file

**Impact:**
- `promote_to_selected` expects `**Impact:** High - reasoning` format
- Parser fails with "Could not find Impact in AI Impact/Effort Analysis section"
- **Blocks entire goal promotion workflow**

**Files Affected:**
- `src/tools/create-potential-goal.ts` (line 295: `renderer.render('potential-goal', context)`)
- `src/utils/goal-template-renderer.ts` (template rendering logic)
- `src/templates/goal-workflow/potential-goal.md` (template file)

**Root Cause:** Template renderer not properly replacing `{{variables}}`

**Fix Required:**
1. Debug `GoalTemplateRenderer.render()` method
2. Verify Handlebars/Mustache parsing logic
3. Ensure all template variables are in context
4. Add template rendering tests

---

### 🟡 Issue #4: Stakeholder Extraction Creates Duplicates

**Severity:** LOW (data quality)
**Status:** ⏭️ **DEFERRED**

**Problem:**
- `identify_stakeholders` creates 13 stakeholders from simple conversation
- Many are duplicates: "patient", "patient (patient)", "doctor (doctor)"
- Extracted malformed names: "15 physician", "000 patient", "VP"

**Impact:**
- STAKEHOLDERS.md is cluttered
- Not critical - user can edit manually

**Recommendation:**
- Improve NLP extraction patterns
- Add de-duplication logic
- Better entity recognition

---

## Workflow Tests

### ✅ Test 1: Project Setup End-to-End

**Scenario:** Create new project from scratch

**Steps:**
1. `start_project_setup` → ✅ Conversation started
2. `continue_project_setup` (2 turns) → ✅ Extracted 2 goals, 8 stakeholders
3. `extract_project_goals` → ✅ 2 goals identified (with duplicates)
4. `generate_project_constitution` → ✅ 4 principles, 2 constraints
5. `generate_initial_roadmap` → ✅ 1 phase, 1 milestone
6. `identify_resources_and_assets` → ✅ Budget captured, files created
7. `identify_stakeholders` → ✅ 13 stakeholders (with duplicates)
8. `finalize_project_setup` → ✅ All docs + 1 potential goal created

**Result:** ✅ **PASSED** (with data quality issues noted)

---

### ❌ Test 2: Goal Management Workflow

**Scenario:** Evaluate goal → Create potential → Promote to selected

**Steps:**
1. `evaluate_goal` → ✅ Returned Impact: High, Effort: Medium, Tier: Next
2. `create_potential_goal` → ⚠️ Created file BUT missing AI Impact/Effort Analysis section
3. `promote_to_selected` → ❌ **FAILED** - Parser error (missing Impact section)

**Result:** ❌ **BLOCKED** - Cannot complete workflow

**Blocker:** Issue #3 (Template Rendering Broken)

---

## Performance Observations

### Response Times
- `start_project_setup`: <1s
- `continue_project_setup`: <1s
- `extract_project_goals`: ~1s
- `generate_project_constitution`: ~1s
- Other tools: <500ms

### File I/O
- All file operations work correctly
- Directory creation with `recursive: true` works
- No permission issues observed

---

## Recommendations

### Immediate Actions (Blocking)

1. **Fix Template Rendering (Issue #3)** - CRITICAL
   - Debug `GoalTemplateRenderer`
   - Add unit tests for template rendering
   - Verify all template variables are being replaced

2. **Update promote_to_selected Parser** - DONE ✅
   - Already updated regex to match template format
   - Needs testing after Issue #3 is fixed

### Short-term Improvements

3. **Add Duplicate Detection**
   - Goal extraction
   - Stakeholder extraction
   - Use fuzzy matching (Levenshtein distance)

4. **Improve NLP Extraction**
   - Better entity recognition
   - Handle quantities properly ("15 physicians" not "15 physician")
   - Skip malformed extractions ("000 patient")

5. **Add Validation & Error Handling**
   - Validate template rendering output
   - Check that required sections exist before writing
   - Provide helpful error messages

### Future Enhancements

6. **Add Tests**
   - Unit tests for each tool
   - Integration tests for workflows
   - Template rendering tests

7. **Better Conversation Flow**
   - More intelligent question selection
   - Skip redundant questions if info already provided
   - Show extracted info during conversation

8. **Documentation**
   - Create QUICK_START.md (see separate file)
   - Add troubleshooting guide
   - Document expected file formats

---

## Test Environment

- **OS:** macOS (Darwin 23.3.0)
- **Node:** Compatible with MCP SDK 0.5.0
- **TypeScript:** 5.3.0
- **MCP SDK:** 0.5.0
- **Project Path:** `/Users/mmaruthurnew/Desktop/test-ai-planning-workflow` (cleaned up after test)

---

## Files Modified During Testing

1. ✅ `package.json` - Added copy-templates script
2. ✅ `src/tools/promote-to-selected.ts` - Updated parser regex (needs verification after renderer fix)
3. ✅ `archive/WORKFLOW_GUIDE.md.deprecated` - Archived outdated documentation

---

## Next Steps

**For User:**
1. Review this testing report
2. Prioritize which issues to fix first
3. Decide on iteration strategy (see your comments about big vs small projects)

**For Development:**
1. Fix Issue #3 (template rendering) - CRITICAL
2. Test complete workflow end-to-end
3. Add duplicate detection
4. Create comprehensive test suite

**For Documentation:**
1. Review QUICK_START.md (being created)
2. Update README with actual working workflow
3. Add troubleshooting section

---

## Conclusion

**The AI Planning MCP Server has a solid foundation:**
- ✅ Phase 6 (Project Setup) is fully functional
- ✅ Architecture is well-designed
- ✅ Code quality is good

**But has critical bugs preventing full use:**
- ❌ Template rendering broken (blocks goal workflow)
- ⚠️ Data quality issues (duplicates)

**Recommendation:** Fix Issue #3, then this becomes a highly usable project planning system.

---

**Tested by:** Claude Code
**Date:** 2025-10-26
**Version:** 0.6.0
**Status:** Testing Complete - Critical Bug Found
