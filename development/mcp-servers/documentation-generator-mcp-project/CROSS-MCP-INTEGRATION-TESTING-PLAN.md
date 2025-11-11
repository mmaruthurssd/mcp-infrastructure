---
type: testing-plan
tags: [integration-testing, cross-mcp, documentation-generator, phase-3]
created: 2025-10-31
status: ready-for-execution
---

# Documentation Generator MCP - Cross-MCP Integration Testing Plan

**Version:** 1.0.0
**Created:** 2025-10-31
**MCP Version:** documentation-generator v1.0.0
**Purpose:** Comprehensive testing plan for validating documentation-generator MCP integration with other workspace MCPs

---

## Overview

This plan validates 5 critical integration points identified in the Documentation Generator MCP specification:

1. **git-assistant** - Git commit data for changelogs and change detection
2. **project-index-generator** - Feed generated docs into project index
3. **workspace-brain** - Log documentation generation events
4. **task-executor** - Documentation task automation
5. **spec-driven** - API docs from specifications

**Testing Approach:**
- End-to-end workflow testing (not isolated tool testing)
- Real project data (workspace MCPs as test subjects)
- Validation of data flow between MCPs
- Error handling and edge case coverage

---

## Prerequisites

### System Requirements
- [ ] Claude Code restarted after documentation-generator MCP registration
- [ ] All 5 integration MCPs loaded (git-assistant, project-index-generator, workspace-brain, task-executor, spec-driven)
- [ ] Test project available with TypeScript code and git history

### Verification
```bash
# Verify documentation-generator MCP loaded
# Ask Claude Code: "What MCP servers do you have access to?"
# Confirm: documentation-generator appears in list

# Verify integration MCPs loaded
# Confirm: git-assistant, project-index-generator, workspace-brain, task-executor, spec-driven all present
```

---

## Integration Test Suite

### Test 1: git-assistant + documentation-generator (Changelog Generation)

**Scenario:** Generate changelog from git commit history using conventional commits

**Integration Flow:**
```
git-assistant (commit data) → documentation-generator (generate_changelog) → CHANGELOG.md
```

**Test Steps:**
1. **Setup:** Select a project with git history (e.g., workspace-brain-mcp-project)
2. **Execute:** Ask Claude Code:
   ```
   Generate a changelog for mcp-server-development/workspace-brain-mcp-project
   using the Keep a Changelog format, grouped by type
   ```
3. **Verify Tool Chain:**
   - documentation-generator uses git data via simple-git library
   - Changelog includes commits from git history
   - Conventional commits categorized (feat:, fix:, chore:, etc.)
   - Output includes stats (features, fixes, breaking changes)

**Expected Output:**
```json
{
  "success": true,
  "changelog": "# Changelog\n\n## [Unreleased]\n\n### Added\n- Feature 1...",
  "stats": {
    "totalCommits": 25,
    "features": 8,
    "fixes": 12,
    "breakingChanges": 1,
    "chores": 4
  }
}
```

**Pass Criteria:**
- ✅ Changelog generated successfully
- ✅ Commits correctly categorized by conventional commit type
- ✅ Stats match git history (verify with `git log --oneline | wc -l`)
- ✅ Keep a Changelog format followed
- ✅ No errors in tool execution

**Notes:** git-assistant integration is indirect (documentation-generator uses simple-git directly, not git-assistant MCP tools)

---

### Test 2: documentation-generator + project-index-generator (Doc Cataloging)

**Scenario:** Generate documentation catalog and feed into project index for searchability

**Integration Flow:**
```
documentation-generator (catalog_documentation) → project-index-generator (update_indexes_for_paths)
```

**Test Steps:**
1. **Setup:** Select project with multiple markdown files (e.g., mcp-implementation-master-project)
2. **Execute Part 1 - Catalog:** Ask Claude Code:
   ```
   Catalog all documentation in mcp-server-development/mcp-implementation-master-project
   with metadata extraction and generate DOCS-INDEX.md
   ```
