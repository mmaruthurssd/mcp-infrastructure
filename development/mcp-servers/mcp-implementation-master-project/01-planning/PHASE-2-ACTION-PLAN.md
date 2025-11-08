---
type: plan
tags: [phase-2, operations-mcps, 2-week-plan, build-order]
created: 2025-10-30
status: active
---

# Phase 2 Operations MCPs - 2-Week Action Plan

**Purpose:** Detailed execution plan for building Phase 2 operations MCPs
**Timeline:** 2 weeks (November 1-15, 2025)
**Current Status:** 50% complete (14/28 MCPs) - Ready to start Phase 2
**Key Achievement:** Foundation complete, parallelization available for 2x speedup

---

## 📊 Phase 2 Overview

**Goal:** Build critical operational MCPs that enable reliable development and deployment

**MCPs to Build (4 total):**
1. ✅ Parallelization MCP (Week 7 - COMPLETE)
2. ⏭️ Configuration Manager MCP (Week 8 - 2-3 hours)
3. ⏭️ Code Review MCP (Week 9 - 2.5-3.5 hours, includes Apps Script support)
4. ⏭️ Deployment & Release MCP (Weeks 10-11 - 3-4 hours)

**Estimated Total Time:** 7.5-10.5 hours (with parallelization acceleration)
**Expected Completion:** November 15, 2025

---

## 🎯 Week 1: Configuration Manager + Code Review MCPs

### Day 1-2: Configuration Manager MCP
**Estimated Time:** 2-3 hours
**Priority:** HIGH (needed before deployment automation)

#### Planning (30 mins)
- [ ] Review IMPLEMENTATION_PLAN.md Configuration Manager specification
- [ ] Create configuration-manager-mcp-server-project/ folder structure
- [ ] Write PROJECT-BRIEF.md (vision and purpose)
- [ ] Write SPECIFICATION.md (tools, architecture, data models)
- [ ] Document DESIGN-DECISIONS.md (architecture rationale)

#### Implementation (1.5 hours)
- [ ] Set up dev-instance/ with TypeScript + Jest
- [ ] Implement tools:
  - `manage_secrets` - Store/retrieve/rotate secrets with OS keychain
  - `validate_config` - Validate configuration files (JSON schema)
  - `get_environment_vars` - Get environment-specific config
  - `template_config` - Generate config templates
  - `check_config_drift` - Detect config differences across environments
- [ ] Write unit tests (>70% coverage target)
- [ ] Integration testing with security-compliance-mcp

#### Rollout (30 mins)
- [ ] Run quality gates with testing-validation-mcp
- [ ] Copy to production: `/local-instances/mcp-servers/configuration-manager-mcp/`
- [ ] Register with mcp-config-manager
- [ ] Update MCP-COMPLETION-TRACKER.md
- [ ] Update EVENT-LOG.md

**Success Criteria:**
- ✅ All 5 tools functional
- ✅ Secrets encrypted using OS keychain
- ✅ Environment validation working
- ✅ Tests passing (>70% coverage)
- ✅ Security scan clean

---

### Day 3-4: Code Review MCP
**Estimated Time:** 2.5-3.5 hours (includes Apps Script support)
**Priority:** HIGH (code quality enforcement before building more MCPs)

#### Planning (30 mins)
- [ ] Review IMPLEMENTATION_PLAN.md Code Review specification
- [ ] Create code-review-mcp-server-project/ folder structure
- [ ] Write PROJECT-BRIEF.md
- [ ] Write SPECIFICATION.md (6 tools with schemas)
- [ ] Document DESIGN-DECISIONS.md

#### Implementation (1.5-2 hours)
- [ ] Set up dev-instance/ with TypeScript + Jest
- [ ] Implement tools:
  - `run_lint_check` - ESLint integration with auto-fix
  - `analyze_complexity` - Cyclomatic + cognitive complexity
  - `detect_code_smells` - Long methods, large classes, duplicates, dead code
  - `track_technical_debt` - TODO/FIXME detection and quantification
  - `suggest_improvements` - Code improvement recommendations
  - `generate_review_report` - Comprehensive code review reports
- [ ] **Add Apps Script support** (+30-45 mins):
  - Configure ESLint for JavaScript (Apps Script is JS-based)
  - Add `.gs` file scanning capability (Google Apps Script files)
  - Install/configure Apps Script ESLint plugin (if available)
  - Add Apps Script-specific rules (e.g., avoid expensive `getValue()` in loops)
  - Test with sample Apps Script project
