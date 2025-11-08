---
type: readme
phase: stable
project: project-index-generator-mcp-server
tags: [MCP, automation, deployment, mcp-server, project-index-generator]
category: mcp-servers
status: completed
priority: high
---

# Workspace Index MCP Server

**Version:** 1.2.0 (Phase 3)
**Template Type:** MCP Server
**Status:** Production Ready

## Quick Start

### For AI Assistants

1. Read `TEMPLATE-INFO.json` for metadata
2. Follow `INSTALL-INSTRUCTIONS.md` step-by-step
3. Ask user for confirmation before proceeding
4. Execute installation automatically

### For Human Users

```bash
cd templates-and-patterns/mcp-server-templates/templates/project-index-generator-mcp-server-template
./install.sh
```

## What This Template Provides

The Project Index Generator MCP Server creates searchable, categorized indexes of your workspace to improve file discoverability and AI navigation. It's designed to work alongside the Smart File Organizer as a complementary tool.

### Key Features

1. **Complete Project Indexing**
   - Scans entire workspace recursively
   - Categorizes files by type (Code, Documentation, Configuration, etc.)
   - Tracks file metadata (size, modification date)
   - Generates markdown indexes (PROJECT_INDEX.md)

2. **Recent Files Tracking**
   - Identifies files modified in last 7 days
   - Sorts by modification date
   - Helps focus on active work

3. **Incremental Updates**
   - Update specific paths instead of full rescan
   - Efficient for large workspaces
   - Targeted re-indexing after file operations

4. **Staleness Detection**
   - Compares index timestamp with directory modifications
   - Proactive recommendations for updates
   - Prevents working with outdated indexes

5. **Smart AI Coordination**
   - Returns `_meta` responses for orchestration
   - Signals index generation/updates to other tools
   - Enables multi-tool workflows

6. **MCP Resources**
   - Access current index programmatically
   - Query stale indexes
   - Retrieve project statistics

7. **Documentation Validation** (Phase 2)
   - Validates workspace documentation consistency
   - Checks MCP counts against actual filesystem
   - Validates template inventory accuracy
   - Detects cross-reference inconsistencies
   - Auto-fix capabilities for common issues

8. **Documentation Drift Tracking** (Phase 2)
   - Tracks changes to workspace state over time
   - Compares current state against last validation baseline
   - Detects MCP additions/removals
   - Identifies template changes
   - Project structure drift detection
   - Integration with git pre-commit hooks

9. **Auto-Correction** (Phase 3)
   - Automatically fixes documentation to match filesystem reality
   - Updates MCP counts, template counts, project counts
   - Dry-run preview mode with diff generation
   - Automatic backup before all modifications
   - Markdown syntax validation with automatic rollback
   - Safe, reversible documentation updates
### What Gets Installed

**Template Storage:**
```
templates-and-patterns/mcp-server-templates/templates/project-index-generator-mcp-server-template/
├── TEMPLATE-INFO.json           # AI-readable metadata
├── INSTALL-INSTRUCTIONS.md      # AI installation guide
├── README.md                    # This file
├── install.sh                   # Automated installation
├── configure-mcp.sh             # MCP configuration
├── src/
│   ├── server.ts                # MCP server implementation
│   ├── index-generator.ts       # Core indexing logic
│   └── types.ts                 # Type definitions
├── package.json
├── tsconfig.json
└── .gitignore
```

**Working Instance:**
```
local-instances/mcp-servers/project-index-generator-mcp-server/
├── dist/                        # Compiled JavaScript
│   ├── server.js
│   ├── index-generator.js
│   └── types.js
├── src/                         # Source TypeScript
├── node_modules/                # Dependencies
├── package.json
└── tsconfig.json
```

**Generated Files (in workspace root):**
```
PROJECT_INDEX.md                 # Main searchable index
.index-metadata.json            # Index timestamps and metadata
```

## Prerequisites

- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **git:** For version control
- **Operating System:** macOS, Linux, or Windows

## Installation Process

### Automated Installation (Recommended)

The `install.sh` script handles everything automatically:

```bash
./install.sh
```

**What it does:**
1. Detects workspace root
2. Creates local-instances directory structure
3. Copies template files to working instance
4. Installs npm dependencies
5. Builds TypeScript → JavaScript
6. Optionally configures MCP (.mcp.json)

**Installation takes:** ~1-2 minutes depending on npm download speed

### Manual Installation

If you prefer manual control:

