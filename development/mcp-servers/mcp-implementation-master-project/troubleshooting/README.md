---
type: system-documentation
tags: [troubleshooting, learning-system, continuous-improvement, meta-workflow]
created: 2025-10-29
status: active
---

# MCP Development Troubleshooting System

**Version:** 1.0.0
**Purpose:** Continuous learning and improvement of MCP development workflows through automated issue tracking and optimization

---

## Overview

This troubleshooting system captures issues encountered during MCP development, tracks their frequency, and automatically promotes high-impact issues to preventive checks in our development checklists.

**Key Principle:** Every issue is an opportunity to improve the process and prevent future occurrences.

---

## System Architecture

```
Issue Encountered
        ↓
Log to Domain File (configuration-issues.md, build-issues.md, etc.)
        ↓
Learning-Optimizer MCP tracks frequency
        ↓
Optimization triggers (3+ occurrences OR 5+ issues)
        ↓
Automatic optimization:
  - Merge duplicates
  - Categorize by type
  - Promote high-frequency issues (3+) to preventive checks
        ↓
Update relevant checklist (MCP-CONFIGURATION-CHECKLIST.md, etc.)
        ↓
Future developments: Issue prevented
        ↓
Track prevention success rate
```

---

## Domain-Based Structure

Each domain has its own troubleshooting file:

### 1. **configuration-issues.md**
**Domain:** `mcp-configuration`
**Scope:** MCP server configuration issues
**Checklist:** MCP-CONFIGURATION-CHECKLIST.md
**Examples:**
- Duplicate registrations
- Wrong config scope (workspace vs global)
- Path errors (relative paths, missing dist/)
- Credential exposure
- Environment variable issues

---

### 2. **build-issues.md**
**Domain:** `mcp-build`
**Scope:** Build and compilation issues
**Checklist:** MCP-BUILD-INTEGRATION-GUIDE.md
**Examples:**
- TypeScript compilation errors
- Missing dependencies
- Import resolution failures
- Type mismatches
- Build tool configuration

---

### 3. **testing-issues.md**
**Domain:** `mcp-testing`
**Scope:** Testing and validation issues
**Checklist:** Testing sections in ROLLOUT-CHECKLIST.md
**Examples:**
- Test failures
- Coverage issues
- Integration test problems
- Performance benchmark failures
- Mock/stub issues

---

### 4. **deployment-issues.md**
**Domain:** `mcp-deployment`
**Scope:** Deployment and rollout issues
**Checklist:** ROLLOUT-CHECKLIST.md
**Examples:**
- Registration failures
- Claude Code not loading MCP
- Path not found errors
- Permission issues
- Version conflicts

---

### 5. **integration-issues.md**
**Domain:** `mcp-integration`
**Scope:** Cross-MCP integration issues
**Checklist:** Extended Integration Testing section in ROLLOUT-CHECKLIST.md
**Examples:**
- State synchronization problems
- Tool chaining failures
- Dependency conflicts
- Communication issues between MCPs
- Workflow orchestrator integration

---

### 6. **documentation-issues.md**
**Domain:** `mcp-documentation`
**Scope:** Documentation consistency and quality issues
**Checklist:** Documentation sections in ROLLOUT-CHECKLIST.md
**Examples:**
- README out of sync with tracker
- Missing API documentation
- Unclear tool descriptions
- Version number inconsistencies
- Changelog not updated

---

## Issue Format

Each issue follows this standardized format for learning-optimizer integration:

```markdown
### Issue #XXX: [Brief Description]

**Domain:** [mcp-configuration|mcp-build|mcp-testing|mcp-deployment|mcp-integration|mcp-documentation]
**First Encountered:** YYYY-MM-DD
**Frequency:** X occurrences
**Last Seen:** YYYY-MM-DD
**Status:** [active|resolved|promoted]

#### Symptom
[Exact error message or observable behavior that indicates this issue]

#### Context
- **MCP:** [Which MCP encountered this]
- **Phase:** [Which development phase: planning, development, testing, deployment]
- **Environment:** [OS, Node version, npm version, etc.]
- **Step:** [Which specific step in the process]
- **Related Files:** [Files involved]

#### Root Cause
[Technical explanation of WHY this happened - be specific]

#### Solution
[Step-by-step resolution that worked]
```bash
# Commands or actions taken
```

#### Prevention
[How to avoid in future - added to checklist if promoted]

#### Promotion Status
- [ ] Frequency >= 3 (eligible for promotion)
- [ ] Added to checklist as preventive check
- [ ] Prevention success rate: X/X (100%)

---
```