- [ ] Write unit tests (>70% coverage target)
- [ ] Integration testing with git-assistant

#### Rollout (30 mins)
- [ ] Run quality gates with testing-validation-mcp
- [ ] Copy to production: `/local-instances/mcp-servers/code-review-mcp/`
- [ ] Register with mcp-config-manager
- [ ] Update MCP-COMPLETION-TRACKER.md
- [ ] Update EVENT-LOG.md

**Success Criteria:**
- ✅ All 6 tools functional
- ✅ Linting and complexity analysis working
- ✅ Code smell detection active
- ✅ Technical debt tracked
- ✅ Pre-commit review integration possible
- ✅ **Apps Script support working** (.gs files, JavaScript config, Apps Script-specific rules)
- ✅ Tests passing (>70% coverage)

---

## 🎯 Week 2: Deployment & Release MCP

### Day 5-8: Deployment & Release MCP
**Estimated Time:** 3-4 hours (larger scope than others)
**Priority:** HIGH (deployment automation critical for operations)

#### Planning (45 mins)
- [ ] Review IMPLEMENTATION_PLAN.md Deployment & Release specification
- [ ] Create deployment-release-mcp-server-project/ folder structure
- [ ] Write PROJECT-BRIEF.md
- [ ] Write SPECIFICATION.md (6 tools with comprehensive schemas)
- [ ] Document DESIGN-DECISIONS.md
- [ ] **Decision:** Determine if workflow-orchestrator integration needed
  - Deployment phases: pre-check → build → test → deploy → verify
  - State tracking: deployment history, rollback info, environment configs

#### Implementation (2-2.5 hours)
- [ ] Set up dev-instance/ with TypeScript + Jest
- [ ] Implement tools:
  - `deploy_to_environment` - Deploy to dev/staging/production
  - `rollback_deployment` - Rollback to previous version with validation
  - `validate_deployment` - Health checks + smoke tests post-deployment
  - `coordinate_release` - Multi-system release coordination
  - `generate_release_notes` - Auto-generate from git commits
  - `check_deployment_health` - Continuous health monitoring
- [ ] Write unit tests (>70% coverage target)
- [ ] Integration testing with:
  - testing-validation-mcp (pre-deploy tests)
  - security-compliance-mcp (pre-deploy scans)
  - configuration-manager-mcp (environment configs)
  - communications-mcp (release announcements)

#### Rollout (30 mins)
- [ ] Run quality gates with testing-validation-mcp
- [ ] Copy to production: `/local-instances/mcp-servers/deployment-release-mcp/`
- [ ] Register with mcp-config-manager
- [ ] Update MCP-COMPLETION-TRACKER.md
- [ ] Update EVENT-LOG.md
- [ ] **Celebrate:** Phase 2 complete!

**Success Criteria:**
- ✅ All 6 tools functional
- ✅ Deployment automation working for all environments
- ✅ Rollback capabilities tested
- ✅ Zero-downtime deployment patterns implemented
- ✅ Integration with 4 MCPs validated
- ✅ Tests passing (>70% coverage)
- ✅ Security scan clean

---

## 🚀 Integration Priorities

### Security & Compliance Integration (Parallel with Phase 2)
**Estimated Time:** 1-2 hours
**Priority:** HIGH

**Actions:**
- [ ] Create pre-commit hook integration with git-assistant
- [ ] Test credential detection blocking commits
- [ ] Test PHI detection in medical workspace
- [ ] Document integration pattern in WORKSPACE_GUIDE.md
- [ ] Enable automatic security scanning on every commit

**Success Criteria:**
- ✅ Pre-commit hooks active
- ✅ Commits blocked when violations found
- ✅ User-friendly error messages
- ✅ Documentation updated

---

## 📈 Progress Tracking

### Milestones
- **Start:** 14/28 MCPs (50%)
- **Week 1 Complete:** 16/28 MCPs (57%)
- **Week 2 Complete:** 17/28 MCPs (61%) + Security integration
- **Phase 2 Complete:** All 4 operations MCPs operational

### Success Metrics
- **Build Quality:** Zero TypeScript errors for all MCPs
- **Test Coverage:** >70% for all MCPs
- **Integration Tests:** 100% pass rate
- **Security Scans:** All passing
- **Time Savings:** Validate 2x parallelization speedup