3. **Verify Catalog:**
   - DOCS-INDEX.md created with navigation tree
   - YAML frontmatter extracted from markdown files
   - Broken links detected and reported
   - Stats include totalDocs, byType, avgWordCount

4. **Execute Part 2 - Index Update:** Ask Claude Code:
   ```
   Update the project index for mcp-implementation-master-project
   to include the newly generated DOCS-INDEX.md
   ```
5. **Verify Integration:**
   - project-index-generator processes DOCS-INDEX.md
   - Index includes documentation catalog
   - Docs searchable via index

**Expected Workflow:**
1. `catalog_documentation` generates DOCS-INDEX.md
2. `update_indexes_for_paths` adds DOCS-INDEX.md to project index
3. Documentation discoverable via index queries

**Pass Criteria:**
- ✅ DOCS-INDEX.md generated with complete catalog
- ✅ YAML frontmatter extracted correctly
- ✅ Navigation tree reflects directory structure
- ✅ Project index updated to include catalog
- ✅ Documentation searchable via index
- ✅ Both tools execute without errors

**Integration Validation:**
- Verify DOCS-INDEX.md path passed to project-index-generator
- Confirm catalog entries appear in project index output
- Test search functionality includes cataloged docs

---

### Test 3: documentation-generator + workspace-brain (Event Logging)

**Scenario:** Log documentation generation events for analytics and learning

**Integration Flow:**
```
documentation-generator (generate_api_docs) → workspace-brain (log_event) → telemetry storage
```

**Test Steps:**
1. **Setup:** Clear workspace-brain cache (optional for clean test)
2. **Execute Doc Generation:** Ask Claude Code:
   ```
   Generate API documentation for
   mcp-server-development/workspace-brain-mcp-project/04-product-under-development/src/index.ts
   ```
3. **Log Event:** Ask Claude Code:
   ```
   Log this documentation generation event to workspace-brain:
   - Event type: "mcp-usage"
   - Tool: "generate_api_docs"
   - Project: "workspace-brain-mcp"
   - Duration: [check execution time]
   - Outcome: "completed"
   ```
4. **Verify Logging:**
   - Event logged to workspace-brain
   - Query events to confirm
   - Stats show documentation generation tracked

**Expected Integration Pattern:**
```javascript
// Manual logging pattern (per TELEMETRY-INTEGRATION-GUIDE.md)
1. documentation-generator executes generate_api_docs
2. User/Claude manually logs event to workspace-brain
3. Event stored in ~/.workspace-brain-data/telemetry/
4. Available for analytics queries
```

**Pass Criteria:**
- ✅ API docs generated successfully
- ✅ Event logged to workspace-brain
- ✅ Event retrievable via query_events
- ✅ Event stats include doc generation metrics
- ✅ Pattern follows TELEMETRY-INTEGRATION-GUIDE.md

**Verification Commands:**
```
Query workspace-brain for recent documentation events:
- Event type: "mcp-usage"
- Tool used: "generate_api_docs"
- Time range: last 1 hour

Get tool usage stats for documentation-generator MCP
```

**Note:** Integration is manual (user logs events) - no automatic telemetry yet

---

### Test 4: task-executor + documentation-generator (Documentation Workflows)

**Scenario:** Create task-executor workflow that includes documentation generation tasks

**Integration Flow:**
```
task-executor (create_workflow) → documentation-generator (multiple tools) → task-executor (complete_task)
```

**Test Steps:**
1. **Setup:** Select project needing documentation (e.g., new MCP project)
2. **Create Workflow:** Ask Claude Code:
   ```
   Create a task-executor workflow for documenting the performance-monitor-mcp project:
   1. Generate API docs for all source files
   2. Track documentation coverage
   3. Generate changelog from git commits
   4. Generate architecture diagram
   5. Catalog all documentation files
   ```
