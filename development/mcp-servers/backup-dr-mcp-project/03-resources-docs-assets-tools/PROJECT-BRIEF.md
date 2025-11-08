---
type: guide
tags: [backup, disaster-recovery, mcp-specification, project-brief]
---

# Backup & Disaster Recovery MCP - Project Brief

**Version:** 1.0.0
**Created:** 2025-11-02
**Status:** Planning

---

## Problem Statement

The workspace has grown to **20 operational MCPs** generating critical state data outside git version control. This data represents **7+ months of accumulated workspace knowledge** including:

- **Telemetry & Analytics** (~workspace-brain/): 10,000+ events, automation patterns, metrics
- **MCP State Files**: Checklist registry, workflow state, agent assignments, performance data
- **Configuration**: MCP registrations (~/.claude.json), learned patterns, environment configs
- **Project Artifacts**: Planning state, temp workflows, security logs

**Current Risk:**
- **No automated backup system** - manual backups are tedious and forgotten
- **No point-in-time recovery** - cannot rollback to previous state
- **No integrity verification** - backups may be corrupted without detection
- **Data loss scenarios**: Accidental deletion, file corruption, system failures, failed experiments

**Impact of Data Loss:**
- Lose 7 months of workspace telemetry (irreplaceable learning data)
- Lose 50+ automation patterns and preventive checks
- Lose checklist progress across multiple projects
- Lose workflow execution history and performance baselines
- Reconfigure all 20 MCPs from scratch

---

## Goals

### Primary Goals

1. **Automated Daily Backups**
   - Scheduled backups without manual intervention
   - Incremental backups for efficiency (only changed files)
   - Full backups weekly for baseline

2. **Point-in-Time Recovery**
   - Restore to any previous backup (specific date/time)
   - Selective restore (individual files or full datasets)
   - Dry-run preview before actual restore

3. **Data Integrity & Safety**
   - Checksum/hash verification for all backups
   - Validate backups are restorable
   - Compression (gzip) for storage efficiency
   - PHI detection and exclusion

4. **Retention Management**
   - Automatic cleanup of old backups
   - Configurable retention policies (7 daily, 4 weekly, 12 monthly)
   - Storage optimization

### Secondary Goals

5. **Pre-Operation Safety**
   - Automatic backup before destructive operations (MCP uninstall, config changes)
   - Integration with deployment-release-mcp for pre-deployment backups

6. **Monitoring & Reporting**
   - Backup status dashboard
   - Alert on backup failures
   - Storage usage tracking

---

## Success Criteria

### Must Have (v1.0.0)
- ✅ **Automated backups** running on schedule (daily incremental, weekly full)
- ✅ **Point-in-time recovery** working for all critical data sources
- ✅ **Integrity verification** confirms all backups are valid and restorable
- ✅ **Retention policies** automatically clean up old backups
- ✅ **Compression** reduces storage footprint by ≥60%
- ✅ **Fast operation** - incremental backup completes in <30 seconds

### Should Have (v1.1.0)
- ✅ **Pre-operation backups** integrated with deployment workflows
- ✅ **Backup status** visible via dashboard/report
- ✅ **Cross-platform** support (macOS, Linux, Windows)

### Nice to Have (v2.0.0)
- ⏸️ **Cloud storage** integration (S3, Google Drive, Dropbox)
- ⏸️ **Encryption** for sensitive data at rest
- ⏸️ **Differential backups** (track file-level changes)

---

## Critical Data Sources

### 1. External Brain Storage
**Path:** `~/workspace-brain/`
**Contents:** Telemetry events, analytics, learning patterns, cache, preventive checks
**Size:** ~50MB (growing)
**Criticality:** HIGH - irreplaceable learning data
**Backup Frequency:** Daily incremental

### 2. MCP State Files
**Paths:**
- `checklist-registry.json` (workspace root)
- `temp/workflows/*/` (per-project workflow state)
- `.agent-assignments.jsonl` (per-project agent tracking)

**Criticality:** HIGH - project state and progress
**Backup Frequency:** Daily incremental

### 3. Configuration Files
**Paths:**
- `~/.claude.json` (MCP registrations and config)
- `.smart-file-organizer-rules.json` (learned patterns)
- `.mcp.json` (workspace-specific MCP config if exists)
- Environment files (`.env.*`)

**Criticality:** MEDIUM - can be recreated but tedious
**Backup Frequency:** Weekly full

### 4. Project Artifacts
**Paths:**
- `.ai-planning/` (project orchestration state)
- `.security-scans/` (security scan reports)
- `.security-issues-log/` (security issue tracking)

**Criticality:** MEDIUM - valuable for audit trail
**Backup Frequency:** Weekly full

