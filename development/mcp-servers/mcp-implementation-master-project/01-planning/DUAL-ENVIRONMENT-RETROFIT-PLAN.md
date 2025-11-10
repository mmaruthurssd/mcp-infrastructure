---
type: plan
tags: [architectural-compliance, dual-environment, staging-retrofit, enforcement, production-feedback-loop]
status: ready-to-execute
priority: critical
created: 2025-10-29
---

# Dual-Environment Pattern Retrofit & Enforcement Plan

**Purpose:** Establish proper staging/production separation for all MCPs and enforce architectural compliance

**Context:** Currently, most MCPs are built directly in production (`/local-instances/mcp-servers/`) without staging environments, violating the documented dual-environment pattern and preventing the production feedback loop from functioning correctly.

**Priority:** CRITICAL - Blocks production feedback loop, prevents proper testing, creates technical debt

**Timeline:** 4-6 hours total (after parallelization-mcp completion)

---

## Problem Statement

### Current State (Architectural Violation)

**What SHOULD exist:**
```
mcp-server-development/
├── [mcp-name]-project/
│   ├── 01-planning/
│   ├── 02-goals-and-roadmap/
│   ├── 03-resources-docs-assets-tools/
│   ├── 04-product-under-development/
│   │   └── dev-instance/          ← STAGING (build here)
│   ├── 08-archive/
│   │   └── issues/                ← PRODUCTION ISSUES logged here
│   └── [standard project files]
```

**What ACTUALLY exists:**
- Only 1 MCP has staging project: `testing-validation-mcp-project`
- 13+ MCPs built directly in production: `/local-instances/mcp-servers/[mcp-name]/`
- No place to route production issues back to staging
- Production feedback loop cannot function

### Impact

**Broken workflows:**
1. ❌ Production feedback loop (documented but non-functional)
2. ❌ Cannot test fixes in staging before production
3. ❌ No place to log production issues per MCP
4. ❌ Cannot follow PRODUCTION-FEEDBACK-LOOP.md workflow
5. ❌ Violates SYSTEM-ARCHITECTURE.md dual-environment pattern

