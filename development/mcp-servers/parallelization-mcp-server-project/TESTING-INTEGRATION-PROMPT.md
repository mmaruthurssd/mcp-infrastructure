---
type: testing-prompt
tags: [parallelization, integration-testing, mcp-testing]
---

# Parallelization MCP - Integration Testing Prompt

**Purpose:** Use this prompt to begin testing the parallelization MCP integration in a new Claude Code chat session

**Date Created:** 2025-10-29

---

## Copy-Paste This Prompt Into New Chat:

---

I need your help testing the newly activated **parallelization MCP server** that was just set up with a staging environment.

## Background

The parallelization MCP (v1.0.0) has been activated with:
- ✅ Staging environment created at `mcp-server-development/parallelization-mcp-server-project/`
- ✅ Production code exists at `/local-instances/mcp-servers/parallelization-mcp/`
- ✅ Already registered in `~/.claude.json`
- ✅ Build verified in both staging and production
- ✅ Documentation complete (README, EVENT-LOG, NEXT-STEPS)

## What This MCP Provides

**6 Tools for Parallel Task Execution:**
1. `mcp__parallelization-mcp__analyze_task_parallelizability` - Analyze tasks for parallelization opportunities
2. `mcp__parallelization-mcp__create_dependency_graph` - Build dependency graphs with cycle detection
3. `mcp__parallelization-mcp__execute_parallel_workflow` - Coordinate parallel sub-agent execution
4. `mcp__parallelization-mcp__aggregate_progress` - Aggregate progress from multiple agents
5. `mcp__parallelization-mcp__detect_conflicts` - Detect conflicts from parallel execution
6. `mcp__parallelization-mcp__optimize_batch_distribution` - Optimize task distribution

## Testing Goals

### Phase 1: Verify Tool Availability (5 minutes)
Please verify that all 6 parallelization MCP tools are visible and available in your tool list.

### Phase 2: Individual Tool Testing (30 minutes)

**Test 1: analyze_task_parallelizability**
- Create a sample task description with 5-10 subtasks
- Some tasks should be independent, some dependent
- Verify it returns: parallelization score, dependency graph, suggested batches, estimated speedup

**Test 2: create_dependency_graph**
- Provide tasks with explicit dependencies (dependsOn arrays)
- Test implicit dependency detection
- Verify cycle detection works
- Confirm topological ordering is correct

**Test 3: aggregate_progress**
- Simulate 3-5 agent progress reports with different completion percentages
- Test all 3 strategies: simple-average, weighted, critical-path
- Verify bottleneck detection

**Test 4: detect_conflicts**
- Simulate agent results with overlapping file modifications
- Test file-level conflict detection
- Verify resolution options are provided

**Test 5: optimize_batch_distribution**
- Provide 10 tasks with varying estimated times and dependencies
- Test all 3 optimization goals: minimize-time, balance-load, minimize-conflicts
- Verify batch assignments make logical sense

### Phase 3: Integration Testing (2 hours)

**Integration 1: Task-Executor MCP**
- Create a real workflow with task-executor MCP (8-10 tasks)
- Use parallelization MCP to analyze parallelizability
- Document the integration pattern
- Measure if analysis is helpful

**Integration 2: Project-Management MCP** (if time permits)
- Select a goal from a project
- Analyze goal tasks for parallelization opportunities
- Document handoff pattern

## Key Files to Reference

**Documentation:**
- `mcp-server-development/parallelization-mcp-server-project/README.md` - Overview and tool documentation
- `mcp-server-development/parallelization-mcp-server-project/NEXT-STEPS.md` - Testing roadmap
- `mcp-server-development/parallelization-mcp-server-project/EVENT-LOG.md` - Activation history

**Code (for understanding implementation):**
- `mcp-server-development/parallelization-mcp-server-project/04-product-under-development/dev-instance/src/tools/` - Tool implementations
- `mcp-server-development/parallelization-mcp-server-project/04-product-under-development/dev-instance/src/types.ts` - Type definitions

**Production:**
- `/local-instances/mcp-servers/parallelization-mcp/dist/server.js` - Registered production server

## Expected Outcomes

By the end of testing, we should have:
- ✅ Verification that all 6 tools are functional
- ✅ Sample test cases for each tool documented
- ✅ Integration pattern with task-executor MCP documented
- ✅ Performance metrics (if applicable)
- ✅ Any issues found logged to `08-archive/issues/`
- ✅ Update to NEXT-STEPS.md with findings

## Testing Constraints

- Use task-executor MCP to track testing progress
- If you find issues, log them to `mcp-server-development/parallelization-mcp-server-project/08-archive/issues/`
- Document integration patterns in `03-resources-docs-assets-tools/integration-examples.md` (create if needed)
- Focus on practical use cases, not theoretical scenarios

## Questions to Answer

1. Are all 6 tools working as expected?
2. Does the dependency graph detection (explicit + implicit) work correctly?
3. Is the parallelization analysis helpful for real workflows?
4. What's the integration pattern with task-executor MCP?
5. Are there any errors, edge cases, or improvements needed?
6. What's the estimated speedup for parallel execution (if testable)?

## Post-Testing Actions

After testing is complete:
1. Update `NEXT-STEPS.md` with findings
2. Update `EVENT-LOG.md` with testing event
3. Create integration examples document
4. Update `SYSTEM-ARCHITECTURE.md` to include parallelization MCP (deferred from activation)
5. Archive testing workflow

---

Please begin with Phase 1 (verify tool availability) and proceed through the testing phases systematically. Use task-executor MCP to track your progress through the testing workflow.

---

## Alternative: Quick Smoke Test

If you want to do a quick smoke test first (10 minutes):

1. Verify all 6 tools are available
2. Call `analyze_task_parallelizability` with this sample task:
   ```
   taskDescription: "Implement user authentication system"
   subtasks: [
     {id: "1", description: "Design database schema"},
     {id: "2", description: "Implement user registration API", dependsOn: ["1"]},
     {id: "3", description: "Implement login API", dependsOn: ["1"]},
     {id: "4", description: "Create frontend login form"},
     {id: "5", description: "Create frontend registration form"},
     {id: "6", description: "Integrate frontend with APIs", dependsOn: ["2", "3", "4", "5"]}
   ]
   ```
3. Verify it returns sensible parallelization suggestions
4. Report back findings

Let me know which approach you'd like to take!