---

## Non-Goals

- ❌ **Source code backup** - Already handled by git version control
- ❌ **Large file backup** - Not designed for GB-scale files (node_modules, etc.)
- ❌ **Real-time backup** - Scheduled backups only (not continuous)
- ❌ **Secret storage** - Actual secrets stay in OS keychain (only backup metadata)

---

## Constraints

### Performance Constraints
- Incremental backup must complete in **<30 seconds**
- Full backup should complete in **<2 minutes**
- Minimal CPU/memory footprint during backup operation

### Storage Constraints
- Aggressive compression (gzip level 6+)
- Automatic cleanup to prevent unbounded growth
- Target: <500MB total backup storage for typical workspace

### Security Constraints
- **No PHI in backups** - Scan and exclude PHI before backup
- **No plaintext secrets** - Backup secrets metadata only, not actual values
- **Safe restore** - Dry-run validation before destructive restore

### Platform Constraints
- **Node.js built-ins preferred** - Minimize external dependencies
- **Cross-platform** - Works on macOS, Linux, Windows
- **No sudo required** - User-level permissions only

---

## Stakeholders

### Primary Stakeholder
- **User/Developer** - Needs peace of mind that workspace data is protected

### Dependent MCPs
- **workspace-brain-mcp** - Protect telemetry and analytics data
- **checklist-manager-mcp** - Protect registry and progress
- **project-management-mcp** - Protect orchestration state
- **task-executor-mcp** - Protect workflow execution state
- **deployment-release-mcp** - Integration for pre-deployment backups

---

## Timeline & Milestones

### Phase 1: Core Backup (Days 1-2)
- Implement create_backup, list_backups, verify_backup tools
- Build backup engine with compression and checksums
- Test with workspace-brain data

### Phase 2: Recovery (Day 3)
- Implement restore_backup with dry-run preview
- Point-in-time recovery capability
- Selective restore (individual files)

### Phase 3: Automation (Day 4)
- Implement schedule_backup and cleanup_old_backups
- Retention policy engine
- Integration with cron/Task Scheduler

### Phase 4: Polish (Day 5)
- Implement get_backup_status and export_backup_config
- Documentation and examples
- ROLLOUT-CHECKLIST completion

**Estimated Total Time:** 5 days (40 hours)
**With Parallelization:** 2-3 days (16-24 hours)

---

## Dependencies

### External Dependencies
- Node.js file system APIs (fs, path, zlib)
- Optional: node-cron for scheduling (or OS-level cron/Task Scheduler)

### MCP Dependencies
- **security-compliance-mcp** - PHI detection for safe backups
- **workspace-brain-mcp** - Primary data source for backup

### Knowledge Dependencies
- Understanding of backup strategies (full vs incremental vs differential)
- Retention policy algorithms
- Compression trade-offs
- Cross-platform file path handling

---

## Risks & Mitigations

### Risk 1: Backup Corruption
**Mitigation:** SHA-256 checksums for all backup files, verify on creation and before restore

### Risk 2: Incomplete Backups
**Mitigation:** Atomic operations, rollback on failure, verify file count matches

### Risk 3: Storage Explosion
**Mitigation:** Aggressive retention policies, compression, automatic cleanup, storage monitoring

### Risk 4: Restore Failures
**Mitigation:** Dry-run preview, validate before restore, backup-before-restore safety net

### Risk 5: PHI Leakage in Backups
**Mitigation:** Integration with security-compliance-mcp for PHI scanning before backup

---

## Metrics & KPIs

### Reliability Metrics
- **Backup Success Rate:** Target >99% (failed backups trigger alerts)
- **Restore Success Rate:** Target 100% (all backups must be restorable)
- **Integrity Check Pass Rate:** Target 100% (checksums validate)

### Performance Metrics
- **Incremental Backup Time:** Target <30 seconds
- **Full Backup Time:** Target <2 minutes
- **Compression Ratio:** Target ≥60% size reduction
- **Storage Footprint:** Target <500MB total backup storage

### Usage Metrics
- **Backup Frequency:** Daily incremental, weekly full
- **Average Restore Time:** Target <60 seconds
- **Failed Backup Count:** Target 0 per month

---

## Out of Scope (Future Versions)

### v2.0.0 Features
- Cloud storage integration (S3, Google Drive, Dropbox)
- Encryption for data at rest
- Multi-destination backups (local + cloud)
- Backup synchronization across machines

### v3.0.0 Features
- Continuous backup (real-time file watching)
- Differential backups (block-level changes)
- Deduplication across backup sets
- Backup analytics and insights

---

**Status:** Ready for specification phase
**Next Step:** Create detailed SPECIFICATION.md with tool definitions and implementation plan
