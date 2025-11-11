---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, configuration, deployment, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# Spec-Driven MCP Server - Local Instance

This is a **deployed local instance** of the Spec-Driven Development MCP Server template.

## Status

✅ **Installed and configured** for this workspace
✅ **Built and ready** to use with Claude Code
✅ **Added to MCP config** at `workspace-config/.mcp.json`

## Configuration

**MCP Config Entry**:
```json
{
  "spec-driven": {
    "command": "node",
    "args": [
      "./local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js"
    ]
  }
}
```

## Usage

After restarting Claude Code, you can use:

```
"I want to build a Google Sheets version control system using spec-driven development"
```

Claude will use the `sdd_guide` tool to walk you through:
1. Constitution (project principles)
2. Specification (what/why)
3. Planning (how/tech)
4. Tasks (execution order)

## Scenarios Supported

1. **New Project** - Starting from scratch
2. **Existing Project** - Adding specs to existing code
3. **Add Feature** - Adding features to project with specs

See `SCENARIOS.md` for details.

## Customization

To customize this instance:

1. Edit question files in `src/questions/`
2. Edit templates in `src/templates/base/`
3. Rebuild: `npm run build`
4. Restart Claude Code

## Source Template

This instance was deployed from:
```
Templates-for-tools-frameworks-mcp-servers/mcp-servers/spec-driven-mcp-server/
```

To deploy a fresh copy:
```bash
cp -r Templates-for-tools-frameworks-mcp-servers/mcp-servers/spec-driven-mcp-server \
      local-instances/mcp-servers/spec-driven-mcp-server-v2
cd local-instances/mcp-servers/spec-driven-mcp-server-v2
rm -rf node_modules dist
npm install
npm run build
```

## Documentation

- `README.md` - Full documentation
- `SETUP.md` - Setup instructions
- `SCENARIOS.md` - Scenario guide
- `DEPLOYMENT.md` - Deployment guide

## State Storage

Workflow state is stored in:
```
~/.sdd-mcp-data/workflows/
```

To clear state:
```bash
rm -rf ~/.sdd-mcp-data
```

## This is a Local Instance

**DO NOT** edit the template directly. Make changes here in `local-instances/`, then:
- If you want to keep changes private: Keep them here only
- If you want to share: Copy improvements back to the template

---

**Template Location**: `Templates-for-tools-frameworks-mcp-servers/mcp-servers/spec-driven-mcp-server/`
**This Instance**: `local-instances/mcp-servers/spec-driven-mcp-server/`
