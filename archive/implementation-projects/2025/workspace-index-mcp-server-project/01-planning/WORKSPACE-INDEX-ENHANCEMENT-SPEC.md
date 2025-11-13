---
type: specification
phase: planning
project: project-index-generator-mcp-server-project
tags: [enhancement, documentation-consistency, validation, automation]
goal-id: "01"
priority: high
status: planning
created: 2025-11-03
---

# Workspace Index MCP Enhancement Specification

**Enhancement Goal**: Transform project-index-generator-mcp into workspace-index-mcp with documentation consistency validation, drift detection, and automated correction capabilities.

**Strategic Rationale**: Documentation drift is a system health indicator. Automated consistency enforcement prevents compounding technical debt and maintains workspace reliability.

---

## 1. Overview

### Current State (project-index-generator-mcp)

**Purpose**: Generate searchable file catalogs and project indexes
**Tools**: 3 tools
- `generate_project_index()` - Create comprehensive file catalog
- `update_indexes_for_paths()` - Efficient targeted updates
- `check_index_freshness()` - Detect stale indexes

**Focus**: File discovery and searchability

### Enhanced State (workspace-index-mcp)

**New Purpose**: Workspace indexing + documentation consistency enforcement
**Tools**: 6 tools (3 existing + 3 new)
- Existing: generate_project_index, update_indexes_for_paths, check_index_freshness
- **NEW**: validate_workspace_documentation, track_documentation_drift, update_workspace_docs_for_reality

**Focus**: File discovery + validation + automated consistency

---

## 2. Problem Statement

### The Problem

Documentation drift occurs when workspace structure changes but documentation isn't updated:
- MCPs added/removed → counts in guides become stale
- Projects archived → status references remain incorrect
- Templates created → inventories outdated
- Manual updates → error-prone and forgotten

### Recent Example (2025-11-03)

Documentation audit revealed:
- ❌ WORKSPACE_GUIDE.md said "20 projects" (actually 22)
- ❌ WORKSPACE_ARCHITECTURE.md listed agent-coordinator as active (actually archived)
- ❌ TEMPLATES_INDEX.md listed 1 template (actually 24)

**Impact**: Confusion, wasted time, incorrect assumptions about system state

### Root Cause

No automated validation that documentation matches filesystem reality.

---

## 3. Solution Design

### Architecture Principle

**The scanner knows the truth**. When workspace-index-mcp scans the filesystem, it knows:
- Actual MCP count (scan local-instances/mcp-servers/)
- Actual template count (scan templates-and-patterns/)
- Actual staging projects (scan development/mcp-servers/)

**Validation = comparing documentation against scanned reality**

### Three Pillars

1. **Validation**: Check docs match reality
2. **Detection**: Track what changed over time
3. **Correction**: Auto-update docs to match reality

---

## 4. New Tool Specifications

### Tool 1: validate_workspace_documentation()

**Purpose**: Scan workspace, compare against key documentation files, report inconsistencies

**Parameters**:
```typescript
{
  checks?: Array<"mcp_counts" | "cross_references" | "status_accuracy" | "template_inventory" | "all">;
  targets?: string[];  // Specific docs to validate (default: all key docs)
  reportFormat?: "summary" | "detailed" | "actionable";
  autoFix?: boolean;   // Default false - just report
}
```

**Validation Rules**:

1. **MCP Counts**
   - Scan: `local-instances/mcp-servers/` → count directories
   - Check: WORKSPACE_GUIDE.md, WORKSPACE_ARCHITECTURE.md for matching counts
   - Report: Line numbers with incorrect counts

2. **Template Inventory**
   - Scan: `templates-and-patterns/mcp-server-templates/templates/` → count templates
   - Check: TEMPLATES_INDEX.md for complete listing
   - Report: Missing or extra templates

3. **Status Accuracy**
   - Scan: Check archive directories vs active directories
   - Check: Documentation references to archived/active status
   - Report: Conflicts (e.g., doc says "active" but in archive/)

