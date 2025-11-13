---
type: specification
phase: planning
project: workspace-index-mcp-server-project
tags: [enhancement, autonomous-management, documentation-lifecycle, confidence-based-autonomy]
goal-id: "02"
priority: high
status: planning
created: 2025-11-04
parent-spec: WORKSPACE-INDEX-ENHANCEMENT-SPEC.md
framework: autonomous-deployment
---

# Phase 4: Autonomous Documentation Management

**Enhancement Goal**: Enable workspace-index-mcp to autonomously detect, classify, and resolve documentation lifecycle issues (supersession, consolidation, archival) using confidence-based autonomy.

**Strategic Rationale**: Documentation becomes stale not just through drift (Phase 1-3), but through lifecycle changes - frameworks supersede earlier docs, overlapping docs need consolidation, outdated docs need archival. Manual detection is slow and error-prone. Autonomous management keeps documentation lean and current.

**Framework Integration**: Follows **Autonomous Deployment Framework** pattern (development/frameworks/autonomous-deployment/)

---

## 1. Overview

### What Phase 4 Adds

**Phases 1-3** (Complete):
- ✅ Validation: Check docs match filesystem reality (counts, status, inventory)
- ✅ Drift Detection: Track changes over time (MCPs added/removed, projects archived)
- ✅ Auto-Correction: Fix simple issues (update counts, fix status references)

**Phase 4** (New):
- 🆕 **Documentation Health Analysis**: Detect superseded, redundant, or missing docs
- 🆕 **Autonomous Operations**: Archive, consolidate, create replacement docs
- 🆕 **Confidence-Based Autonomy**: Auto-execute high-confidence operations, require approval for uncertain ones
- 🆕 **Learning System**: Improve confidence scoring from outcomes
- 🆕 **MCP Integration**: Coordinate with project-management, workspace-brain, learning-optimizer

### Real-World Example (What Triggered This)

**Manual Cleanup on 2025-11-04**:
1. Found 3 docs in development/mcp-servers/:
   - PRODUCTION-FEEDBACK-LOOP.md (762 lines) - superseded by Autonomous Deployment Framework
   - MCP-SYSTEM-ARCHITECTURE.md (3,397 lines) - outdated, overlaps with WORKSPACE_ARCHITECTURE.md
   - MCP-COORDINATION-README.md (198 lines) - outdated references, wrong counts
2. Manually archived all three to archive/mcp-coordination-docs-2025-11-04/
3. Manually created concise README.md (234 lines) pointing to current sources

**With Phase 4**: This entire process would be detected and suggested (or executed) autonomously.

---

## 2. Problem Statement

### The Problem

Documentation has a lifecycle that current tools don't manage:

**Type 1: Superseded Documentation**
- Framework replaces earlier approach (e.g., PRODUCTION-FEEDBACK-LOOP.md → Autonomous Deployment Framework)
- Newer comprehensive doc absorbs older doc (e.g., WORKSPACE_ARCHITECTURE.md → MCP-SYSTEM-ARCHITECTURE.md)
- Pattern evolves beyond initial documentation

**Type 2: Redundant Documentation**
- Multiple docs cover same topic with massive overlap
- Consolidated doc would be clearer than scattered docs
- Cross-references create circular dependencies

**Type 3: Missing Documentation**
- After archiving superseded docs, need replacement pointing to current source
- New framework created but no concise overview doc
- Major changes undocumented

### Current Gaps

Existing tools (Phases 1-3) handle:
- ✅ Counts wrong → fix counts
- ✅ Status incorrect → update status
- ✅ Inventory incomplete → regenerate inventory

But NOT:
- ❌ Detect when doc is superseded by framework
- ❌ Identify redundant docs that should consolidate
- ❌ Auto-generate replacement docs after archival
- ❌ Learn from past decisions to improve future confidence

---

## 3. Solution Design

### Architecture: Confidence-Based Autonomy

Following **Autonomous Deployment Framework** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCUMENTATION HEALTH SCAN                   │
│  (analyze_documentation_health tool - scheduled/triggered)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              ISSUE CLASSIFICATION & SCORING                  │
│   Type: Superseded | Redundant | Missing                    │
│   Confidence: 0.0-1.0 (based on detection patterns)         │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
   Confidence ≥0.85?        Confidence <0.85?
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  AUTO-EXECUTE    │    │  ASSISTED MODE       │
│  • Archive       │    │  • Show analysis     │
│  • Consolidate   │    │  • Suggest action    │
│  • Create        │    │  • Require approval  │
│  • Log outcome   │    │  • Learn from choice │
└─────────┬────────┘    └──────────┬───────────┘
          │                        │
          └────────────┬───────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   WORKSPACE-BRAIN LOGGING                    │
