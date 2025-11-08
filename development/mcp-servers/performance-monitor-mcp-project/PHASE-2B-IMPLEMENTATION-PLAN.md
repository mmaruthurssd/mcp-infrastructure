# Phase 2B: Intelligence Layer Implementation Plan

**Created:** 2025-10-31
**Status:** 🔵 In Progress

---

## Overview

This document tracks the implementation plan for Phase 2B: Intelligence Layer MCPs.

**Goal:** Build monitoring and analytics infrastructure for workspace intelligence.

---

## Implementation Order

### ✅ Phase 2B-1: Performance Monitor MCP (CURRENT)
**Status:** Fixing deployment compliance
**Timeline:** 2025-10-31

**Tasks:**
1. ✅ Build Performance Monitor MCP with 8 tools
2. ✅ Create comprehensive specification and documentation
3. 🔵 **FIX: Update ROLLOUT-CHECKLIST.md** to include MCP Configuration Checklist compliance
4. 🔵 **FIX: Update MCP-CONFIGURATION.md** with proper `claude mcp add` command
5. ⏳ Verify no workspace `.mcp.json` was created
6. ⏳ Deploy using proper registration command
7. ⏳ Run smoke tests

**Issues Found:**
- ❌ ROLLOUT-CHECKLIST.md missing Layer 3 MCP Configuration Compliance section
- ❌ MCP-CONFIGURATION.md uses deprecated manual JSON approach
- ⚠️ Need to verify compliance with MCP-CONFIGURATION-CHECKLIST.md v1.2.0

---

### 🔵 Phase 2B-2: External Brain Infrastructure
**Status:** Planned
**Timeline:** After Performance Monitor deployment

**Purpose:** Build storage and query infrastructure for intelligence layer

**Components:**
1. **workspace-brain MCP Server**
   - Telemetry data storage (task logs, MCP usage)
   - Analytics database (SQLite for Phase 1)
   - Pattern cache
   - Query tools

2. **Directory Structure**
   ```
   ~/workspace-brain/
   ├── telemetry/         # Task logs, MCP usage
   ├── analytics/         # Generated reports, patterns
   ├── learning/          # Issue patterns, solutions
   └── cache/             # Computed metrics, indexes
   ```

3. **Google Drive Sync**
   - Automatic backup to Google Drive
   - Disaster recovery
   - Cross-machine access

**Integration Points:**
- Performance Monitor logs metrics to external brain
- BI Analyst queries external brain for insights
- Documentation Generator uses external brain for caching

**Estimated Effort:** 2-3 weeks
- Week 1: Basic setup (folders, MCP scaffold, Google Drive sync)
- Week 2-3: Database migration, analytics queries, caching

---

### 🔵 Phase 2B-3: Performance Monitor + External Brain Integration
**Status:** Planned
**Timeline:** After External Brain Phase 1

**Tasks:**
1. Update Performance Monitor to log metrics to external brain
2. Migrate from local `.performance-data/` to `~/workspace-brain/telemetry/`
3. Use external brain's analytics for report generation
4. Test integration with existing 8 tools

**Benefits:**
- Workspace stays lean (no metrics bloat in git repo)
- Unlimited historical data retention
- Faster analytics queries
- Cross-workspace performance insights

---

### 🔵 Phase 2B-4: BI Analyst MCP
**Status:** Planned
**Timeline:** After External Brain Phase 2 (database)

**Purpose:** Analyze workspace patterns and generate insights

**Key Tools:**
1. `analyze_task_patterns` - Identify frequent workflows
2. `get_automation_opportunities` - Score automation targets
3. `generate_weekly_summary` - Weekly analytics reports
4. `detect_workflow_anomalies` - Find unusual task patterns
5. `get_time_distribution` - When do tasks happen?
6. `suggest_optimizations` - Data-driven recommendations

**Data Sources:**
- Task logs from task-executor MCP (via external brain)
- MCP usage logs (via external brain)
- Performance metrics from performance-monitor MCP
- Issue patterns from learning-optimizer MCP

**Output:**
- Weekly summary reports (markdown)
- Automation opportunity lists (prioritized)
- Pattern detection results (JSON)
- Visualization data (for dashboards)

**Integration:**
- Queries external brain database
- Cross-references with learning-optimizer
- Provides input for orchestrator design

---

### 🔵 Phase 2B-5: Documentation Generator MCP
**Status:** Planned
**Timeline:** After BI Analyst MCP

**Purpose:** Automatically generate and maintain documentation

**Key Tools:**
1. `generate_api_docs` - Extract API documentation from code
2. `generate_readme` - Create/update README files
3. `generate_architecture_docs` - System architecture documentation
4. `update_changelog` - Maintain CHANGELOG.md
5. `generate_usage_examples` - Create code examples
6. `check_doc_coverage` - Identify undocumented code

**Features:**
- AST parsing for code analysis
- Template-based generation
- Incremental updates (only changed files)
- Coverage tracking (what's documented vs. not)

**Integration:**
- Logs documentation events to external brain
- Caches generated docs in external brain
- Tracks coverage metrics via external brain analytics
- Can be triggered by git-assistant pre-commit hook

---

## Three-Layer Enforcement Compliance

All MCPs in Phase 2B must follow the three-layer enforcement pattern:

**Layer 1: Automated Validation**
- Pre-deployment script checks configuration
- Validates paths, scope, format

**Layer 2: Tool Prevention**
- `mcp-config-manager` blocks invalid operations
- Real-time validation during registration

**Layer 3: Manual Verification**
- ROLLOUT-CHECKLIST.md mandatory section
- Human verification before deployment
- Attestation recorded

**Reference:** `SYSTEM-ARCHITECTURE.md` v1.5.0, sections 823-1290

---

## Success Metrics

### Performance Monitor MCP
- ✅ 8 tools operational
- ⏳ <5ms overhead per track_performance call
- ⏳ <100ms query time for get_metrics
- ⏳ Configuration compliant with MCP-CONFIGURATION-CHECKLIST.md

### External Brain Infrastructure
- ⏳ Workspace stays < 500 MB
- ⏳ Query performance < 100ms (Phase 1) or < 10ms (Phase 2)
- ⏳ Google Drive sync working reliably
- ⏳ Data integrity verified

### BI Analyst MCP
- ⏳ 10+ actionable patterns identified per month
- ⏳ 3+ high-value automation targets discovered
- ⏳ 20+ hours/month savings from automation
- ⏳ 80%+ of suggestions implemented

### Documentation Generator MCP
- ⏳ 90%+ API coverage
- ⏳ Incremental updates < 1 second per file
- ⏳ Auto-generated docs match manual quality
- ⏳ Integration with git workflow

---

## Current Status

**Performance Monitor MCP:**
- Build: ✅ Complete
- Security: ✅ Clean (0 vulnerabilities)
- Documentation: ✅ Complete
- Configuration Compliance: 🔵 **In Progress - Fixing violations**
- Deployment: ⏳ Pending after fixes

**Next Steps:**
1. Complete ROLLOUT-CHECKLIST.md Layer 3 section ← **CURRENT**
2. Update MCP-CONFIGURATION.md with proper command
3. Verify no workspace config conflicts
4. Deploy using `claude mcp add` command
5. Run smoke tests
6. Move to Phase 2B-2 (External Brain)

---

**Plan Owner:** Workspace Team
**Last Updated:** 2025-10-31
**Next Review:** After Performance Monitor deployment
