---
type: readme
tags: [workflow, orchestration, state-management, library]
---

# Workflow Orchestrator MCP Server Project

**MCP Name:** workflow-orchestrator-mcp-server
**Status:** Production (v0.1.0) - Library
**Purpose:** Shared state management and workflow orchestration for MCP servers

---

## Overview

This is a **library dependency**, not a standalone MCP server. It provides:
- **StateManager:** Unified state management across MCPs
- **RuleEngine:** Intelligent workflow suggestions
- **StateDetector:** Auto-sync with file system changes

**Used By:**
- project-management-mcp-server v1.0.0
- spec-driven-mcp-server v0.2.0 (integration ready)
- task-executor-mcp-server v2.0.0 (integration ready)

---

## Production Location

**Path:** `/local-instances/mcp-servers/workflow-orchestrator-mcp-server/`
**Note:** This is a library - imported by other MCPs via local file dependency

---

## Staging Location

**Path:** `04-product-under-development/dev-instance/`

**Workflow:**
1. Issues discovered in dependent MCPs → logged to `08-archive/issues/`
2. Fixes developed in `dev-instance/`
3. Tested with dependent MCPs in staging
4. Deployed to production

---

## Architecture

```
MCP Servers (project-management, spec-driven, task-executor)
      ↓ imports
workflow-orchestrator-mcp-server (this library)
      ↓ provides
StateManager, RuleEngine, StateDetector
```

**Benefits:**
- Eliminates 150-500 lines of duplicate code per MCP
- Unified state management pattern
- 100x-2,500x faster than targets
- Zero runtime overhead

---

## Version History

### v0.1.0 (2025-10-29)
- Initial extraction from project-management-mcp
- StateManager, RuleEngine, StateDetector
- Generic WorkflowState<T> type system
- Integration prompts for spec-driven and task-executor

---

## Retrofit Event

**Date:** 2025-10-29
**Action:** Retrofitted to dual-environment pattern
**Reason:** Enable production feedback loop for library maintenance
**Status:** Staging project created, production code copied to dev-instance

---

**Created:** 2025-10-29
**Retrofitted:** 2025-10-29
**Last Updated:** 2025-10-29
