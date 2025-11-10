# Quick Start Guide

Get the Workspace Health Dashboard MCP running in 5 minutes.

## Prerequisites

✅ Node.js 18+ installed
✅ Claude Desktop installed
✅ Workspace Brain MCP running

## Installation

### 1. The MCP is already built!

```bash
cd /Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/workspace-health-dashboard-mcp-server
# Already done: npm install && npm run build
```

### 2. The MCP is already registered!

It's been added to `~/.claude.json`:

```json
{
  "mcpServers": {
    "workspace-health-dashboard": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/workspace-health-dashboard-mcp-server/dist/index.js"
      ],
      "env": {
        "WORKSPACE_ROOT": "/Users/mmaruthurnew/Desktop/medical-practice-workspace",
        "WORKSPACE_BRAIN_PATH": "/Users/mmaruthurnew/workspace-brain"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

**Important:** You MUST restart Claude Desktop for the new MCP to load.

## First Use

### Test 1: Get Overall Health

In Claude, try:

```
Get the workspace health using the workspace-health-dashboard MCP
```

Expected response:
```json
{
  "score": 95,
  "status": "healthy",
  "topIssues": [],
  "breakdown": {
    "mcpHealth": 100,
    "autonomousResolution": 95,
    "workflowCompletion": 100,
    "systemResources": 100
  }
}
```

### Test 2: Create Dashboard

```
Create a health dashboard in markdown format
```

Expected response:
```markdown
# Workspace Health Dashboard

Generated: 11/7/2025, 12:00:00 AM

---

## Overall Health: 95/100 🟢

**Status:** HEALTHY

[... full dashboard ...]
```

### Test 3: Get MCP Status

```
Show me the status of all MCPs
```

Expected response:
```json
{
  "summary": {
    "total": 22,
    "healthy": 22,
    "warning": 0,
    "critical": 0,
    "inactive": 0
  },
  "statuses": [...]
}
```

## Common Commands

### Daily Health Check

"Show me the workspace health dashboard"

### Investigate Issues

"What are the top bottlenecks in my workspace?"

### Find Automation Opportunities

"What tasks should I automate? Show me ROI estimates."

### Check Alerts

"Are there any critical system alerts?"

### Monitor Autonomous Performance

"How is autonomous resolution performing?"

## Troubleshooting

### MCP Not Found

**Problem:** "I don't see workspace-health-dashboard in my MCP list"

**Solution:**
1. Restart Claude Desktop (Required!)
2. Check `~/.claude.json` has the entry
3. Verify build: `ls dist/index.js`

### No Data Showing

**Problem:** "Dashboard shows all zeros"

**Solution:**
1. Check workspace-brain exists: `ls ~/workspace-brain/telemetry/`
2. Verify sample data: `cat ~/workspace-brain/telemetry/events.jsonl`
3. Use workspace for a few hours to generate real data

### Build Errors

**Problem:** "npm run build fails"

**Solution:**
```bash
cd /Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/workspace-health-dashboard-mcp-server
rm -rf node_modules dist
npm install
npm run build
```

## What's Next?

1. **Use the dashboard daily** - Check health every morning
2. **Set up monitoring** - Watch for alerts and bottlenecks
3. **Act on opportunities** - Automate high-ROI tasks
4. **Wait for Agent 2/3** - ROI and calibration data coming soon
5. **Integrate with CI/CD** - Block deployments if health <85

## Full Documentation

- **README.md** - Complete guide (500+ lines)
- **EXAMPLE_DASHBOARD.md** - All scenarios with examples
- **DELIVERABLES.md** - Technical specifications

## Support

If you encounter issues:

1. Check this QUICK_START.md
2. Review README.md troubleshooting section
3. Verify sample data exists in workspace-brain
4. Check MCP registration in ~/.claude.json
5. Restart Claude Desktop

---

**Ready?** Restart Claude Desktop and try: "Show me the workspace health dashboard" 🚀
