---
type: readme
phase: stable
tags: [MCP, configuration, management, validation, template]
category: templates
status: completed
priority: high
---

# MCP Config Manager Server Template

**Version:** 2.0.0
**Template Type:** MCP Server
**Status:** Production Ready

## Overview

Comprehensive MCP server for managing and validating MCP server configurations against **MCP_CONFIGURATION_GUIDE.md** standards. Ensures your local MCP server instances are properly registered with correct environment variables, configuration directories, and portable paths.

### ⚠️ Important: Claude Code vs Claude Desktop

**Claude Code** is the CLI tool you use in VS Code. It stores its global config at:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**NOTE:** The filename says "desktop" but this is **Claude Code's config**, not a separate desktop application. The naming is confusing but this is the official file location for Claude Code.

**📖 For detailed explanation and troubleshooting guidance, see:** [CONFIG_FILE_NAMING_GUIDE.md](../../CONFIG_FILE_NAMING_GUIDE.md)

### What Problem Does This Solve?

- **Orphaned configs**: Server registered but local instance deleted
- **Missing registrations**: Local instance exists but not in any config
- **Configuration conflicts**: Server registered in MULTIPLE locations (Claude Code + workspace, or VS Code + workspace)
- **Missing environment variables**: Required env vars not set per guide
- **Missing config directories**: Required directories don't exist
- **Hardcoded paths**: Non-portable paths instead of `${workspaceFolder}`
- **Unbuilt servers**: Registered but `dist/server.js` missing

**NEW in v2.0: Guide Compliance Validation** - Validates all servers against MCP_CONFIGURATION_GUIDE.md requirements including environment variables, configuration directories, and path portability!

### Key Features

- ✅ **Guide-driven**: Validates against MCP_CONFIGURATION_GUIDE.md
- ✅ **Comprehensive**: 5 tools covering registration, validation, and health checks
- ✅ **Auto-scope detection**: Determines user vs project scope automatically
- ✅ **Actionable fixes**: Every warning includes specific fix commands
- ✅ **Safe**: Creates backups before modifying configs
- ✅ **Complete**: Validates, registers, unregisters, and lists servers

---

## 🚀 Quick Start

### For AI Assistants

1. Read `TEMPLATE-INFO.json` for metadata
2. Follow `INSTALL-INSTRUCTIONS.md` for installation steps
3. Execute after user confirmation

### For Human Users

```bash
cd templates-and-patterns/mcp-server-templates/templates/mcp-config-manager-template
./install.sh
```

---

## 📦 What This Template Provides

**5 MCP Tools:**

1. **`sync_mcp_configs()`** - Comprehensive configuration health check:
   - Orphaned configurations (no local instance)
   - Missing registrations (local instance not registered)
   - Configuration conflicts (multiple locations)
   - Build status (registered but not built)
   - **NEW:** Environment variable validation (per guide)
   - **NEW:** Configuration directory validation (per guide)
   - **NEW:** Path portability validation (${workspaceFolder} vs hardcoded)

2. **`register_mcp_server(serverName, scope?)`** - Registers a server with validation:
   - Auto-detects scope based on server characteristics
   - Validates server exists and is built
   - **NEW:** Shows guide requirements before registration (env vars, config dirs)
   - Updates appropriate config file
   - Provides guide references for manual configuration

3. **`unregister_mcp_server(serverName)`** - Removes a server:
   - Checks all config files (global, workspace, Claude Code, VS Code)
   - Safe removal with backups

4. **`list_mcp_servers()`** - Lists all servers with:
   - Registration scopes
   - Build status
   - Existence in local instances

5. **`validate_mcp_configuration(serverName?)`** - **NEW:** Deep validation tool:
   - Validates specific server or all servers
   - Checks against MCP_CONFIGURATION_GUIDE.md requirements
   - Reports errors, warnings, and info with severity levels
   - Provides actionable fixes for each issue
   - Includes guide line number references

---

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

---

## 🛠️ Installation Process

The installation script will:

1. **Detect workspace root** (via .git directory)
2. **Store template** in `templates-and-patterns/mcp-server-templates/templates/`
3. **Create working instance** in `local-instances/mcp-servers/mcp-config-manager/`
4. **Install dependencies** (`npm install`)
5. **Build TypeScript** (`npm run build`)
6. **Configure MCP** (adds to `.mcp.json`)

---

## 🔧 Configuration

### For Claude Code Users (Recommended)

Add servers to Claude Code's global config at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-config-manager": {
      "command": "node",
      "args": [
        "/absolute/path/to/workspace/local-instances/mcp-servers/mcp-config-manager/dist/server.js"
      ]
    }
  }
}
```

**Use absolute paths** - Claude Code doesn't expand `${workspaceFolder}` reliably.

### For VS Code Users

Add to VS Code's MCP settings (managed by the Claude extension).

### Workspace Config (NOT Recommended)

Workspace `.mcp.json` files can conflict with Claude Code's global config and cause servers to fail loading. Only use if you need project-specific servers AND you understand the risks.

**No environment variables needed** - the server auto-detects workspace root.

---

## 🎓 Usage Examples

### Check Configuration Health

```
Claude: sync my MCP configs

