---
type: guide
phase: stable
project: mcp-servers
tags: [installation, standard, user-scope, configuration, best-practices]
category: mcp-servers
status: completed
priority: high
---

# Standard MCP Server Installation Guide

## Overview

This guide provides the **recommended approach** for installing MCP servers with Claude Code. It emphasizes **user scope (global)** configuration so servers are available across all your projects.

---

## Quick Install (3 Steps)

### 1. Install & Build
```bash
cd /path/to/local-instances/mcp-servers/<server-name>
npm install
npm run build
```

### 2. Add to User Scope (Global)
```bash
claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/local-instances/mcp-servers/<server-name>/dist/server.js
```

### 3. Restart Claude Code
Fully quit and restart Claude Code (Cmd+Q on macOS).

---

## Detailed Installation

### Step 1: Install Dependencies

Navigate to the server directory and install:

```bash
cd /absolute/path/to/local-instances/mcp-servers/<server-name>
npm install
```

**Verify:**
- `node_modules/` directory created
- No error messages

### Step 2: Build the Server

Compile TypeScript to JavaScript:

```bash
npm run build
```

**Verify:**
- `dist/` directory created (or `build/` for some servers)
- `dist/server.js` exists
- No TypeScript errors

### Step 3: Add to User Scope

**This is the recommended approach** - it makes the server available globally across ALL projects:

```bash
claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/dist/server.js
```

**Example (macOS/Linux):**
```bash
claude mcp add --scope user --transport stdio file-organizer -- node /Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js
```

**Example (Windows):**
```bash
claude mcp add --scope user --transport stdio file-organizer -- node C:/Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js
```

**Important Notes:**
- Use `--scope user` to make servers globally available
- Use `--transport stdio` for local servers
- Always use absolute paths (not relative paths like `./` or `../`)
- Replace `<server-name>` with the MCP server name (e.g., `file-organizer`, `git-assistant`)
- Replace `/absolute/path/to/` with your actual full path

### Step 4: Verify Installation

List all configured MCP servers:

```bash
claude mcp list
```

You should see your server in the list with a green checkmark (✓ Connected).

### Step 5: Restart Claude Code

Fully quit Claude Code:
- macOS: Cmd+Q
- Windows/Linux: Alt+F4 or Ctrl+Q

Then restart Claude Code.

### Step 6: Test the Server

In Claude Code, verify the server is working:

```
You: "What MCP tools do you have access to?"
```

You should see tools from your newly installed server.

---

## Configuration Scopes

### User Scope (Recommended)

**Use Case:** General-purpose servers you want available everywhere

**Advantages:**
- ✅ Available in ALL projects
- ✅ Configure once, use everywhere
- ✅ No need for `.mcp.json` in each project
- ✅ Easier to maintain

**Configuration:**
```bash
claude mcp add --scope user --transport stdio <name> -- node /path/to/server.js
```

**Where it's stored:**
- macOS: `~/.claude.json`
- Windows: `%APPDATA%/.claude.json`
- Linux: `~/.claude.json`

### Project Scope (Alternative)

**Use Case:** Project-specific servers or overrides

**Advantages:**
- ✅ Shared via version control
- ✅ Team-wide configuration
- ✅ Project-specific settings