```bash
# 1. Create working instance directory
mkdir -p ../../local-instances/mcp-servers/project-index-generator-mcp-server

# 2. Copy template files
cp -r src package.json tsconfig.json .gitignore \
  ../../local-instances/mcp-servers/project-index-generator-mcp-server/

# 3. Install dependencies
cd ../../local-instances/mcp-servers/project-index-generator-mcp-server
npm install

# 4. Build TypeScript
npm run build

# 5. Configure MCP (see Configuration section below)
```

## Configuration

### MCP Server Configuration

Add to `.mcp.json` in workspace root:

```json
{
  "mcpServers": {
    "project-index-generator": {
      "command": "node",
      "args": [
        "/absolute/path/to/local-instances/mcp-servers/project-index-generator-mcp-server/dist/server.js"
      ],
      "env": {
        "PROJECT_INDEX_GENERATOR_PROJECT_ROOT": "/absolute/path/to/workspace"
      }
    }
  }
}
```

**Required Environment Variables:**

- `PROJECT_INDEX_GENERATOR_PROJECT_ROOT` - Path to index (defaults to cwd if not set)

**Path Requirements:**
- Use absolute paths (not relative)
- Replace `/absolute/path/to/...` with actual paths
- Windows: Use forward slashes or escaped backslashes

### Automated MCP Configuration

Use the configuration script:

```bash
./configure-mcp.sh /absolute/path/to/local-instances/mcp-servers/project-index-generator-mcp-server
```

**What it does:**
- Finds Claude Code config file automatically
- Backs up existing configuration
- Merges new server into config (preserves existing servers)
- Validates JSON syntax
- Restores from backup if errors occur

## Usage Examples

### Tool: generate_project_index

Generate complete searchable index:

```typescript
// AI calls tool
generate_project_index()

// Response includes:
{
  content: [{ type: 'text', text: '✅ Project index generated...' }],
  _meta: {
    indexGenerated: true,
    indexPath: 'PROJECT_INDEX.md',
    affectedPaths: ['/workspace/root'],
    totalFiles: 1250,
    timestamp: '2025-10-25T10:30:00.000Z'
  }
}
```

**Generated Index Structure:**
```markdown
# Project Index

**Generated:** 10/25/2025, 10:30:00 AM

## Overview
- Total Files: 1,250
- Total Folders: 87
- Project Root: `/workspace`

## Recently Modified Files (Last 7 Days)
- `projects/new-feature/README.md` - 10/25/2025
- `live-practice-management-system/script.gs` - 10/24/2025
...

## Files by Category

### Code (450 files)
- `src/server.ts`
- `src/index-generator.ts`
...

### Documentation (180 files)
- `README.md`
- `planning-and-roadmap/ROADMAP_2025.md`
...
```

### Tool: update_indexes_for_paths

Efficient targeted updates:

```typescript
// After moving files to new folder
update_indexes_for_paths(['projects/new-feature', 'archive/old-code'])

// Response:
{
  content: [{ type: 'text', text: '✅ Index update complete...' }],
  _meta: {
    indexUpdated: true,
    updatedPaths: ['projects/new-feature', 'archive/old-code'],
    errorCount: 0,
    timestamp: '2025-10-25T10:35:00.000Z'
  }
}
```

### Tool: check_index_freshness

Proactive staleness detection:

```typescript
// Check if indexes need updating
check_index_freshness()

// If stale:
{
  content: [{ type: 'text', text: '⚠️ Found 3 stale indexes...' }],
  _meta: {
    staleIndexes: ['projects/old-project', 'archive/2024', 'temp'],
    staleCount: 3,
    suggestUpdate: true,
    timestamp: '2025-10-25T10:40:00.000Z'
  }
}

// If fresh:
{
  content: [{ type: 'text', text: '✅ All indexes are fresh!' }],
  _meta: {
    allFresh: true,
    checkedPath: undefined,
    timestamp: '2025-10-25T10:40:00.000Z'
  }
}
```

### Tool: validate_workspace_documentation (Phase 2)

Validate documentation consistency:

```typescript
// Validate all documentation
validate_workspace_documentation()

// Response with all checks passed:
{
  content: [{ type: 'text', text: '✅ All documentation is consistent!\n\n📊 Summary:\n- Total Checks: 4\n- Passed: 4\n- Failed: 0' }]
}

// Response with issues:
{
  content: [{ type: 'text', text: '❌ Found documentation inconsistencies...' }]
}

// Validate specific check
validate_workspace_documentation({
  checks: ['mcp_counts'],
  reportFormat: 'detailed'
})

// Auto-fix issues
validate_workspace_documentation({
  checks: ['all'],
  autoFix: true
})
```