=== MCP Configuration Sync Report ===

** Active Configuration Files **
  ✓ Workspace: /Users/you/workspace/.mcp.json
  ✓ Claude Code (global): ~/Library/Application Support/Claude/claude_desktop_config.json

** Orphaned Configurations **
  ⚠️  basic-mcp-server (in global config, but no local instance)

** Missing Registrations **
  ✓ All local instances are registered

** Configuration Conflicts **
  ⚠️  learning-optimizer - REGISTERED IN MULTIPLE LOCATIONS
     Locations: claude-code, workspace
     claude-code: /Users/you/workspace/local-instances/mcp-servers/learning-optimizer-mcp-server/dist/server.js
     workspace: ${workspaceFolder}/local-instances/mcp-servers/learning-optimizer-mcp-server/dist/server.js
     ❌ PATHS DIFFER - This WILL cause loading issues!
     Claude Code may only load from one location, others will fail.
     Recommendation: Keep in ONE location only. Remove from others.
     Suggested: Keep in claude-code (Claude Code's primary config), remove from workspace/global.

** Build Status **
  ✓ All registered servers are built

=== Summary ===
Local instances: 10
Workspace config: 10 servers
Claude Code config: 10 servers

⚠️  CONFLICTS DETECTED - Servers registered in multiple locations will fail to load properly!
   Action required: Remove duplicate registrations from conflicting configs.
```

### Register a New Server

```
Claude: register the ai-planning MCP server

MCP Config Manager:
✅ Successfully registered 'ai-planning' in project scope
   Config: /Users/you/workspace/.mcp.json
```

### List All Servers

```
Claude: list all my MCP servers

git-assistant
  Scopes: global, workspace
  Status: ✅ ready

ai-planning
  Scopes: workspace
  Status: ✅ ready

basic-mcp-server
  Scopes: global
  Status: ❌ missing

Total servers: 10
Local instances: 9
```

### Unregister a Server

```
Claude: unregister basic-mcp-server

MCP Config Manager:
✅ Removed 'basic-mcp-server' from global config
```

### Validate Configuration (NEW in v2.0)

Validate a specific server against guide requirements:

```
Claude: validate the learning-optimizer MCP configuration

=== Configuration Validation: learning-optimizer ===

Status: 🟡 missing-dir
Guide reference: MCP_CONFIGURATION_GUIDE.md:169-193

** Warnings **
  ⚠️  Configuration directory does not exist: ${workspaceFolder}/configuration/learning-optimizer
     Fix: Create directory: mkdir -p /Users/you/workspace/configuration/learning-optimizer
     See: MCP_CONFIGURATION_GUIDE.md:169

=== Summary ===
Errors: 0
Warnings: 1
Info: 0
```

Validate all servers:

```
Claude: validate all my MCP configurations

=== Configuration Validation: All Servers ===

git-assistant: 🟡
  Errors: 0, Warnings: 1

learning-optimizer: 🟡
  Errors: 0, Warnings: 1

arc-decision: 🟢
  Errors: 0, Warnings: 0

=== Summary ===
Total servers validated: 10
Total errors: 0
Total warnings: 2

💡 Run validate_mcp_configuration("<server-name>") for detailed analysis of a specific server.
```

---

## 🔍 How Scope Detection Works

The server uses simple heuristics to determine scope:

**User Scope** (cross-project utilities):
- Server name contains: `git`, `file`, `utility`, `helper`
- Generic, reusable tools

**Project Scope** (workspace-specific):
- Server name matches project domain
- Uses workspace-specific environment variables
- Default for most servers

You can override auto-detection by specifying scope:
```
register_mcp_server("my-server", "user")
```

---

## 🚨 Troubleshooting

### Configuration conflicts detected

**Warning:** `Server registered in MULTIPLE locations`

**Problem:** Same server registered in multiple config files (e.g., both workspace `.mcp.json` and Claude Code's `claude_desktop_config.json`)

**Impact:** Claude Code will fail to load servers properly. Only 4 out of 10 servers may appear.

**Why this happens:**

Claude Code (the CLI tool) uses `~/Library/Application Support/Claude/claude_desktop_config.json` as its global config. **Yes, the filename says "desktop" but this is Claude Code's config file** - the naming is confusing.

If you also have a workspace `.mcp.json`, servers in both files will conflict. The workspace config's `${workspaceFolder}` variable may not expand properly in Claude Code.

**Solution:**
1. Run `sync_mcp_configs()` to see which servers have conflicts
2. Choose ONE config location to keep:
   - **Recommended for Claude Code users:** Use `claude_desktop_config.json` with absolute paths
   - **Recommended for VS Code users:** Use VS Code's MCP config
   - **NOT recommended:** Workspace `.mcp.json` (conflicts with Claude Code, `${workspaceFolder}` doesn't expand)
3. Remove the server from other configs manually or use `unregister_mcp_server()`
4. Restart Claude Code completely (Cmd+Q and reopen)

**Example conflict:**
```
⚠️  learning-optimizer - REGISTERED IN MULTIPLE LOCATIONS
   Locations: claude-code, workspace
   claude-code: /absolute/path/to/server.js
   workspace: ${workspaceFolder}/local-instances/...
   ❌ PATHS DIFFER - This WILL cause loading issues!
   Recommendation: Keep in claude-code, remove from workspace
```

### Server not found

**Error:** `Server 'xyz' not found in local-instances/mcp-servers/`

**Solution:** The server directory doesn't exist. Check spelling or create the server first.

### Server not built

**Warning:** `Server 'xyz' exists but is not built`

**Solution:** Run `npm run build` in the server directory:
```bash
cd local-instances/mcp-servers/xyz
npm run build
```

### Config file locked

**Error:** `Failed to write configuration`

**Solution:** Close any editors with `.mcp.json` or `.claude.json` open.

### Invalid JSON

**Error:** `Configuration is invalid JSON`

**Solution:** The server creates backups automatically. Check `~/.claude.json.backup` or `.mcp.json.backup`.

---

## 🔄 Re-Installation / Updating

To reinstall or update the working instance from the template:

```bash
cd templates-and-patterns/mcp-server-templates/templates/mcp-config-manager-template
./install.sh
```

The script will:
1. Detect existing instance
2. Ask for confirmation before reinstalling
3. Preserve configuration files
4. Fresh install from template

---

## 📚 Files in This Template

```
mcp-config-manager-template/
├── TEMPLATE-INFO.json          # AI-readable metadata
├── INSTALL-INSTRUCTIONS.md     # AI installation guide
├── README.md                   # This file
├── install.sh                  # Automated installation
├── configure-mcp.sh            # MCP configuration
├── package.json                # npm dependencies
├── tsconfig.json               # TypeScript config
├── .gitignore                  # Git ignore rules
└── src/
    └── server.ts               # Main server implementation
```

## 📖 Related Documentation

- **[CONFIG_FILE_NAMING_GUIDE.md](../../CONFIG_FILE_NAMING_GUIDE.md)** - Essential reading for understanding Claude Code's config file naming
- **[START_HERE.md](../../START_HERE.md)** - MCP servers framework overview
- **[TROUBLESHOOTING.md](../../../local-instances/mcp-servers/TROUBLESHOOTING.md)** - Common MCP issues and solutions

---

## 🎯 Design Philosophy

**Guide-Driven > Ad-Hoc:**
- All validation based on MCP_CONFIGURATION_GUIDE.md
- Parses guide requirements automatically
- Actionable fixes for every issue
- References line numbers for easy navigation

**Simple > Complex:**
- 5 focused tools instead of 22
- ~600 lines split across 2 files (main + parser)
- Clear separation of concerns
- Easy to understand and maintain

**Safe > Fast:**
- Always creates backups
- Validates before writing
- Clear error messages
- Restores from backup on failures

**Maintainable > Clever:**
- Straightforward code
- No abstractions
- Easy to debug
- Can grow as needed

---

## 📝 Version History

### v2.0.0 (2025-10-30)
- **MAJOR: MCP_CONFIGURATION_GUIDE.md integration**
- New guide parser module that extracts server requirements automatically
- sync_mcp_configs now validates:
  - Environment variables (required vs optional, with defaults)
  - Configuration directories (checks existence, provides mkdir fixes)
  - Path portability (detects hardcoded paths vs ${workspaceFolder})
- register_mcp_server now shows guide requirements before registration
- **NEW TOOL:** validate_mcp_configuration(serverName?) for deep validation
  - Validates specific server or all servers
  - Groups issues by severity (error, warning, info)
  - Provides actionable fixes for each issue
  - References guide line numbers for navigation
- All validation outputs include guide references
- Backwards compatible - all existing tools work as before with enhanced output

### v1.1.0 (2025-10-26)
- Configuration conflict detection
- Detects servers registered in multiple config files
- Shows exact paths and differences causing loading failures
- Provides specific recommendations for resolving conflicts
- Reports all active config file locations
- Enhanced summary with conflict warnings

### v1.0.0 (2025-10-26)
- Initial release
- 4 core tools (sync, register, unregister, list)
- Auto-scope detection
- Config validation and health reporting
- Safe backup/restore mechanism

---

## 🤝 Contributing

This is a workspace-specific template. To modify:

1. Edit the template files in this directory
2. Run `./install.sh` to update the local instance
3. Restart Claude Code to load changes
4. Test thoroughly before committing

---

## 📄 License

MIT

---

**Built with:** TypeScript, @modelcontextprotocol/sdk
**Pattern:** Simple MCP Server Template
**Maintained by:** Medical Practice Workspace
