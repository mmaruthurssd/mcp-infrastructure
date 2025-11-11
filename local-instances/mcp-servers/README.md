---
type: readme
phase: stable
project: mcp-servers
tags: [overview, directory, documentation, mcp]
category: mcp-servers
status: completed
priority: high
---

# MCP Servers Directory

This directory contains MCP server templates and installed instances.

## Quick Start

**New to MCP servers?** Read `STANDARD_INSTALLATION_GUIDE.md` for the recommended approach.

**Quick reference?** See `QUICK_START.md` for a one-page guide.

**Detailed workflow?** Follow `MCP_INSTALLATION_WORKFLOW.md` step-by-step.

**Having issues?** Check `TROUBLESHOOTING.md` and run `./verify-mcp-setup.sh`

---

## Standard Installation Workflow

Every time you install an MCP server:

1. **Install & Build** the server
2. **Add to user scope (globally)** using `claude mcp add --scope user`
3. **Run `./verify-mcp-setup.sh`** to check everything (optional)
4. **Fix any issues** using TROUBLESHOOTING.md
5. **Restart Claude Code**

---

## Directory Structure

When properly set up, this directory should contain:

```
mcp-servers/
├── README.md                          # This file
├── QUICK_START.md                     # One-page quick reference
├── MCP_INSTALLATION_WORKFLOW.md       # Complete installation guide
├── TROUBLESHOOTING.md                 # Issue tracking and solutions
├── verify-mcp-setup.sh               # Automated verification script
├── <server-name-1>/                  # Individual MCP server
│   ├── src/
│   ├── dist/                         # Built server (after npm run build)
│   ├── package.json
│   └── ...
├── <server-name-2>/
└── <server-name-3>/
```

---

## Configuration

**Recommended: User Scope (Global Configuration)**

Add MCP servers to user scope so they're available across ALL your projects:

```bash
claude mcp add --scope user --transport stdio <server-name> -- node /full/absolute/path/to/mcp-servers/server-name/dist/server.js
```

**Example:**
```bash
claude mcp add --scope user --transport stdio file-organizer -- node /Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js
```

**Alternative: Project Scope (`.mcp.json`)**

For project-specific servers, you can use `.mcp.json` at your workspace root:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": [
        "/full/absolute/path/to/workspace/mcp-servers/server-name/dist/server.js"
      ]
    }
  }
}
```

**Critical Rules:**
- ✅ Use **ABSOLUTE paths** (full path with `/`)
- ❌ Never use relative paths (`./` or `../`)
- ✅ User scope recommended for general-purpose servers
- ✅ Project scope for project-specific overrides

---

## Troubleshooting

If MCP servers aren't loading:

1. **Run the verification script first:**
   ```bash
   ./verify-mcp-setup.sh
   ```
   This will automatically detect issues and suggest fixes.

2. **Check TROUBLESHOOTING.md** for documented issues and solutions

3. **Common mistakes:**
   - Using relative paths instead of absolute paths
   - Forgetting to run `npm run build`
   - Wrong config file name (`mcp-servers.json` vs `.mcp.json`)
   - Config in wrong location (should be workspace root)

---

## Files in This Directory

- **`README.md`** - This file, overview and quick reference
- **`STANDARD_INSTALLATION_GUIDE.md`** - **Recommended installation guide with user scope**
- **`QUICK_START.md`** - One-page cheat sheet for installation
- **`MCP_INSTALLATION_WORKFLOW.md`** - Complete step-by-step guide
- **`TROUBLESHOOTING.md`** - Known issues and solutions
- **`verify-mcp-setup.sh`** - Automated verification script
- **Individual server folders** - Your installed MCP servers

---

## Documentation

- **[CONFIG_FILE_NAMING_GUIDE.md](../../templates-and-patterns/mcp-server-templates/CONFIG_FILE_NAMING_GUIDE.md)** - ⚠️ MUST READ: Understanding Claude Code's config file naming
- Official MCP Docs: https://docs.claude.com/en/docs/claude-code/mcp
- Installation Guide: See `MCP_INSTALLATION_WORKFLOW.md`
- Troubleshooting: See `TROUBLESHOOTING.md`

### ⚠️ Important for Claude Code Users

If you're using Claude Code (the CLI in VS Code), you MUST understand the config file naming:
- Config file: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **The filename says "desktop" but it's Claude Code's config** - not a desktop app
- Use absolute paths, NOT `${workspaceFolder}`
- Avoid workspace `.mcp.json` (causes conflicts)

**Read [CONFIG_FILE_NAMING_GUIDE.md](../../templates-and-patterns/mcp-server-templates/CONFIG_FILE_NAMING_GUIDE.md) for full details.**