**Available checks:**
- `mcp_counts` - Validates MCP server counts in documentation
- `template_inventory` - Checks template listings
- `status_accuracy` - Verifies status indicators
- `cross_references` - Validates internal links
- `all` - Runs all checks (default)

### Tool: track_documentation_drift (Phase 2)

Track changes since last validation:

```typescript
// Track all drift
track_documentation_drift()

// Response when drift detected:
{
  content: [{
    type: 'text',
    text: '🔔 Drift detected since 2025-11-03T22:52:24.644Z\n\n📝 Template Changes (2):\n  ➕ New template: new-mcp-template\n  ➖ Template removed: old-template\n\n📄 Affected Documentation:\n  - templates-and-patterns/mcp-server-templates/TEMPLATES_INDEX.md'
  }]
}

// Filter by category
track_documentation_drift({
  categories: ['mcps', 'templates']
})

// Include minor changes
track_documentation_drift({
  includeMinorChanges: true
})
```

**Available categories:**
- `mcps` - Track MCP server changes
- `templates` - Track template changes
- `projects` - Track project structure changes
- `all` - Track all categories (default)

### Tool: update_workspace_docs_for_reality (Phase 3)

Auto-correct documentation to match filesystem:

```typescript
// Dry run preview (default behavior)
update_workspace_docs_for_reality()

// Response with preview:
{
  content: [{
    type: 'text',
    text: '🔍 DRY RUN: Preview of changes\n\n📝 Changes proposed (2 files):\n\n📄 WORKSPACE_GUIDE.md (3 lines modified)\n--- a/WORKSPACE_GUIDE.md\n+++ b/WORKSPACE_GUIDE.md\n@@ -332 @@\n-**21 active MCPs available across 5 categories**\n+**22 active MCPs available across 5 categories**\n\n💡 To apply these changes, call again with dryRun: false'
  }]
}

// Apply changes
update_workspace_docs_for_reality({
  dryRun: false
})

// Response after applying:
{
  content: [{
    type: 'text',
    text: '✅ Documentation updated!\n\n📝 Changes applied (2 files):\n\n📄 WORKSPACE_GUIDE.md (3 lines modified)\n📄 WORKSPACE_ARCHITECTURE.md (2 lines modified)\n\n💾 Backups saved to: .doc-backups/'
  }]
}

// Target specific files
update_workspace_docs_for_reality({
  targets: ['WORKSPACE_GUIDE.md'],
  dryRun: false
})
```

**Safety Features:**
- **Default dry-run**: Preview changes before applying (dryRun: true by default)
- **Automatic backups**: Timestamped backups in `.doc-backups/` directory
- **Syntax validation**: Checks markdown syntax after updates
- **Automatic rollback**: Reverts changes if syntax validation fails
- **Diff preview**: See exactly what will change before applying

**What gets updated:**
- MCP counts (e.g., "21 active MCPs" → "22 active MCPs")
- Template counts (e.g., "23 templates" → "24 templates")
- Library MCPs (e.g., "1 library" stays correct)
- Total counts in documentation

### Resource: project-index

Access current index programmatically:

```typescript
// Read resource
ReadResource({ uri: 'index-generator://project-index' })

// Returns:
{
  contents: [{
    uri: 'index-generator://project-index',
    mimeType: 'text/markdown',
    text: '# Project Index\n\n**Generated:** ...'
  }]
}
```

### Resource: statistics

Get project statistics:

```typescript
ReadResource({ uri: 'index-generator://statistics' })

// Returns:
{
  contents: [{
    uri: 'index-generator://statistics',
    mimeType: 'application/json',
    text: {
      totalFiles: 1250,
      totalFolders: 87,
      categoryCounts: {
        "Code": 450,
        "Documentation": 180,
        "Configuration": 95,
        ...
      },
      recentFileCount: 23,
      lastGenerated: '2025-10-25T10:30:00.000Z'
    }
  }]
}
```

## AI Coordination Workflow

The Project Index Generator works alongside other tools via smart signaling:

```
1. User: "Organize and index my workspace"

2. AI calls Smart File Organizer:
   → Files moved to optimal locations
   → Response includes: _meta: { movedFiles: [...paths] }

3. AI detects files were moved, calls Project Index Generator:
   → update_indexes_for_paths(movedPaths)
   → Response includes: _meta: { indexUpdated: true }

4. AI confirms to user:
   "Files organized and indexes updated. Your workspace is now searchable!"
```

## File Filtering

The index generator automatically excludes:

