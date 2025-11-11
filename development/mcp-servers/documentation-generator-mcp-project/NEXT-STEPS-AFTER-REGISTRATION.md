---
type: guide
tags: [next-steps, runtime-testing, post-deployment, documentation-generator]
created: 2025-10-31
status: action-required
---

# Next Steps After Documentation Generator MCP Registration

**Status:** 🟡 Action Required
**Created:** 2025-10-31
**MCP Version:** documentation-generator v1.0.0

---

## Quick Summary

You need to:
1. ✅ **Register the MCP** (run command below)
2. ✅ **Restart Claude Code** (close and reopen)
3. ✅ **Run smoke tests** (verify tools work)
4. ✅ **Execute integration tests** (follow testing plan)

**Estimated Time:** 15-20 minutes

---

## Step 1: Register Documentation Generator MCP

### Registration Command

**Run this command in your terminal:**

```bash
claude mcp add --scope user --transport stdio documentation-generator -- \
  node /Users/mmaruthurnew/local-instances/mcp-servers/documentation-generator-mcp-server/build/index.js
```

### What This Does
- Registers the MCP in `~/.claude.json` (user scope = global access)
- Uses absolute path (no variables)
- Points to compiled output (build/index.js)
- Transport: stdio (standard input/output communication)

### Verification

**Check registration succeeded:**
```bash
# List all registered MCPs
claude mcp list

# Should see: documentation-generator
```

**Alternative verification:**
```bash
# Check ~/.claude.json directly
cat ~/.claude.json | grep -A 5 "documentation-generator"
```

**Expected output:**
```json
"documentation-generator": {
  "command": "node",
  "args": [
    "/Users/mmaruthurnew/local-instances/mcp-servers/documentation-generator-mcp-server/build/index.js"
  ]
}
```

### Troubleshooting

**If registration fails:**
1. Check Node.js installed: `node --version` (need >= 18.0.0)
2. Verify build exists: `ls ~/local-instances/mcp-servers/documentation-generator-mcp-server/build/index.js`
3. Check JSON syntax: `cat ~/.claude.json | jq .`
4. See MCP-CONFIGURATION-CHECKLIST.md Section 9 for common errors

---

## Step 2: Restart Claude Code

### Why Restart?
- Claude Code only loads MCPs at startup
- New MCP won't be available until restart
- This applies to ALL MCP registrations

### How to Restart

**macOS/Linux:**
1. Close all Claude Code windows
2. Wait 5 seconds (ensure process fully exits)
3. Reopen Claude Code

**Verification:**
- Claude Code opens without errors
- No error notifications about MCP loading

---

## Step 3: Smoke Tests (Basic Functionality)

### Test 1: Verify MCP Loaded

**Ask Claude Code:**
```
What MCP servers do you have access to?
```

**Expected Response:**
- List includes "documentation-generator" (or similar name)
- 6 tools listed: generate_api_docs, generate_changelog, track_doc_coverage, generate_diagrams, update_documentation, catalog_documentation

**✅ Pass:** documentation-generator appears in list
**❌ Fail:** MCP not in list → Check registration, restart again

---

### Test 2: Tool Availability

**Ask Claude Code:**
```
List all tools available from the documentation-generator MCP
```

**Expected Response:**
All 6 tools with descriptions:
1. `generate_api_docs` - Generate API documentation from TypeScript/JSDoc
2. `generate_changelog` - Generate changelog from git commit history
3. `track_doc_coverage` - Calculate documentation coverage percentage
4. `generate_diagrams` - Generate Mermaid.js diagrams from code structure
5. `update_documentation` - Detect code changes and regenerate docs
6. `catalog_documentation` - Scan and index markdown documentation files

**✅ Pass:** All 6 tools available
**❌ Fail:** Tools missing → Check build, verify dist/index.js exists

---

### Test 3: Basic Tool Invocation (generate_api_docs)

**Ask Claude Code:**
```
Generate API documentation for:
mcp-server-development/workspace-brain-mcp-project/04-product-under-development/src/index.ts

Include private functions and use markdown format.
```

**Expected Behavior:**
1. Tool executes without errors
2. API documentation generated (markdown format)
3. Functions, classes, interfaces documented
4. JSDoc comments extracted
5. Stats returned (functionsDocumented, classesDocumented, etc.)

**Expected Output Structure:**
```json
{
  "success": true,
  "documentation": "# API Documentation\n\n## Functions\n\n### functionName\n...",
  "stats": {
    "functionsDocumented": 15,
    "classesDocumented": 2,
    "interfacesDocumented": 5,
    "typesDocumented": 3
  }
}
```

**✅ Pass:** Documentation generated successfully
**❌ Fail:** Errors occur → Check error message, verify TypeScript file exists

---

### Test 4: Changelog Generation (generate_changelog)