│  Record: issue type, confidence, action, outcome            │
│  Learn: Improve future confidence scoring                   │
└─────────────────────────────────────────────────────────────┘
```

### Three Documentation Issue Types

Following Autonomous Deployment Framework's 3-issue-type pattern:

**Type 1: Broken Documentation**
- **Definition**: Doc contains factual errors but is still relevant
- **Existing Tool**: `update_workspace_docs_for_reality()` (Phase 3)
- **Examples**: Wrong counts, incorrect status references, broken links
- **Phase 4 Enhancement**: None needed (already handled)

**Type 2: Superseded Documentation**
- **Definition**: Doc replaced by newer/better doc or framework
- **New Tool**: `analyze_documentation_health()` detects
- **New Tool**: `execute_documentation_operation()` archives + creates replacement
- **Examples**:
  - PRODUCTION-FEEDBACK-LOOP.md → Autonomous Deployment Framework
  - MCP-SYSTEM-ARCHITECTURE.md → WORKSPACE_ARCHITECTURE.md
  - Old README with massive overlap → concise README pointing to sources

**Type 3: Missing Documentation**
- **Definition**: After archival or framework creation, need concise overview
- **New Tool**: `execute_documentation_operation()` creates from template
- **Examples**:
  - After archiving 3 docs → create new README.md
  - After creating framework → create START_HERE.md
  - After major consolidation → create migration guide

---

## 4. New Tool Specifications

### Tool 4: analyze_documentation_health()

**Purpose**: Scan documentation for lifecycle issues (supersession, redundancy, gaps)

**Parameters**:
```typescript
{
  checks?: Array<"supersession" | "redundancy" | "consolidation" | "overlap" | "staleness" | "all">;
  scope?: "workspace" | "project" | string[]; // Paths to analyze
  confidenceThreshold?: number; // Default 0.85 (issues below threshold need approval)
  includeRecommendations?: boolean; // Default true
  depth?: "quick" | "comprehensive"; // Default "comprehensive"
}
```

**Detection Patterns**:

1. **Supersession Detection**
   ```typescript
   Indicators (weighted):
   - Doc references "deprecated", "superseded", "see instead" (0.9)
   - Newer doc in same folder with overlapping content (0.8)
   - Framework created that covers same topic (0.85)
   - Doc >6 months old + newer comprehensive doc exists (0.7)
   - Cross-references point to newer doc (0.75)

   Confidence = weighted_average(indicators_matched)
   ```

2. **Redundancy Detection**
   ```typescript
   Indicators:
   - Content overlap >60% between 2+ docs (0.8)
   - Same topic, different levels of detail (0.7)
   - Circular cross-references (0.85)
   - Multiple "README" files in same context (0.75)

   Confidence = overlap_percentage × 0.8 + structure_similarity × 0.2
   ```

3. **Consolidation Opportunities**
   ```typescript
   Indicators:
   - 3+ docs <500 lines each on related topics (0.7)
   - Fragmented coverage of single system (0.8)
   - User recently manually consolidated similar docs (0.9)

   Confidence = pattern_match_score
   ```

4. **Staleness Detection**
   ```typescript
   Indicators:
   - Last modified >12 months + no references (0.6)
   - References non-existent files/MCPs (0.85)
   - Describes architecture that changed (0.75)
   - "Planned" features now implemented elsewhere (0.8)

   Confidence = recency_factor × accuracy_factor
   ```

**Return Format**:
```typescript
{
  healthScore: number; // 0-100 (100 = perfect health)
  issues: Array<{
    type: "superseded" | "redundant" | "missing" | "stale";
    confidence: number; // 0-1
    severity: "critical" | "warning" | "info";
    files: string[]; // Affected files
    analysis: {
      reason: string;
      evidence: string[];
      supersededBy?: string; // If superseded, what replaced it
      overlaps?: { file: string; percentage: number }[]; // If redundant
      consolidationTarget?: string; // Suggested consolidated doc path
    };
    recommendedAction: {
      operation: "archive" | "consolidate" | "create" | "restructure";
      description: string;
      steps: string[];
      requiresApproval: boolean; // Based on confidence threshold
    };
  }>;
  summary: {
    totalIssues: number;
    byType: Record<string, number>;
    autoExecutable: number; // Confidence ≥0.85
    requiresApproval: number; // Confidence <0.85
  };
  lastAnalyzed: string; // ISO timestamp
}
```

### Tool 5: execute_documentation_operation()

**Purpose**: Execute autonomous documentation operations (archive, consolidate, create)

**Parameters**:
```typescript
{
  operation: "archive" | "consolidate" | "create" | "restructure";
  issue: Issue; // From analyze_documentation_health()
  dryRun?: boolean; // Default true
  requireApproval?: boolean; // Default based on confidence (<0.85)
  options?: {
    // Archive options
    archivePath?: string; // Default: archive/[topic]-[date]/
    createReplacement?: boolean; // Default true
    replacementTemplate?: "minimal" | "detailed"; // Default "minimal"

    // Consolidate options
    targetPath?: string; // Where to create consolidated doc
    preserveSections?: string[]; // Sections to preserve from each source

    // Create options
    template?: string; // Template to use
    variables?: Record<string, string>; // Template variables
  };
}
```

**Operations**:

**1. Archive Operation**
```typescript
Steps:
1. Create archive directory: archive/[topic]-[date]/
2. Move superseded files to archive
3. Create replacement doc (if createReplacement=true):
   Template:
   ---
   type: reference
   replaces: [list of archived files]
   archived: [date]
   ---

   # [Topic]

   **Status**: Archived on [date]
   **Superseded by**: [new doc/framework]

   ## Quick Reference
   [Brief overview]

   ## Current Documentation
   See: [link to current source]

   ## Historical Documentation
   Archived at: [archive path]
