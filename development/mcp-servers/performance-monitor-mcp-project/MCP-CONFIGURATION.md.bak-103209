# Performance Monitor MCP - Configuration Guide

**Version:** 2.0.0 (Updated for MCP-CONFIGURATION-CHECKLIST.md v1.2.0 compliance)
**Last Updated:** 2025-10-31

---

## ⚠️ IMPORTANT: Use Command-Based Registration

**Claude Code CLI uses `~/.claude.json` as the ONLY configuration file.**

- ✅ **CORRECT:** Use `claude mcp add` command
- ❌ **INCORRECT:** Manual JSON editing (deprecated, causes conflicts)
- ❌ **INCORRECT:** Workspace `.mcp.json` files (not supported in Claude Code CLI)

---

## MCP Registration (Recommended Method)

### Step 1: Verify Build Artifacts Exist

```bash
# Check that build completed successfully
ls -la /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/performance-monitor-mcp-project/04-product-under-development/build/index.js
```

**Expected output:** File should exist with read/execute permissions

---

### Step 2: Register MCP Server

**Command:**
```bash
claude mcp add --transport stdio performance-monitor-mcp -- node /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/performance-monitor-mcp-project/04-product-under-development/build/index.js
```

**Explanation:**
- `--transport stdio` - Communication protocol (standard input/output)
- `performance-monitor-mcp` - MCP server name
- `--` - Separator between MCP options and server command
- `node /path/to/build/index.js` - Command to execute (**MUST be absolute path**, no relative paths, no `${workspaceFolder}`)

**Note:**
- Registrations are user-global by default (available across all workspaces)
- Single registration works everywhere
- No per-project configuration needed

---

### Step 3: Verify Registration

```bash
# List all registered MCP servers
claude mcp list
```

**Expected output:**
```
performance-monitor-mcp
  Command: node
  Args: /Users/mmaruthurnew/Desktop/.../build/index.js
  Scope: user
  Config: ~/.claude.json
```

---

### Step 4: Restart Claude Code

```bash
# Restart Claude Code to load the new MCP server
# (Use your system's method to restart the application)
```

After restart, the Performance Monitor MCP will be loaded automatically.

---

### Step 5: Verify Tools Available

Check that all 8 tools are available in Claude Code:

1. `mcp__performance-monitor-mcp__track_performance` - Track MCP tool execution metrics
2. `mcp__performance-monitor-mcp__get_metrics` - Query performance metrics
3. `mcp__performance-monitor-mcp__detect_anomalies` - Detect performance anomalies
4. `mcp__performance-monitor-mcp__set_alert_threshold` - Configure alert thresholds
5. `mcp__performance-monitor-mcp__get_active_alerts` - Get active alerts
6. `mcp__performance-monitor-mcp__acknowledge_alert` - Acknowledge alerts
7. `mcp__performance-monitor-mcp__generate_performance_report` - Generate reports
8. `mcp__performance-monitor-mcp__get_performance_dashboard` - Get dashboard data

---

## Configuration Validation Checklist

Before deployment, verify the following:

### ✅ Path Validation
- [ ] Using absolute path (not relative)
- [ ] NO `${workspaceFolder}` variable
- [ ] Path verified to exist: `ls -la /path/to/build/index.js`

### ✅ Scope Decision
- [ ] User scope (`--scope user`) for cross-workspace monitoring
- [ ] Registered in `~/.claude.json` (NOT workspace `.mcp.json`)

### ✅ No Configuration Conflicts
- [ ] NO `.mcp.json` in workspace root
- [ ] NO `.claude_code_config.json` in workspace root
- [ ] Claude Code CLI uses `~/.claude.json` ONLY

### ✅ Registration Verification
- [ ] `claude mcp list` shows `performance-monitor-mcp`
- [ ] All 8 tools visible in Claude Code
- [ ] No registration errors in logs

**Reference:** `mcp-implementation-master-project/MCP-CONFIGURATION-CHECKLIST.md` v1.2.0

---

## Unregistration (If Needed)

To remove the MCP server:

```bash
claude mcp remove performance-monitor-mcp
```

This will:
- Remove entry from `~/.claude.json`
- Require Claude Code restart to take effect
- NOT delete the build artifacts (they remain in `04-product-under-development/build/`)

---

## Testing

### Smoke Test: Track Performance

```typescript
// Track a test metric
mcp__performance-monitor-mcp__track_performance({
  mcpServer: "test-mcp",
  toolName: "test_tool",
  duration: 150,
  success: true
})
```

**Expected output:**
```json
{
  "success": true,
  "metricId": "perf_abc123...",
  "timestamp": "2025-10-31T12:00:00Z",
  "stored": true
}
```