---

## Workflow: When to Log Issues

### During Development

**When to log:**
- ✅ Any error that blocks progress for >5 minutes
- ✅ Any error requiring troubleshooting/research
- ✅ Any error not clearly documented
- ✅ Any unexpected behavior
- ✅ Any workaround needed

**When NOT to log:**
- ❌ Simple typos (unless recurring pattern)
- ❌ User error (unless checklist unclear)
- ❌ One-time environmental issues

### AI Assistant (Claude) Process

When encountering an issue during MCP development:

1. **Resolve the issue** - Fix it first
2. **Determine domain** - Which domain file?
3. **Check for duplicate** - Is this already documented?
4. **If new issue:**
   ```
   Use: track_issue(
     domain="mcp-configuration",
     title="Duplicate registration error",
     symptom="Error: MCP 'server-name' already registered in .mcp.json",
     solution="1. Run sync_mcp_configs to detect duplicates\n2. Remove from one location...",
     root_cause="MCP was defined in both workspace and global configs",
     prevention="Added pre-flight duplicate check to configuration checklist",
     context={
       "mcp": "project-management-mcp",
       "phase": "deployment",
       "os": "macOS",
       "step": "Registration"
     }
   )
   ```

5. **If existing issue:**
   ```
   Frequency automatically incremented by learning-optimizer
   Last Seen date updated
   ```

6. **Check optimization triggers:**
   ```
   Use: check_optimization_triggers(domain="mcp-configuration")
   ```

7. **If triggers met:**
   ```
   Use: optimize_knowledge_base(domain="mcp-configuration")
   ```

8. **If issue promoted:**
   - Update relevant checklist with preventive check
   - Document promotion in issue
   - Track prevention success rate

---

## 🚨 MANDATORY Post-Resolution Checklist

**CRITICAL: This checklist MUST be completed after EVERY issue resolution.**

**Purpose:** Ensure feedback loop is triggered automatically, not relying on memory.

### Automatic Trigger Detection

**You are resolving an issue if you observe yourself doing ANY of these:**

1. ⏱️ **Time Threshold**: Spent >5 minutes on one problem
2. 🔍 **Multiple Diagnostics**: Ran 3+ diagnostic commands (ls, grep, cat, test, jq)
3. 💾 **Backup/Restore**: Used backup files to recover from errors
4. 📖 **Research Required**: Read documentation files to solve problem
5. ⚠️ **Breaking Change**: Fixed something that broke other things
6. ⚙️ **Configuration Change**: Modified .mcp.json or config files due to errors
7. 🔨 **Build/Rebuild**: Ran npm install, npm build, or tsc to fix errors
8. 🧪 **Test Failures**: Debugged and fixed failing tests
9. 🔄 **Multiple Attempts**: Tried 3+ different solutions before finding fix
10. 📝 **Workaround Needed**: Applied a workaround instead of ideal solution

**If ANY trigger detected → STOP → Complete this checklist immediately**

---

### Checklist Steps

#### Step 1: Duration & Impact Assessment

- [ ] **Issue duration >5 minutes?**
  - YES → **MUST LOG** (proceed to Step 2)
  - NO → Skip logging (unless other criteria met)

- [ ] **Issue duration >15 minutes?**
  - YES → **HIGH PRIORITY LOG** (mark as high-impact in issue)

- [ ] **Blocked other work?**
  - YES → Note in context

#### Step 2: Domain Classification

Determine which domain file to use:

- [ ] **Configuration issue?**
  - Path errors, .mcp.json issues, registration failures, duplicate configs
  - → `troubleshooting/configuration-issues.md`
  - Domain: `mcp-configuration`

- [ ] **Build issue?**
  - TypeScript errors, compilation failures, dependency issues, import errors
  - → `troubleshooting/build-issues.md`
  - Domain: `mcp-build`

- [ ] **Testing issue?**
  - Test failures, coverage problems, integration test errors
  - → `troubleshooting/testing-issues.md`
  - Domain: `mcp-testing`

- [ ] **Deployment issue?**
  - Registration failures, Claude Code not loading, permission errors
  - → `troubleshooting/deployment-issues.md`
  - Domain: `mcp-deployment`

- [ ] **Integration issue?**
  - Cross-MCP problems, state sync issues, tool chaining failures
  - → `troubleshooting/integration-issues.md`
  - Domain: `mcp-integration`