4. Update cross-references in other docs
5. Git commit with descriptive message
6. Log to workspace-brain
```

**2. Consolidate Operation**
```typescript
Steps:
1. Analyze source docs for key sections
2. Create consolidated doc structure
3. Merge content:
   - Deduplicate overlapping sections
   - Preserve unique content from each
   - Add "Migrated from" note
4. Create backup of originals
5. Move originals to archive
6. Update all cross-references
7. Git commit
8. Log to workspace-brain
```

**3. Create Operation**
```typescript
Steps:
1. Load template (or generate from pattern)
2. Replace variables
3. Add cross-references to related docs
4. Add metadata (type, tags, created date)
5. Write file
6. Update documentation index
7. Git commit
8. Log to workspace-brain
```

**Safety Mechanisms**:
- Always backup before modifications
- Validate markdown syntax after changes
- Check for broken links before committing
- Dry-run mode shows preview
- First-time patterns require approval even if high confidence
- Complete audit trail in workspace-brain

**Return Format**:
```typescript
{
  executed: boolean;
  dryRun: boolean;
  approved: boolean; // If requireApproval, whether user approved
  operation: string;
  changes: Array<{
    type: "created" | "moved" | "archived" | "modified";
    path: string;
    preview?: string; // Diff or content preview
  }>;
  backupPath?: string;
  validation: {
    syntaxValid: boolean;
    linksValid: boolean;
    errors: string[];
  };
  gitCommit?: string; // Commit hash if committed
  auditTrail: {
    timestamp: string;
    confidence: number;
    approvedBy?: "autonomous" | "user";
    outcome: "success" | "failed" | "rolled_back";
  };
}
```

---

## 5. Confidence Scoring Algorithm

### Scoring Framework

```typescript
interface ConfidenceFactors {
  // Pattern matching (0-1)
  patternMatch: number;        // How well issue matches known patterns

  // Historical learning (0-1)
  historicalSuccess: number;   // Past success rate for this issue type

  // Complexity (0-1, inverted)
  complexityPenalty: number;   // Simple operations = higher confidence

  // Safety (0-1)
  reversibility: number;       // Can this be easily undone?

  // Context (0-1)
  contextClarity: number;      // Is replacement/target clear?
}

function calculateConfidence(issue, factors): number {
  // Weighted combination
  const weights = {
    patternMatch: 0.30,
    historicalSuccess: 0.25,
    complexityPenalty: 0.15,
    reversibility: 0.15,
    contextClarity: 0.15
  };

  let confidence = 0;
  for (const [factor, value] of Object.entries(factors)) {
    confidence += value * weights[factor];
  }

  // Apply learning bonus from workspace-brain
  const learningBonus = getLearningBonus(issue.type);
  confidence = Math.min(1.0, confidence + learningBonus);

  return confidence;
}
```

### Example Scoring

**High Confidence (≥0.85) - Auto-Execute**:
```typescript
Issue: PRODUCTION-FEEDBACK-LOOP.md superseded by framework
Factors:
  patternMatch: 0.95       // "superseded by" comment in file
  historicalSuccess: 0.85  // Similar archival succeeded before
  complexityPenalty: 0.90  // Simple archive operation
  reversibility: 1.0       // Easy to restore from archive
  contextClarity: 0.95     // Framework path clearly identified

Confidence: 0.93 → AUTO-EXECUTE
```

**Medium Confidence (0.70-0.84) - Assisted**:
```typescript
Issue: Multiple READMEs with 60% overlap
Factors:
  patternMatch: 0.75       // Overlap detected but not extreme
  historicalSuccess: 0.70  // Mixed results consolidating READMEs
  complexityPenalty: 0.65  // Need to merge content intelligently
  reversibility: 0.80      // Can restore from backup
  contextClarity: 0.70     // Unclear which should be primary

Confidence: 0.72 → REQUIRE APPROVAL
```

**Low Confidence (<0.70) - Manual**:
```typescript
Issue: Doc may be stale, no clear replacement
Factors:
  patternMatch: 0.50       // Age-based heuristic only
  historicalSuccess: 0.60  // Archiving stale docs sometimes wrong
  complexityPenalty: 0.70  // Archive simple, but replacement unclear
  reversibility: 0.90      // Can restore
  contextClarity: 0.40     // No clear replacement identified

Confidence: 0.58 → SUGGEST BUT DON'T AUTO-EXECUTE
```

### Learning System

After each operation, log outcome to workspace-brain:
```typescript
workspace-brain.log_event({
  event_type: "documentation-operation",
  event_data: {
    operation: "archive",
    issue_type: "superseded",
    confidence_score: 0.93,
    factors: { ... },
    outcome: "success" | "reverted" | "refined",
    user_feedback?: "approved" | "rejected" | "modified"
  }
});

