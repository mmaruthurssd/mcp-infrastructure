---
type: reference
phase: stable
project: task-executor-mcp-server
tags: [MCP, mcp-server, task-executor]
category: mcp-servers
status: completed
priority: medium
---

# Task Executor MCP Server - Local Instance

**Instance Type**: Local MCP Server Instance
**Created From**: `templates-and-patterns/mcp-server-templates/task-executor-mcp-server`
**Template Version**: 1.0.0
**Created Date**: 2025-10-25
**Status**: Active

---

## About This Instance

This is a **local instance** of the Task Executor MCP Server template. It was created by copying the template and building it for use in this workspace.

**Template Location**:
```
templates-and-patterns/mcp-server-templates/task-executor-mcp-server/
```

**Instance Location**:
```
local-instances/mcp-servers/task-executor-mcp-server/
```

---

## Instance Configuration

**Registered in**: `/.mcp.json`

```json
{
  "task-executor": {
    "command": "node",
    "args": [
      "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/task-executor-mcp-server/dist/server.js"
    ]
  }
}
```

---

## Customizations

This instance currently uses the **default template configuration** with no customizations.

Future customizations will be documented here:

- [ ] No customizations yet

---

## Updating from Template

To update this instance with template improvements:

1. **Check template version**:
   ```bash
   cd templates-and-patterns/mcp-server-templates/task-executor-mcp-server
   # Review TEMPLATE_README.md for version
   ```

2. **Backup current instance**:
   ```bash
   cp -r local-instances/mcp-servers/task-executor-mcp-server \
         local-instances/mcp-servers/task-executor-mcp-server.backup
   ```

3. **Merge template changes**:
   ```bash
   # Review diffs
   # Merge relevant changes
   # Preserve customizations
   ```

4. **Rebuild**:
   ```bash
   cd local-instances/mcp-servers/task-executor-mcp-server
   npm install
   npm run build
   ```

5. **Test**:
   ```bash
   # Restart Claude Code
   # Test basic workflow creation
   ```

---

## Instance Maintenance

### Build Status
- ✅ Last successful build: 2025-10-25
- ✅ TypeScript compilation: Clean
- ✅ Dependencies: 92 packages, 0 vulnerabilities

### Usage Stats
- Workflows created: TBD
- Tasks completed: TBD
- Workflows archived: TBD

---

## Workflow Storage

This instance stores workflows in:

**Active workflows**:
```
{project}/temp/workflows/{workflow-name}/
```

**Archived workflows**:
```
{project}/archive/workflows/YYYY-MM-DD-{workflow-name}/
```

---

## Related Templates

**Template**: `templates-and-patterns/mcp-server-templates/task-executor-mcp-server/`
- Full source code
- Template documentation
- Customization guide
- Future updates

**Other MCP Servers in Workspace**:
- spec-driven (comprehensive specs)
- git-assistant (git operations)
- smart-file-organizer (file management)
- learning-optimizer (learning patterns)
- project-index-generator (project indexing)
- communications (team communication)

---

## Template vs Instance

| Aspect | Template | This Instance |
|--------|----------|---------------|
| **Purpose** | Reusable base | Active server |
| **Location** | `templates-and-patterns/` | `local-instances/` |
| **Modifications** | Should avoid | Can customize freely |
| **Updates** | Source of truth | Receives updates |
| **Documentation** | TEMPLATE_README.md | This file |

---

## Notes

- This instance was created during initial implementation
- Currently using default template configuration
- No customizations applied yet
- Template and instance are in sync

---

**End of Instance Information**