- [ ] **Documentation issue?**
  - README out of sync, missing docs, version inconsistencies
  - → `troubleshooting/documentation-issues.md`
  - Domain: `mcp-documentation`

#### Step 3: Check for Duplicates

- [ ] **Search domain file for similar issues**
  ```bash
  # Example search
  grep -i "keyword" troubleshooting/configuration-issues.md
  ```

- [ ] **If duplicate found:**
  - Note the issue number
  - Increment frequency count manually (or via learning-optimizer)
  - Update "Last Seen" date
  - Skip to Step 5

- [ ] **If new issue:**
  - Proceed to Step 4

#### Step 4: Log the Issue

**Option A: If learning-optimizer MCP is available**

```javascript
mcp__learning-optimizer__track_issue({
  domain: "mcp-configuration",  // or mcp-build, mcp-testing, etc.
  title: "Brief description (< 60 chars)",
  symptom: "Exact error message or observable behavior",
  solution: "Step-by-step resolution with commands",
  root_cause: "Technical explanation of WHY it happened",
  prevention: "How to avoid in future",
  context: {
    mcp: "mcp-server-name",
    phase: "deployment",  // or development, testing, etc.
    environment: "macOS, Node v22.20.0",
    step: "Configuration registration",
    related_files: [".mcp.json", "dist/server.js"]
  }
})
```

- [ ] **Executed track_issue() successfully**

**Option B: If learning-optimizer NOT available (fallback)**

- [ ] **Manually add issue to domain file** using issue template
- [ ] **Update domain statistics** at top of file
- [ ] **Increment total issue count**

**CRITICAL: If Option A fails, IMMEDIATELY use Option B. Do NOT skip logging.**

#### Step 5: Check Optimization Triggers

- [ ] **Check if optimization triggers are met**

```javascript
mcp__learning-optimizer__check_optimization_triggers({
  domain: "mcp-configuration"  // use appropriate domain
})
```

**Triggers to check manually if MCP unavailable:**
- Any issue with frequency >= 3?
- Total issues in domain >= 5?
- Duplicate issues detected?

#### Step 6: Run Optimization (If Triggered)

- [ ] **If triggers met, run optimization**

```javascript
mcp__learning-optimizer__optimize_knowledge_base({
  domain: "mcp-configuration"
})
```

**Manual optimization if MCP unavailable:**
- Merge duplicate issues
- Categorize by keywords
- Identify promotion candidates (frequency >= 3)

#### Step 7: Update Checklist (If Promoted)

- [ ] **If issue promoted (frequency >= 3):**
  - Add preventive check to relevant checklist
  - Link checklist ← → issue file
  - Document promotion in issue
  - Mark promotion status checkboxes

**Checklists to update:**
- Configuration issues → MCP-CONFIGURATION-CHECKLIST.md
- Build issues → MCP-BUILD-INTEGRATION-GUIDE.md
- Testing issues → ROLLOUT-CHECKLIST.md (Testing sections)
- Deployment issues → ROLLOUT-CHECKLIST.md (Deployment sections)
- Integration issues → ROLLOUT-CHECKLIST.md (Integration sections)
- Documentation issues → ROLLOUT-CHECKLIST.md (Documentation sections)

#### Step 8: Verification

- [ ] **Issue logged in domain file** ✅
- [ ] **Domain statistics updated** ✅
- [ ] **Optimization checked** ✅
- [ ] **If promoted: Checklist updated** ✅

---

### Quick Reference Card

**Copy this to every MCP development session for immediate reference:**

```
🚨 POST-RESOLUTION CHECKLIST 🚨

Spent >5 min troubleshooting? → MUST LOG

1. [ ] Duration check (>5 min = must log, >15 min = high priority)
2. [ ] Classify domain (config/build/test/deploy/integration/docs)
3. [ ] Search for duplicates in domain file
4. [ ] Log issue (try learning-optimizer, fallback to manual)
5. [ ] Check optimization triggers (frequency >=3, total >=5)
6. [ ] Run optimization if triggered
7. [ ] Update checklist if promoted (frequency >=3)
8. [ ] Verify all steps completed

NEVER SKIP: If learning-optimizer fails, manually log immediately.
```

---

## Optimization Triggers

Learning-optimizer automatically checks these thresholds:

### Trigger 1: High-Impact Issue (3+ occurrences)
```
Any single issue with frequency >= 3
Action: Promote to preventive check in relevant checklist
Impact: Prevents issue before it happens
```