// Learning adjustment
if (outcome === "success") {
  // Increase confidence for similar patterns
  adjustFactorWeights(issue_type, +0.02);
}
if (outcome === "reverted") {
  // Decrease confidence for this pattern
  adjustFactorWeights(issue_type, -0.05);
}
```

---

## 6. Integration with Autonomous Deployment Framework

### Mapping to Framework Pattern

**Issue Detection** (Framework Step 1):
- Tool: `analyze_documentation_health()`
- Classification: Superseded | Redundant | Missing
- Confidence Scoring: 0-1 scale

**Classification** (Framework Step 2):
- ≥0.85 confidence → Autonomous
- 0.70-0.84 confidence → Assisted
- <0.70 confidence → Manual with AI support

**MCP Orchestration** (Framework Step 3):
```
analyze_documentation_health() → Issue detected
    ↓
learning-optimizer? (Check if similar issue seen before)
    ↓
project-management? (If major doc restructuring, create goal?)
    ↓
execute_documentation_operation() → Perform action
    ↓
workspace-brain.log_event() → Record outcome
```

**Safety & Validation** (Framework Step 4):
- Dry-run preview
- Backup before changes
- Markdown validation
- Link checking
- First-time pattern approval
- Rollback on error

**Learning** (Framework Step 5):
- Log all operations to workspace-brain
- Track confidence vs outcome
- Adjust scoring weights
- Build pattern library

---

## 7. Automation Tiers

### Tier 1: Post-Operation Hooks (Event-Driven)

**Triggers**:
```typescript
// After major documentation changes
after project-management.wrap_up_project():
  workspace-index.analyze_documentation_health({
    scope: "project",
    checks: ["supersession", "missing"]
  });

// After framework creation
after create_framework():
  workspace-index.analyze_documentation_health({
    scope: workspace,
    checks: ["supersession"]
  });

// After major archival
after archive_multiple_files():
  workspace-index.analyze_documentation_health({
    scope: affected_directory,
    checks: ["missing"]
  });
```

### Tier 2: Scheduled Deep Scans (Proactive)

**Schedule**: Weekly (Monday 9 AM)
```typescript
Weekly Task:
  const health = workspace-index.analyze_documentation_health({
    scope: "workspace",
    checks: "all",
    confidenceThreshold: 0.85
  });

  // Auto-execute high-confidence operations
  for (const issue of health.issues) {
    if (issue.confidence >= 0.85 && !isFirstTimePattern(issue)) {
      workspace-index.execute_documentation_operation({
        operation: issue.recommendedAction.operation,
        issue: issue,
        dryRun: false,
        requireApproval: false
      });
    }
  }

  // Report medium-confidence issues
  if (health.summary.requiresApproval > 0) {
    notifyUser({
      message: `${health.summary.requiresApproval} documentation issues need review`,
      details: health.issues.filter(i => i.confidence < 0.85)
    });
  }
```

### Tier 3: Git Pre-Commit Hook (Real-Time Validation)

**Trigger**: Before commit with documentation changes
```typescript
if (staged_files.includes_documentation) {
  const health = workspace-index.analyze_documentation_health({
    scope: staged_files,
    checks: ["supersession", "redundancy"],
    depth: "quick"
  });

  if (health.issues.length > 0 && health.issues.some(i => i.severity === "critical")) {
    WARN: "Documentation health issues detected";
    SUGGEST: "Run analyze_documentation_health() for details";
    // Don't block commit, just warn
  }
}
```

### Tier 4: On-Demand (Manual Trigger)

**User Request**:
```typescript
User: "Check documentation health"
Assistant: [Runs analyze_documentation_health()]
Assistant: "Found 2 issues:
  1. PRODUCTION-FEEDBACK-LOOP.md superseded (confidence 0.93) - can auto-archive
  2. Multiple READMEs overlap (confidence 0.72) - needs approval

  Execute auto-archive now?"
```

---

## 8. First-Time Pattern Approval

### Safety Gate

Even if confidence ≥0.85, require approval for:
- First occurrence of this specific pattern
- Operations affecting >5 files
- Operations in critical directories (root, WORKSPACE_GUIDE.md, etc.)
- Destructive operations (delete vs archive)

**Approval Flow**:
```typescript
const isFirstTime = !workspace-brain.hasPattern({
  operation: "archive",
  pattern: "superseded-by-framework"
});

if (issue.confidence >= 0.85 && !isFirstTime) {
  // Auto-execute
  execute_documentation_operation({ requireApproval: false });
} else if (issue.confidence >= 0.85 && isFirstTime) {
  // Show preview, require approval
  const preview = execute_documentation_operation({ dryRun: true });
  notifyUser({
    message: "First-time pattern detected (high confidence)",
    preview: preview,
    question: "Approve this operation? Future similar operations will be automatic."
  });
} else {
  // Medium/low confidence - always require approval
  const preview = execute_documentation_operation({ dryRun: true });
  notifyUser({
    message: "Medium confidence operation requires approval",
    preview: preview
  });
}
```

---

## 9. Implementation Phases

### Phase 4A: Documentation Health Analysis (Week 1)

**Deliverables**:
1. Tool: `analyze_documentation_health()` implementation
2. Detection patterns for:
   - Supersession (framework replacement, newer comprehensive doc)
   - Redundancy (overlap >60%, circular refs)
   - Staleness (>12 months + no refs)
3. Confidence scoring algorithm
4. Unit tests for detection patterns
5. Manual trigger only (no automation yet)

**Success Criteria**:
- Correctly identifies 3-doc consolidation scenario from 2025-11-04
- Confidence scores align with human judgment (±0.1)
- Zero false positives on current workspace
- Detection completes in <30 seconds

**Testing**:
```typescript
// Reproduce 2025-11-04 scenario
analyze_documentation_health({
  scope: "development/mcp-servers/",
  checks: ["supersession", "redundancy"]
});