3. **Execute Workflow:** Complete each task sequentially:
   - Task 1: `generate_api_docs` for each .ts file
   - Task 2: `track_doc_coverage` for project
   - Task 3: `generate_changelog` for git history
   - Task 4: `generate_diagrams` (architecture type)
   - Task 5: `catalog_documentation` for final index
4. **Verify Integration:**
   - Each task uses appropriate documentation-generator tool
   - task-executor tracks progress through workflow
   - Tasks marked complete after verification
   - Documentation complete at workflow end

**Expected Workflow State:**
```json
{
  "workflow": "performance-monitor-documentation",
  "tasks": 5,
  "completed": 5,
  "percentComplete": 100,
  "documentation": {
    "apiDocs": ["index.API.md", "tools/track-performance.API.md", ...],
    "changelog": "CHANGELOG.md",
    "diagrams": ["ARCHITECTURE.md with Mermaid diagram"],
    "catalog": "DOCS-INDEX.md",
    "coverage": "85% (12/14 functions documented)"
  }
}
```

**Pass Criteria:**
- ✅ Workflow created with 5 documentation tasks
- ✅ Each task calls appropriate documentation-generator tool
- ✅ All 5 tasks complete successfully
- ✅ task-executor verification passes for each task
- ✅ Complete documentation suite generated
- ✅ Workflow archived successfully

**Integration Validation:**
- Verify task-executor state tracks doc generation progress
- Confirm documentation artifacts created for each task
- Test workflow can resume if interrupted
- Validate verification checks doc files exist

---

### Test 5: spec-driven + documentation-generator (Spec-to-Docs)

**Scenario:** Generate API documentation from specification documents

**Integration Flow:**
```
spec-driven (SPECIFICATION.md) → documentation-generator (generate_api_docs) → API documentation
```

**Test Steps:**
1. **Setup:** Select project with SPECIFICATION.md (e.g., any Phase 3 MCP project)
2. **Execute Spec-Driven Workflow:** Ask Claude Code:
   ```
   For the documentation-generator-mcp-project:
   1. Review SPECIFICATION.md for tool definitions
   2. Generate API documentation for all 6 tools from the specification
   3. Validate documentation matches specification
   ```
3. **Verify Integration:**
   - spec-driven identifies tool schemas from SPECIFICATION.md
   - documentation-generator generates API docs for each tool
   - Generated docs match specification requirements
   - Cross-reference validates accuracy

**Expected Integration Pattern:**
```
1. spec-driven reads SPECIFICATION.md (tool schemas)
2. Identifies TypeScript implementation files
3. documentation-generator.generate_api_docs for each file
4. Validation: Generated docs ↔ Specification alignment
```

**Pass Criteria:**
- ✅ Tool definitions extracted from SPECIFICATION.md
- ✅ API docs generated for all 6 tools
- ✅ Generated docs match specification schemas
- ✅ JSDoc comments align with spec requirements
- ✅ Coverage report shows all tools documented
- ✅ No discrepancies between spec and implementation docs

**Verification:**
```
Compare:
- SPECIFICATION.md tool schemas
- Generated API documentation
- TypeScript implementation signatures

Validate:
- All tools from spec have API docs
- Parameter types match spec
- Return types match spec
- Descriptions align with spec purpose
```

**Note:** Integration validates spec-to-code alignment via documentation

---

## Multi-MCP Workflow Tests

### Test 6: Complete Project Documentation Workflow (4 MCPs)

**Scenario:** End-to-end project documentation using multiple MCPs

**MCPs Involved:**
1. **task-executor** - Workflow orchestration
2. **git-assistant** - Commit history data
3. **documentation-generator** - Doc generation
4. **workspace-brain** - Event logging

**Workflow:**
```
1. task-executor.create_workflow("document-project")
2. documentation-generator.generate_api_docs (all files)
3. documentation-generator.generate_changelog (git commits via git-assistant data)
4. documentation-generator.track_doc_coverage (gap analysis)
5. documentation-generator.generate_diagrams (architecture)
6. documentation-generator.catalog_documentation (index)
7. workspace-brain.log_event (each step)
8. task-executor.archive_workflow (completion)
```