4. **Cross-References**
   - Scan: Documentation file paths and MCP names
   - Check: Links and references are accurate
   - Report: Broken references

**Return Format**:
```typescript
{
  valid: boolean;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
  };
  issues: Array<{
    severity: "critical" | "warning" | "info";
    category: string;
    file: string;
    line?: number;
    expected: string;
    actual: string;
    suggestion: string;
  }>;
  lastValidated: string; // ISO timestamp
}
```

### Tool 2: track_documentation_drift()

**Purpose**: Compare current workspace state against last validation, detect what changed

**Parameters**:
```typescript
{
  since?: "last-validation" | string; // ISO date
  categories?: Array<"mcps" | "templates" | "projects" | "all">;
  includeMinorChanges?: boolean; // Include trivial changes like date updates
}
```

**Drift Detection**:

Compares current scan against stored baseline:
- MCPs added/removed
- Projects created/archived
- Templates added/removed
- Documentation last-modified dates

**Return Format**:
```typescript
{
  driftDetected: boolean;
  since: string; // ISO timestamp
  changes: Array<{
    category: string;
    type: "added" | "removed" | "modified" | "renamed";
    path: string;
    details: string;
  }>;
  affectedDocumentation: string[]; // Docs likely to be stale
  recommendedAction: string;
}
```

### Tool 3: update_workspace_docs_for_reality()

**Purpose**: Auto-correct documentation to match filesystem reality

**Parameters**:
```typescript
{
  targets?: string[];  // Specific docs to update (default: all with issues)
  dryRun?: boolean;    // Preview changes without applying (default: true)
  createBackup?: boolean; // Backup before changes (default: true)
  issues?: Array<Issue>; // From validate_workspace_documentation()
}
```

**Update Strategy**:

1. **Count Updates**
   - Find patterns like "22 MCPs", "24 templates" in documentation
   - Replace with current scanned counts
   - Preserve surrounding context

2. **Status Updates**
   - Find references to archived projects as "active"
   - Update status markers
   - Add archive notes where appropriate

3. **Inventory Updates**
   - Regenerate template listings
   - Update MCP category listings
   - Synchronize indexes

**Safety Mechanisms**:
- Always create backup before modifications
- Show diff preview in dry-run mode
- Validate changes don't break markdown syntax
- Log all changes to workspace-brain

**Return Format**:
```typescript
{
  applied: boolean;
  dryRun: boolean;
  backupPath?: string;
  changes: Array<{
    file: string;
    linesModified: number;
    preview: string; // Diff format
  }>;
  validation: {
    syntaxValid: boolean;
    errors: string[];
  };
}
```

---

## 5. Multi-Tiered Automation

### Tier 1: Git Pre-Commit Hook (Real-Time)

**Trigger**: Before any git commit
**Action**: Quick validation of affected documentation files
**Speed**: <5 seconds

```bash
# .git/hooks/pre-commit enhancement
if [staged files include documentation]; then
  workspace-index-mcp: validate_workspace_documentation({
    mode: "quick",
    targets: stagedDocFiles
  })
  if critical_issues:
    WARN user
    ALLOW commit (don't block)
fi
```

### Tier 2: Post-Operation Hooks (Event-Driven)

**Triggers**:
- MCP deployment: `mcp-config-manager.register_mcp_server()`
- MCP unregistration: `mcp-config-manager.unregister_mcp_server()`
- Project wrap-up: `project-management.wrap_up_project()`
- Template creation: File added to templates/

**Action**: Targeted drift detection + optional auto-fix

```typescript
// Integration in project-management-mcp
after wrap_up_project():
  workspace-index-mcp.track_documentation_drift()
  if drift.detected && drift.affectedDocs:
    REPORT to user
    OFFER auto-fix option
```

### Tier 3: Scheduled Deep Scans (Proactive)

**Schedule**: Weekly (Monday 9 AM)
**Action**: Comprehensive validation + drift analysis
**Mechanism**: Cron job or workspace-brain scheduled task