Expected:
- Detect PRODUCTION-FEEDBACK-LOOP.md superseded (confidence ≥0.85)
- Detect MCP-SYSTEM-ARCHITECTURE.md redundant (confidence ≥0.75)
- Suggest consolidation operation
```

### Phase 4B: Autonomous Operations (Week 2)

**Deliverables**:
1. Tool: `execute_documentation_operation()` implementation
2. Operations:
   - Archive (with replacement creation)
   - Consolidate (merge multiple docs)
   - Create (from templates)
3. Dry-run mode with preview
4. Backup/rollback mechanism
5. First-time pattern approval gate
6. Integration tests

**Success Criteria**:
- Archive operation preserves all content
- Consolidation merges without content loss
- All operations create backups
- Dry-run preview matches actual outcome
- Rollback successfully restores state

**Testing**:
```typescript
// Test archive with replacement
execute_documentation_operation({
  operation: "archive",
  issue: superseded_issue,
  dryRun: true
});

// Verify preview shows:
// - Archive path: archive/mcp-coordination-docs-2025-11-04/
// - Replacement doc content
// - Updated cross-references
```

### Phase 4C: Learning System & Integration (Week 3)

**Deliverables**:
1. workspace-brain integration for logging
2. Learning algorithm to adjust confidence weights
3. Pattern library for known issue types
4. Post-operation hooks:
   - project-management.wrap_up_project()
   - After framework creation
   - After major archival
5. Scheduled weekly deep scan
6. E2E tests

**Success Criteria**:
- All operations logged to workspace-brain
- Confidence improves after 5+ similar operations
- Weekly scan completes in <2 minutes
- Post-operation hooks trigger correctly
- 90%+ auto-execution rate for learned patterns

**Testing**:
```typescript
// E2E: Simulate user creating framework
1. Create new framework in development/frameworks/
2. Trigger: workspace-index detects supersession opportunity
3. Confidence: Calculate based on pattern match
4. If ≥0.85 and not first-time: auto-archive old docs
5. Create replacement pointing to framework
6. Log outcome to workspace-brain
7. Verify: Next similar operation has higher confidence
```

---

## 10. Integration Points

### workspace-brain-mcp

**Purpose**: Log all documentation operations for learning
**Integration**:
```typescript
after execute_documentation_operation():
  workspace-brain.log_event({
    event_type: "documentation-operation",
    event_data: {
      operation: "archive" | "consolidate" | "create",
      issue_type: "superseded" | "redundant" | "missing",
      confidence_score: number,
      confidence_factors: { ... },
      files_affected: string[],
      outcome: "success" | "reverted" | "refined",
      user_approved: boolean,
      execution_time_ms: number
    }
  });

// Query for learning
const patterns = workspace-brain.query_events({
  event_type: "documentation-operation",
  filters: { issue_type: "superseded" }
});

// Calculate success rate for confidence adjustment
const successRate = patterns.filter(p => p.outcome === "success").length / patterns.length;
```

### project-management-mcp

**Purpose**: Trigger analysis after project wrap-up
**Integration**:
```typescript
// In project-management-mcp wrap_up_project()
after project_archived:
  workspace-index.analyze_documentation_health({
    scope: project_path,
    checks: ["missing", "supersession"]
  });

  if (high_confidence_issues.length > 0) {
    auto_execute_operations();
  }
```

### learning-optimizer-mcp

**Purpose**: Track documentation issues as learnings, suggest prevention
**Integration**:
```typescript
// When documentation issue resolved
learning-optimizer.track_issue({
  domain: "documentation-lifecycle",
  title: "Superseded doc not archived",
  symptom: "Old PRODUCTION-FEEDBACK-LOOP.md still present",
  solution: "Detected by workspace-index, auto-archived",
  prevention: "Post-framework-creation hook now checks for supersession"
});

// Query for frequent patterns
const frequent = learning-optimizer.get_issues({
  domain: "documentation-lifecycle",
  filter: "high-frequency"
});

// Promote to preventive check if frequency ≥5
if (issue.frequency >= 5) {
  learning-optimizer.promote_to_preventive_check(issue);
}
```

### mcp-config-manager

**Purpose**: Trigger after MCP registration/unregistration
**Integration**:
```typescript
after register_mcp_server() or unregister_mcp_server():
  workspace-index.analyze_documentation_health({
    scope: "workspace",
    checks: ["mcp_counts", "supersession"]
  });

  // Auto-fix count drift (existing Phase 3 capability)
  workspace-index.update_workspace_docs_for_reality();
```

---

## 11. Templates for Common Operations

### Template 1: Replacement After Archival (Minimal)

```markdown
---
type: reference
status: archived-replaced
archived: {{date}}
replaces: {{archived_files}}
superseded-by: {{new_source}}
---

# {{topic}}

