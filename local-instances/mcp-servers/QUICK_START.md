---
type: guide
phase: stable
project: mcp-servers
tags: [quick-start, installation, reference, setup]
category: mcp-servers
status: completed
priority: high
---

# MCP Server Installation - Quick Start

## Every Time You Install an MCP Server

Run these commands in order:

### 1. Install & Build
```bash
cd <WORKSPACE_ROOT>/local-instances/mcp-servers/<server-name>
npm install
npm run build
```

### 2. Add to User Scope (Recommended - Available Globally)
```bash
claude mcp add --scope user --transport stdio <server-name> -- node <ABSOLUTE_PATH>/local-instances/mcp-servers/<server-name>/dist/server.js
```

**Example:**
```bash
# macOS/Linux
claude mcp add --scope user --transport stdio file-organizer -- node /Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js

# Windows
claude mcp add --scope user --transport stdio file-organizer -- node C:/Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js
```

**Important:** Replace `<ABSOLUTE_PATH>` with your full workspace path!

### Alternative: Project Scope (`.mcp.json`)
For project-specific servers only, edit `.mcp.json` in workspace root:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": [
        "<ABSOLUTE_PATH>/local-instances/mcp-servers/<server-name>/dist/server.js"
      ]
    }
  }
}
```

### 3. Verify Setup
```bash
cd <WORKSPACE_ROOT>/mcp-servers
./verify-mcp-setup.sh
```

### 4. Fix Issues (if any)
- Read the error output from verification script
- Check `TROUBLESHOOTING.md` for solutions
- Re-run verification after fixes

### 5. Restart Claude Code
- Fully quit Claude Code (Cmd+Q on macOS)
- Restart Claude Code

---

## Common Mistakes

❌ **Relative paths** → Use full path starting with `/` not `./`
❌ **Forgot to build** → Run `npm run build` in server directory
❌ **Forgot --scope user** → Servers won't be available in other projects
❌ **Didn't restart** → Must fully quit and restart Claude Code

---

## Quick Commands

```bash
# Navigate to mcp-servers directory
cd <WORKSPACE_ROOT>/mcp-servers

# Verify setup (run this often!)
./verify-mcp-setup.sh

# View config
cat <WORKSPACE_ROOT>/.mcp.json

# View troubleshooting guide
cat TROUBLESHOOTING.md
```

---

## Need More Help?

- **Complete guide**: Read `MCP_INSTALLATION_WORKFLOW.md`
- **Known issues**: Check `TROUBLESHOOTING.md`
- **Overview**: See `README.md`