```typescript
Weekly Task:
  workspace-index-mcp.validate_workspace_documentation({
    mode: "comprehensive",
    checks: "all",
    reportFormat: "actionable"
  })

  Log results to workspace-brain
  If major drift: Notify user
```

### Tier 4: On-Demand (Manual)

**Trigger**: User request or Claude proactive check
**Action**: Full validation with interactive fix workflow

---

## 6. Drift Detection Thresholds

### Minor Drift (Warning Only)
- 1-2 count mismatches
- Stale "Last Updated" dates (>30 days old)
- Cosmetic inconsistencies

**Action**: Log, report in weekly summary

### Moderate Drift (Report + Suggest Fix)
- 3-5 count mismatches
- Missing cross-references
- Status conflicts (active vs archived)
- Template inventory gaps

**Action**: Immediate report, offer auto-fix

### Major Drift (Alert + Require Attention)
- 6+ count mismatches
- Critical documentation completely missing
- Structural changes not reflected
- Archive directories not documented

**Action**: Block weekly validation, require user review

---

## 7. Implementation Phases

### Phase 1: Core Validation (Week 1)

**Deliverables**:
1. ✅ Rename: project-index-generator-mcp → workspace-index-mcp
2. ✅ Tool: `validate_workspace_documentation()` implementation
3. ✅ Validation rules for MCP counts, templates, status
4. ✅ Manual on-demand validation only (no automation yet)
5. ✅ Unit tests for validation logic

**Success Criteria**:
- Tool returns accurate drift reports
- All validation rules working
- No false positives on current workspace

### Phase 2: Auto-Detection (Week 2)

**Deliverables**:
1. ✅ Tool: `track_documentation_drift()` implementation
2. ✅ Baseline storage (last validation state)
3. ✅ Git pre-commit hook integration (Tier 1)
4. ✅ Post-operation hook integration (Tier 2)
5. ✅ Integration tests

**Success Criteria**:
- Drift detected accurately after changes
- Git commits show warnings when appropriate
- MCP operations trigger validation

### Phase 3: Auto-Correction (Week 3)

**Deliverables**:
1. ✅ Tool: `update_workspace_docs_for_reality()` implementation
2. ✅ Dry-run preview mode
3. ✅ Backup/rollback mechanism
4. ✅ Markdown syntax validation
5. ✅ Integration with validation reports

**Success Criteria**:
- Safe auto-correction of known issues
- All changes create backups
- Syntax remains valid after updates

### Phase 4: Autonomous Documentation Management (Active)

**Status**: ✅ APPROVED - Implementation in progress (2025-11-04)

**Purpose**: Enable autonomous detection, classification, and resolution of documentation lifecycle issues (supersession, consolidation, archival) using confidence-based autonomy.

**See**: `PHASE4-AUTONOMOUS-DOCUMENTATION-SPEC.md` for complete specification

**Key Capabilities**:
1. 🆕 Documentation Health Analysis - Detect superseded, redundant, or missing docs
2. 🆕 Autonomous Operations - Archive, consolidate, create replacement docs
3. 🆕 Confidence-Based Autonomy - Auto-execute high-confidence (≥0.85) operations
4. 🆕 Learning System - Improve confidence scoring from outcomes
5. 🆕 MCP Integration - Coordinate with project-management, workspace-brain, learning-optimizer

**New Tools**:
- `analyze_documentation_health()` - Scan for lifecycle issues with confidence scoring
- `execute_documentation_operation()` - Archive, consolidate, or create docs autonomously

**Framework Integration**: Follows **Autonomous Deployment Framework** pattern:
- Issue types: Superseded | Redundant | Missing
- Confidence thresholds: ≥0.85 auto-execute, <0.85 require approval
- Safety: Backups, dry-run, first-time pattern approval, rollback
- Learning: Log outcomes to workspace-brain, adjust confidence weights

