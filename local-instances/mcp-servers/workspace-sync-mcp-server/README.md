# Workspace Sync MCP Server

MCP server for workspace synchronization with platform updates, project sync, and Google Drive integration.

## Features

### Platform Synchronization
- **check_platform_updates**: Check for platform updates from upstream repository
  - Compares current version with latest upstream version
  - Detects breaking changes
  - Shows new components

- **apply_platform_update**: Apply platform update with backup and rollback
  - Creates backup before updating
  - Merges from upstream tag
  - Validates workspace health after update

### Project Synchronization
- **sync_projects**: Sync all projects using git submodules
  - Parses workspace-manifest.yml
  - Syncs each project according to its sync method
  - Supports selective project sync

- **sync_google_drive**: Sync project with Google Drive (placeholder)
  - Bidirectional synchronization
  - OAuth2 authentication required
  - Conflict resolution (future implementation)

### Workspace Management
- **workspace_health**: Run comprehensive workspace health check
  - Platform metadata validation
  - Workspace configuration checks
  - Git repository status
  - Submodule initialization
  - Dependency checks
  - MCP build status
  - Disk space monitoring
  - Security configuration

### Manifest Management
- **list_projects**: List all projects configured in workspace-manifest.yml
  - Filter by sync method
  - Show sync status and metadata

- **update_manifest**: Update workspace-manifest.yml
  - Add/update/remove projects
  - Modify MCP configuration
  - Update security settings
  - Safe YAML modification

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the `WORKSPACE_ROOT` environment variable to point to your workspace directory:

```bash
export WORKSPACE_ROOT=/path/to/workspace
```

If not set, the server will use the current working directory.

## Usage

Add to your MCP configuration file (`~/.claude.json`):

```json
{
  "mcpServers": {
    "workspace-sync": {
      "command": "node",
      "args": [
        "/path/to/workspace/local-instances/mcp-servers/workspace-sync-mcp-server/dist/index.js"
      ],
      "env": {
        "WORKSPACE_ROOT": "/path/to/workspace"
      }
    }
  }
}
```

## Tools

### check_platform_updates

Check for platform updates from upstream.

**Input**: None

**Output**: Version comparison, breaking changes, new components

**Example**:
```
Latest available: 1.5.0
Currently installed: 1.4.0
⚠️  BREAKING CHANGES detected
✨ 3 new MCP(s) available
```

### apply_platform_update

Apply platform update with backup.

**Input**:
- `skipBackup` (boolean, optional): Skip backup creation
- `autoConfirm` (boolean, optional): Auto-confirm breaking changes

**Output**: Update progress, backup location, health check results

### sync_projects

Sync all projects or specific project.

**Input**:
- `projectName` (string, optional): Sync specific project only

**Output**: Sync summary with success/failure counts

### workspace_health

Run comprehensive health check.

**Input**: None

**Output**: 8 health checks with errors and warnings count

### list_projects

List all configured projects.

**Input**:
- `filter` (enum, optional): Filter by sync method (git, google-drive, both, manual)

**Output**: JSON array of projects with metadata

**Example**:
```json
[
  {
    "name": "live-practice-system",
    "displayName": "Live Practice Management System",
    "location": "live-practice-management-system/",
    "syncMethod": "git",
    "autoSync": true,
    "owner": "mmaruthurssd",
    "type": "production-system",
    "hipaaCompliant": true,
    "lastSync": "2025-11-08"
  }
]
```

### update_manifest

Update workspace-manifest.yml.

**Input**:
- `section` (enum): projects, mcps, security
- `action` (enum): add, update, remove
- `data` (object): Data to add/update

**Output**: Success confirmation

**Example - Add new project**:
```json
{
  "section": "projects",
  "action": "add",
  "data": {
    "name": "new-project",
    "display_name": "New Project",
    "location": "projects/new-project/",
    "sync": {
      "method": "git",
      "source": "github.com/user/new-project",
      "branch": "main",
      "auto_sync": true
    }
  }
}
```

### sync_google_drive

Sync project with Google Drive (placeholder).

**Input**:
- `projectName` (string): Project name to sync
- `direction` (enum): upload, download, bidirectional
- `driveFolderId` (string, optional): Google Drive folder ID

**Output**: Sync status (currently returns setup instructions)

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK
- `googleapis`: Google Drive API integration
- `js-yaml`: YAML parsing and modification

## Architecture

This MCP server wraps the bash scripts in `scripts/sync/`:
- `check-platform-updates.sh`
- `apply-platform-update.sh`
- `sync-projects.sh`
- `workspace-health-check.sh`

It also provides high-level YAML manipulation tools for workspace-manifest.yml management.

## Security

- All scripts handle paths with spaces correctly
- POSIX-compliant bash scripts (portable across macOS/Linux)
- Backup-first approach for destructive operations
- PHI and credential scanning integration (via workspace health check)

## Future Enhancements

- Full Google Drive API integration with OAuth2
- Bidirectional conflict resolution
- Automated backup rotation
- Real-time sync monitoring
- Multi-workspace support

## Version

1.0.0 - Phase 4 Implementation

## License

MIT