**Ask Claude Code:**
```
Generate a changelog for mcp-server-development/workspace-brain-mcp-project
using Keep a Changelog format, grouped by type
```

**Expected Behavior:**
1. Git repository detected
2. Commit history analyzed
3. Conventional commits categorized (feat:, fix:, chore:, etc.)
4. Changelog formatted in Keep a Changelog style
5. Stats returned (features, fixes, breaking changes)

**✅ Pass:** Changelog generated with categorized commits
**❌ Fail:** Git errors → Verify project is git repository

---

### Test 5: Documentation Coverage (track_doc_coverage)

**Ask Claude Code:**
```
Track documentation coverage for mcp-server-development/performance-monitor-mcp-project
with minimum coverage of 70% and detailed report format
```

**Expected Behavior:**
1. TypeScript files scanned
2. Exported symbols identified
3. JSDoc comments checked
4. Coverage percentage calculated
5. Gap report generated (undocumented symbols)

**✅ Pass:** Coverage report generated with percentage and gap list
**❌ Fail:** No TypeScript files found → Verify project path

---

## Step 4: Integration Tests (Cross-MCP Workflows)

### Integration Test Checklist

**Before starting, verify:**
- [ ] All 5 integration MCPs loaded (git-assistant, project-index-generator, workspace-brain, task-executor, spec-driven)
- [ ] Test projects accessible
- [ ] CROSS-MCP-INTEGRATION-TESTING-PLAN.md reviewed

### Quick Integration Test (5 minutes)

**Minimal validation of integration points:**

1. **task-executor Integration:**
   ```
   Create a task-executor workflow for documenting the configuration-manager-mcp-project:
   1. Generate API docs for src/index.ts
   2. Track documentation coverage
   3. Generate changelog from git commits
   ```
   **✅ Pass:** Workflow created with 3 tasks using documentation-generator tools

2. **workspace-brain Integration:**
   ```
   Log this documentation generation event to workspace-brain:
   - Event type: "mcp-usage"
   - Tool: "generate_api_docs"
   - Outcome: "completed"
   ```
   **✅ Pass:** Event logged successfully

### Full Integration Test Suite

**For comprehensive validation:**

Follow **CROSS-MCP-INTEGRATION-TESTING-PLAN.md**:
- Test 1-5: Individual integration points (30 minutes)
- Test 6-7: Multi-MCP workflows (20 minutes)
- Test 8-9: Error handling & performance (15 minutes)

**Total Time:** ~65 minutes for full suite

---

## Step 5: Production Usage Readiness

### Documentation Complete?

- [x] README.md with tool examples
- [x] PROJECT-BRIEF.md with purpose and features
- [x] SPECIFICATION.md with complete tool schemas
- [x] DESIGN-DECISIONS.md with architecture rationale
- [x] CROSS-MCP-INTEGRATION-TESTING-PLAN.md
- [x] NEXT-STEPS-AFTER-REGISTRATION.md (this file)
- [x] WORKSPACE_GUIDE.md updated with MCP listing

### Production Checklist

From ROLLOUT-CHECKLIST.md:

**Pre-Rollout:**
- [x] Build successful (0 TypeScript errors)
- [x] Tests passing (12/14, 80.76% coverage)
- [x] Deployed to local-instances/
- [x] Configuration complete (registration instructions provided)
- [x] Documentation complete

**Post-Rollout:**
- [ ] MCP registered in ~/.claude.json
- [ ] Claude Code restarted
- [ ] Smoke tests passed
- [ ] Integration tests passed (or scheduled)
- [ ] MCP-COMPLETION-TRACKER.md updated ✅ (already done)
- [ ] EVENT-LOG.md updated ✅ (already done)
- [ ] WORKSPACE_GUIDE.md updated ✅ (already done)

### Usage Recommendations

**When to use documentation-generator:**

1. **After implementing MCP tools** - Generate API docs
2. **Before releasing new version** - Generate changelog
3. **Quality gates** - Check doc coverage (>70% threshold)
4. **Architecture reviews** - Generate dependency diagrams
5. **Project documentation** - Catalog all markdown files

**Best Practices:**
- Generate API docs after code stabilizes (avoid frequent regeneration)
- Run doc coverage before all rollouts (quality gate)
- Use conservative mode for update_documentation (review before regenerating)
- Catalog docs after major documentation updates

---

## Troubleshooting

### Issue: MCP Not Loading

**Symptoms:**
- documentation-generator not in "What MCP servers" list
- Tools unavailable

**Diagnosis:**
```bash
# Check registration
claude mcp list | grep documentation-generator

# Check build exists
ls ~/local-instances/mcp-servers/documentation-generator-mcp-server/build/index.js

# Check for errors in config
cat ~/.claude.json | jq .
```