### Smoke Test: Get Metrics

```typescript
// Query metrics from last 24 hours
mcp__performance-monitor-mcp__get_metrics({
  startTime: "2025-10-31T00:00:00Z",
  endTime: "2025-10-31T23:59:59Z"
})
```

**Expected output:**
```json
{
  "totalCalls": 1,
  "successRate": 100,
  "avgResponseTime": 150,
  "errorRate": 0,
  "metrics": [...]
}
```

### Smoke Test: Detect Anomalies

```typescript
// Check for anomalies in last 6 hours
mcp__performance-monitor-mcp__detect_anomalies({
  lookbackWindow: "6h",
  sensitivity: "medium"
})
```

**Expected output:**
```json
{
  "anomalies": [],
  "summary": "No anomalies detected (insufficient data for baseline)"
}
```

---

## Troubleshooting

### Issue: `claude: command not found`

**Cause:** Claude Code CLI not installed or not in PATH

**Solution:**
```bash
# Check if Claude Code CLI is installed
which claude

# If not found, install from:
# https://docs.claude.com/en/docs/claude-code/installation
```

---

### Issue: `Server not starting`

**Cause:** Build artifacts missing or Node.js not installed

**Solution:**
```bash
# Verify Node.js is installed
node --version  # Should show v18+ or v20+

# Verify build artifacts exist
ls -la /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/performance-monitor-mcp-project/04-product-under-development/build/index.js

# If missing, rebuild
cd /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/performance-monitor-mcp-project/04-product-under-development
npm run build
```

---

### Issue: `Tools not available after restart`

**Cause:** Registration didn't complete or configuration syntax error

**Solution:**
```bash
# Verify registration
claude mcp list | grep performance-monitor-mcp

# Check Claude Code logs for errors
# (Location varies by OS, check Claude Code documentation)

# Re-register if needed
claude mcp remove performance-monitor-mcp
claude mcp add performance-monitor-mcp --command node --args /path/to/build/index.js --scope user
```

---

### Issue: `Permission errors`

**Cause:** `.performance-data/` directory not writable

**Solution:**
```bash
# Create directory with proper permissions
mkdir -p ~/.performance-data
chmod 700 ~/.performance-data

# Or check existing permissions
ls -ld ~/.performance-data
```

---

## Advanced Configuration

### Custom Data Directory

By default, Performance Monitor stores data in `~/.performance-data/`.

To use a custom location, set the `PERFORMANCE_DATA_DIR` environment variable:

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PERFORMANCE_DATA_DIR="/path/to/custom/directory"

# Then re-register
claude mcp remove performance-monitor-mcp
claude mcp add performance-monitor-mcp --command node --args /path/to/build/index.js --scope user
```

**Note:** Custom data directory must exist and be writable.

---

## Migration from Manual Configuration

If you previously used manual JSON configuration, migrate to command-based:

### Step 1: Remove Old Configuration

```bash
# Backup current config
cp ~/.claude.json ~/.claude.json.backup

# Remove old manual entry
# (Edit ~/.claude.json and remove "performance-monitor-mcp" entry)
```

### Step 2: Register Using Command

```bash
claude mcp add performance-monitor-mcp \
  --command node \
  --args /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/performance-monitor-mcp-project/04-product-under-development/build/index.js \
  --scope user
```

### Step 3: Verify Migration

```bash
# Check registration
claude mcp list | grep performance-monitor-mcp

# Restart Claude Code
# Verify all 8 tools still available
```

---

## Configuration File Locations (Reference Only)

**DO NOT edit these files manually. Use `claude mcp add` command.**

| File | Purpose | Managed By | Edit Manually? |
|------|---------|------------|----------------|
| `~/.claude.json` | User-global MCP config | `claude mcp` commands | ❌ NO |
| `.mcp.json` (workspace) | Project-specific config | NOT SUPPORTED | ❌ NO |
| `~/.config/Claude/claude_desktop_config.json` | Claude Desktop (NOT Claude Code CLI) | Different app | ❌ NO |

---

## Next Steps After Registration

1. ✅ Verify all 8 tools available in Claude Code
2. ✅ Run smoke tests to verify functionality
3. ✅ Start tracking MCP performance metrics
4. 📊 Monitor workspace performance
5. 🔔 Configure alert thresholds for critical MCPs
6. 📈 Generate weekly performance reports

---

**Configuration Guide Version:** 2.0.0
**Compliance:** MCP-CONFIGURATION-CHECKLIST.md v1.2.0
**Last Updated:** 2025-10-31
**Status:** ✅ Ready for deployment
