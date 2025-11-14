---
type: reference
tags: [system-index, components, architecture, documentation-maintenance]
last_updated: 2025-11-14
---

# System Components Index

**Purpose:** Quick reference map for all major system components in the mcp-infrastructure workspace.

**For AI Initialization:** Read this file early to understand what systems exist and where to find their documentation.

---

## 🚨 IMPORTANT: Documentation Maintenance Rule

**MANDATORY: When you develop a new system component, you MUST update this index immediately.**

**What qualifies as a "system component"?**
- Production MCP servers (new server implementations)
- Development infrastructure (build systems, deployment pipelines)
- Configuration management (dual-config systems, environment setup)
- Integration systems (cross-workspace communication, external APIs)
- Testing and validation infrastructure
- Cross-workspace shared systems

**Update process:**
1. Implement the new component
2. Add entry to this file (SYSTEM-COMPONENTS.md) in the appropriate section
3. If architectural, add detailed section to workspace documentation
4. If critical for AI to know immediately, reference in START_HERE.md
5. Commit all documentation updates in the same session as implementation

**Do NOT:**
- Skip documentation "to do later" (it won't happen)
- Document only in README files (AI won't find them)
- Create orphan documentation that isn't indexed here

---

## Core Infrastructure

### Dual-Client MCP Configuration
**Location:** `~/.claude.json` (Claude Code) + `~/Desktop/medical-patient-data/.gemini-mcp.json` (Gemini)
**Status:** ✅ Production (26 MCP servers shared across both AI clients)
**Purpose:** Central configuration for all MCP servers used by Claude Code and Gemini
**Key Requirement:** BOTH configs must be updated when deploying/modifying MCPs
**Quick Test:** `cat ~/.claude.json | grep -c '"command"'` (should return 26+)

### MCP Production Servers
**Location:** `local-instances/mcp-servers/` (26 servers)
**Status:** ✅ Production
**Purpose:** Shared MCP server infrastructure for both Claude Code and Gemini
**Build System:** Each server has `npm run build`, `npm test`
**Documentation:** Each server has `README.md` with tool listings and usage

### MCP Development Environment
**Location:** `development/mcp-servers/` (25 development projects)
**Status:** 🟡 Development/Staging
**Purpose:** Test new MCPs before production deployment
**Standard:** Test in development/ → Deploy to local-instances/ → Update both configs
**Template:** Available in operations-workspace templates-and-patterns/

---

## Production MCP Servers (26 Total)

### Core Workflow (4 servers)
**git-assistant-mcp-server**
- **Location:** `local-instances/mcp-servers/git-assistant-mcp-server/`
- **Purpose:** Git operations, commit readiness, commit message generation
- **Tools:** 7 tools (check_commit_readiness, suggest_commit_message, etc.)
- **README:** `local-instances/mcp-servers/git-assistant-mcp-server/README.md`

**smart-file-organizer-mcp-server**
- **Location:** `local-instances/mcp-servers/smart-file-organizer-mcp-server/`
- **Purpose:** File organization, project detection, lifecycle management
- **Tools:** 9 tools (analyze_file, suggest_organization, etc.)
- **README:** `local-instances/mcp-servers/smart-file-organizer-mcp-server/README.md`

**spec-driven-mcp-server**
- **Location:** `local-instances/mcp-servers/spec-driven-mcp-server/`
- **Purpose:** Specification-driven development workflow
- **Tools:** 4 tools (sdd_guide, research_best_practices, etc.)
- **README:** `local-instances/mcp-servers/spec-driven-mcp-server/README.md`

**task-executor-mcp-server**
- **Location:** `local-instances/mcp-servers/task-executor-mcp-server/`
- **Purpose:** Task workflow execution with verification
- **Tools:** 4 tools (create_workflow, complete_task, etc.)
- **README:** `local-instances/mcp-servers/task-executor-mcp-server/README.md`

### Foundation (3 servers)
**mcp-config-manager**
- **Location:** `local-instances/mcp-servers/mcp-config-manager/`
- **Purpose:** MCP configuration synchronization and validation
- **Tools:** 4 tools (sync_mcp_configs, register_mcp_server, etc.)
- **README:** `local-instances/mcp-servers/mcp-config-manager/README.md`

**security-compliance-mcp**
- **Location:** `local-instances/mcp-servers/security-compliance-mcp/`
- **Purpose:** Credential scanning, PHI detection, pre-commit hooks
- **Tools:** 5 tools (scan_for_credentials, scan_for_phi, etc.)
- **README:** `local-instances/mcp-servers/security-compliance-mcp/README.md`

**testing-validation-mcp-server**
- **Location:** `local-instances/mcp-servers/testing-validation-mcp-server/`
- **Purpose:** MCP testing, quality gates, smoke tests
- **Tools:** 6 tools (run_mcp_tests, validate_mcp_implementation, etc.)
- **README:** `local-instances/mcp-servers/testing-validation-mcp-server/README.md`

### Operations (8 servers)
**project-management-mcp-server**
- **Location:** `local-instances/mcp-servers/project-management-mcp-server/`
- **Purpose:** Project setup, goal management, roadmap tracking
- **Tools:** 30+ tools (start_project_setup, evaluate_goal, etc.)
- **README:** `local-instances/mcp-servers/project-management-mcp-server/README.md`

**parallelization-mcp**
- **Location:** `local-instances/mcp-servers/parallelization-mcp/`
- **Purpose:** Parallel task execution with sub-agent coordination
- **Tools:** 6 tools (analyze_task_parallelizability, execute_parallel_workflow, etc.)
- **README:** `local-instances/mcp-servers/parallelization-mcp/README.md`

**configuration-manager-mcp**
- **Location:** `local-instances/mcp-servers/configuration-manager-mcp/`
- **Purpose:** Environment configuration, secrets management, config validation
- **Tools:** 5 tools (manage_secrets, validate_config, etc.)
- **README:** `local-instances/mcp-servers/configuration-manager-mcp/README.md`

**deployment-release-mcp**
- **Location:** `local-instances/mcp-servers/deployment-release-mcp/`
- **Purpose:** Application deployment, rollback, health validation
- **Tools:** 6 tools (deploy_application, rollback_deployment, etc.)
- **README:** `local-instances/mcp-servers/deployment-release-mcp/README.md`

**code-review-mcp**
- **Location:** `local-instances/mcp-servers/code-review-mcp/`
- **Purpose:** Code quality analysis, complexity detection, technical debt tracking
- **Tools:** 6 tools (analyze_code_quality, detect_complexity, etc.)
- **README:** `local-instances/mcp-servers/code-review-mcp/README.md`

**workflow-orchestrator-mcp-server**
- **Location:** `local-instances/mcp-servers/workflow-orchestrator-mcp-server/`
- **Purpose:** Multi-step workflow orchestration and automation
- **README:** `local-instances/mcp-servers/workflow-orchestrator-mcp-server/README.md`

**checklist-manager-mcp-server**
- **Location:** `local-instances/mcp-servers/checklist-manager-mcp-server/`
- **Purpose:** Checklist creation, tracking, and verification
- **README:** `local-instances/mcp-servers/checklist-manager-mcp-server/README.md`

**communications-mcp-server**
- **Location:** `local-instances/mcp-servers/communications-mcp-server/`
- **Purpose:** Team communication and notification management
- **README:** `local-instances/mcp-servers/communications-mcp-server/README.md`

### Intelligence (4 servers)
**workspace-brain-mcp-server**
- **Location:** `local-instances/mcp-servers/workspace-brain-mcp-server/`
- **Purpose:** External learning system, telemetry, ROI tracking
- **Tools:** 25+ tools (log_event, query_events, track_workflow_cost, etc.)
- **Storage:** External brain (survives workspace resets)
- **README:** `local-instances/mcp-servers/workspace-brain-mcp-server/README.md`

**learning-optimizer-mcp-server**
- **Location:** `local-instances/mcp-servers/learning-optimizer-mcp-server/`
- **Purpose:** Issue tracking, knowledge optimization, prevention patterns
- **Tools:** 11 tools (track_issue, optimize_knowledge_base, etc.)
- **README:** `local-instances/mcp-servers/learning-optimizer-mcp-server/README.md`

**workspace-index**
- **Location:** `local-instances/mcp-servers/workspace-index/`
- **Status:** ✅ Production (Phase 5 implemented 2025-11-14)
- **Purpose:** Project indexing, documentation health, cross-reference validation
- **Tools:** 11 tools (generate_project_index, validate_workspace_documentation, etc.)
- **README:** `local-instances/mcp-servers/workspace-index/README.md`

**performance-monitor-mcp-server**
- **Location:** `local-instances/mcp-servers/performance-monitor-mcp-server/`
- **Purpose:** MCP performance tracking, anomaly detection, alerting
- **Tools:** 8 tools (track_performance, detect_anomalies, etc.)
- **README:** `local-instances/mcp-servers/performance-monitor-mcp-server/README.md`

### Supporting (7 servers)
**arc-decision-mcp-server**
- **Location:** `local-instances/mcp-servers/arc-decision-mcp-server/`
- **Purpose:** Architecture decision guidance (MCP vs subagent vs skill)
- **Tools:** 7 tools (analyze_requirements, suggest_architecture, etc.)
- **README:** `local-instances/mcp-servers/arc-decision-mcp-server/README.md`

**backup-dr-mcp-server**
- **Location:** `local-instances/mcp-servers/backup-dr-mcp-server/`
- **Purpose:** Backup creation, restore, scheduling, retention
- **Tools:** 8 tools (create_backup, restore_backup, etc.)
- **README:** `local-instances/mcp-servers/backup-dr-mcp-server/README.md`

**test-generator-mcp**
- **Location:** `local-instances/mcp-servers/test-generator-mcp/`
- **Purpose:** Automated test generation, coverage analysis
- **Tools:** 4 tools (generate_unit_tests, analyze_coverage_gaps, etc.)
- **README:** `local-instances/mcp-servers/test-generator-mcp/README.md`

**standards-enforcement-mcp**
- **Location:** `local-instances/mcp-servers/standards-enforcement-mcp/`
- **Purpose:** Workspace standards validation, compliance checking
- **Tools:** 3 tools (validate_mcp_compliance, validate_project_structure, etc.)
- **README:** `local-instances/mcp-servers/standards-enforcement-mcp/README.md`

**autonomous-deployment-mcp-server**
- **Location:** `local-instances/mcp-servers/autonomous-deployment-mcp-server/`
- **Purpose:** Autonomous issue detection and resolution with confidence scoring
- **Tools:** 10 tools (detect_issue, resolve_autonomously, etc.)
- **README:** `local-instances/mcp-servers/autonomous-deployment-mcp-server/README.md`

**workspace-health-dashboard-mcp-server**
- **Location:** `local-instances/mcp-servers/workspace-health-dashboard-mcp-server/`
- **Purpose:** Comprehensive workspace health monitoring
- **Tools:** 7 tools (get_workspace_health, get_mcp_status, etc.)
- **README:** `local-instances/mcp-servers/workspace-health-dashboard-mcp-server/README.md`

**workspace-sync-mcp-server**
- **Location:** `local-instances/mcp-servers/workspace-sync-mcp-server/`
- **Purpose:** Cross-workspace sync, platform updates, team messaging
- **Tools:** 12 tools (check_platform_updates, sync_projects, etc.)
- **README:** `local-instances/mcp-servers/workspace-sync-mcp-server/README.md`

---

## Development Systems

### MCP Build Infrastructure
**Location:** `local-instances/mcp-servers/*/build/` + `node_modules/`
**Build Command:** `npm run build` (compiles TypeScript → JavaScript)
**Test Command:** `npm test` (runs unit and integration tests)
**Standard:** All MCPs use TypeScript, compile to `build/index.js`
**Dependencies:** Managed via `package.json`, installed via `npm install`

### MCP Deployment Scripts
**Location:** `local-instances/mcp-servers/` (various shell scripts)
**Scripts:**
- `comprehensive-mcp-verification.sh` - Verify all 26 MCPs
- `validate-mcp-config.sh` - Validate configuration files
- `verify-mcp-setup.sh` - Verify MCP installation
**Purpose:** Automated verification and deployment validation

### Development MCP Projects
**Location:** `development/mcp-servers/` (25 projects)
**Status:** 🟡 Staging/Testing
**Projects Include:**
- arc-decision-mcp-server-project
- backup-dr-mcp-project
- checklist-manager-mcp-project
- code-review-mcp-project
- communications-mcp-server-project
- configuration-manager-mcp-server-project
- deployment-release-mcp-project
- documentation-generator-mcp-project
- git-assistant-mcp-server-project
- learning-optimizer-mcp-project
- mcp-config-manager-project
- parallelization-mcp-server-project
- performance-monitor-mcp-project
- project-management-mcp-project
- (and 11 more)

**Standard Workflow:** Develop in development/ → Test → Deploy to local-instances/

---

## Documentation & Knowledge Base

### Workspace Management System
**Location:** `workspace-management/` (symlinked from operations-workspace)
**Index:** `workspace-management/README.md`
**Key Files:**
- `THREE-WORKSPACE-ARCHITECTURE.md` - System overview
- `WORKSPACE-RULES.md` - Operational standards
- `AI-GUIDELINES-BY-WORKSPACE.md` - AI permissions
- `DAILY-WORKFLOW.md` - Daily procedures
- `EVENT-LOGGING-PROCEDURES.md` - Event logging system
- `MCP-CONFIGURATION-GUIDE.md` - MCP setup and configuration
- `DOCUMENTATION-INDEX.md` - Complete documentation map

**Sync:** Changes in operations-workspace propagate via symlink

### MCP Server Documentation
**Standard:** Each MCP has comprehensive README.md
**Location:** `local-instances/mcp-servers/*/README.md`
**Contents:**
- Tool listings with descriptions
- Parameter schemas
- Usage examples
- Integration patterns
- Version history

### Configuration Documentation
**Location:** `local-instances/mcp-servers/` (various .md files)
**Files:**
- `MCP_CONFIGURATION_GUIDE.md` - Setup instructions
- `MCP_CONFIG_PREVENTION_GUIDE.md` - Common mistakes
- `MCP_VERIFICATION_REPORT.md` - Verification checklist
- `CROSS-SERVER-INTEGRATION.md` - Integration patterns
- `SESSION-HANDOFF.md` - Session handoff procedures
- `QUICK_START.md` - Quick start guide
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## Cross-Workspace Systems

### Workspace-Brain MCP (External Learning)
**Purpose:** Persistent telemetry, analytics, pattern learning across sessions
**Tools:** 25+ tools (event logging, ROI tracking, automation opportunities)
**Storage:** External brain (survives workspace resets)
**Data:** Telemetry events, learning patterns, performance metrics
**See:** `local-instances/mcp-servers/workspace-brain-mcp-server/README.md`

### Workspace-Index MCP Phase 5 (NEW 2025-11-14)
**Purpose:** Cross-workspace documentation health and component detection
**Status:** ✅ Production
**Capabilities:**
- Auto-detect undocumented system components
- Validate documentation coverage across workspaces
- Generate suggested documentation entries
- Alert during initialization if components missing from documentation

**Run manual check:**
```typescript
validate_workspace_documentation({
  checks: ['system_components', 'mcp_counts', 'cross_references']
})
```

### Workspace-Sync MCP
**Purpose:** Cross-workspace synchronization and team communication
**Architecture:** Local → GitHub → Google Drive → workspace-brain
**Tools:** Platform updates, project sync, team messaging, daemon control
**See:** `local-instances/mcp-servers/workspace-sync-mcp-server/README.md`

### Four-Part Sync
**Architecture:** Local → GitHub → Google Drive → workspace-brain
**Sync Script:** Available via workspace-sync-mcp tools
**Auto-Sync Daemon:** Pulls from GitHub every 5 minutes
**Purpose:** Changes propagate across all 3 workspaces and external storage

---

## Data Protection & Security

### Pre-Commit Hooks (security-compliance-mcp)
**Purpose:** PHI and credential scanning before commits
**Coverage:** All three workspaces
**Detection:** 18 HIPAA identifiers, API keys, tokens
**Status:** ✅ Active (installed via security-compliance-mcp)
**See:** `workspace-management/SECURITY-GIT-INTEGRATION-GUIDE.md`

### PHI Boundary Enforcement
**PHI Allowed:** Only in medical-patient-data workspace
**This Workspace:** ❌ PHI PROHIBITED - All code must be platform-agnostic
**AI Authorization:** Claude Code + Gemini (shared infrastructure)
**Enforcement:** Pre-commit hooks, .gitignore, MCP tool awareness
**Standard:** All MCP code must work with any data type (not PHI-specific)

### Standards Enforcement
**MCP:** standards-enforcement-mcp
**Checks:**
- Dual-environment compliance (dev + production)
- Template-first development
- Project structure standards
- Configuration standards
- Documentation standards
- Security standards

---

## Monitoring & Health

### MCP Performance Monitoring
**MCP:** performance-monitor-mcp-server
**Capabilities:** Response time tracking, anomaly detection, alerting
**Metrics:** Duration, success rate, resource usage
**Dashboard:** Available via `get_performance_dashboard()`

### Workspace Health Dashboard
**MCP:** workspace-health-dashboard-mcp-server
**Metrics:** MCP status, autonomous resolution rates, bottlenecks, automation ROI
**Tool:** `get_workspace_health()` for overall health score
**Alerts:** Critical alerts for MCP failures, performance degradation

### MCP Verification
**Scripts:**
- `comprehensive-mcp-verification.sh` - Full verification suite
- `validate-mcp-config.sh` - Configuration validation
- `verify-mcp-setup.sh` - Installation verification
**Location:** `local-instances/mcp-servers/`
**Purpose:** Automated health checks for all 26 production MCPs

---

## Quick Reference: Where to Document What

| Type of Component | Primary Documentation | Secondary Reference | Critical Path? |
|-------------------|----------------------|---------------------|----------------|
| **New MCP Server** | Server README.md | This file (MCP listing) | No |
| **Configuration Change** | MCP_CONFIGURATION_GUIDE.md | This file | If affects both AIs |
| **Build Infrastructure** | This file + dedicated docs | START_HERE.md | No |
| **Integration System** | This file + CROSS-SERVER-INTEGRATION.md | workspace-management/ | If cross-workspace |
| **Security Feature** | security-compliance-mcp README | workspace-management/ | Yes (START_HERE) |
| **Development Standard** | workspace-management/WORKSPACE-RULES.md | This file | If mandatory |
| **MCP Template** | operations-workspace/templates/ | This file | No |

---

## Adding a New Component (Step-by-Step)

**Example: You just built a new MCP server**

1. **Implement the MCP** in `development/mcp-servers/new-mcp-name/`
   - Copy from template
   - Implement tools
   - Write tests

2. **Add to this file** (SYSTEM-COMPONENTS.md):
   ```markdown
   ### [Category] (X servers)
   **new-mcp-name**
   - **Location:** `local-instances/mcp-servers/new-mcp-name/`
   - **Purpose:** Brief description
   - **Tools:** X tools (tool1, tool2, etc.)
   - **README:** `local-instances/mcp-servers/new-mcp-name/README.md`
   ```

3. **Create comprehensive README.md** in MCP folder:
   - Tool listings with parameters
   - Usage examples
   - Integration patterns

4. **Deploy to production:**
   ```bash
   # Build and test
   cd development/mcp-servers/new-mcp-name
   npm run build && npm test

   # Deploy to production
   cp -r . ../../local-instances/mcp-servers/new-mcp-name

   # Update both configs
   # Update ~/.claude.json
   # Update ~/Desktop/medical-patient-data/.gemini-mcp.json
   ```

5. **Update START_HERE.md** if widely used:
   ```markdown
   ## Available MCP Servers (27 Total)
   - Add to appropriate category
   ```

6. **Commit all documentation** in same session as implementation:
   ```bash
   git add development/mcp-servers/new-mcp-name/
   git add local-instances/mcp-servers/new-mcp-name/
   git add SYSTEM-COMPONENTS.md START_HERE.md
   git commit -m "feat: add new-mcp-name with complete documentation"
   git push
   ```

---

## Maintenance Notes

**Last Updated:** 2025-11-14
**Next Review:** 2025-12-14 (monthly)
**Maintained By:** AI assistants updating during development

**Review Checklist:**
- [ ] All 26 production MCPs documented
- [ ] Development projects list current
- [ ] Deprecated MCPs moved to archive section
- [ ] Cross-references are accurate
- [ ] New MCPs since last review added
- [ ] Status indicators current
- [ ] Both config locations verified

---

**Remember:** This index is only useful if kept up to date. Update it NOW, not "later."

**Proactive Documentation Enforcement:**
The **workspace-index MCP Phase 5** now automatically detects undocumented system components. When you create new MCPs or infrastructure:
- Auto-detection after 7 days if not documented
- Validation of required documentation locations
- AI-powered metadata extraction for suggested entries
- Alerts during workspace initialization if missing