**Test Steps:**
1. Select test project: `configuration-manager-mcp-project`
2. Create task-executor workflow with all documentation tasks
3. Execute each task with workspace-brain logging
4. Verify integration between all 4 MCPs
5. Archive workflow when complete

**Pass Criteria:**
- ✅ Workflow created and tracks all 6 doc tasks
- ✅ All documentation generated successfully
- ✅ Git commit data used for changelog
- ✅ All events logged to workspace-brain
- ✅ Workflow archived with 100% completion
- ✅ Complete documentation suite available
- ✅ No errors across 4 MCP integrations

**Success Metrics:**
- API docs coverage: >70%
- Changelog: All commits categorized
- Diagrams: Architecture diagram renders in GitHub
- Catalog: All docs indexed with metadata
- Events: 6+ logged to workspace-brain
- Workflow: 100% task completion

---

### Test 7: Documentation Quality Gate (3 MCPs)

**Scenario:** Pre-deployment documentation validation workflow

**MCPs Involved:**
1. **documentation-generator** - Coverage tracking
2. **task-executor** - Workflow enforcement
3. **workspace-brain** - Quality metrics

**Workflow:**
```
Before MCP rollout:
1. documentation-generator.track_doc_coverage (minCoverage: 70%)
2. If coverage < 70%:
   - Generate gap report
   - Fail quality gate
   - Block deployment
3. If coverage >= 70%:
   - Log metrics to workspace-brain
   - Pass quality gate
   - Allow deployment
```

**Test Steps:**
1. **Test Failing Gate:**
   - Select project with <70% coverage
   - Run track_doc_coverage
   - Verify quality gate fails
   - Gap report generated

2. **Test Passing Gate:**
   - Select project with >70% coverage
   - Run track_doc_coverage
   - Verify quality gate passes
   - Metrics logged

**Pass Criteria:**
- ✅ Coverage calculated accurately
- ✅ Quality gate enforces 70% threshold
- ✅ Gap report identifies undocumented symbols
- ✅ Metrics logged to workspace-brain
- ✅ Integration prevents low-quality deployments

---

## Error Handling & Edge Cases

### Test 8: Error Recovery Across MCPs

**Scenarios to test:**

1. **Tool Failure Propagation:**
   - documentation-generator tool fails
   - Error handled gracefully in task-executor workflow
   - User notified with actionable error message

2. **Partial Data Handling:**
   - Git history incomplete (shallow clone)
   - generate_changelog handles gracefully
   - Generates changelog with available data + warning

3. **Missing Dependencies:**
   - TypeScript file references missing import
   - generate_diagrams handles broken dependencies
   - Diagram includes available nodes + notes missing deps

4. **Concurrent Access:**
   - Multiple tools writing to same project
   - File locks prevent corruption
   - Sequential execution recommended via task-executor

**Pass Criteria:**
- ✅ Errors don't crash workflows
- ✅ Partial results returned when possible
- ✅ Clear error messages guide resolution
- ✅ State remains consistent across MCPs
- ✅ Workflows recoverable after errors

---

## Performance & Scalability Tests

### Test 9: Large Project Performance

**Scenario:** Documentation generation for large codebase

**Test Project:** workspace-brain-mcp (15 tools, ~2,000 lines)

**Metrics to Track:**
- API doc generation time (per file)
- Changelog generation time (100+ commits)
- Diagram generation time (complex dependencies)
- Memory usage during processing
- Event logging overhead

**Pass Criteria:**
- ✅ API docs: <5 seconds per file
- ✅ Changelog: <10 seconds for 100 commits
- ✅ Diagrams: <15 seconds for 50+ files
- ✅ Memory: <500MB peak usage
- ✅ Event logging: <100ms overhead
- ✅ No timeouts or crashes

