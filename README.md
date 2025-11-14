# MCP Infrastructure Workspace

Production MCP servers powering Claude Code and Gemini with dual-client configuration and cross-workspace integration.

---

## Overview

**Purpose**: Shared platform infrastructure for AI-assisted development
**AI Clients**: Claude Code + Gemini (dual-client configuration)
**MCP Servers**: 26 production servers organized by category
**Location**: `~/Desktop/mcp-infrastructure`
**PHI Status**: PROHIBITED - Platform-agnostic code only

This workspace provides the **core MCP server infrastructure** that powers both Claude Code and Gemini. All code here is platform-agnostic and shared across both AI clients.

**Key Characteristics**:
- 26 production MCP servers across 5 categories
- Dual-environment pattern (development → production)
- Template-first development standard
- Cross-workspace integration with operations-workspace
- Shared configuration for both AI clients

---

## Quick Start

### For AI Assistants

**6-Step Initialization Path**:

1. **START_HERE.md** - Workspace identification and permissions
2. **workspace-management/AI-WORKSPACE-INITIALIZATION.md** - Detailed initialization
3. **workspace-management/DOCUMENTATION-INDEX.md** - Complete documentation map
4. **workspace-management/AI-GUIDELINES-BY-WORKSPACE.md** - Workspace permissions
5. **EVENT_LOG.md** - Recent changes (check last 50 lines)
6. **README.md** (this file) - MCP architecture and server index

**For task-specific guidance**: See DOCUMENTATION-INDEX.md > "Before Working With..." section

### For Developers

**Accessing the workspace**:
```bash
cd ~/Desktop/mcp-infrastructure
```

**Key directories**:
- `local-instances/mcp-servers/` - 26 production MCP servers
- `development/mcp-servers/` - Development/staging environment
- `workspace-management/` - Shared documentation (symlinked)
- `templates-and-patterns/` - MCP templates and patterns (symlinked)
- `live-practice-management-system/` - Production system docs (symlinked)

**Quick links**:
- [START_HERE.md](START_HERE.md) - Complete orientation guide
- [SYSTEM-COMPONENTS.md](SYSTEM-COMPONENTS.md) - Component index with tool listings
- [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md) - Standards and collaboration preferences
- [WORKSPACE_ARCHITECTURE.md](WORKSPACE_ARCHITECTURE.md) - MCP integration patterns

---

## MCP Servers Index

**26 production MCP servers** organized by strategic function. For complete tool listings, parameters, and integration patterns, see [SYSTEM-COMPONENTS.md](SYSTEM-COMPONENTS.md).

### Core Workflow (4 servers)

**git-assistant-mcp-server**
Git operations, commit readiness, commit message generation
Tools: 7 (check_commit_readiness, suggest_commit_message, etc.)
[README](local-instances/mcp-servers/git-assistant-mcp-server/README.md)

**smart-file-organizer-mcp-server**
File organization, project detection, lifecycle management
Tools: 9 (analyze_file, suggest_organization, etc.)
[README](local-instances/mcp-servers/smart-file-organizer-mcp-server/README.md)

**spec-driven-mcp-server**
Specification-driven development workflow
Tools: 4 (sdd_guide, research_best_practices, etc.)
[README](local-instances/mcp-servers/spec-driven-mcp-server/README.md)

**task-executor-mcp-server**
Task workflow execution with verification
Tools: 4 (create_workflow, complete_task, etc.)
[README](local-instances/mcp-servers/task-executor-mcp-server/README.md)

### Foundation (3 servers)

**mcp-config-manager**
MCP configuration synchronization and validation
Tools: 4 (sync_mcp_configs, register_mcp_server, etc.)
[README](local-instances/mcp-servers/mcp-config-manager/README.md)

**security-compliance-mcp**
Credential scanning, PHI detection, pre-commit hooks
Tools: 5 (scan_for_credentials, scan_for_phi, etc.)
[README](local-instances/mcp-servers/security-compliance-mcp/README.md)

**testing-validation-mcp-server**
MCP testing, quality gates, smoke tests
Tools: 6 (run_mcp_tests, validate_mcp_implementation, etc.)
[README](local-instances/mcp-servers/testing-validation-mcp-server/README.md)

