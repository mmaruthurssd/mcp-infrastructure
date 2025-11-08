---
type: readme
tags: [project-management-mcp, development, standardization]
---

# Project Management MCP Server - Development Project

**Version:** 1.0.3
**Status:** Production (Standardization Complete)
**Location:** Development instance with 8-folder structure

---

## Overview

The Project Management MCP Server provides AI-assisted project planning with intelligent workflow orchestration, component-driven design, and goal management.

**Key Features:**
- **Project Setup** (8 tools) - Initialize with constitution, stakeholders, roadmap
- **Goal Management** (11 tools) - Evaluate, create, promote, track, archive goals
- **Component-Driven Framework** (6 tools) - EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED workflow
- **Workflow Orchestration** (9 tools) - Intelligent workflow guidance with state tracking
- **Validation** (1 tool) - Comprehensive project structure validation
- **Migration** (2 tools) - Migrate existing projects to standardized structure

**Total:** 31 MCP tools

---

## Project Structure (8-Folder Standard)

This project follows the workspace 8-folder standardized development structure:

```
project-management-mcp-server-project/
├── 01-planning/
│   ├── README.md (this file)
│   ├── ARCHITECTURE.md (moved from staging/)
│   └── EVENT_LOG.md (project history)
├── 02-goals-and-roadmap/
│   └── potential-goals/ (feature ideas)
├── 03-resources-docs-assets-tools/
│   ├── docs/ (moved from staging/)
│   └── API_REFERENCE.md
├── 04-product-under-development/
│   ├── staging/ (source code)
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── tests/
├── 05-launch-deployment/
│   └── DEPLOYMENT_CHECKLIST.md
├── 06-monitoring-feedback/
│   └── METRICS.md
├── 07-communication-updates/
│   └── CHANGELOG.md (moved from staging/)
└── 08-archive/
    └── [archived files]
```

---

## Development Workflow

### Local Development
```bash
cd 04-product-under-development/staging
npm install
npm run build
npm test
```

### Production Deployment
```bash
# Production instance location:
# local-instances/mcp-servers/project-management-mcp-server/

# Deploy after validation:
cp -r dist/* ../../local-instances/mcp-servers/project-management-mcp-server/dist/
```

### Testing
```bash
# Run all tests
npm test

# Test specific tool
npm test -- create_component

# Integration tests
npm run test:integration
```

---

## Recent Updates

### v1.0.3 - Component-Driven Framework (2025-11-07)
- Fixed 3 architectural bugs in component management
- All 6 component tools tested and verified
- Production ready and deployment complete

### v1.0.2 - Propagation Bug Fix (2025-11-07)
- Fixed components not writing to PROJECT_OVERVIEW.md
- Added saveProjectOverview() call in addComponentToStage

### v1.0.1 - Heading Level Fix (2025-11-07)
- Fixed markdown parsing conflict with component headings
- Changed component heading level from ### to ####

See `07-communication-updates/CHANGELOG.md` for complete history.

---

## Component-Driven Framework

6 tools for managing components through lifecycle stages:

1. **create_component** - Create components in any stage
2. **update_component** - Update descriptions, sub-components, priorities
3. **move_component** - Move between EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED
4. **split_component** - Split one component into multiple
5. **merge_components** - Merge multiple components into one
6. **component_to_goal** - Convert finalized components to trackable goals

**Workflow:** EXPLORING (ideas) → FRAMEWORK (design) → FINALIZED (ready) → ARCHIVED (completed/converted)

---

## Drop-in Template

This MCP has a drop-in template for easy installation in other workspaces:

**Location:** `templates-and-patterns/mcp-server-templates/project-management-template/`

**Installation:**
```bash
cd templates-and-patterns/mcp-server-templates/project-management-template
./install.sh /path/to/workspace [optional-mcp-name]
./configure-mcp.sh /path/to/workspace [optional-mcp-name]
```

See `TEMPLATE-INFO.json` for AI-readable installation instructions.

---

## Integration with Other MCPs

**Workflow Orchestration:**
- Uses `workflow-orchestrator-mcp-server` as library dependency
- Zero code duplication, clean architecture

**Handoffs:**
- `prepare_spec_handoff` → spec-driven-mcp
- `prepare_task_executor_handoff` → task-executor-mcp (with auto-parallelization analysis)

**Integrations:**
- Coordinates with spec-driven + task-executor
- Auto-analyzes tasks for parallel execution opportunities
- Provides workflow guidance with ready-to-execute tool calls

---

## Documentation

### Planning & Architecture
- `01-planning/ARCHITECTURE.md` - Technical design and integration
- `01-planning/EVENT_LOG.md` - Project history and milestones

### Communication
- `07-communication-updates/CHANGELOG.md` - Version history and release notes

### Resources
- `03-resources-docs-assets-tools/docs/` - API documentation
- `04-product-under-development/staging/README.md` - Source code documentation

---

## Next Steps

See `EVENT_LOG.md` for current status and next actions.

---

## Support

**Issues:** Document in `TROUBLESHOOTING.md`
**Questions:** See workspace documentation in `/WORKSPACE_GUIDE.md` and `/WORKSPACE_ARCHITECTURE.md`
