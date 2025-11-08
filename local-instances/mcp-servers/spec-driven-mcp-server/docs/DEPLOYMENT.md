---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, deployment, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# Deployment Guide: Spec-Driven MCP Server

This is a **template** that can be deployed as a drop-in MCP server. Follow these steps to set up your own instance.

## Quick Deploy (5 minutes)

### 1. Copy Template to Your Workspace

```bash
# Copy this entire folder to your local-instances
cp -r spec-driven-mcp-server /path/to/your/local-instances/mcp-servers/spec-driven-mcp-server
cd /path/to/your/local-instances/mcp-servers/spec-driven-mcp-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Server

```bash
npm run build
```

### 4. Configure Your MCP Client

#### For Claude Code

Edit your MCP configuration:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this entry (replace with YOUR absolute path):

```json
{
  "mcpServers": {
    "spec-driven": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js"
      ]
    }
  }
}
```

**CRITICAL**: Use the **absolute path** to your local instance, not this template!

### 5. Restart Claude Code

The server will now be available with the `sdd_guide` tool.

## Verify Installation

Ask Claude Code:
```
"Do you have the sdd_guide tool?"
```

Then test it:
```
"I want to build a patient appointment scheduler using spec-driven development"
```

## What This Template Includes

✅ Full source code (`src/`)
✅ TypeScript configuration (`tsconfig.json`)
✅ Package dependencies (`package.json`)
✅ All question sets (9 scenarios)
✅ All templates (4 documents)
✅ Complete documentation
✅ Agent guide for Claude
✅ Example configurations

## What Gets Created on Build

When you run `npm run build`:
- `dist/` folder with compiled JavaScript
- `node_modules/` with dependencies

Both are gitignored and won't be committed.

## Customization

### Add New Questions

Edit files in `src/questions/{step}/{scenario}.json`

### Modify Templates

Edit files in `src/templates/base/`

### Change Workflow Logic

Edit `src/workflows/orchestrator.ts`

### Rebuild After Changes

```bash
npm run build
# Then restart Claude Code
```

## File Structure

```
spec-driven-mcp-server/          # This template
├── src/                         # TypeScript source
│   ├── server.ts
│   ├── types.ts
│   ├── tools/
│   ├── workflows/
│   ├── detection/
│   ├── questions/
│   ├── templates/
│   ├── renderers/
│   └── utils/
├── agent/                       # Claude guide
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── README.md
├── SETUP.md
├── SCENARIOS.md
├── DEPLOYMENT.md               # This file
└── [docs]
```

## Troubleshooting

### Build Fails
```bash
# Ensure TypeScript is installed
npm install typescript@latest --save-dev
npm run build
```

### Server Not Appearing
1. Check path in MCP config is **absolute**
2. Verify `dist/server.js` exists
3. Restart Claude Code completely

### Questions Not Loading
- Ensure `npm run build` completed
- Check JSON syntax in question files
- Verify scenario detection (see SCENARIOS.md)

## Support

- See `README.md` for full documentation
- See `SCENARIOS.md` for scenario guide
- See `SETUP.md` for detailed setup

## License

MIT - Free to use and modify

---

**Remember**: This is a TEMPLATE. Always deploy to a separate location (like `local-instances/`) for actual use!