### Operations (8 servers)

**project-management-mcp-server**
Project setup, goal management, roadmap tracking
Tools: 30+ (start_project_setup, evaluate_goal, etc.)
[README](local-instances/mcp-servers/project-management-mcp-server/README.md)

**parallelization-mcp**
Parallel task execution with sub-agent coordination
Tools: 6 (analyze_task_parallelizability, execute_parallel_workflow, etc.)
[README](local-instances/mcp-servers/parallelization-mcp/README.md)

**configuration-manager-mcp**
Environment configuration, secrets management, config validation
Tools: 5 (manage_secrets, validate_config, etc.)
[README](local-instances/mcp-servers/configuration-manager-mcp/README.md)

**deployment-release-mcp**
Application deployment, rollback, health validation
Tools: 6 (deploy_application, rollback_deployment, etc.)
[README](local-instances/mcp-servers/deployment-release-mcp/README.md)

**code-review-mcp**
Code quality analysis, complexity detection, technical debt tracking
Tools: 6 (analyze_code_quality, detect_complexity, etc.)
[README](local-instances/mcp-servers/code-review-mcp/README.md)

**workflow-orchestrator-mcp-server**
Multi-step workflow orchestration and automation
[README](local-instances/mcp-servers/workflow-orchestrator-mcp-server/README.md)

**checklist-manager-mcp-server**
Checklist creation, tracking, and verification
[README](local-instances/mcp-servers/checklist-manager-mcp-server/README.md)

**communications-mcp-server**
Team communication and notification management
[README](local-instances/mcp-servers/communications-mcp-server/README.md)

### Intelligence (4 servers)

**workspace-brain-mcp-server**
External learning system, telemetry, ROI tracking
Tools: 25+ (log_event, query_events, track_workflow_cost, etc.)
Storage: External brain (survives workspace resets)
[README](local-instances/mcp-servers/workspace-brain-mcp-server/README.md)

**learning-optimizer-mcp-server**
Issue tracking, knowledge optimization, prevention patterns
Tools: 11 (track_issue, optimize_knowledge_base, etc.)
[README](local-instances/mcp-servers/learning-optimizer-mcp-server/README.md)

**workspace-index**
Project indexing, documentation health, cross-reference validation
Tools: 11 (generate_project_index, validate_workspace_documentation, etc.)
Status: Phase 5 implemented (2025-11-14)
[README](local-instances/mcp-servers/workspace-index/README.md)

**performance-monitor-mcp-server**
MCP performance tracking, anomaly detection, alerting
Tools: 8 (track_performance, detect_anomalies, etc.)
[README](local-instances/mcp-servers/performance-monitor-mcp-server/README.md)

### Supporting (7 servers)

**arc-decision-mcp-server**
Architecture decision guidance (MCP vs subagent vs skill)
Tools: 7 (analyze_requirements, suggest_architecture, etc.)
[README](local-instances/mcp-servers/arc-decision-mcp-server/README.md)

**backup-dr-mcp-server**
Backup creation, restore, scheduling, retention
Tools: 8 (create_backup, restore_backup, etc.)
[README](local-instances/mcp-servers/backup-dr-mcp-server/README.md)

**test-generator-mcp**
Automated test generation, coverage analysis
Tools: 4 (generate_unit_tests, analyze_coverage_gaps, etc.)
[README](local-instances/mcp-servers/test-generator-mcp/README.md)

**standards-enforcement-mcp**
Workspace standards validation, compliance checking
Tools: 3 (validate_mcp_compliance, validate_project_structure, etc.)
[README](local-instances/mcp-servers/standards-enforcement-mcp/README.md)

**autonomous-deployment-mcp-server**
Autonomous issue detection and resolution with confidence scoring
Tools: 10 (detect_issue, resolve_autonomously, etc.)
[README](local-instances/mcp-servers/autonomous-deployment-mcp-server/README.md)

**workspace-health-dashboard-mcp-server**
Comprehensive workspace health monitoring
Tools: 7 (get_workspace_health, get_mcp_status, etc.)
[README](local-instances/mcp-servers/workspace-health-dashboard-mcp-server/README.md)