### Trigger 2: Technical Debt (5+ total issues)
```
Total issues in domain >= 5
Action: Reorganize and categorize all issues
Impact: Maintains knowledge base organization
```

### Trigger 3: Duplicate Detection
```
Two or more issues with similar symptoms
Action: Merge immediately, combine frequency counts
Impact: Reduces confusion, accurate tracking
```

---

## Promotion Process

When an issue reaches 3+ occurrences:

### 1. AI Detects Promotion Eligibility
```
Issue #26: Duplicate registration error
Frequency: 3 occurrences
Status: Eligible for promotion
```

### 2. Add to Relevant Checklist

**Example for configuration issue:**

Update `MCP-CONFIGURATION-CHECKLIST.md`:

```markdown
### Pre-Configuration Check: Duplicate Detection
**Promoted from:** configuration-issues.md Issue #26 (3 occurrences)

```bash
# Check for duplicate registrations
mcp__mcp-config-manager__sync_mcp_configs

# Verify no duplicates
grep -r "server-name" .mcp.json ~/.config/claude-code/config.json
```

**Pass Criteria:**
- ✅ No duplicate registrations detected
- ✅ Server appears in only ONE config file

**If duplicate found:** Follow Issue #26 resolution steps
```

### 3. Update Issue with Promotion Status

```markdown
#### Promotion Status
- [x] Frequency >= 3 (eligible for promotion)
- [x] Added to MCP-CONFIGURATION-CHECKLIST.md Section 4
- [ ] Prevention success rate: 0/0 (tracking started)
```

### 4. Track Prevention Success

After promotion, track how many times the preventive check **prevents** the issue:

```markdown
#### Promotion Status
- [x] Frequency >= 3 (promoted after 3 occurrences)
- [x] Added to MCP-CONFIGURATION-CHECKLIST.md Section 4
- [x] Prevention success rate: 5/5 (100% - prevented 5 times)

**Prevention Metrics:**
- Occurrences before promotion: 3
- Builds after promotion: 5
- Times prevented: 5
- Prevention rate: 100%
```

---

## Integration with Existing Systems

### vs. WORKFLOW-IMPROVEMENT-IDEAS.md

| Troubleshooting Files | WORKFLOW-IMPROVEMENT-IDEAS.md |
|----------------------|-------------------------------|
| **Tactical** - Specific technical issues | **Strategic** - Process improvements |
| Auto-tracked by learning-optimizer | Human + AI collaboration |
| Promotes to preventive checks | Proposes workflow changes |
| Example: "npm install timeout" | Example: "Add documentation sync to workflow" |
| Continuous automated optimization | Weekly/monthly review |

**Relationship:**
- Troubleshooting files identify **recurring technical patterns**
- WORKFLOW-IMPROVEMENT-IDEAS.md proposes **strategic process changes**
- Both feed into continuous improvement

**Example Flow:**
1. Configuration issues file shows 5 issues related to path errors
2. Pattern emerges: Absolute paths confusing developers
3. Propose in WORKFLOW-IMPROVEMENT-IDEAS.md: "Create path helper tool"
4. Implement path helper tool
5. Path errors decrease in configuration issues file

---

### vs. Template TROUBLESHOOTING.md

**Template TROUBLESHOOTING.md** (in mcp-server-templates):
- Scope: Template **installation** issues
- Domain: Installation/setup process
- Auto-learning for installation workflow

**This System** (mcp-implementation-master-project/troubleshooting/):
- Scope: MCP **development** issues
- Domains: All phases (config, build, test, deploy, integration, docs)
- Auto-learning for development workflow

**Both use same pattern:** Issue tracking → Frequency → Optimization → Promotion → Prevention

---

## Commands Reference

### Track New Issue
```
mcp__learning-optimizer__track_issue(
  domain="mcp-configuration",  // or mcp-build, mcp-testing, etc.
  title="Brief description",
  symptom="Error message or observable behavior",
  solution="Step-by-step resolution",
  root_cause="Why this happened",
  prevention="How to avoid in future",
  context={
    "mcp": "server-name",
    "phase": "deployment",
    "os": "macOS",
    "step": "Configuration"
  }
)
```

### Check Optimization Triggers
```
mcp__learning-optimizer__check_optimization_triggers(
  domain="mcp-configuration"
)
```

### Optimize Knowledge Base
```
mcp__learning-optimizer__optimize_knowledge_base(
  domain="mcp-configuration"
)
```

### Get Domain Statistics
```
mcp__learning-optimizer__get_domain_stats(
  domain="mcp-configuration"
)
```