**Implementation Phases**:
1. ⏳ Phase 4A: Documentation Health Analysis (Week 1)
   - Tool: `analyze_documentation_health()` implementation
   - Detection patterns: supersession, redundancy, staleness
   - Confidence scoring algorithm
   - Manual trigger only
2. ⏳ Phase 4B: Autonomous Operations (Week 2)
   - Tool: `execute_documentation_operation()` implementation
   - Operations: archive, consolidate, create
   - Dry-run preview, backup/rollback
   - First-time pattern approval
3. ⏳ Phase 4C: Learning System & Integration (Week 3)
   - workspace-brain logging
   - Confidence weight adjustment
   - Post-operation hooks
   - Weekly scheduled scans

**Task Executor Workflow**: `temp/workflows/phase4a-documentation-health-analysis/`
- 15 tasks, 32.5 estimated hours
- Constraints: ±0.1 confidence accuracy, <30s scan time, zero false positives

**Success Criteria**:
- Correctly identifies 2025-11-04 consolidation scenario (3 docs → archive + new README)
- Confidence scores ±0.1 of human judgment
- 90%+ auto-execution rate after learning (5+ operations)
- Manual documentation cleanup reduced by 80%

**Motivation**: Manual documentation cleanup on 2025-11-04 revealed need for autonomous detection of superseded/redundant docs and auto-generation of concise replacements.

---

## 8. Rename Strategy

### Migration Plan

**From**: project-index-generator-mcp-server
**To**: workspace-index-mcp-server

**Steps**:

1. **Development Project**
   - Rename: `development/mcp-servers/project-index-generator-mcp-server-project/`
   - → `development/mcp-servers/workspace-index-mcp-server-project/`
   - Update all internal references

2. **Production Instance**
   - Rename: `local-instances/mcp-servers/project-index-generator-mcp-server/`
   - → `local-instances/mcp-servers/workspace-index-mcp-server/`

3. **Configuration**
   - Update: `~/.claude.json` MCP server entry
   - Old: `"project-index-generator": { "command": "node", ... }`
   - New: `"workspace-index": { "command": "node", ... }`

4. **Templates**
   - Rename: `templates/project-index-generator-mcp-server-template/`
   - → `templates/workspace-index-mcp-server-template/`

5. **Documentation**
   - Update all references in:
     - WORKSPACE_GUIDE.md
     - WORKSPACE_ARCHITECTURE.md
     - TEMPLATES_INDEX.md
     - All MCP README files

**Backward Compatibility**:
- No backward compatibility needed (internal tool, no external dependencies)
- Single atomic rename + config update + restart Claude Code

---

## 9. Integration Points

### workspace-brain-mcp
**Purpose**: Log all drift events for pattern analysis
**Integration**:
```typescript
after validate_workspace_documentation():
  workspace-brain.log_event({
    event_type: "documentation-drift",
    event_data: {
      drift_detected: boolean,
      issues_count: number,
      categories: string[],
      auto_fixed: boolean
    }
  })
```

### mcp-config-manager
**Purpose**: Trigger validation after MCP registration/unregistration
**Integration**: Add post-operation hooks

### project-management-mcp
**Purpose**: Trigger validation after project wrap-up
**Integration**: Call track_documentation_drift() in wrap_up_project()

### learning-optimizer-mcp
**Purpose**: Track documentation issues as learnings
**Integration**: Log frequent drift patterns as preventable issues

---

## 10. Performance Considerations

### Targets

- **Git pre-commit**: <5 seconds (quick mode)
- **Post-operation**: <10 seconds (targeted validation)
- **Weekly deep scan**: <2 minutes (comprehensive)
- **Auto-correction**: <30 seconds

### Optimization Strategies

1. **Caching**
   - Cache filesystem scans (5-minute TTL)
   - Cache validation results (1-hour TTL)
   - Invalidate on filesystem changes

2. **Incremental Scanning**
   - Track last-modified times
   - Only re-scan changed directories
   - Use git diff for targeted checks

