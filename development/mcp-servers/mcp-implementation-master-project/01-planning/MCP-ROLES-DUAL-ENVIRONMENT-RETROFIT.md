---
type: plan
tags: [mcp-coordination, roles-responsibilities, dual-environment, first-coordinated-project]
---

# MCP Roles: Dual-Environment Retrofit Project

**Purpose:** Define each MCP's role in the dual-environment retrofit project
**Context:** First coordinated project using all active MCPs together
**Created:** 2025-10-29

---

## Project Overview

**Goal:** Establish proper staging → production separation for all 13+ MCPs to enable the production feedback loop

**Phases:**
- Phase 1: Enforcement (4 tasks, 1.5 hours)
- Phase 2: Retrofit Critical MCPs (6 tasks, 2 hours)
- Phase 3: Retrofit Remaining MCPs (14 tasks, 2.5 hours)

**Total:** 24 tasks, 7.65 hours

---

## MCP Roles & Responsibilities

### 1. project-management-mcp-server
**Role:** PROJECT COORDINATOR & ORCHESTRATOR

**Responsibilities:**
- ✅ Initialize project orchestration (state tracking)
- Monitor overall project health and progress
- Track which MCPs are being retrofitted
- Coordinate handoffs between MCPs
- Provide next-step suggestions
- Track completion and generate final report

**Tools Used:**
- `initialize_project_orchestration` - Track project state
- `get_next_steps` - Suggest prioritized actions
- `get_project_status` - Monitor overall health
- `validate_project_readiness` - Final validation before completion
- `wrap_up_project` - Generate completion report

**When to Use:**
- At project start (initialization)
- When asking "What's next?"
- For high-level progress overview
- At project completion

---

### 2. task-executor-mcp-server
**Role:** TASK WORKFLOW MANAGER

**Responsibilities:**
- ✅ Create and manage the 24-task workflow
- Track completion status of each task
- Verify tasks are actually completed (not just claimed)
- Maintain temp/archive lifecycle for workflow
- Provide detailed task progress reports
- Auto-detect documentation needs

**Tools Used:**
- `create_workflow` - Initialize 24-task workflow ✅
- `complete_task` - Mark tasks complete with verification
- `get_workflow_status` - Check detailed task progress
- `archive_workflow` - Move to archive when done

**When to Use:**
- For every task completion (with verification)
- When checking task-level progress
- When verifying build success for each MCP
- At workflow completion for archival

**Current Workflow:**
- Name: `dual-environment-retrofit`
- Location: `temp/workflows/dual-environment-retrofit/`
- Status: 0/24 tasks complete

---

### 3. spec-driven-mcp-server
**Role:** NOT DIRECTLY USED (Future Enhancement)

**Why Not Used:**
- This is a refactoring/compliance project, not new feature development
- Specifications already exist in DUAL-ENVIRONMENT-RETROFIT-PLAN.md
- No new MCP being built (retrofitting existing MCPs)

**Could Be Used For:**
- If we need detailed specifications for enforcement mechanisms
- If we build the batch-retrofit automation script as a larger tool
- For documenting the architectural pattern formally

**Future Integration:**
- After retrofit, spec-driven will benefit from proper staging environment
- Can use staging → production workflow for its own updates

---

### 4. workflow-orchestrator-mcp-server
**Role:** SHARED LIBRARY (No Direct Tools)

**Responsibilities:**
- Provides StateManager for project-management
- Provides RuleEngine for intelligent suggestions
- Provides StateDetector for file system sync
- Enables coordination between project-management, spec-driven, task-executor