**Configuration:**

Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": [
        "/absolute/path/to/server.js"
      ],
      "env": {
        "OPTIONAL_VAR": "value"
      }
    }
  }
}
```

### Local Scope

**Use Case:** Personal project settings (not shared)

**Configuration:**
```bash
claude mcp add --scope local --transport stdio <name> -- node /path/to/server.js
```

---

## Common Server Names

When installing these common MCP servers, use these server names:

| Server | Name | Command |
|--------|------|---------|
| File Organizer | `file-organizer` | `claude mcp add --scope user --transport stdio file-organizer -- node /path/to/file-organizer-mcp-server/dist/server.js` |
| Git Assistant | `git-assistant` | `claude mcp add --scope user --transport stdio git-assistant -- node /path/to/git-assistant-mcp-server/dist/server.js` |
| Spec-Driven | `spec-driven` | `claude mcp add --scope user --transport stdio spec-driven -- node /path/to/spec-driven-mcp-server/dist/server.js` |
| Smart File Organizer | `smart-file-organizer` | `claude mcp add --scope user --transport stdio smart-file-organizer -- node /path/to/smart-file-organizer-mcp-server/dist/server.js` |
| Learning Optimizer | `learning-optimizer` | `claude mcp add --scope user --transport stdio learning-optimizer -- node /path/to/learning-optimizer-mcp-server/dist/server.js` |
| Miro | `miro` | `claude mcp add --scope user --transport stdio miro -- node /path/to/miro-mcp-server/build/index.js` |

---

## Troubleshooting

### Server Not Appearing

**Problem:** Server doesn't show up in `claude mcp list`

**Solutions:**
1. Check you used the correct command with `--scope user`
2. Verify the absolute path is correct
3. Ensure the server file exists: `ls /path/to/dist/server.js`
4. Restart Claude Code completely

### Server Shows "Not Connected"

**Problem:** Server appears in list but shows ✗ Not Connected

**Solutions:**
1. Check the server built correctly: `ls dist/server.js`
2. Try running the server manually: `node dist/server.js`
3. Check for errors in Claude Code logs
4. Rebuild the server: `npm run build`

### "Command Not Found" Error

**Problem:** `claude mcp add` command not found

**Solutions:**
1. Ensure Claude Code CLI is installed
2. Update Claude Code to latest version
3. Try using full path: `/usr/local/bin/claude mcp add`

### Server Path is Relative

**Problem:** Used `./dist/server.js` instead of absolute path

**Solution:**
Remove and re-add with absolute path:
```bash
claude mcp remove <server-name>
claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/dist/server.js
```

### Wrong Scope

**Problem:** Added to local/project scope instead of user scope

**Solution:**
Remove and re-add with `--scope user`:
```bash
claude mcp remove <server-name>
claude mcp add --scope user --transport stdio <server-name> -- node /path/to/server.js
```

---

## Environment Variables

Some servers require environment variables. Add them like this:

**Note:** Environment variables cannot be set via `claude mcp add`. Use `.mcp.json` if you need environment variables:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your-key-here",
        "DEBUG": "true"
      }
    }
  }
}
```

---

## Updating Servers

### Update Server Code

1. Pull latest changes or modify code
2. Rebuild: `npm run build`
3. Restart Claude Code (servers reload automatically)

### Update Server Configuration

```bash
# Remove old configuration
claude mcp remove <server-name>

# Add new configuration
claude mcp add --scope user --transport stdio <server-name> -- node /new/path/to/server.js
```

### Verify Update

```bash
claude mcp list
```

---

## Removing Servers

Remove a server from user scope:

```bash
claude mcp remove <server-name>
```

Then restart Claude Code.

---

## Best Practices

1. ✅ **Always use `--scope user`** for general-purpose servers
2. ✅ **Use absolute paths** (not relative paths)
3. ✅ **Test servers** after installation with `claude mcp list`
4. ✅ **Document custom servers** with README files
5. ✅ **Keep servers updated** by pulling latest changes and rebuilding
6. ✅ **Use consistent naming** (kebab-case like `file-organizer`)

---

## Related Documentation

- [MCP Protocol Documentation](https://spec.modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.claude.com/en/docs/claude-code/mcp)
- `README.md` - Overview of mcp-servers directory
- `QUICK_START.md` - Quick reference for installation
- `MCP_INSTALLATION_WORKFLOW.md` - Detailed workflow guide
- `TROUBLESHOOTING.md` - Known issues and solutions

---

## Summary

**The standard installation process:**

1. Install dependencies: `npm install`
2. Build server: `npm run build`
3. Add to user scope: `claude mcp add --scope user --transport stdio <name> -- node /absolute/path/to/dist/server.js`
4. Restart Claude Code
5. Verify: `claude mcp list`

That's it! Your MCP server is now available across all your projects.