**workspace-sync-mcp-server**
Cross-workspace sync, platform updates, team messaging
Tools: 12 (check_platform_updates, sync_projects, etc.)
[README](local-instances/mcp-servers/workspace-sync-mcp-server/README.md)

---

## Development Workflow

### Building a New MCP

**Follow template-first development standard**:

```bash
# Step 1: Create from template in development folder
cd ~/Desktop/mcp-infrastructure/development/mcp-servers
cp -r ../../templates-and-patterns/mcp-server-templates/base-mcp-template ./my-new-mcp
cd my-new-mcp

# Step 2: Develop and test
npm install
npm run build
npm test

# Step 3: Deploy to production
cd ~/Desktop/mcp-infrastructure
cp -r development/mcp-servers/my-new-mcp local-instances/mcp-servers/

# Step 4: Update both configs
# Edit ~/.claude.json (Claude Code)
# Edit ~/Desktop/medical-patient-data/.gemini-mcp.json (Gemini)

# Step 5: Restart AI clients to load new MCP
```

**See**: `workspace-management/MCP-CONFIGURATION-GUIDE.md` for detailed instructions

### Updating an Existing MCP

```bash
# Step 1: Work in production folder
cd ~/Desktop/mcp-infrastructure/local-instances/mcp-servers/[mcp-name]

# Step 2: Make changes and rebuild
npm run build
npm test

# Step 3: Commit and push
git add .
git commit -m "feat: add new feature to [mcp-name]"
git push

# Step 4: Restart AI clients (changes take effect after restart)
```

### Development → Production Promotion

**Standard workflow**:
1. Develop in `development/mcp-servers/[project]/`
2. Build and test: `npm run build && npm test`
3. Deploy to `local-instances/mcp-servers/[name]/`
4. Update **both** configs (~/.claude.json AND .gemini-mcp.json)
5. Restart both AI clients
6. Verify MCP loads correctly in both clients

**Build and deployment scripts**:
- `comprehensive-mcp-verification.sh` - Verify all 26 MCPs
- `validate-mcp-config.sh` - Validate configuration files
- `verify-mcp-setup.sh` - Verify MCP installation

---

## Cross-Workspace Integration

This workspace integrates with **operations-workspace** through symlinks and shared systems.

### Symlinked Directories