3. **Parallel Processing**
   - Scan multiple directories concurrently
   - Validate multiple docs in parallel
   - Use worker threads for large scans

---

## 11. Success Metrics

### Immediate (Phase 1-2)
- ✅ Zero false positives in validation
- ✅ <5 second git pre-commit overhead
- ✅ 100% detection of introduced drift

### Short-Term (Phase 3-4)
- ✅ 80%+ auto-fix success rate (no manual edits needed)
- ✅ Weekly scans complete in <2 minutes
- ✅ Zero documentation bugs filed

### Long-Term (1-3 months)
- ✅ Documentation drift reduced by 90%
- ✅ Pattern analysis identifies prevention opportunities
- ✅ Zero stale documentation in key guides

---

## 12. Risks & Mitigation

### Risk 1: Scope Creep
**Description**: Too many validation rules, becomes unwieldy
**Mitigation**: Start with 3 core rules (counts, status, inventory), expand based on real drift patterns

### Risk 2: False Positives
**Description**: Validation flags legitimate variations as drift
**Mitigation**:
- Exclude patterns (e.g., "approximately 22 MCPs" vs "22 MCPs")
- Severity levels (critical vs info)
- Allowlist for known exceptions

### Risk 3: Performance Impact
**Description**: Git commits become slow
**Mitigation**:
- Quick mode only checks affected files
- Cache filesystem scans
- Async validation (non-blocking)

### Risk 4: Breaking Changes
**Description**: Rename causes config issues
**Mitigation**:
- Atomic rename + config update
- Clear migration guide
- Test with all dependent MCPs

---

## 13. Documentation Updates Required

After implementation:

1. **WORKSPACE_ARCHITECTURE.md**
   - Update workspace-index-mcp description
   - Add automation tier explanations
   - Document integration points

2. **WORKSPACE_GUIDE.md**
   - Update MCP listings
   - Add validation workflow guidance

3. **TEMPLATES_INDEX.md**
   - Rename template entry

4. **README.md** (workspace-index project)
   - Add new tool documentation
   - Document validation rules
   - Add usage examples

---

## 14. Testing Strategy

### Unit Tests
- Validation rule logic
- Drift detection algorithms
- Auto-correction safety checks
- Markdown syntax preservation

### Integration Tests
- Git hook triggering
- MCP operation hooks
- Workspace-brain logging
- Multi-doc updates

### E2E Tests
1. Add new MCP → detect drift → auto-fix
2. Archive project → validate status updates
3. Weekly scan → report generation
4. Manual validation → dry-run preview → apply

---

## 15. Next Steps

**Immediate Actions**:

1. ✅ Create this specification (completed)
2. ⏳ Review with user for approval
3. ⏳ Create task-executor workflow for Phase 1 implementation
4. ⏳ Begin Phase 1: Core validation tool implementation

**Decision Points**:
- Approve phased implementation plan?
- Confirm validation rules cover key use cases?
- Approve rename from project-index-generator to workspace-index?

---

**Specification Version**: 1.2 (Phase 4 active)
**Created**: 2025-11-03
**Last Updated**: 2025-11-04
**Status**: ✅ PHASES 1-3 COMPLETE | ⏳ PHASE 4 IN PROGRESS
**Implementation Status**:
- ✅ Phase 1: Core Validation (complete)
- ✅ Phase 2: Auto-Detection (complete)
- ✅ Phase 3: Auto-Correction (complete, verified)
- ⏳ Phase 4: Autonomous Documentation Management (in progress - see PHASE4-AUTONOMOUS-DOCUMENTATION-SPEC.md)
  - ⏳ Phase 4A: Documentation Health Analysis (Week 1 - task-executor workflow created)
  - ⏳ Phase 4B: Autonomous Operations (Week 2 - pending)
  - ⏳ Phase 4C: Learning System & Integration (Week 3 - pending)
**Next Review**: After Phase 4A completion (Week 1)