- Hidden files (starting with `.`)
- `node_modules/` directories
- `dist/` and `build/` directories
- Git internals (`.git/`)
- Build artifacts

**To customize filtering:**

Edit `src/index-generator.ts:154`:

```typescript
if (entry.name.startsWith('.') ||
    entry.name === 'node_modules' ||
    entry.name === 'dist' ||
    entry.name === 'build' ||
    entry.name === 'your-custom-exclude') {
  continue;
}
```

## File Categories

Files are automatically categorized:

| Category | Extensions |
|----------|------------|
| Documentation | .md, .txt, .pdf, .doc, .docx |
| Code | .js, .ts, .tsx, .jsx, .py, .java, .cpp, .c, .go, .rs, .rb, .php |
| Configuration | .json, .yaml, .yml, .toml, .ini, .env, .config |
| Data | .csv, .xml, .sql, .db, .sqlite |
| Images | .png, .jpg, .jpeg, .gif, .svg, .ico |
| Styles | .css, .scss, .sass, .less |
| Build | .lock, .log |
| Other | Everything else |

**To customize categories:**

Edit `src/index-generator.ts:202`:

```typescript
const categories: { [key: string]: string[] } = {
  'Your Category': ['.ext1', '.ext2'],
  ...
};
```

## Troubleshooting

### Issue: Index not generated

**Symptoms:**
- No PROJECT_INDEX.md file created
- Tool returns errors

**Solutions:**
1. Check workspace path is correct
2. Verify write permissions in workspace
3. Ensure no files are locking the directory
4. Check console for error messages

### Issue: Missing files in index

**Symptoms:**
- Some files don't appear in index
- File count seems low

**Solutions:**
1. Check if files are in excluded directories (node_modules, .git, etc.)
2. Verify files aren't hidden (starting with `.`)
3. Ensure files exist on disk (not just in git history)
4. Re-run `generate_project_index` to full rescan

### Issue: Stale indexes not detected

**Symptoms:**
- `check_index_freshness` always returns "fresh"
- Indexes seem outdated

**Solutions:**
1. Check `.index-metadata.json` exists
2. Verify file system timestamps are correct
3. Re-generate index with `generate_project_index`
4. Check that metadata file wasn't deleted

### Issue: MCP server not found

**Symptoms:**
- Tools don't appear in Claude Code
- Server not in MCP list

**Solutions:**
1. Verify `.mcp.json` syntax is valid (use JSON validator)
2. Check absolute paths are correct
3. Ensure `dist/server.js` exists
4. Restart Claude Code to reload configuration
5. Check MCP logs for errors

### Issue: Build fails

**Symptoms:**
- `npm run build` errors
- Missing `dist/` directory

**Solutions:**
1. Check TypeScript is installed: `npm list typescript`
2. Verify Node version: `node --version` (need >=18)
3. Delete and reinstall: `rm -rf node_modules && npm install`
4. Check for syntax errors in source files

## Performance Considerations

### Large Workspaces

For workspaces with 10,000+ files:

1. **Use incremental updates** instead of full regeneration:
   ```typescript
   update_indexes_for_paths(['specific/folder'])
   ```

2. **Customize file filtering** to exclude more directories

3. **Limit category samples** in generated markdown (currently shows 10 per category)

### Index Generation Time

Typical performance:

- **Small workspace** (< 100 files): ~100ms
- **Medium workspace** (100-1,000 files): ~500ms
- **Large workspace** (1,000-10,000 files): ~2-5 seconds
- **Very large workspace** (10,000+ files): ~10-30 seconds

## Re-Installation / Updating

To reinstall or update the template:

### Option 1: Using install.sh

```bash
cd templates-and-patterns/mcp-server-templates/templates/project-index-generator-mcp-server-template

# Remove old instance
rm -rf ../../local-instances/mcp-servers/project-index-generator-mcp-server

# Reinstall
./install.sh
```

### Option 2: Manual

```bash
# 1. Backup configuration (if customized)
cp local-instances/mcp-servers/project-index-generator-mcp-server/.env .env.backup

# 2. Remove instance
rm -rf local-instances/mcp-servers/project-index-generator-mcp-server

# 3. Follow installation steps again

# 4. Restore configuration
cp .env.backup local-instances/mcp-servers/project-index-generator-mcp-server/.env
```

### Preserving Index Data

Index data is stored in workspace root:
- `PROJECT_INDEX.md` - Not deleted during reinstall
- `.index-metadata.json` - Not deleted during reinstall

These files are preserved automatically.

## Integration with Other Tools

### Smart File Organizer