### List All Issues
```
mcp__learning-optimizer__get_issues(
  domain="mcp-configuration",
  filter="high-frequency"  // optional: high-frequency, promoted, duplicates
)
```

### Detect Duplicates
```
mcp__learning-optimizer__detect_duplicates(
  domain="mcp-configuration"
)
```

---

## Metrics to Track

### Per Domain:
- Total issues documented
- Average resolution time
- Promotion rate (issues promoted / total issues)
- Prevention success rate (prevented / opportunities)

### Overall System:
- Issues per MCP build
- Time saved through prevention
- Checklist effectiveness (issues prevented / total builds)
- Knowledge base growth rate

---

## Best Practices

### For AI Assistants

1. **Always log resolved issues** - Every fix is learning
2. **Check for duplicates first** - Don't create duplicate entries
3. **Be specific in root cause** - "Path error" is not enough, explain why
4. **Document exact solution** - Commands, not just descriptions
5. **Update frequency** - Increment for existing issues
6. **Trigger optimization** - Check triggers after logging
7. **Promote proactively** - Don't wait for user to ask

### For Users

1. **Review promoted issues** - Verify preventive checks make sense
2. **Provide feedback** - Are preventive checks helping?
3. **Request optimization** - If you notice patterns, ask for optimization
4. **Track metrics** - Monitor prevention success rates
5. **Update checklists** - Ensure promoted checks are integrated

---

## Example: End-to-End Flow

### Scenario: Duplicate Registration Error

**Step 1: Issue Encountered**
```
Developer attempting to deploy project-management-mcp
Error: MCP 'project-management' already registered
Build blocked for 15 minutes
```

**Step 2: Issue Resolved**
```
Root cause: MCP defined in both .mcp.json and config.json
Solution: Removed from global config, kept in workspace
```

**Step 3: Issue Logged**
```
AI tracks issue:
  domain: mcp-configuration
  title: Duplicate registration prevents deployment
  frequency: 1 (first occurrence)
```

**Step 4: Issue Recurs**
```
Same issue with spec-driven-mcp (frequency: 2)
Same issue with task-executor-mcp (frequency: 3)
→ Trigger: Frequency >= 3
```

**Step 5: Optimization Triggered**
```
AI runs: optimize_knowledge_base(domain="mcp-configuration")
Result: Issue #26 promoted to preventive check
```

**Step 6: Checklist Updated**
```
MCP-CONFIGURATION-CHECKLIST.md Section 4 updated:
Add: Pre-deployment duplicate detection
Command: sync_mcp_configs
Pass criteria: No duplicates
```

**Step 7: Prevention Tracking**
```
Next 5 MCP deployments:
  - communications-mcp: Duplicate detected in pre-flight, fixed before deployment ✅
  - security-mcp: No duplicate, passed check ✅
  - testing-validation-mcp: Duplicate detected, fixed before deployment ✅
  - workflow-orchestrator-mcp: No duplicate, passed check ✅
  - deployment-manager-mcp: No duplicate, passed check ✅

Prevention success rate: 5/5 (100%)
Time saved: ~75 minutes (5 builds × 15 min each)
```

---

## Setup Instructions

### Initial Setup

1. **Create domain files** (this guide's directory structure)
2. **Configure learning-optimizer domains** (already done if learning-optimizer-mcp installed)
3. **Link to checklists** (add references to domain files in relevant checklists)
4. **Train AI assistants** (this README provides instructions)

### Ongoing Maintenance

1. **Weekly:** Review new issues in each domain
2. **After each MCP build:** Check for new issues to log
3. **When triggers met:** Run optimization
4. **Monthly:** Review promotion success rates
5. **Quarterly:** Assess overall system effectiveness

---

## Success Metrics

### Target Goals (After 3 Months):

- **Issue recurrence rate:** <10% (most issues only happen once)
- **Prevention rate:** >90% (preventive checks catch 90%+ of known issues)
- **Time saved:** >2 hours per MCP build
- **Promotion rate:** ~20-30% of issues (high-impact ones promoted)
- **Checklist growth:** Steady addition of preventive checks

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-29 | Initial system design and documentation |

---

**Created:** 2025-10-29
**Status:** Active System
**Maintained By:** AI + User Collaboration
**Integration:** learning-optimizer-mcp + MCP development workflow

**This system turns every issue into an opportunity for continuous improvement. Every problem solved today prevents it from happening tomorrow.**
