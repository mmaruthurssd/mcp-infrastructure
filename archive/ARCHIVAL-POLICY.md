# Archival Policy and Procedures

**Version**: 1.0
**Effective Date**: 2025-11-16
**Last Updated**: 2025-11-16
**Applies To**: All workspace archives (medical-patient-data, operations-workspace, mcp-infrastructure)

---

## Table of Contents

1. [Purpose](#purpose)
2. [Scope](#scope)
3. [Archival Criteria](#archival-criteria)
4. [Archive vs Delete](#archive-vs-delete)
5. [Archival Procedures](#archival-procedures)
6. [Metadata Requirements](#metadata-requirements)
7. [Retention Policies](#retention-policies)
8. [Compression Guidelines](#compression-guidelines)
9. [Search and Retrieval](#search-and-retrieval)
10. [Restoration Procedures](#restoration-procedures)
11. [Review and Cleanup](#review-and-cleanup)

---

## Purpose

This policy establishes standardized procedures for archiving workspace artifacts across all three workspaces to ensure:
- Consistent organization and discoverability
- Appropriate retention periods
- Efficient storage usage
- Preservation of institutional knowledge
- Audit trail compliance

---

## Scope

This policy applies to:
- All files and directories in workspace archive directories
- All workspace team members and AI agents
- All archive operations (create, move, restore, delete)

---

## Archival Criteria

### When to Archive

Archive items when:
- ✅ Project is completed and all deliverables are finalized
- ✅ Documentation is superseded by newer version
- ✅ Troubleshooting is resolved and solution is documented
- ✅ Workflow is completed successfully
- ✅ Code is deprecated and replaced by new implementation
- ✅ Configuration is no longer in use
- ✅ Item has historical or reference value
- ✅ Item is required for audit trail or compliance

### When NOT to Archive

Do not archive items that:
- ❌ Are still actively used or referenced
- ❌ Are part of current/in-progress work
- ❌ May be needed in the next 30 days
- ❌ Are temporary build artifacts (delete instead)
- ❌ Are duplicate copies (delete instead)
- ❌ Contain sensitive data without encryption
- ❌ Are incomplete or in draft state

---

## Archive vs Delete

### Archive (Long-term Retention)

Use archival for:
- Completed projects with reference value
- Historical documentation for institutional knowledge
- Resolved incidents for pattern analysis
- Deprecated code that may inform future decisions
- Configuration history for audit trails
- Troubleshooting artifacts for learning

**Retention**: 6 months to 2 years (see Retention Policies)

### Delete (Permanent Removal)

Use deletion for:
- True duplicates (identical copies)
- Temporary files (build artifacts, cache, logs)
- Failed experiments with no learning value
- Incomplete drafts that were abandoned
- Sensitive data that should not be retained
- Files with no historical or reference value

**Process**: Review before deletion, document in EVENT_LOG.md

---

## Archival Procedures

### Step 1: Pre-Archival Review

**Checklist**:
- [ ] Item is complete and no longer actively used
- [ ] Item has been reviewed and approved for archival
- [ ] No active references to this item exist in current work
- [ ] Sensitive data has been removed or encrypted
- [ ] Item has reference or historical value

### Step 2: Prepare Metadata

Create metadata entry with:
- **Original location**: Where item was before archival
- **Archival date**: When item was archived
- **Archived by**: Who performed the archival
- **Reason**: Why item was archived
- **Related items**: Links to related archived items
- **Retention period**: When item can be deleted
- **Keywords**: Searchable terms

### Step 3: Determine Location

Archive directory structure:
```
archive/
└── YYYY/                      # Year (e.g., 2025)
    └── MM-month/              # Month (e.g., 11-november)
        └── [category]/        # Category (see below)
```

**Categories**:
- `documentation/` - Archived docs, guides, READMEs
- `troubleshooting/` - Incident reports, fixes, analyses
- `workflows/` - Completed workflow states
- `code/` - Deprecated source code
- `configuration/` - Old config files
- `projects/` - Complete archived projects

### Step 4: Move to Archive

```bash
# Example: Archive a troubleshooting document
mv path/to/ISSUE-FIX.md archive/2025/11-november/troubleshooting/
```

### Step 5: Update Archive Index

Add entry to `archive/ARCHIVE-INDEX.md`:
```markdown
### ISSUE-FIX.md
- **Type**: Troubleshooting
- **Location**: archive/2025/11-november/troubleshooting/ISSUE-FIX.md
- **Archived**: 2025-11-16
- **Reason**: Issue resolved and fix implemented
- **Keywords**: bug fix, database, performance
- **Retention**: 2026-11-16
```

### Step 6: Update Month Metadata

Update or create `archive/YYYY/MM-month/metadata.json`:
```json
{
  "month": "11-november",
  "year": "2025",
  "items": [
    {
      "filename": "ISSUE-FIX.md",
      "category": "troubleshooting",
      "archivedDate": "2025-11-16",
      "archivedBy": "Claude",
      "originalLocation": "troubleshooting/active/ISSUE-FIX.md",
      "reason": "Issue resolved and fix implemented",
      "retentionUntil": "2026-11-16",
      "keywords": ["bug fix", "database", "performance"],
      "size": "15KB",
      "compressed": false
    }
  ],
  "lastUpdated": "2025-11-16"
}
```

### Step 7: Commit Changes

```bash
git add archive/
git commit -m "archive: Add ISSUE-FIX.md (resolved incident)"
git push
```

### Step 8: Verify

- [ ] Item moved to correct location
- [ ] Metadata updated
- [ ] Archive index updated
- [ ] Commit successful
- [ ] Item no longer in active workspace

---

## Metadata Requirements

### Required Fields

Every archived item MUST have:
1. **Filename** - Name of archived file/directory
2. **Category** - Type of archived item
3. **Archived Date** - When item was archived (YYYY-MM-DD)
4. **Original Location** - Where item came from
5. **Reason** - Why item was archived
6. **Retention Until** - When item can be deleted

### Recommended Fields

Should include when available:
- **Archived By** - Person or agent who archived
- **Keywords** - Searchable terms
- **Size** - File/directory size
- **Related Items** - Links to related archives
- **Compressed** - Whether item is compressed
- **Notes** - Additional context

### Example Metadata Entry

```json
{
  "filename": "smart-file-organizer-fix-summary.md",
  "category": "troubleshooting",
  "archivedDate": "2025-11-16",
  "archivedBy": "Claude",
  "originalLocation": "troubleshooting/smart-file-organizer/SMART-FILE-ORGANIZER-FIX-SUMMARY.md",
  "reason": "Smart File Organizer fix completed and tested",
  "retentionUntil": "2026-11-16",
  "keywords": ["smart-file-organizer", "bug fix", "git corruption", "duplicates"],
  "size": "56KB",
  "compressed": false,
  "relatedItems": [
    "archive/2025/11-november/troubleshooting/smart-file-organizer-analysis.md",
    "archive/2025/11-november/troubleshooting/smart-file-organizer-fix-plan.md"
  ],
  "notes": "Comprehensive fix with 99.5%+ reliability. All tests passed."
}
```

---

## Retention Policies

### Default Retention Periods

| Item Type | Retention Period | Reason |
|-----------|-----------------|---------|
| Documentation | 2 years | Reference value, version history |
| Troubleshooting | 1 year | Pattern analysis, learning |
| Workflows | 6 months | Process improvement, audit trail |
| Code | 1 year | Implementation history, rollback |
| Configuration | 1 year | Audit trail, compliance |
| Projects | 2 years | Institutional knowledge |

### Extended Retention

Items may have extended retention if:
- High reference value for future work
- Required for compliance or legal reasons
- Contains unique institutional knowledge
- Critical to understanding system evolution

**Process**: Document reason for extended retention in metadata

### Early Deletion

Items may be deleted before retention expires if:
- Item is superseded by better documentation
- Storage constraints require cleanup
- Item provides no value on review

**Process**: Requires approval and documentation in EVENT_LOG.md

---

## Compression Guidelines

### When to Compress

Compress archives when:
- Item is older than compression threshold (see table)
- Item is large (>10MB)
- Item is rarely accessed
- Storage space is limited

### Compression Thresholds

| Item Type | Compress After | Method |
|-----------|---------------|--------|
| Documentation | 6 months | gzip |
| Troubleshooting | 3 months | gzip |
| Workflows | 1 month | gzip |
| Code | 6 months | tar.gz |
| Large projects | Immediately | tar.gz |

### Compression Commands

```bash
# Compress single file
gzip archive/2025/11-november/troubleshooting/old-fix.md
# Creates: old-fix.md.gz

# Compress directory
tar -czf archive/2025/11-november/workflows/old-workflow.tar.gz archive/2025/11-november/workflows/old-workflow/
# Creates: old-workflow.tar.gz
```

### Update Metadata After Compression

```json
{
  "filename": "old-fix.md.gz",
  "compressed": true,
  "compressionMethod": "gzip",
  "compressedDate": "2026-05-16",
  "originalSize": "500KB",
  "compressedSize": "120KB",
  "compressionRatio": "76%"
}
```

---

## Search and Retrieval

### Search Methods

#### 1. Archive Index Search
```bash
grep -i "smart file" archive/ARCHIVE-INDEX.md
```

#### 2. Metadata Search
```bash
find archive/ -name "metadata.json" -exec grep -l "troubleshooting" {} \;
```

#### 3. Date-based Search
```bash
ls -R archive/2025/11-november/
```

#### 4. Category Search
```bash
find archive/ -type d -name "troubleshooting"
```

#### 5. Content Search
```bash
# Search within archived files (uncompressed)
grep -r "error message" archive/2025/11-november/
```

### Quick Reference Card

```bash
# Find by keyword
grep -i "keyword" archive/ARCHIVE-INDEX.md

# Find by date
ls -R archive/2025/11-november/

# Find by type
find archive/ -name "troubleshooting"

# Find large archives
find archive/ -size +10M

# Find old archives
find archive/ -mtime +365
```

---

## Restoration Procedures

### When to Restore

Restore archived items when:
- Need to reference historical implementation
- Investigating similar current issue
- Reverting to previous version
- Audit or compliance review required

### Restoration Process

#### Step 1: Locate Item
Use archive index or search methods to find item

#### Step 2: Review Metadata
Check metadata.json for context and notes

#### Step 3: Decompress (if needed)
```bash
# Decompress gzip
gunzip old-fix.md.gz

# Extract tar.gz
tar -xzf old-workflow.tar.gz
```

#### Step 4: Copy (Don't Move)
```bash
# Copy to working location
cp archive/2025/11-november/troubleshooting/old-fix.md troubleshooting/reference/
```

**NEVER move items out of archive** - always copy

#### Step 5: Review and Update
- Review content for accuracy
- Update dates and references
- Modify as needed for current use

#### Step 6: Document Restoration
Add entry to EVENT_LOG.md:
```markdown
## 2025-11-16 - Archive Restoration
- Restored archive/2025/11-november/troubleshooting/old-fix.md
- Reason: Similar issue encountered
- Location: troubleshooting/reference/old-fix.md
```

---

## Review and Cleanup

### Quarterly Review Schedule

**Frequency**: Every 3 months (January, April, July, October)

**Process**:
1. Review all archives for retention period expiration
2. Identify items ready for deletion
3. Review compression status
4. Update archive statistics
5. Document review in EVENT_LOG.md

### Review Checklist

For each archived item:
- [ ] Still within retention period?
- [ ] Still has reference value?
- [ ] Properly compressed if old enough?
- [ ] Metadata accurate and complete?
- [ ] Should retention be extended or reduced?

### Cleanup Process

#### Step 1: Identify Expired Items
```bash
# Find archives older than 1 year
find archive/ -mtime +365
```

#### Step 2: Review for Deletion
- Check metadata for retention period
- Verify no active references
- Confirm deletion is appropriate

#### Step 3: Document Deletion
Update EVENT_LOG.md:
```markdown
## 2025-11-16 - Archive Cleanup
- Deleted expired archives (retention period ended)
- Items deleted: 15 files, 45KB total
- Oldest item: 2023-11-16
- Reason: Retention period expired, no reference value
```

#### Step 4: Delete Items
```bash
# Delete expired item
rm archive/2023/11-november/old-item.md

# Update metadata
# Remove entry from metadata.json
# Remove entry from ARCHIVE-INDEX.md
```

#### Step 5: Commit Cleanup
```bash
git add archive/
git commit -m "archive: Cleanup expired items (retention period ended)"
git push
```

---

## Compliance and Audit

### Audit Requirements

All archive operations must:
- Be documented in EVENT_LOG.md
- Include metadata with archival reason
- Follow retention policies
- Preserve audit trail

### Audit Trail

The following create audit trail:
- Git commit history for archive directory
- EVENT_LOG.md entries
- metadata.json files
- ARCHIVE-INDEX.md updates

### Compliance Review

**Annual Review**:
- Verify all archived items have metadata
- Check retention policies are followed
- Confirm sensitive data is handled properly
- Review and update archival procedures

---

## Exceptions and Special Cases

### Large Projects (>100MB)

1. Compress before archiving
2. Store in separate large-archives/ directory
3. Document in ARCHIVE-INDEX.md
4. Consider external storage for very large projects

### Sensitive Data

1. Encrypt before archiving
2. Document encryption method in metadata
3. Shorter retention period (6 months default)
4. Secure deletion after retention expires

### Cross-Workspace Archives

When archiving items used across multiple workspaces:
1. Archive in primary workspace
2. Add cross-references in other workspaces
3. Document in ARCHIVE-INDEX.md for all workspaces

---

## Questions and Support

### Common Questions

**Q: Should I archive or delete this draft document?**
A: If incomplete/abandoned with no value, delete. If completed but superseded, archive.

**Q: How do I find an old archived file?**
A: Check ARCHIVE-INDEX.md first, then use search methods in section 9.

**Q: Can I modify an archived file?**
A: No. Copy to working location, modify, then re-archive if needed.

**Q: What if retention period doesn't fit my item?**
A: Document reason for extended/reduced retention in metadata.

### Support Resources

- **archive/README.md** - Archive overview
- **ARCHIVE-INDEX.md** - Searchable catalog
- **EVENT_LOG.md** - Archive activity history
- **Workspace documentation** - General workspace standards

---

## Policy Updates

This policy will be reviewed and updated:
- Annually (November)
- When major changes to archival needs occur
- When compliance requirements change
- When storage constraints require adjustment

**Version History**:
- v1.0 (2025-11-16): Initial policy creation

---

**Policy Owner**: Workspace Management
**Next Review**: 2026-11-16
**Approved By**: Workspace Team
**Effective Date**: 2025-11-16
