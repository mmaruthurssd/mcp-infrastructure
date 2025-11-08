---
type: mcp-server
category: operations
status: active
version: 2.0.0
created: 2025-11-07
---

# MCP Config Manager

**Category**: Operations
**Status**: Active
**Version**: 2.0.0

## Overview

Comprehensive MCP server for managing and validating MCP server configurations against workspace standards. Provides tools for syncing configs, registering/unregistering servers, listing servers, and validating configurations.

## Key Features

- **Config Sync**: Scan local MCP instances and compare with config files
- **Server Registration**: Register local MCP servers in appropriate config files (auto-detect scope)
- **Server Unregistration**: Remove MCP servers from all configuration files
- **Server Listing**: List all MCP servers with registration scopes and build status
- **Config Validation**: Validate MCP server configuration against standards

## Tools

1. `sync_mcp_configs` - Scan and compare local instances with configs
2. `register_mcp_server` - Register a local MCP server instance
3. `unregister_mcp_server` - Remove an MCP server from configs
4. `list_mcp_servers` - List all MCP servers with status
5. `validate_mcp_configuration` - Validate configuration against standards

## Development Structure

```
development/mcp-servers/mcp-config-manager-project/
├── 01-brainstorming/              # Design and planning documents
├── 02-goals-and-roadmap/          # Goals and milestones
├── 03-development-specifications/ # Technical specifications
├── 04-product-under-development/  # Active development
│   └── staging/                   # Build and test here
├── 05-testing-and-quality/        # Test results and QA
├── 06-deployment-readiness/       # Deployment artifacts
├── 07-monitoring-and-feedback/    # Performance monitoring
└── 08-historical-artifacts/       # Archived versions
```

## Production Location

`local-instances/mcp-servers/mcp-config-manager/`

## Template Location

`templates-and-patterns/mcp-server-templates/mcp-config-manager-template/`

## Usage

Registered in `~/.claude.json` with absolute paths. Access via Claude Code.

## Related Documentation

- MCP Development Standard: `/templates-and-patterns/MCP-DEVELOPMENT-STANDARD.md`
- Configuration Checklist: `/templates-and-patterns/mcp-server-templates/MCP-CONFIGURATION-CHECKLIST.md`
- Workspace Guide: `/WORKSPACE_GUIDE.md`