**Status**: Archived on {{date}}
**Superseded by**: [{{new_source_name}}]({{new_source_path}})

## Quick Reference

{{brief_overview}}

## Current Documentation

See: [{{new_source_name}}]({{new_source_path}})

**Key Resources**:
{{#key_resources}}
- **{{name}}**: {{path}}
{{/key_resources}}

## Historical Documentation

Archived documentation available at: `{{archive_path}}`

---

**Last Updated**: {{date}}
```

### Template 2: Consolidated Documentation

```markdown
---
type: consolidated
created: {{date}}
migrated-from: {{source_files}}
tags: {{tags}}
---

# {{consolidated_title}}

**Consolidated**: {{date}}
**Migrated from**: {{source_count}} documents

---

## Overview

{{overview_section}}

---

{{#sections}}
## {{section_title}}

{{section_content}}

**Source**: {{source_file}}

---
{{/sections}}

## Historical Documentation

Original documents archived at: `{{archive_path}}`

---

**Last Updated**: {{date}}
```

### Template 3: Framework Overview (Detailed)

```markdown
---
type: framework-overview
framework: {{framework_name}}
created: {{date}}
tags: {{tags}}
---

# {{framework_name}}

**Purpose**: {{purpose}}
**Created**: {{date}}
**Status**: Active

---

## Quick Start

{{quick_start_steps}}

---

## Architecture

{{architecture_overview}}

---

## Use Cases

{{#use_cases}}
### {{use_case_title}}

{{use_case_description}}

**Example**:
{{use_case_example}}
{{/use_cases}}

---

## Integration

{{integration_guide}}

---

## Complete Documentation

See: `{{framework_path}}/README.md`

---

**Last Updated**: {{date}}
```

---

## 12. Performance Considerations

### Targets

- **Health analysis**: <30 seconds (comprehensive scan)
- **Quick health check**: <5 seconds (single directory)
- **Archive operation**: <10 seconds
- **Consolidate operation**: <20 seconds (2-3 source docs)
- **Weekly deep scan**: <2 minutes

### Optimization Strategies

**1. Caching**:
```typescript
// Cache content analysis results
const cache = {
  file_hash: md5(file_content),
  overlap_analysis: { ... },
  ttl: 1_hour
};

// Skip re-analysis if file unchanged
if (cache.file_hash === current_hash && !cache_expired) {
  return cache.overlap_analysis;
}
```

**2. Incremental Analysis**:
```typescript
// Only analyze changed files
const changed_files = git_diff_since(last_analysis_timestamp);
const health = analyze_documentation_health({
  scope: changed_files,
  mode: "incremental"
});
```

**3. Parallel Processing**:
```typescript
// Analyze multiple directories concurrently
await Promise.all([
  analyze_directory("development/mcp-servers/"),
  analyze_directory("development/frameworks/"),
  analyze_directory("templates-and-patterns/")
]);
```

---

## 13. Success Metrics

### Immediate (Phase 4A - Week 1)

- ✅ Correctly identifies 2025-11-04 consolidation scenario
- ✅ Confidence scores ±0.1 of human judgment
- ✅ Zero false positives on current workspace
- ✅ Analysis completes in <30 seconds

### Short-Term (Phase 4B-C - Weeks 2-3)

- ✅ 100% of operations create backups
- ✅ 90%+ auto-execution rate after learning (5+ operations)
- ✅ Weekly scans complete in <2 minutes
- ✅ All operations logged to workspace-brain

### Long-Term (1-3 months)

- ✅ Manual documentation cleanup reduced by 80%
- ✅ Documentation health score consistently >90/100
- ✅ Superseded docs detected within 1 week of replacement
- ✅ Confidence accuracy improves to ±0.05 over time
- ✅ Zero documentation archival mistakes

---

## 14. Risks & Mitigation

### Risk 1: Incorrect Supersession Detection

**Description**: False positive - archives still-relevant doc
**Probability**: Medium (especially in learning phase)
**Impact**: High (lost documentation)

**Mitigation**:
- First-time patterns always require approval
- Confidence threshold ≥0.85 for auto-execute
- Always create archive (not delete)
- Easy rollback mechanism
- Log all operations for audit trail
- User can mark "never archive" for critical docs

### Risk 2: Poor Consolidation Quality

**Description**: Merged doc loses important content or context
**Probability**: Medium
**Impact**: Medium (user must manually fix)

**Mitigation**:
- Dry-run preview before consolidation
- Preserve all sections, deduplicate carefully
- Require approval for consolidation (never fully autonomous)
- Backup originals in archive
- Track consolidation outcomes in workspace-brain

### Risk 3: Learning System Drift

**Description**: Confidence adjustments become miscalibrated over time
**Probability**: Low
**Impact**: Medium (increased false positives/negatives)

**Mitigation**:
- Cap adjustment magnitude (±0.05 per operation)
- Periodic review of confidence accuracy
- Reset option if calibration degrades
- Human feedback loop for edge cases

### Risk 4: Performance Degradation

**Description**: Weekly scans become slow as workspace grows
**Probability**: Medium (long-term)
**Impact**: Low (still runs, just slower)

**Mitigation**:
- Incremental analysis (only changed files)
- Caching with TTL
- Parallel processing
- Skip analysis for excluded directories
- Performance monitoring to detect degradation early

---

## 15. Rollout Strategy

### Step 1: Manual-Only Mode (Week 1)

**Configuration**:
```typescript
{
  autonomous_operations: false,
  require_approval_always: true,
  automation_tiers: []
}
```

**Usage**:
- User manually triggers `analyze_documentation_health()`
- All operations require explicit approval
- Build confidence in detection accuracy

### Step 2: Assisted Mode (Week 2)

**Configuration**:
```typescript
{
  autonomous_operations: true,
  confidence_threshold: 0.95, // Very high threshold initially
  require_approval_first_time: true,
  automation_tiers: ["post-operation"]
}
```

**Usage**:
- Post-operation hooks trigger analysis
- Very high confidence (≥0.95) can auto-execute
- First-time patterns always require approval
- Build pattern library

### Step 3: Full Autonomy (Week 3+)

**Configuration**:
```typescript
{
  autonomous_operations: true,
  confidence_threshold: 0.85, // Standard threshold
  require_approval_first_time: true,
  automation_tiers: ["post-operation", "scheduled", "git-hook"]
}
```

**Usage**:
- Weekly scheduled scans
- Auto-execute high-confidence operations
- Assisted mode for medium-confidence
- Fully integrated with MCP ecosystem

---

## 16. Documentation Updates Required

After Phase 4 implementation:

**1. WORKSPACE_ARCHITECTURE.md**
- Add Phase 4 capabilities to workspace-index-mcp description
- Document autonomous documentation management
- Add confidence-based autonomy explanation
- List integration points

**2. WORKSPACE_GUIDE.md**
- Add documentation lifecycle workflow
- Explain autonomous management tiers
- Document approval process for first-time patterns

**3. development/mcp-servers/workspace-index-mcp-server-project/README.md**
- Add Phase 4 tool documentation
- Add confidence scoring explanation
- Add usage examples for each operation type
- Document integration with Autonomous Deployment Framework

**4. development/frameworks/autonomous-deployment/README.md**
- Add workspace-index as example implementation
- Reference documentation management use case

---

## 17. Testing Strategy

### Unit Tests

```typescript
describe('analyze_documentation_health', () => {
  it('detects superseded doc with high confidence', () => {
    const result = analyze_documentation_health({
      scope: ['PRODUCTION-FEEDBACK-LOOP.md'],
      checks: ['supersession']
    });
    expect(result.issues[0].type).toBe('superseded');
    expect(result.issues[0].confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('detects overlap between docs', () => {
    const result = analyze_documentation_health({
      scope: ['README1.md', 'README2.md'],
      checks: ['redundancy']
    });
    expect(result.issues[0].analysis.overlaps[0].percentage).toBeGreaterThan(60);
  });
});

describe('execute_documentation_operation', () => {
  it('creates archive with replacement doc', async () => {
    const result = await execute_documentation_operation({
      operation: 'archive',
      issue: superseded_issue,
      dryRun: false
    });
    expect(result.changes).toContainEqual({
      type: 'created',
      path: expect.stringMatching(/archive\/.*\/README\.md/)
    });
  });

  it('preserves content during consolidation', async () => {
    const sources = ['doc1.md', 'doc2.md'];
    const original_content = sources.map(readFile);

    const result = await execute_documentation_operation({
      operation: 'consolidate',
      issue: redundancy_issue
    });

    const consolidated = readFile(result.changes[0].path);
    original_content.forEach(content => {
      expect(consolidated).toContain(uniqueContentFrom(content));
    });
  });
});
```

### Integration Tests

```typescript
describe('MCP Integration', () => {
  it('triggers analysis after project wrap-up', async () => {
    const spy = jest.spyOn(workspace_index, 'analyze_documentation_health');

    await project_management.wrap_up_project({
      projectPath: '/test/project'
    });

    expect(spy).toHaveBeenCalledWith({
      scope: '/test/project',
      checks: expect.arrayContaining(['missing', 'supersession'])
    });
  });

  it('logs operations to workspace-brain', async () => {
    const spy = jest.spyOn(workspace_brain, 'log_event');

    await execute_documentation_operation({
      operation: 'archive',
      issue: test_issue
    });

    expect(spy).toHaveBeenCalledWith({
      event_type: 'documentation-operation',
      event_data: expect.objectContaining({
        operation: 'archive',
        confidence_score: expect.any(Number)
      })
    });
  });
});
```

### E2E Tests

```typescript
describe('E2E: Autonomous Documentation Management', () => {
  it('detects and auto-archives superseded doc (high confidence)', async () => {
    // Setup: Create framework that supersedes old doc
    createFramework('development/frameworks/new-framework/');
    createOldDoc('development/mcp-servers/OLD-DOC.md', {
      content: 'See new-framework instead'
    });

    // Trigger: Weekly scan
    const health = await analyze_documentation_health({ scope: 'workspace' });

    // Verify: Issue detected with high confidence
    const issue = health.issues.find(i => i.files.includes('OLD-DOC.md'));
    expect(issue.confidence).toBeGreaterThanOrEqual(0.85);

    // Execute: Auto-archive (no approval needed)
    const result = await execute_documentation_operation({
      operation: 'archive',
      issue: issue,
      requireApproval: false
    });

    // Verify: Doc archived, replacement created
    expect(fs.existsSync('archive/old-doc-2025-11-04/OLD-DOC.md')).toBe(true);
    expect(fs.existsSync('development/mcp-servers/OLD-DOC.md')).toBe(false);
    expect(fs.existsSync('development/mcp-servers/README.md')).toBe(true);
    expect(readFile('development/mcp-servers/README.md')).toContain('new-framework');
  });

  it('requires approval for first-time pattern', async () => {
    // Setup: New pattern never seen before
    const issue = createUniqueIssue({ confidence: 0.90 });

    // Verify: First-time check
    const isFirstTime = !workspace_brain.hasPattern(issue.pattern);
    expect(isFirstTime).toBe(true);

    // Execute: Should require approval despite high confidence
    const result = await execute_documentation_operation({
      operation: 'archive',
      issue: issue
    });

    expect(result.requiresApproval).toBe(true);
  });
});
```

---

## 18. Future Enhancements (Post-Phase 4)

### Enhancement 1: Proactive Documentation Generation

**Capability**: Auto-generate missing docs after detecting gaps
**Example**: New framework created → auto-generate START_HERE.md from template
**Confidence Required**: 0.90+ (content generation is high-risk)

### Enhancement 2: Cross-Repository Documentation Sync

**Capability**: Detect when workspace doc differs from GitHub README
**Example**: WORKSPACE_GUIDE.md changes → suggest updating GitHub README
**Integration**: Git hooks + GitHub API

### Enhancement 3: Documentation Quality Scoring

**Capability**: Score doc quality (clarity, completeness, freshness)
**Example**: Flag docs with low quality score for improvement
**Metrics**: Reading level, link validity, last-updated recency, cross-reference density

### Enhancement 4: AI-Powered Consolidation

**Capability**: Use LLM to intelligently merge content during consolidation
**Example**: Multiple READMEs → LLM creates unified structure preserving all key points
**Safety**: Dry-run + human approval required

---

## 19. Next Steps

**Immediate Actions**:

1. ✅ Create this specification (completed)
2. ⏳ Review with user for approval
3. ⏳ Create task-executor workflow for Phase 4A implementation
4. ⏳ Begin Phase 4A: analyze_documentation_health() tool implementation

**Decision Points**:

- Approve Phase 4 implementation plan?
- Confirm confidence threshold (0.85) is appropriate?
- Approve integration with Autonomous Deployment Framework pattern?
- Confirm automation tiers (post-operation, scheduled, git-hook)?

**Dependencies**:

- Phases 1-3 complete ✅ (already done)
- Autonomous Deployment Framework available ✅ (development/frameworks/autonomous-deployment/)
- workspace-brain-mcp operational ✅
- project-management-mcp operational ✅

---

## 20. Appendix: Real-World Scenarios

### Scenario 1: Framework Supersedes Docs (2025-11-04 Actual)

**Before**:
```
development/mcp-servers/
├── PRODUCTION-FEEDBACK-LOOP.md (762 lines)
├── MCP-SYSTEM-ARCHITECTURE.md (3,397 lines)
├── MCP-COORDINATION-README.md (198 lines)
└── [21 MCP projects]
```

**Analysis** (autonomous):
```typescript
analyze_documentation_health() detects:
1. PRODUCTION-FEEDBACK-LOOP.md:
   - Type: superseded
   - Confidence: 0.93
   - Superseded by: development/frameworks/autonomous-deployment/
   - Evidence: "superseded by autonomous feedback framework" (user comment)

2. MCP-SYSTEM-ARCHITECTURE.md:
   - Type: redundant
   - Confidence: 0.78
   - Overlaps: WORKSPACE_ARCHITECTURE.md (70% overlap)
   - Evidence: Both describe MCP architecture, newer is more accurate

3. MCP-COORDINATION-README.md:
   - Type: superseded
   - Confidence: 0.82
   - Evidence: References outdated counts, points to superseded docs
```

**Operation** (autonomous or assisted):
```typescript
execute_documentation_operation({
  operation: "archive",
  issue: all_three_issues,
  options: {
    archivePath: "archive/mcp-coordination-docs-2025-11-04/",
    createReplacement: true,
    replacementTemplate: "minimal"
  }
});

Result:
- All 3 docs moved to archive/
- New README.md created (234 lines):
  - Points to Autonomous Deployment Framework
  - Points to WORKSPACE_ARCHITECTURE.md
  - Concise overview of 21 MCP projects
  - References archived docs for historical context
```

**After**:
```
development/mcp-servers/
├── README.md (234 lines - concise, current)
└── [21 MCP projects]

archive/mcp-coordination-docs-2025-11-04/
├── PRODUCTION-FEEDBACK-LOOP.md
├── MCP-SYSTEM-ARCHITECTURE.md
└── MCP-COORDINATION-README.md
```

---

**Specification Version**: 1.0
**Created**: 2025-11-04
**Status**: ✅ APPROVED FOR IMPLEMENTATION
**Implementation Timeline**: 3 weeks (Phases 4A-4C)
**Next Review**: After Phase 4A completion (Week 1)