---

## ⚠️ Risk Mitigation

### Potential Risks

**1. Deployment MCP Complexity**
- **Risk:** Larger scope than other MCPs (6 tools, multi-system coordination)
- **Mitigation:** Break into 2 phases if needed (basic deployment week 1, advanced features week 2)
- **Fallback:** Skip zero-downtime deployment initially, add in v1.1

**2. Integration Testing Overhead**
- **Risk:** Each MCP needs integration testing with multiple MCPs
- **Mitigation:** Use testing-validation-mcp for automated validation
- **Fallback:** Document integration tests, execute manually if automation fails

**3. Security Integration Complexity**
- **Risk:** Git hooks may conflict with existing workflows
- **Mitigation:** Make hooks optional initially, gather feedback
- **Fallback:** Provide manual security scan command as alternative

---

## 📋 Daily Checklist Template

For each MCP build:

### Day Start
- [ ] Review specification and design decisions
- [ ] Set up project folder structure
- [ ] Initialize dev-instance with package.json + tsconfig.json

### Development
- [ ] Implement 1-2 tools at a time
- [ ] Write tests as you go (not at the end)
- [ ] Build and test incrementally
- [ ] Update EVENT-LOG.md with progress

### Day End
- [ ] All tools implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Quality gates passed

### Rollout
- [ ] Final validation with testing-validation-mcp
- [ ] Security scan with security-compliance-mcp
- [ ] Copy to production
- [ ] Register MCP
- [ ] Update trackers

---

## 🎓 Lessons from Phase 1

**Apply These Learnings:**

1. **Clear specification = rapid build**
   - Agent coordinator: 1 day from clear spec
   - Spend 30-45 mins on planning upfront

2. **Test as you go**
   - Don't wait until end to write tests
   - Testing-validation-mcp catches issues early

3. **Stateless when possible**
   - 11/14 MCPs are stateless (simpler, faster)
   - Only use workflow-orchestrator when multi-phase workflows exist

4. **Documentation matters**
   - Comprehensive READMEs reduce integration friction
   - Examples in docs save time later

5. **Integration testing critical**
   - Extended testing caught issues in 2 MCPs
   - Test cross-MCP integrations early

---

## 🔄 Continuous Improvement

### After Each MCP
- [ ] Log learnings in MCP-COMPLETION-TRACKER.md
- [ ] Update build time estimates
- [ ] Identify reusable patterns
- [ ] Document any issues in TROUBLESHOOTING.md

### End of Week Reviews
- [ ] Review progress vs. plan
- [ ] Adjust estimates for week 2
- [ ] Identify blockers
- [ ] Celebrate wins

---

## 📚 Reference Documents

**Planning:**
- IMPLEMENTATION_PLAN.md (Week 8-11 specifications)
- MCP-BUILD-INTEGRATION-GUIDE.md (how to build MCPs)
- ROLLOUT-CHECKLIST.md (quality gates)

**Templates:**
- agent-coordinator-mcp-server-project/ (recent example)
- testing-validation-mcp-project/ (stateless MCP example)
- project-management-mcp-server/ (stateful MCP example with workflow-orchestrator)

**Validation:**
- testing-validation-mcp tools
- security-compliance-mcp tools
- MCP-COMPLETION-TRACKER.md

---

## 🎉 Success Criteria - Phase 2 Complete

**Operations Layer Operational When:**
- [x] Parallelization MCP operational ✅ (Week 7)
- [ ] Configuration Manager MCP deployed (Week 8)
- [ ] Code Review MCP deployed (Week 9)
- [ ] Deployment & Release MCP deployed (Weeks 10-11)
- [ ] Security integration with git-assistant complete
- [ ] All integration tests passing
- [ ] Documentation complete
- [ ] 17/28 MCPs complete (61%)

**Ready For:** Phase 3 - Intelligence Layer (BI Analyst, Performance Monitor, Documentation Generator)

---

**Status:** Active Plan
**Start Date:** November 1, 2025 (projected)
**End Date:** November 15, 2025 (projected)
**Owner:** Workspace Team
**Last Updated:** October 30, 2025

---

**This plan provides the roadmap for completing Phase 2 operations MCPs with parallelization acceleration. Update daily as work progresses.**