---

## Test Execution Checklist

### Pre-Execution
- [ ] documentation-generator MCP registered in ~/.claude.json
- [ ] Claude Code restarted and MCP loaded
- [ ] All integration MCPs available (git-assistant, project-index-generator, workspace-brain, task-executor, spec-driven)
- [ ] Test projects identified and accessible
- [ ] Backup created of test projects (optional)

### Execution Phases

**Phase 1: Individual Integration Tests (Tests 1-5)**
- [ ] Test 1: git-assistant + documentation-generator (Changelog)
- [ ] Test 2: documentation-generator + project-index-generator (Cataloging)
- [ ] Test 3: documentation-generator + workspace-brain (Event Logging)
- [ ] Test 4: task-executor + documentation-generator (Workflows)
- [ ] Test 5: spec-driven + documentation-generator (Spec-to-Docs)

**Phase 2: Multi-MCP Workflow Tests (Tests 6-7)**
- [ ] Test 6: Complete Project Documentation Workflow (4 MCPs)
- [ ] Test 7: Documentation Quality Gate (3 MCPs)

**Phase 3: Error & Performance Tests (Tests 8-9)**
- [ ] Test 8: Error Recovery Across MCPs
- [ ] Test 9: Large Project Performance

### Post-Execution
- [ ] All test results documented
- [ ] Issues logged to workspace-brain (if any)
- [ ] Integration patterns validated
- [ ] Performance benchmarks recorded
- [ ] Recommendations documented

---

## Success Criteria Summary

### Critical Requirements
- ✅ All 5 integration points validated
- ✅ End-to-end workflows execute successfully
- ✅ Error handling prevents data corruption
- ✅ Performance meets targets (<5s API docs, <10s changelogs)
- ✅ Documentation quality gates enforceable

### Integration Health Indicators
- **Pass Rate:** ≥90% of test cases pass
- **Integration Coverage:** All 5 MCPs tested
- **Workflow Completion:** ≥95% successful completions
- **Error Recovery:** 100% graceful failures (no crashes)
- **Performance:** All tools within target times

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Manual Event Logging:** workspace-brain integration requires manual log_event calls (not automatic)
2. **No Direct MCP-to-MCP Calls:** Integration via user orchestration, not direct tool chains
3. **Sequential Execution:** No parallel doc generation yet (future enhancement)
4. **TypeScript Only:** Multi-language support planned Phase 2

### Future Integration Enhancements
1. **Automatic Telemetry:** Auto-log doc generation events to workspace-brain
2. **Direct MCP Integration:** Allow documentation-generator to call git-assistant directly
3. **Parallel Generation:** Use parallelization-mcp for large codebases
4. **Quality Gate Automation:** Auto-block deployments based on doc coverage

---

## Test Result Template

For each test, document:

```markdown
### Test [Number]: [Name]
**Date:** YYYY-MM-DD
**Tester:** [Name/Claude Code]
**Status:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Execution Summary:**
- Tools called: [list]
- Integration MCPs: [list]
- Duration: [time]

**Results:**
- [Specific outcome 1]
- [Specific outcome 2]

**Pass/Fail Criteria:**
- ✅ Criterion 1: [result]
- ✅ Criterion 2: [result]
- ❌ Criterion 3: [result with issue]

**Issues Found:**
- Issue #1: [description, severity, workaround]

**Recommendations:**
- [Improvement suggestion]
```

---

## Next Steps After Testing

1. **Document Results:** Create test execution report
2. **Log Issues:** Track issues to workspace-brain for learning
3. **Update Integration Guides:** Document validated patterns
4. **Optimize Workflows:** Improve based on performance data
5. **Plan Phase 2:** Multi-language support, parallel execution

---

**Maintained By:** Medical Practice Workspace
**Status:** Ready for Execution
**Last Updated:** 2025-10-31
**Version:** 1.0.0
