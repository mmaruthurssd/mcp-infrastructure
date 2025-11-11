---
type: guide
phase: stable
project: spec-driven-mcp-server
tags: [MCP, configuration, installation, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: high
---

# Setup Guide: Spec-Driven Development MCP Server

## Quick Setup

### 1. Install Dependencies
```bash
cd spec-driven-mcp-server
npm install
```

### 2. Build the Server
```bash
npm run build
```

### 3. Configure Claude Code

Add this server to your Claude Code MCP configuration:

**macOS**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spec-driven": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/spec-driven-mcp-server/dist/server.js"
      ]
    }
  }
}
```

**IMPORTANT**: Replace `/ABSOLUTE/PATH/TO/` with the actual absolute path to this directory.

### 4. Restart Claude Code

The server will be available as the `sdd_guide` tool.

## Verify Installation

After restarting Claude Code, ask:

```
"Do you have access to the sdd_guide tool?"
```

Claude should respond confirming the tool is available.

## First Use

Try building your first spec:

```
"I want to build a Google Sheets version control system using the spec-driven development process"
```

Claude will guide you through:
1. Constitution (principles)
2. Specification (what/why)
3. Planning (how/tech)
4. Tasks (execution)

## Troubleshooting

### Server not appearing in Claude Code

1. Check that the path in config is absolute (not relative)
2. Verify the build completed successfully (`dist/server.js` exists)
3. Check for typos in the JSON configuration
4. Restart Claude Code completely

### TypeScript errors during build

```bash
npm run build
```

If errors occur, ensure TypeScript 5.7+ is installed:
```bash
npm install typescript@latest --save-dev
npm run build
```

### State persistence issues

Workflow state is saved to: `~/.sdd-mcp-data/workflows/`

If you encounter state errors:
```bash
# Clear all workflow state
rm -rf ~/.sdd-mcp-data
```

## Development Mode

For active development:

```bash
# Watch mode - auto-rebuild on changes
npm run watch

# In another terminal, restart Claude Code to pick up changes
```

## Next Steps

Read:
- `README.md` - Full documentation and usage examples
- `agent/spec-driven.md` - Guide for Claude on how to use this tool
- GitHub Spec-Kit docs for methodology background

## Support

- Check `TROUBLESHOOTING.md` in the spec-kit repo for common issues
- Review example conversations in `README.md`
- Open issues on GitHub (when published)