**workspace-management/** → `../operations-workspace/workspace-management`
Shared documentation, standards, workflows, troubleshooting guides
Changes in operations-workspace propagate automatically

**templates-and-patterns/** → `../operations-workspace/templates-and-patterns`
MCP server templates (24 templates), simple templates, development standards
Template-first development pattern

**live-practice-management-system/** → `../operations-workspace/live-practice-management-system`
Production system documentation and deployment guides

### Three-Workspace Architecture

| # | Workspace | Purpose | PHI | AI Client |
|---|-----------|---------|-----|-----------|
| 1 | operations-workspace | Development, planning, templates | NO | Claude Code |
| 2 | **mcp-infrastructure** (this workspace) | 26 MCP servers (production) | NO | Claude Code + Gemini |
| 3 | medical-patient-data | Patient data, clinical workflows | YES | Gemini only |

**See**: `workspace-management/THREE-WORKSPACE-ARCHITECTURE.md` for complete overview

### Shared Documentation

**Key shared files** (via workspace-management symlink):
- `MCP-CONFIGURATION-GUIDE.md` - MCP setup and configuration
- `WORKSPACE-RULES.md` - Operational standards
- `AI-GUIDELINES-BY-WORKSPACE.md` - AI permissions by workspace
- `DAILY-WORKFLOW.md` - Daily procedures
- `EVENT-LOGGING-PROCEDURES.md` - Event logging system
- `DOCUMENTATION-INDEX.md` - Complete documentation map
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## For AI Assistants

### Quick Initialization Checklist

Before starting work in this workspace:

- [ ] Read START_HERE.md (workspace identification and permissions)
- [ ] Read workspace-management/AI-WORKSPACE-INITIALIZATION.md (detailed initialization)
- [ ] Understand PHI is PROHIBITED in this workspace
- [ ] Understand changes affect BOTH Claude Code AND Gemini
- [ ] Know the dual-config requirement (~/.claude.json AND .gemini-mcp.json)
- [ ] Reviewed SYSTEM-COMPONENTS.md (component index)
- [ ] Checked EVENT_LOG.md (last 50 lines for recent changes)

### Key Documentation by Task

**Building MCP servers**:
- [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md) - Development standards
- [workspace-management/MCP-CONFIGURATION-GUIDE.md](workspace-management/MCP-CONFIGURATION-GUIDE.md) - Configuration
- [SYSTEM-COMPONENTS.md](SYSTEM-COMPONENTS.md) - Existing MCP reference

**Understanding MCP architecture**:
- [WORKSPACE_ARCHITECTURE.md](WORKSPACE_ARCHITECTURE.md) - Integration patterns
- [SYSTEM-COMPONENTS.md](SYSTEM-COMPONENTS.md) - Component listings

**Cross-workspace operations**:
- [workspace-management/THREE-WORKSPACE-ARCHITECTURE.md](workspace-management/THREE-WORKSPACE-ARCHITECTURE.md) - System overview

**Troubleshooting**:
- [workspace-management/TROUBLESHOOTING.md](workspace-management/TROUBLESHOOTING.md) - Common issues
- [local-instances/mcp-servers/TROUBLESHOOTING.md](local-instances/mcp-servers/TROUBLESHOOTING.md) - MCP-specific issues

---

## Configuration

### Dual-Client Setup

**CRITICAL**: Every MCP deployment requires updating **BOTH** configs.

**Claude Code configuration**:
```bash
~/.claude.json
```

**Gemini configuration**:
```bash
~/Desktop/medical-patient-data/.gemini-mcp.json
```

**Why dual configs?**
- Claude Code and Gemini both use the same MCP servers
- They have separate configuration files
- Forgetting to update one breaks that AI client

**Example MCP config entry**:
```json
{
  "mcpServers": {
    "task-executor": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/mcp-infrastructure/local-instances/mcp-servers/task-executor-mcp-server/build/index.js"
      ]
    }
  }
}
```

**Configuration standards**:
- Use **absolute paths** (no relative paths or ${workspaceFolder})
- Register in global `~/.claude.json` ONLY (NO workspace .mcp.json)
- Validate before registration with `validate-mcp-config.sh`
- Backup config file before making changes
- Test in both AI clients after configuration changes

**See**: `workspace-management/MCP-CONFIGURATION-GUIDE.md` for complete setup instructions

### MCP Server Build System

**Standard build process**:
```bash
cd local-instances/mcp-servers/[mcp-name]
npm install          # Install dependencies
npm run build        # Compile TypeScript → JavaScript
npm test             # Run unit and integration tests
```

**Build outputs**:
- TypeScript source: `src/`
- Compiled JavaScript: `build/index.js`
- Dependencies: `node_modules/`
- Tests: `src/__tests__/`

**All MCPs follow this standard**:
- TypeScript implementation
- Compile to `build/index.js`
- Dependencies managed via `package.json`
- Tests required before deployment

---

## HIPAA Compliance & Security

### PHI Prohibition

**All MCP code must be PHI-agnostic**:
- MCPs work with **any data type**, not just patient data
- No PHI hardcoded in MCP logic
- Generic, reusable, platform-independent
- PHI handling occurs in medical-patient-data workspace only

**Example of PHI-agnostic design**:
```typescript
// BAD - PHI-specific
function processPatientName(name: string) { ... }

// GOOD - Generic
function processField(value: string, fieldType: string) { ... }
```

### Pre-Commit Security Hooks

**Active security scanning** (via security-compliance-mcp):
- Credential detection (API keys, tokens, passwords)
- PHI scanning (18 HIPAA identifiers)
- Pre-commit hooks block commits with violations
- Scan reports in `.security-scans/` (gitignored)

**See**: `workspace-management/SECURITY-GIT-INTEGRATION-GUIDE.md` for complete setup

---

## Common Scenarios

### Scenario 1: MCP Not Loading in Claude Code

**Troubleshooting steps**:
1. Check `~/.claude.json` has correct path to MCP
2. Verify MCP is built: `cd [mcp-path] && npm run build`
3. Check for TypeScript errors in build output
4. Restart Claude Code
5. Check Claude Code logs for errors

### Scenario 2: MCP Not Loading in Gemini

**Troubleshooting steps**:
1. Check `.gemini-mcp.json` has correct configuration
2. Verify MCP server is built
3. Check file permissions on build/index.js
4. Restart Gemini client
5. Check Gemini logs for errors

### Scenario 3: Build Errors

**Resolution steps**:
1. Run `npm install` to ensure dependencies installed
2. Check TypeScript errors: `npm run build`
3. Review error messages for missing dependencies
4. Check Node.js version compatibility
5. Clear build artifacts: `rm -rf build/ && npm run build`

**See**: `workspace-management/TROUBLESHOOTING.md` for complete troubleshooting guide

---

## Monitoring & Validation

### MCP Verification Scripts

**comprehensive-mcp-verification.sh**
Full verification suite for all 26 production MCPs
Location: `local-instances/mcp-servers/`
Usage: `./comprehensive-mcp-verification.sh`

**validate-mcp-config.sh**
Configuration validation (checks both ~/.claude.json and .gemini-mcp.json)
Location: `local-instances/mcp-servers/`
Usage: `./validate-mcp-config.sh`

**verify-mcp-setup.sh**
Installation verification and health checks
Location: `local-instances/mcp-servers/`
Usage: `./verify-mcp-setup.sh`

### Workspace Health Dashboard

**workspace-health-dashboard-mcp** provides real-time monitoring:
- MCP status (error rates, response times)
- Autonomous resolution success rates
- Performance bottlenecks
- Automation ROI metrics

**Usage**:
```typescript
// Get overall health score (0-100)
get_workspace_health()

// Check MCP status
get_mcp_status()

// View system alerts
get_system_alerts()
```

---

## Directory Structure

```
mcp-infrastructure/
├── README.md (this file)
├── START_HERE.md (orientation guide)
├── SYSTEM-COMPONENTS.md (component index with tool listings)
├── WORKSPACE_GUIDE.md (standards and collaboration preferences)
├── WORKSPACE_ARCHITECTURE.md (MCP integration patterns)
├── EVENT_LOG.md (recent changes and decisions)
│
├── local-instances/
│   └── mcp-servers/ (26 PRODUCTION MCP servers)
│       ├── task-executor-mcp-server/
│       ├── project-management-mcp-server/
│       ├── workspace-sync-mcp-server/
│       ├── security-compliance-mcp/
│       └── ... (22 more servers)
│
├── development/
│   └── mcp-servers/ (DEVELOPMENT - test here first)
│       └── [new-mcp-name]/
│
├── workspace-management/ → operations-workspace/workspace-management (SYMLINK)
│   ├── MCP-CONFIGURATION-GUIDE.md
│   ├── THREE-WORKSPACE-ARCHITECTURE.md
│   ├── AI-GUIDELINES-BY-WORKSPACE.md
│   ├── WORKSPACE-RULES.md
│   └── ... (shared documentation)
│
├── templates-and-patterns/ → operations-workspace/templates-and-patterns (SYMLINK)
│   ├── mcp-server-templates/ (24 MCP templates)
│   ├── simple-templates/
│   └── MCP-DEVELOPMENT-STANDARD.md
│
└── live-practice-management-system/ → operations-workspace/live-practice-management-system (SYMLINK)
```

---

## Next Steps

**New to this workspace?**
Read [START_HERE.md](START_HERE.md) for complete orientation

**Building a new MCP?**
See `workspace-management/MCP-CONFIGURATION-GUIDE.md`

**Need MCP architecture details?**
See [WORKSPACE_ARCHITECTURE.md](WORKSPACE_ARCHITECTURE.md)

**Looking for templates?**
See `templates-and-patterns/mcp-server-templates/`

**Troubleshooting?**
See `workspace-management/TROUBLESHOOTING.md`

---

## Remember

- **Test in development/ before deploying to local-instances/**
- **Always update BOTH configs** (~/.claude.json AND .gemini-mcp.json)
- **All code must be PHI-agnostic** (platform-independent)
- **Restart AI clients after changes**
- **Never break backward compatibility** without migration plan
- **Follow template-first development** standard
- **Document as you build** (update README files)

---

**Last Updated**: 2025-11-14
**Maintained By**: AI assistants and development team
**For Help**: Check workspace-management/TROUBLESHOOTING.md or START_HERE.md