**Risk:**
- Testing directly in production (dangerous for medical practice)
- No rollback path (no staging backup)
- Architecture docs misleading (document workflow that doesn't exist)
- Technical debt accumulating

---

## Solution Overview

### Three-Phase Approach

**Phase 1: Enforcement (Prevent Future Violations)**
- Create validation script to block direct production builds
- Update MCP-BUILD-INTEGRATION-GUIDE.md with enforcement
- Add pre-deployment checks

**Phase 2: Retrofit Critical MCPs (Highest Priority)**
- Create staging projects for MCPs actively being modified
- Move production code to staging, establish workflow
- Priority order: security, testing, workflow-orchestrator, project-management, spec-driven, task-executor

**Phase 3: Retrofit Remaining MCPs (Lower Priority)**
- Create staging projects for stable MCPs
- Establish baseline for future maintenance
- Complete compliance

---

## Phase 1: Enforcement Mechanisms

**Goal:** Prevent future MCPs from being built directly in production

### Task 1.1: Create Validation Script

**File:** `mcp-server-development/mcp-implementation-master-project/03-resources-docs-assets-tools/validate-dual-environment.sh`

**Purpose:** Validate that MCP has staging project before production deployment

**Logic:**
```bash
#!/bin/bash
# validate-dual-environment.sh <mcp-name>

MCP_NAME=$1
STAGING_PROJECT="mcp-server-development/${MCP_NAME}-project"
DEV_INSTANCE="${STAGING_PROJECT}/04-product-under-development/dev-instance"

# Check staging project exists
if [ ! -d "$STAGING_PROJECT" ]; then
  echo "❌ ERROR: No staging project for ${MCP_NAME}"
  echo "   Required: ${STAGING_PROJECT}"
  echo "   Create staging project before deploying to production"
  exit 1
fi

# Check dev-instance exists
if [ ! -d "$DEV_INSTANCE" ]; then
  echo "❌ ERROR: No dev-instance for ${MCP_NAME}"
  echo "   Required: ${DEV_INSTANCE}"
  echo "   Build in staging dev-instance, not production"
  exit 1
fi

# Check dev-instance has built code
if [ ! -d "$DEV_INSTANCE/dist" ] && [ ! -d "$DEV_INSTANCE/build" ]; then
  echo "❌ ERROR: dev-instance not built for ${MCP_NAME}"
  echo "   Run 'npm run build' in ${DEV_INSTANCE}"
  exit 1
fi

echo "✅ Dual-environment validation passed for ${MCP_NAME}"
echo "   Staging: ${DEV_INSTANCE}"
echo "   Ready for production deployment"
exit 0
```

**Validation checks:**
1. Staging project exists (`mcp-server-development/[mcp-name]-project/`)
2. dev-instance folder exists
3. Code is built (dist/ or build/ folder present)

**Integration points:**
- Called by ROLLOUT-CHECKLIST.md (manual step)
- Called by testing-validation MCP (automated)
- Called by deployment scripts (future)

**Estimated time:** 30 minutes

---

### Task 1.2: Update ROLLOUT-CHECKLIST.md

**File:** `mcp-server-development/mcp-implementation-master-project/03-resources-docs-assets-tools/ROLLOUT-CHECKLIST.md`

**Add new section (after Pre-Deployment Validation):**

```markdown
## Dual-Environment Compliance

- [ ] **Staging Project Exists**
  - **MANDATORY:** MCP must have staging project in mcp-server-development/
  - **STOP:** Do NOT deploy directly to production
  - Staging project: `mcp-server-development/[mcp-name]-project/`
  - dev-instance: `04-product-under-development/dev-instance/`
  - Run validation: `./validate-dual-environment.sh [mcp-name]`
  - ✅ Validation passed: ☐ Yes ☐ No

- [ ] **Production Feedback Loop Ready**
  - Issue logging location exists: `08-archive/issues/`
  - EVENT-LOG.md exists
  - NEXT-STEPS.md exists
  - Production issues can be routed back to staging
```

**Estimated time:** 15 minutes

---

### Task 1.3: Update MCP-BUILD-INTEGRATION-GUIDE.md

**File:** `planning-and-roadmap/future-ideas/Workspace-Component-Roles-System/MCP-BUILD-INTEGRATION-GUIDE.md`

**Add section on dual-environment requirement:**

```markdown
## Dual-Environment Pattern (MANDATORY)

**ALL MCPs must follow the staging → production pattern.**

### Staging Environment (Development)

**Location:** `mcp-server-development/[mcp-name]-project/04-product-under-development/dev-instance/`

**Purpose:**
- Development and testing
- Quality gate validation
- Security scanning
- Integration testing

**Build here:**
```bash
cd mcp-server-development/[mcp-name]-project/04-product-under-development/dev-instance/
npm install
npm run build
npm test
```

### Production Environment (Deployment)

**Location:** `/local-instances/mcp-servers/[mcp-name]/`

**Purpose:**
- Production runtime
- Registered in .mcp.json
- Used by Claude Code

**Deploy here (only after validation):**
```bash
# Run validation first
./validate-dual-environment.sh [mcp-name]

# If validation passes, deploy
cp -r dev-instance/dist/ /local-instances/mcp-servers/[mcp-name]/
cp dev-instance/package.json /local-instances/mcp-servers/[mcp-name]/
```

### Why This Matters

**Production Feedback Loop requires staging:**
- Production issues logged to `08-archive/issues/`
- Fixes developed in `dev-instance/`
- Tested in staging before production rollout
- Rollback possible (staging backup)

**Without staging:**
- ❌ Cannot test fixes safely
- ❌ No place to log production issues
- ❌ Feedback loop breaks
- ❌ Direct production changes (dangerous)
```

**Estimated time:** 30 minutes

---

### Phase 1 Summary

**Deliverables:**
1. ✅ `validate-dual-environment.sh` script
2. ✅ ROLLOUT-CHECKLIST.md updated with validation step
3. ✅ MCP-BUILD-INTEGRATION-GUIDE.md updated with dual-environment requirement

**Success criteria:**
- [ ] Validation script blocks deployment without staging
- [ ] ROLLOUT-CHECKLIST enforces validation
- [ ] Documentation clearly states requirement
- [ ] Future MCPs cannot violate pattern

**Total time:** 1-1.5 hours

---

## Phase 2: Retrofit Critical MCPs

**Goal:** Create staging projects for actively-maintained MCPs

**Priority order (by criticality):**
1. security-compliance-mcp (actively being extended)
2. testing-validation-mcp (already has staging! ✅)
3. workflow-orchestrator-mcp-server (foundation library)
4. project-management-mcp-server (actively being extended)
5. spec-driven-mcp-server (actively being extended)
6. task-executor-mcp-server (actively being extended)

---

### Task 2.1: Retrofit Security & Compliance MCP

**Current state:** Built directly in `/local-instances/mcp-servers/security-compliance-mcp/`

**Create staging project:**

```bash
# 1. Create project structure from template
cp -r mcp-server-development/_mcp-project-template/ \
      mcp-server-development/security-compliance-mcp-project/

# 2. Copy production code to dev-instance
cp -r /local-instances/mcp-servers/security-compliance-mcp/* \
      mcp-server-development/security-compliance-mcp-project/04-product-under-development/dev-instance/

# 3. Initialize project files
cd mcp-server-development/security-compliance-mcp-project/

# Update README.md
echo "# Security & Compliance MCP Project

**MCP Name:** security-compliance-mcp
**Status:** Production (v1.0.0)
**Purpose:** Credential scanning, PHI detection, HIPAA compliance

## Production Location
\`/local-instances/mcp-servers/security-compliance-mcp/\`

## Staging Location
\`04-product-under-development/dev-instance/\`

## Production Issues
Log issues to: \`08-archive/issues/\`

## Workflow
1. Issues discovered in production
2. Logged to 08-archive/issues/
3. Fixed in dev-instance/
4. Tested and validated
5. Deployed to production
" > README.md

# 4. Create initial EVENT-LOG.md
echo "# Security & Compliance MCP - Event Log

## 2025-10-29: Retrofit to Staging/Production Pattern

**Action:** Created staging project structure
**Reason:** Establish dual-environment pattern for production feedback loop
**Status:** Staging project created, production code copied to dev-instance

" > EVENT-LOG.md

# 5. Create NEXT-STEPS.md
echo "# Next Steps

## Immediate
- [ ] Verify dev-instance builds successfully
- [ ] Test all tools in staging
- [ ] Establish production feedback loop

## Future
- [ ] Extend with additional security scanning
- [ ] Integrate with deployment-manager (when built)
" > NEXT-STEPS.md
```

**Validation:**
```bash
# Verify dev-instance builds
cd dev-instance/
npm install
npm run build
npm test

# Run validation script
cd ../../../mcp-implementation-master-project/03-resources-docs-assets-tools/
./validate-dual-environment.sh security-compliance-mcp
```

**Estimated time:** 20 minutes

---

### Task 2.2: Retrofit Workflow Orchestrator

**Current state:** Built directly in `/local-instances/mcp-servers/workflow-orchestrator-mcp-server/`

**Note:** This is a library, not a server, but should still have staging project for maintenance

**Process:** Same as Task 2.1, adapted for workflow-orchestrator

**Estimated time:** 20 minutes

---

### Task 2.3: Retrofit Project Management MCP

**Current state:** Built directly in `/local-instances/mcp-servers/project-management-mcp-server/`

**Process:** Same as Task 2.1, adapted for project-management

**Estimated time:** 20 minutes

---

### Task 2.4: Retrofit Spec-Driven MCP

**Current state:** Built directly in `/local-instances/mcp-servers/spec-driven-mcp-server/`

**Process:** Same as Task 2.1, adapted for spec-driven

**Estimated time:** 20 minutes

---

### Task 2.5: Retrofit Task Executor MCP

**Current state:** Built directly in `/local-instances/mcp-servers/task-executor-mcp-server/`

**Process:** Same as Task 2.1, adapted for task-executor

**Estimated time:** 20 minutes

---

### Phase 2 Summary

**MCPs retrofitted (6 total):**
1. ✅ testing-validation-mcp (already compliant)
2. ✅ security-compliance-mcp
3. ✅ workflow-orchestrator-mcp-server
4. ✅ project-management-mcp-server
5. ✅ spec-driven-mcp-server
6. ✅ task-executor-mcp-server

**Success criteria:**
- [ ] All 6 MCPs have staging projects
- [ ] dev-instance builds successfully for each
- [ ] Production code copied to staging
- [ ] Issues can be logged to 08-archive/issues/
- [ ] Validation script passes for all 6

**Total time:** 1.5-2 hours

---

## Phase 3: Retrofit Remaining MCPs

**Goal:** Complete compliance for all existing MCPs

**Remaining MCPs (7 stable MCPs):**
1. git-assistant-mcp-server
2. smart-file-organizer-mcp-server
3. mcp-config-manager
4. communications-mcp-server
5. learning-optimizer-mcp-server
6. arc-decision-mcp-server
7. project-index-generator-mcp-server

**Strategy:** Batch process (can be parallelized)

---

### Task 3.1: Batch Retrofit Stable MCPs

**Script approach (automate the pattern):**

```bash
#!/bin/bash
# batch-retrofit-staging.sh

MCPS=(
  "git-assistant-mcp-server"
  "smart-file-organizer-mcp-server"
  "mcp-config-manager"
  "communications-mcp-server"
  "learning-optimizer-mcp-server"
  "arc-decision-mcp-server"
  "project-index-generator-mcp-server"
)

for MCP in "${MCPS[@]}"; do
  echo "Retrofitting $MCP..."

  # Create project structure
  cp -r mcp-server-development/_mcp-project-template/ \
        mcp-server-development/${MCP}-project/

  # Copy production code to dev-instance
  cp -r /local-instances/mcp-servers/$MCP/* \
        mcp-server-development/${MCP}-project/04-product-under-development/dev-instance/

  # Create basic docs (README, EVENT-LOG, NEXT-STEPS)
  # ... (similar to Task 2.1)

  echo "✅ $MCP staging project created"
done
```

**Or manual approach (more careful):**
- Retrofit each MCP individually using Task 2.1 pattern
- Verify build success for each
- Run validation for each

**Estimated time:** 1.5-2 hours (all 7 MCPs)

---

### Phase 3 Summary

**All MCPs retrofitted (13+ total):**
- ✅ Phase 2 critical MCPs (6)
- ✅ Phase 3 stable MCPs (7)
- ✅ New MCPs built with pattern (parallelization-mcp and future)

**Success criteria:**
- [ ] All production MCPs have staging projects
- [ ] All dev-instances build successfully
- [ ] Validation passes for all MCPs
- [ ] Production feedback loop functional

**Total time:** 1.5-2 hours

---

## Complete Timeline

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| **Phase 1: Enforcement** | Create validation, update docs | 1-1.5 hours | CRITICAL |
| **Phase 2: Retrofit Critical** | 6 actively-maintained MCPs | 1.5-2 hours | HIGH |
| **Phase 3: Retrofit Remaining** | 7 stable MCPs | 1.5-2 hours | MEDIUM |
| **TOTAL** | 13+ MCPs, validation, docs | **4-6 hours** | - |

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Validation script created and tested
- [ ] ROLLOUT-CHECKLIST.md enforces validation
- [ ] MCP-BUILD-INTEGRATION-GUIDE.md documents requirement
- [ ] Future MCPs blocked from direct production builds

### Phase 2 Complete When:
- [ ] 6 critical MCPs have staging projects
- [ ] All dev-instances build successfully
- [ ] Production issues can be logged per MCP
- [ ] Feedback loop functional for critical MCPs

### Phase 3 Complete When:
- [ ] All 13+ MCPs have staging projects
- [ ] All validation scripts pass
- [ ] Complete architectural compliance
- [ ] Documentation updated in MCP-COMPLETION-TRACKER.md

### System Complete When:
- [ ] All MCPs follow dual-environment pattern
- [ ] Production feedback loop fully operational
- [ ] No architectural violations
- [ ] Enforcement prevents future violations

---

## Risk Mitigation

### Risk: Breaking Production During Retrofit

**Mitigation:**
- Retrofitting creates staging projects, doesn't touch production
- Production continues running unchanged
- No immediate deployment required
- Test staging environments before any production changes

### Risk: Merge Conflicts (Staging vs Production Divergence)

**Mitigation:**
- Production is source of truth (copy production → staging)
- Staging starts as exact copy of production
- No divergence until first fix/enhancement in staging

### Risk: Time Investment Too High

**Mitigation:**
- Phase 1 (enforcement) is critical, phases 2-3 can be staggered
- Retrofit on-demand (when MCP needs modification)
- Automate with batch scripts (Phase 3)

### Risk: Developers Bypass Validation

**Mitigation:**
- Validation in ROLLOUT-CHECKLIST.md (manual checkpoint)
- Validation in testing-validation MCP (automated)
- Code review catches violations
- Documentation clearly states requirement

---

## Next Steps After Completion

**Immediate (After Phase 1):**
1. Complete parallelization-mcp using proper dual-environment pattern
2. Enforce validation for all future MCP builds
3. Start Phase 2 retrofit of critical MCPs

**Short-term (After Phase 2):**
1. Test production feedback loop with retrofitted MCPs
2. Create first staging → production deployment following workflow
3. Verify PRODUCTION-FEEDBACK-LOOP.md workflow functions correctly

**Medium-term (After Phase 3):**
1. Update MCP-COMPLETION-TRACKER.md with compliance status
2. Document lessons learned
3. Automate enforcement further (pre-commit hooks, CI/CD)

---

## References

**Related Documents:**
- `SYSTEM-ARCHITECTURE.md` - Dual-environment pattern architecture
- `PRODUCTION-FEEDBACK-LOOP.md` - Production → staging workflow
- `ROLLOUT-CHECKLIST.md` - Quality gates for deployment
- `MCP-BUILD-INTEGRATION-GUIDE.md` - MCP build standards
- `MCP-COMPLETION-TRACKER.md` - MCP status tracking

**Template:**
- `_mcp-project-template/` - Base structure for new staging projects

---

## Task Executor Workflow

**This plan should be executed via task-executor MCP:**

```javascript
mcp__task-executor__create_workflow({
  name: "dual-environment-retrofit",
  projectPath: "/Users/mmaruthurnew/Desktop/operations-workspace",
  tasks: [
    // Phase 1: Enforcement (1-1.5 hours)
    { description: "Create validate-dual-environment.sh script" },
    { description: "Update ROLLOUT-CHECKLIST.md with dual-environment validation" },
    { description: "Update MCP-BUILD-INTEGRATION-GUIDE.md with requirement" },
    { description: "Test validation script on testing-validation-mcp (should pass)" },

    // Phase 2: Retrofit Critical MCPs (1.5-2 hours)
    { description: "Retrofit security-compliance-mcp to staging pattern" },
    { description: "Retrofit workflow-orchestrator-mcp-server to staging pattern" },
    { description: "Retrofit project-management-mcp-server to staging pattern" },
    { description: "Retrofit spec-driven-mcp-server to staging pattern" },
    { description: "Retrofit task-executor-mcp-server to staging pattern" },
    { description: "Verify all Phase 2 MCPs build successfully in staging" },

    // Phase 3: Retrofit Remaining MCPs (1.5-2 hours)
    { description: "Create batch-retrofit-staging.sh script (optional automation)" },
    { description: "Retrofit git-assistant-mcp-server to staging pattern" },
    { description: "Retrofit smart-file-organizer-mcp-server to staging pattern" },
    { description: "Retrofit mcp-config-manager to staging pattern" },
    { description: "Retrofit communications-mcp-server to staging pattern" },
    { description: "Retrofit learning-optimizer-mcp-server to staging pattern" },
    { description: "Retrofit arc-decision-mcp-server to staging pattern" },
    { description: "Retrofit project-index-generator-mcp-server to staging pattern" },
    { description: "Verify all Phase 3 MCPs build successfully in staging" },

    // Final Validation & Documentation
    { description: "Run validation script on all 13+ MCPs (should all pass)" },
    { description: "Update MCP-COMPLETION-TRACKER.md with staging project status" },
    { description: "Update NEXT-STEPS.md in master project" },
    { description: "Test production feedback loop with one MCP (create test issue, fix in staging, deploy)" },
    { description: "Document completion in EVENT-LOG.md" }
  ],
  constraints: [
    "Do not modify production MCPs during retrofit (only create staging projects)",
    "Verify each dev-instance builds before marking task complete",
    "Maintain production stability throughout retrofit"
  ]
});
```

**Total tasks:** 24 tasks (~4-6 hours)

---

**Status:** Ready to Execute
**Created:** 2025-10-29
**Owner:** MCP Implementation Master Project Team
**Priority:** CRITICAL - Blocks production feedback loop
**Estimated Effort:** 4-6 hours
**Dependencies:** Parallelization MCP completion

---

**This plan establishes proper architectural compliance and enables the production feedback loop to function as documented.**
