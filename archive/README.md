# Archive Directory

**Purpose**: Long-term retention of completed, deprecated, or superseded items
**Last Updated**: 2025-11-16
**Workspace**: medical-patient-data

---

## Overview

This archive contains historical artifacts that are no longer actively used but are retained for reference, audit trails, and institutional knowledge. All items in this archive have been reviewed and approved for archival.

---

## Archive Structure

```
archive/
├── README.md                    # This file
├── ARCHIVE-INDEX.md            # Searchable catalog of all archived items
├── ARCHIVAL-POLICY.md          # Policies and procedures
├── 2025/                       # Year-based organization
│   ├── 11-november/           # Month-based organization
│   │   ├── documentation/     # Archived documentation
│   │   ├── troubleshooting/   # Troubleshooting artifacts
│   │   ├── workflows/         # Completed workflow states
│   │   └── metadata.json      # Archive metadata for this month
│   └── 12-december/
└── legacy/                     # Pre-2025 or unclassified archives
    └── metadata.json
```

---

## What Gets Archived

### Documentation
- Superseded documentation files
- Deprecated guides and procedures
- Historical tracking documents
- Old README versions
- Migration documentation (completed)

### Troubleshooting
- Resolved incident reports
- Root cause analyses (completed)
- Fix summaries and plans (implemented)
- Debug logs and diagnostics

### Workflows
- Completed task executor workflows
- Archived project states
- Old workflow definitions
- Deprecated automation scripts

### Code
- Deprecated source code
- Old implementations (replaced)
- Prototype code (not used)
- Experimental features (abandoned)

### Configuration
- Old configuration files
- Deprecated settings
- Migration configs (completed)

---

## What Should NOT Be Archived

### Active Items
- Current documentation
- In-progress workflows
- Active troubleshooting
- Working configuration

### Temporary Items
- Build artifacts (delete)
- Cache files (delete)
- Log files (delete after 30 days)
- Temporary test files (delete)

### Sensitive Items
- Credentials (use secure vault)
- API keys (use secure vault)
- Patient data (use encrypted storage)
- Personal information (delete or encrypt)

---

## Archival Process

See **ARCHIVAL-POLICY.md** for detailed procedures.

Quick reference:
1. Verify item is ready for archival
2. Create metadata entry
3. Move to appropriate year/month directory
4. Update ARCHIVE-INDEX.md
5. Commit with message: "archive: [description]"

---

## Retention Periods

| Item Type | Retention Period | Compression |
|-----------|-----------------|-------------|
| Documentation | 2 years | After 6 months |
| Troubleshooting | 1 year | After 3 months |
| Workflows | 6 months | After 1 month |
| Code | 1 year | After 6 months |
| Configuration | 1 year | After 6 months |

After retention period expires, items are reviewed for deletion or permanent archival.

---

## Searching the Archive

### By Date
```bash
# Find all items archived in November 2025
ls -R archive/2025/11-november/
```

### By Type
```bash
# Find all troubleshooting archives
find archive/ -type d -name "troubleshooting"
```

### By Content
```bash
# Search archive index
grep -i "smart file organizer" archive/ARCHIVE-INDEX.md
```

### Using Archive Index
See **ARCHIVE-INDEX.md** for a complete searchable catalog.

---

## Restoring from Archive

1. Locate item in ARCHIVE-INDEX.md
2. Review metadata.json for context
3. Copy (don't move) from archive to working location
4. Review and update as needed
5. Document restoration in EVENT_LOG.md

**Never modify items in the archive** - always copy to working location first.

---

## Archive Health

### Current Statistics
- Total size: 104K
- Total files: 9 files
- Oldest item: 2025-11-15
- Newest item: 2025-11-16
- Compression ratio: N/A (not compressed yet)

### Recent Activity
- 2025-11-16: Workflow archived (fix-workspace-backup-gcs)
- 2025-11-16: Workflow archived (fullstart-documentation-update)
- 2025-11-15: Documentation archived (Smart File Organizer docs)

---

## Cross-Workspace Consistency

All three workspaces (medical-patient-data, operations-workspace, mcp-infrastructure) follow the same archive structure and policies for consistency.

### Archive Sizes
- medical-patient-data: ~104K
- operations-workspace: ~33MB
- mcp-infrastructure: ~24MB

---

## Related Documentation

- **ARCHIVAL-POLICY.md** - Complete archival policies and procedures
- **ARCHIVE-INDEX.md** - Searchable catalog of archived items
- **EVENT_LOG.md** - Archive activity log
- **operations-workspace/workspace-management/shared-docs/WORKSPACE_GUIDE.md** - Workspace standards

---

## Contact

For questions about archived items or archival procedures, refer to the workspace documentation or review the metadata.json files in each archive directory.

---

**Last Review**: 2025-11-16
**Next Review**: 2026-02-16 (quarterly)