**Integration:**
- Not called directly (it's a library, not a standalone MCP)
- Powers project-management's orchestration features
- Ensures consistent state management across MCPs

**Impact on This Project:**
- Enables project-management to track retrofit progress
- Provides state persistence across conversation sessions
- Allows intelligent next-step suggestions

---

### 5. parallelization-mcp (NOT YET BUILT)
**Role:** FUTURE FORCE MULTIPLIER

**Why Not Used:**
- Not built yet (scheduled for Week 7 in master plan)
- Current project: 24 sequential tasks (dependencies exist)
- Many tasks must complete before others (Phase 1 → Phase 2 → Phase 3)

**Could Parallelize:**
- Phase 3 batch retrofits (tasks 12-18) - 7 MCPs in parallel
- Build verification tasks (if testing multiple MCPs simultaneously)
- Documentation updates (tasks 21-22 could run in parallel)

**Future Use:**
- After this retrofit, parallelization-mcp will be built
- Will use dual-environment pattern (our retrofit enables this!)
- Will speed up remaining MCP builds by 2-3x

---

### 6. smart-file-organizer-mcp-server
**Role:** FILE ORGANIZATION & VALIDATION

**Responsibilities:**
- Validate staging project structure follows patterns
- Suggest optimal file placement for new artifacts
- Detect when files are in wrong locations
- Record organizational decisions for learning

**Tools Used:**
- `analyze_directory` - Validate staging project structure
- `suggest_organization` - Recommend file placement
- `check_lifecycle` - Verify staging/production lifecycle
- `record_decision` - Learn from retrofit patterns

**When to Use:**
- After creating staging project folders
- When unsure where to place retrofit artifacts
- To validate compliance with 8-folder pattern
- After batch retrofits to check structure

---

### 7. git-assistant-mcp-server
**Role:** VERSION CONTROL & COMMIT GUIDANCE

**Responsibilities:**
- Guide commit strategy for retrofit changes
- Suggest commit messages following repo conventions
- Check commit readiness before major milestones
- Analyze commit history to understand patterns

**Tools Used:**
- `check_commit_readiness` - Before Phase completions
- `suggest_commit_message` - For retrofit commits
- `show_git_guidance` - Best practices for large refactors
- `analyze_commit_history` - Review past patterns

**When to Use:**
- After Phase 1 (enforcement scripts created)
- After Phase 2 (critical MCPs retrofitted)
- After Phase 3 (all MCPs retrofitted)
- At project completion (final commit)

**Commit Strategy:**
- Phase 1: "feat: add dual-environment validation and enforcement"
- Phase 2: "refactor: retrofit 5 critical MCPs to staging pattern"
- Phase 3: "refactor: retrofit remaining 7 MCPs to staging pattern"
- Final: "docs: update completion tracker and event log"

---

### 8. mcp-config-manager
**Role:** CONFIGURATION VALIDATION

**Responsibilities:**
- Validate .mcp.json still points to correct production paths
- Ensure no broken MCP registrations during retrofit
- Sync configs after staging projects created
- Detect orphaned configs

**Tools Used:**
- `sync_mcp_configs` - Check for orphaned/missing registrations
- `list_mcp_servers` - Verify all MCPs still registered
- `register_mcp_server` - If any registrations lost (shouldn't happen)

**When to Use:**
- Before starting retrofit (baseline)
- After Phase 2 (verify production still works)
- After Phase 3 (final validation)
- If any MCP stops loading

**Important:**
- Retrofit creates staging projects, doesn't change production paths
- .mcp.json should remain unchanged (validates production stability)

---

### 9. learning-optimizer-mcp-server
**Role:** ISSUE TRACKING & CONTINUOUS LEARNING

**Responsibilities:**
- Track any issues encountered during retrofit
- Learn patterns from troubleshooting
- Categorize issues by domain (configuration, build, deployment)
- Suggest optimizations based on patterns
- Record this retrofit as a learned pattern

**Tools Used:**
- `track_issue` - Log any problems encountered
- `get_domain_stats` - Check existing issues before starting
- `categorize_issues` - Organize retrofit learnings
- `check_optimization_triggers` - Detect if optimization needed

**When to Use:**
- If any MCP fails to build in staging
- If validation script has issues
- If documentation updates reveal patterns
- At project completion (record retrofit pattern)

**Expected Issues to Track:**
- Any MCPs that don't build cleanly when copied
- Dependencies missing in staging environments
- Documentation gaps discovered during retrofit

---

### 10. communications-mcp-server
**Role:** NOT DIRECTLY USED (Optional Notifications)

**Potential Use:**
- Send notifications at phase completions
- Email summary reports
- Post milestone updates to Google Chat

**Not Critical:**
- Internal project (no external stakeholders)
- Progress tracked in task-executor and project-management
- Could be used for team notifications in future

---

### 11. arc-decision-mcp-server
**Role:** ARCHITECTURAL DECISION RECORDING

**Responsibilities:**
- Record the dual-environment pattern as architectural decision
- Document why staging → production is mandatory
- Learn from this retrofit for future compliance decisions
- Compare this pattern to alternatives (if questioned)

**Tools Used:**
- `record_decision` - Document dual-environment requirement
- `compare_approaches` - Why staging vs. direct production
- `get_statistics` - Review architectural decision history

**When to Use:**
- After Phase 1 (record enforcement decision)
- At project completion (record retrofit pattern)
- If questioned why this pattern is mandatory

**Decision to Record:**
```
Decision: All MCPs must use dual-environment pattern (staging → production)
Reasoning: Enables production feedback loop, safe testing, proper issue logging
Complexity: Moderate (initial retrofit), Simple (ongoing compliance)
State Management: Yes (track staging vs production sync)
Outcome: [To be updated after completion]
```

---

### 12. project-index-generator-mcp-server
**Role:** DOCUMENTATION & DISCOVERABILITY

**Responsibilities:**
- Generate updated file catalogs after retrofit
- Update indexes for staging projects
- Ensure new artifacts are discoverable
- Track what files were added/moved

**Tools Used:**
- `generate_project_index` - After all retrofits complete
- `update_indexes_for_paths` - After each staging project created
- `check_index_freshness` - Validate indexes current

**When to Use:**
- After Phase 2 (6 staging projects created)
- After Phase 3 (7 more staging projects created)
- At project completion (full re-index)

---

### 13. security-compliance-mcp-server (BEING RETROFITTED)
**Role:** DUAL ROLE - Subject of Retrofit & Security Validator

**As Subject:**
- One of the 13 MCPs being retrofitted
- First in Phase 2 (actively being modified)
- Will get staging project structure

**As Validator:**
- Scan validation scripts for credentials
- Check staging projects for PHI
- Validate git commits don't expose secrets

**Tools Used:**
- `scan_for_credentials` - Before committing scripts
- `scan_for_phi` - Validate no PHI in staging copies

**When to Use:**
- Before committing Phase 1 scripts
- After copying production code to staging (verify no PHI)
- Before final git commits

---

### 14. testing-validation-mcp-server (ALREADY COMPLIANT)
**Role:** QUALITY VALIDATION & TESTING

**Responsibilities:**
- Validate each staging project builds successfully
- Run smoke tests on dev-instances
- Check compliance with ROLLOUT-CHECKLIST.md
- Verify quality gates pass

**Tools Used:**
- `run_mcp_tests` - Test each dev-instance builds
- `validate_mcp_implementation` - Check standards compliance
- `check_quality_gates` - Run ROLLOUT-CHECKLIST validation
- `run_smoke_tests` - Basic functionality tests

**When to Use:**
- Task 4: Test validation script on testing-validation-mcp (should pass)
- Task 10: Verify all Phase 2 MCPs build successfully
- Task 19: Verify all Phase 3 MCPs build successfully
- Task 20: Final validation on all 13+ MCPs

**Special Status:**
- Already has staging project ✅
- Example for other MCPs to follow
- Validation target for Phase 1 script

---

## Coordination Patterns

### Pattern 1: Task Completion Flow
```
1. Claude completes a task
2. task-executor: complete_task (with verification)
3. project-management: State auto-syncs
4. Claude: Check for next task or blockers
```

### Pattern 2: Phase Completion Flow
```
1. All phase tasks complete
2. git-assistant: suggest_commit_message
3. git-assistant: check_commit_readiness
4. Claude: Create git commit
5. project-management: Update phase status
6. project-index-generator: update_indexes_for_paths
```

### Pattern 3: Issue Detection Flow
```
1. Issue encountered during task
2. learning-optimizer: track_issue
3. Claude: Resolve issue
4. task-executor: complete_task (with notes)
5. learning-optimizer: Record solution pattern
```

### Pattern 4: Validation Flow
```
1. Staging project created for MCP
2. testing-validation: run_mcp_tests
3. smart-file-organizer: analyze_directory
4. mcp-config-manager: sync_mcp_configs (verify production unchanged)
5. task-executor: complete_task (verified)
```

---

## Success Metrics by MCP

### project-management-mcp-server
- [ ] Project orchestration initialized
- [ ] State tracking functional throughout
- [ ] Final completion report generated
- [ ] All phases tracked and completed

### task-executor-mcp-server
- [ ] 24/24 tasks completed with verification
- [ ] All build verifications passed
- [ ] Workflow archived to archive/workflows/
- [ ] Documentation updated automatically

### smart-file-organizer-mcp-server
- [ ] All 13 staging projects follow 8-folder pattern
- [ ] No misplaced files detected
- [ ] Organizational decisions recorded

### git-assistant-mcp-server
- [ ] 4 clean commits (Phase 1, 2, 3, Final)
- [ ] Commit messages follow conventions
- [ ] No accidental production changes

### mcp-config-manager
- [ ] .mcp.json unchanged (production stable)
- [ ] No orphaned configs detected
- [ ] All MCPs still registered correctly

### learning-optimizer-mcp-server
- [ ] Issues tracked (if any encountered)
- [ ] Retrofit pattern recorded
- [ ] Knowledge base updated

### testing-validation-mcp-server
- [ ] All 13+ MCPs build successfully in staging
- [ ] Validation script passes for all
- [ ] Quality gates satisfied

### project-index-generator-mcp-server
- [ ] Indexes updated for all staging projects
- [ ] New artifacts discoverable
- [ ] Catalog accurate and current

---

## Communication Protocol

### When to Ask MCPs
- **"What should I do next?"** → project-management: get_next_steps
- **"Is this task really done?"** → task-executor: complete_task (verification)
- **"Where should this file go?"** → smart-file-organizer: suggest_organization
- **"Is it safe to commit?"** → git-assistant: check_commit_readiness
- **"Are all MCPs still working?"** → mcp-config-manager: sync_mcp_configs
- **"Did this build succeed?"** → testing-validation: run_mcp_tests
- **"What issues have we seen?"** → learning-optimizer: get_domain_stats

### Cross-MCP Coordination
1. **project-management** provides high-level orchestration
2. **task-executor** provides detailed task tracking
3. **testing-validation** provides quality assurance
4. **git-assistant** provides commit guidance
5. **learning-optimizer** captures learnings
6. All others provide specialized validation/support

---

## Handoff Points

### To spec-driven (Future)
- If enforcement mechanisms need formal specification
- If batch-retrofit script becomes complex tool

### From task-executor (Current)
- Task completion triggers project-management state updates
- Verification failures trigger learning-optimizer issue logging

### To parallelization (Future)
- Phase 3 batch retrofits (7 MCPs in parallel)
- Build verification can be parallelized

---

## Anti-Patterns to Avoid

### DON'T:
- ❌ Use multiple MCPs for same task (choose one, use it)
- ❌ Skip task-executor verification (always verify builds)
- ❌ Modify production during retrofit (only create staging)
- ❌ Commit without git-assistant guidance
- ❌ Ignore issues (always track with learning-optimizer)

### DO:
- ✅ Use project-management for "What's next?"
- ✅ Use task-executor for every task completion
- ✅ Verify builds with testing-validation before marking complete
- ✅ Track issues immediately with learning-optimizer
- ✅ Commit at phase boundaries with git-assistant

---

## Project Timeline with MCP Involvement

### Phase 1: Enforcement (1.5 hours)
**MCPs Active:** task-executor, git-assistant, security-compliance, testing-validation

**Flow:**
1. Create validation script → task-executor: complete_task
2. Update docs → task-executor: complete_task
3. Test script → testing-validation: run_smoke_tests
4. Commit → git-assistant: suggest_commit_message

### Phase 2: Retrofit Critical (2 hours)
**MCPs Active:** task-executor, testing-validation, smart-file-organizer, git-assistant

**Flow:**
1. Create staging project → smart-file-organizer: analyze_directory
2. Copy code → task-executor: complete_task
3. Verify build → testing-validation: run_mcp_tests
4. Repeat for 5 MCPs
5. Commit → git-assistant: suggest_commit_message

### Phase 3: Retrofit Remaining (2.5 hours)
**MCPs Active:** task-executor, testing-validation, smart-file-organizer, git-assistant, parallelization (future)

**Flow:**
1. Batch create staging projects (could parallelize with future parallelization-mcp)
2. Copy code for each MCP
3. Verify builds → testing-validation: run_mcp_tests (all)
4. Commit → git-assistant: suggest_commit_message

### Final: Validation & Completion (1.5 hours)
**MCPs Active:** All

**Flow:**
1. Run final validation → testing-validation: check_quality_gates
2. Update tracker → task-executor: complete_task
3. Generate indexes → project-index-generator: generate_project_index
4. Record decisions → arc-decision: record_decision
5. Final commit → git-assistant: suggest_commit_message
6. Archive workflow → task-executor: archive_workflow
7. Wrap up → project-management: wrap_up_project

---

**This document defines clear roles and responsibilities for all MCPs in this coordinated architectural compliance project.**

**Status:** Ready for execution
**Created:** 2025-10-29
**Next:** Begin Phase 1, Task 1
