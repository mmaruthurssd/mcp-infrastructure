# CRITICAL FIX APPLIED - Restart Required

**Date:** 2025-10-26
**Issue:** GoalTemplateRenderer leaving Handlebars artifacts in generated files
**Status:** ✅ FIXED IN CODE - ⏳ RESTART REQUIRED

---

## Summary

A critical bug in `GoalTemplateRenderer.processConditionals()` was causing template artifacts (`{{/if}}`, `{{#if}}`) to appear in generated potential goal files. This made the files unparseable by `promote_to_selected`, breaking the entire goal workflow.

## Root Cause

The if-else regex was using non-greedy matching that incorrectly matched across multiple conditional blocks. For example:

```
{{#if context}}         <-- Start here
**Context:** {{context}}
{{/if}}                 <-- Should end here, but regex continues...

... many lines later ...

{{#if problem}}
Problem text
{{else}}                <-- Regex matched to THIS else (wrong!)
Default text
{{/if}}
```

The regex would match from `{{#if context}}` all the way to the first `{{else}}` it found, even if that `{{else}}` belonged to a completely different block.

## Fix Applied

Updated the regex in `src/utils/goal-template-renderer.ts` line 61:

**Before:**
```typescript
const ifElseRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
```

**After:**
```typescript
// Use negative lookahead to prevent matching across blocks
const ifElseRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}((?:(?!\{\{else\}\}|\{\{\/if\}\})[\s\S])*)\{\{else\}\}((?:(?!\{\{\/if\}\})[\s\S])*)\{\{\/if\}\}/g;
```

The fix uses negative lookahead `(?!...)` to stop matching when it encounters `{{else}}` or `{{/if}}`, preventing cross-block matches.

## Verification

Tested with standalone Node.js script - **FIX CONFIRMED WORKING:**

```bash
✅ TEMPLATE RENDERING FIXED - No artifacts found!
```

## ⚠️ RESTART REQUIRED

**The MCP server process is still running the old code in memory.**

To apply the fix:

1. **Restart Claude Code** (this will restart all MCP servers)
   - OR -
2. **Manually restart the MCP server** (if you know how to do this)

After restart, the `create_potential_goal` tool will use the fixed template renderer.

## Files Modified

- `src/utils/goal-template-renderer.ts` - Fixed processConditionals regex
- `dist/utils/goal-template-renderer.js` - Compiled (via `npm run build`)

## Test After Restart

After restarting, run this to verify the fix:

```javascript
mcp__ai-planning__create_potential_goal({
  projectPath: "/path/to/test-project",
  goalName: "Test Goal",
  goalDescription: "Test description",
  context: "Test context",
  impactScore: "High",
  // ... other required fields
})
```

Then check the generated file for any `{{` or `}}` artifacts. There should be NONE.

## Impact

This fix unblocks the entire goal workflow:
- ✅ `create_potential_goal` will generate clean files
- ✅ `promote_to_selected` will be able to parse the files
- ✅ End-to-end goal workflow will function correctly

---

**Next Actions:**
1. Restart Claude Code
2. Recreate the 3 potential goals
3. Promote "Fix Duplicate Detection" to selected goals
4. Run complete end-to-end workflow test