**Solutions:**
1. Verify registration command ran successfully
2. Restart Claude Code (close and reopen)
3. Check ~/.claude.json has documentation-generator entry
4. Verify absolute path is correct
5. Check Node.js version (>= 18.0.0)

**Reference:** MCP-CONFIGURATION-CHECKLIST.md Section 9

---

### Issue: Tool Execution Errors

**Symptoms:**
- Tools fail with error messages
- "File not found" errors
- TypeScript parsing errors

**Common Causes:**

1. **Invalid file path:**
   - Check file exists: `ls [path]`
   - Use absolute path or path relative to workspace root

2. **Not a TypeScript file:**
   - generate_api_docs requires .ts files
   - track_doc_coverage scans TypeScript projects

3. **Not a git repository:**
   - generate_changelog requires git history
   - Run: `git rev-parse --git-dir` to verify

4. **Missing dependencies:**
   - TypeScript Compiler API might fail on complex types
   - Check build logs for dependency issues

**Solutions:**
- Verify file/project paths
- Ensure TypeScript project has package.json
- Verify git repository initialized
- Check build succeeded (npm run build)

---

### Issue: Integration Not Working

**Symptoms:**
- Other MCPs not receiving data
- Manual steps required between tools

**Expected Behavior:**
- Integration is **manual** (user orchestrates tool calls)
- No automatic tool chaining yet
- workspace-brain requires manual log_event calls

**Not a Bug:**
- This is current design (stateless MCP)
- Future: Automatic telemetry, direct MCP-to-MCP calls

**Workarounds:**
- Use task-executor to orchestrate multi-step workflows
- Manually log events to workspace-brain after doc generation
- Use project-index-generator to index generated docs

---

## Success Indicators

### Deployment Successful When:

- ✅ MCP appears in Claude Code server list
- ✅ All 6 tools available and callable
- ✅ Smoke tests pass (5/5)
- ✅ At least 1 integration test passes
- ✅ No errors during tool execution
- ✅ Documentation generated matches expected format

### Ready for Production Use When:

- ✅ All smoke tests passed
- ✅ Integration tests ≥90% pass rate
- ✅ Performance within targets (<5s API docs, <10s changelogs)
- ✅ Error handling validated
- ✅ Team trained on usage patterns
- ✅ Integration patterns documented

---

## Future Enhancements (Phase 2)

### Planned Improvements:

1. **Automatic Telemetry:**
   - Auto-log doc generation events to workspace-brain
   - No manual log_event calls needed

2. **Multi-Language Support:**
   - JavaScript, Python, Go documentation
   - Language-specific doc patterns

3. **Enhanced Diagrams:**
   - Detailed dataflow analysis
   - Component interaction diagrams
   - Sequence diagrams from code

4. **Quality Improvements:**
   - AI-powered doc improvement suggestions
   - Doc quality scoring
   - Automated doc testing (code examples work)

5. **External Integrations:**
   - Push docs to external platforms
   - GitHub Pages integration
   - Doc site generation

---

## Support & Resources

### Documentation

- **README.md** - Quick start, tool examples, integration points
- **SPECIFICATION.md** - Complete tool schemas, data models
- **DESIGN-DECISIONS.md** - Architecture rationale (10 decisions)
- **CROSS-MCP-INTEGRATION-TESTING-PLAN.md** - Integration test suite
- **MCP-CONFIGURATION-CHECKLIST.md** - Configuration validation
- **ROLLOUT-CHECKLIST.md** - Deployment checklist

### Getting Help

1. **Check documentation** - README, SPECIFICATION
2. **Review test failures** - Error messages guide resolution
3. **Check known limitations** - README "Known Limitations" section
4. **Log issues** - Use workspace-brain to track for learning
5. **Reference working examples** - Other MCP projects

### Issue Logging

**If you encounter issues:**

```
Log to workspace-brain using learning-optimizer:
- Domain: "documentation-generator"
- Symptom: [error message]
- Solution: [what fixed it]
- Prevention: [how to avoid in future]
```

---

## Next Actions Summary

### Immediate (Required)

1. ✅ **Register MCP** (run command above)
2. ✅ **Restart Claude Code** (close and reopen)
3. ✅ **Run smoke tests** (Tests 1-5 above)

### Short-Term (Recommended)

4. ✅ **Quick integration test** (task-executor + workspace-brain)
5. ✅ **Generate docs for 1 MCP** (validate real-world usage)
6. ✅ **Document any issues** (log to workspace-brain)

### Long-Term (Optional)

7. ⏸️ **Full integration test suite** (follow CROSS-MCP-INTEGRATION-TESTING-PLAN.md)
8. ⏸️ **Performance benchmarks** (large project testing)
9. ⏸️ **Team training** (usage patterns, best practices)

---

**Status:** Ready for Registration
**Created:** 2025-10-31
**Last Updated:** 2025-10-31
**Version:** 1.0.0