The Project Index Generator complements the Smart File Organizer:

**Smart File Organizer:**
- Analyzes file content
- Determines optimal placement
- Moves files to proper folders
- Manages lifecycle stages

**Project Index Generator:**
- Makes files discoverable after organization
- Provides searchable catalog
- Tracks recent activity
- Enables workspace navigation

**Combined Workflow:**
```
1. Smart File Organizer moves files → optimal locations
2. Project Index Generator updates indexes → files discoverable
3. AI can find files quickly → improved user experience
```

### Git Assistant

Coordinate with Git Assistant for repository management:

```
1. AI checks index for stale directories
2. AI suggests archiving unused folders
3. User confirms
4. Git Assistant commits changes
5. Project Index Generator updates indexes
```

### Spec-Driven Development

Use indexes in SDD workflows:

```
1. Generate index to see current project structure
2. Create specification referencing existing files
3. Implement new features
4. Update index to reflect new files
5. Verify all files documented in spec
```

## Advanced Customization

### Custom Index Format

To change the markdown format, edit `src/index-generator.ts`:

**Main index:** `generateMarkdown()` method (line 238)
**Folder indexes:** `generateFolderMarkdown()` method (line 285)

### Custom Staleness Threshold

Currently detects modifications after last index. To add time-based threshold:

```typescript
// In checkIndexFreshness() method
const STALE_THRESHOLD_DAYS = 7;
const threshold = Date.now() - (STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

if (dirModified > lastIndexed || lastIndexed < threshold) {
  // Mark as stale
}
```

### Multiple Index Files

To generate indexes in subdirectories:

```typescript
// Currently only generates PROJECT_INDEX.md in root
// To add per-folder indexes, modify updateIndexesForPaths()
```

## Development

### Building from Source

```bash
cd local-instances/mcp-servers/project-index-generator-mcp-server

# One-time build
npm run build

# Watch mode (rebuilds on changes)
npm run watch

# Development mode (watch + auto-restart)
npm run dev
```

### Testing

```bash
# Generate index
node dist/server.js

# In another terminal, test MCP communication
# (Requires MCP client)
```

### Debugging

Enable debug logging:

```typescript
// In src/server.ts or src/index-generator.ts
console.error('Debug:', data);
```

All `console.error` output goes to Claude Code logs.

## License

MIT

## Support

For issues, questions, or contributions:

1. Review this README
2. Check INSTALL-INSTRUCTIONS.md
3. Review source code in `src/`
4. Check workspace-specific documentation

## Git Integration (Phase 2)

### Pre-Commit Hook

The workspace-index MCP integrates with git pre-commit hooks to automatically validate documentation when committing changes to key workspace files:

**What gets validated:**
- WORKSPACE_GUIDE.md
- WORKSPACE_ARCHITECTURE.md
- MCP_INVENTORY.md
- Template inventory files

**How it works:**
1. You stage changes: `git add WORKSPACE_GUIDE.md`
2. You commit: `git commit -m "Update guide"`
3. Pre-commit hook automatically runs `validate_workspace_documentation()`
4. If issues found, warnings displayed (commit still proceeds)
5. State saved for drift tracking

**Setup:**
Pre-commit hook is installed at `.git/hooks/pre-commit` and automatically integrated with security-compliance-mcp scanning.

**Manual validation:**
```bash
# Validate before committing
mcp workspace-index validate_workspace_documentation
```

## Version History

### v1.2.0 (2025-11-03) - Phase 3
- Auto-correction system for documentation
- update_workspace_docs_for_reality() tool
- Dry-run preview with diff generation
- Automatic backup/rollback mechanisms
- Markdown syntax validation
- Safe, reversible documentation updates
- Count updates for MCPs, templates, projects

### v1.1.0 (2025-11-03) - Phase 2
- Documentation validation system
- Drift tracking with baseline comparison
- Pre-commit hook integration
- Auto-fix capabilities for common issues
- State persistence (.workspace-index-state.json)
- Category-based drift detection (MCPs, templates, projects)

### v1.0.0 (2025-10-25) - Phase 1
- Initial release
- Complete project indexing
- Incremental updates
- Staleness detection
- Smart AI coordination
- MCP resources
- File categorization
- Recent files tracking

## Related Documentation

- **TEMPLATE-INFO.json** - AI-readable template metadata
- **INSTALL-INSTRUCTIONS.md** - AI installation guide
- **TEMPLATE-CREATION-GUIDE.md** - Guide for creating MCP server templates
- **Smart File Organizer README** - Companion tool documentation
