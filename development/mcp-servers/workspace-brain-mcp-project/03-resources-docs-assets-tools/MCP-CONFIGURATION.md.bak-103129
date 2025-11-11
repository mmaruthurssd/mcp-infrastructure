---
type: guide
tags: [configuration, deployment, mcp-setup]
---

# MCP Configuration Guide

**MCP:** workspace-brain-mcp
**Version:** 1.0.0
**Phase:** 1 (File-based storage)

## Deployment Command

```bash
claude mcp add --transport stdio workspace-brain-mcp -- node /Users/mmaruthurnew/Desktop/medical-practice-workspace/mcp-server-development/workspace-brain-mcp-project/04-product-under-development/build/index.js
```

**Scope:** User (global - generic utility)

**Rationale:** workspace-brain provides external storage and intelligence capabilities that can be used across any workspace, not just this medical practice workspace.

## Configuration Details

### Transport
- **Type:** stdio
- **Command:** node
- **Args:** Absolute path to build/index.js

### Environment Variables
```bash
WORKSPACE_BRAIN_PATH=~/workspace-brain  # Default location (optional override)
WORKSPACE_BRAIN_CACHE_TTL=3600         # Default cache TTL (optional)
WORKSPACE_BRAIN_LOG_LEVEL=info         # Logging level (optional)
```

### External Brain Setup

The MCP requires the external brain directory structure at `~/workspace-brain/`:

```bash
~/workspace-brain/
├── telemetry/         # Task logs and MCP usage
├── analytics/         # Generated reports
├── learning/          # Patterns and solutions
├── cache/             # Temporary cached data
└── backups/           # Manual exports
```

**Auto-Creation:** The MCP will create directories automatically on first use.

## Verification

After deployment, verify the MCP is loaded:

1. Restart Claude Code
2. Check MCP availability: All 15 tools should be listed
3. Test basic functionality:
   ```
   workspace_brain.get_storage_stats()
   ```

## MCP Configuration Checklist Compliance

✅ **Uses `claude mcp add` command** (not manual JSON editing)
✅ **Absolute path to executable**
✅ **User scope** (generic utility, not workspace-specific)
✅ **No duplicate registrations** (checked with `list_mcp_servers`)
✅ **Environment variables documented**
✅ **Verified with ROLLOUT-CHECKLIST.md Layer 3**

---

**Created:** 2025-10-31
**Last Updated:** 2025-10-31
