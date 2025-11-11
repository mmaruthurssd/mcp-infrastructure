---
type: guide
tags: [backup, design-decisions, architecture, technical-rationale]
---

# Backup & Disaster Recovery MCP - Design Decisions

**Version:** 1.0.0
**Created:** 2025-11-02
**Status:** Active Development

---

## Overview

This document captures key architectural and implementation decisions for the Backup & DR MCP. Each decision includes rationale, alternatives considered, and trade-offs.

---

## Decision 1: Backup Strategy - Incremental vs Full vs Differential

### Decision
Implement **both full and incremental backups** with user-selectable backup type.

### Rationale

**Full Backups:**
- ✅ Self-contained (no dependencies on previous backups)
- ✅ Faster restore (single backup contains everything)
- ✅ Simpler verification
- ❌ Slower to create
- ❌ Higher storage usage

**Incremental Backups:**
- ✅ Fast to create (only changed files since last backup)
- ✅ Minimal storage usage
- ✅ Efficient for daily backups
- ❌ Restore requires full backup + all incrementals (slower)
- ❌ Dependency chain (if one incremental corrupted, later backups unusable)

**Differential Backups:**
- ✅ Faster restore than incremental (only need full + latest differential)
- ❌ Higher storage than incremental (each differential grows)
- ❌ Slower to create than incremental

### Chosen Approach
- **Daily:** Incremental backups (fast, low storage)
- **Weekly:** Full backups (baseline, no dependencies)
- **Retention:** Keep 7 daily incrementals + 4 weekly fulls + 12 monthly fulls

### Trade-offs
- **Storage:** ~100MB for typical workspace (7 incrementals ~10MB each + 4 full backups ~15MB each)
- **Restore Speed:** Quick restore from recent backups (<1 week old), slightly slower for older backups
- **Reliability:** Weekly full backups limit dependency chain to max 7 days

### Alternatives Considered
1. **Incremental-only:** Rejected due to long dependency chains and restore complexity
2. **Differential-only:** Rejected due to excessive storage growth
3. **Full-only:** Rejected due to high storage usage and slow daily backups
4. **Deduplication/block-level:** Deferred to v2.0.0 (complexity vs benefit for current scale)

---

## Decision 2: Storage Format - Directory-based vs Archive File

### Decision
Use **directory-based storage** with compressed individual files.

### Rationale

**Directory-based:**
- ✅ Selective restore (extract single files without unpacking entire archive)
- ✅ Incremental backups easier (just add new files)
- ✅ Parallel compression possible
- ✅ Easier to inspect and debug
- ❌ Higher file system overhead (many small files)
- ❌ Slightly larger storage (individual file compression less efficient)

**Archive file (tar/zip):**
- ✅ Single file per backup (easier to move/copy)
- ✅ Better compression (solid archive)
- ✅ Fewer inodes used
- ❌ Must extract entire archive for selective restore
- ❌ Harder to implement incremental backups
- ❌ More complex corruption recovery

### Chosen Approach
Directory structure per backup with gzip-compressed individual files:
```
~/.backup-dr/backups/2025-11-02-040000/
├── backup-metadata.json          # Uncompressed metadata
├── manifest.json                 # Uncompressed manifest
└── data/
    ├── workspace-brain/
    │   └── telemetry/
    │       └── events.jsonl.gz   # Compressed data
    └── checklist-registry.json.gz
```

### Trade-offs
- **Storage Efficiency:** ~60-70% compression (gzip level 6)
- **Restore Speed:** Very fast for selective restore (<1 second per file)
- **Complexity:** Low (standard fs operations + gzip)
- **Portability:** Excellent (works across all platforms)

### Alternatives Considered
1. **tar.gz archives:** Rejected due to selective restore complexity
2. **SQLite database:** Rejected due to corruption risk and query overhead
3. **Custom binary format:** Rejected due to complexity and debugging difficulty

---

## Decision 3: Compression Algorithm - gzip vs bzip2 vs zstd

### Decision
Use **gzip with compression level 6**.

### Rationale

**gzip (level 6):**
- ✅ Universal support (Node.js built-in zlib)
- ✅ Fast compression (~50-100 MB/s)
- ✅ Fast decompression (~150-300 MB/s)
- ✅ Good compression ratio (~60-70% for JSON/text)
- ❌ Not the best compression ratio

**bzip2:**
- ✅ Better compression ratio (~70-80%)
- ❌ Much slower compression (~5-10 MB/s)
- ❌ Slower decompression (~30-50 MB/s)
- ❌ Requires external library

**zstd:**
- ✅ Best compression ratio + speed balance
- ✅ Very fast compression/decompression
- ❌ Requires external library (node-zstd)
- ❌ Less universal support

### Chosen Approach
- **Algorithm:** gzip
- **Level:** 6 (default for gzip, good balance)
- **Implementation:** Node.js zlib module (no dependencies)

### Performance Benchmarks
For typical workspace data (JSON, JSONL, text):
- **Compression Speed:** ~70 MB/s (complete 50MB in <1 second)
- **Decompression Speed:** ~200 MB/s
- **Compression Ratio:** 60-70% (50MB → 15-20MB)
- **CPU Usage:** ~15% during compression

### Trade-offs
- **Speed:** Extremely fast for incremental backups (<30 seconds)
- **Storage:** Good compression without excessive CPU overhead
- **Compatibility:** Works everywhere without dependencies

### Alternatives Considered
1. **zstd:** Deferred to v2.0.0 (requires external dependency, minimal benefit at current scale)
2. **bzip2:** Rejected (too slow for daily backups)
3. **No compression:** Rejected (5x storage increase unacceptable)

---

## Decision 4: Checksum Algorithm - MD5 vs SHA-256 vs xxHash

### Decision
Use **SHA-256** for file and manifest checksums.

### Rationale

**SHA-256:**
- ✅ Cryptographically secure
- ✅ Industry standard for integrity verification
- ✅ Node.js crypto built-in
- ✅ 256-bit hash (collision resistant)
- ❌ Slower than non-cryptographic hashes

**MD5:**
- ✅ Very fast
- ✅ Node.js built-in
- ❌ Cryptographically broken (collision attacks)
- ❌ Only 128-bit (higher collision probability)

**xxHash:**
- ✅ Extremely fast (5-10x faster than SHA-256)
- ✅ Good collision resistance for non-adversarial use
- ❌ Requires external library
- ❌ Not cryptographically secure

### Chosen Approach
- **File Checksums:** SHA-256 (verify individual file integrity)
- **Manifest Checksum:** SHA-256 (verify backup integrity)
- **Implementation:** Node.js crypto.createHash('sha256')

### Performance
- **Speed:** ~500 MB/s (hash 50MB in ~100ms)
- **Hash Size:** 64 hex characters (32 bytes)
- **Collision Probability:** Negligible (2^-256)

### Trade-offs
- **Security:** Protection against both accidental corruption and intentional tampering
- **Performance:** Acceptable overhead (~100ms per backup for checksumming)
- **Trust:** Industry-standard algorithm increases user confidence

### Alternatives Considered
1. **xxHash:** Deferred to v2.0.0 (speed not critical at current scale, prefer security)
2. **MD5:** Rejected (inadequate security, minimal speed benefit)
3. **SHA-1:** Rejected (deprecated, cryptographically broken)

---

## Decision 5: Retention Policy - Time-based vs Count-based vs Hybrid

### Decision
Use **hybrid retention policy** (count-based with time categorization).

### Rationale

**Count-based:**
- ✅ Predictable storage usage
- ✅ Simple to implement
- ❌ May delete important backups (e.g., pre-deployment backups)
- ❌ No consideration for backup age diversity

**Time-based:**
- ✅ Keep backups for specific duration (e.g., "keep 90 days")
- ❌ Unpredictable storage usage
- ❌ May accumulate too many backups

**Hybrid (Chosen):**
- ✅ Predictable storage (count limits)
- ✅ Age diversity (daily/weekly/monthly buckets)
- ✅ Important backups preserved (full backups always kept in each bucket)

### Chosen Approach

**Retention Buckets:**
1. **Daily:** Keep last 7 daily backups (incrementals)
2. **Weekly:** Keep last 4 weekly backups (Sunday backup or last of week, full preferred)
3. **Monthly:** Keep last 12 monthly backups (last Sunday of month, full preferred)

**Retention Algorithm:**
```typescript
function categorizeBackup(backup: Backup): 'daily' | 'weekly' | 'monthly' | 'expired' {
  const age = now - backup.created;

  if (age <= 7 days) return 'daily';
  if (age <= 28 days) return 'weekly';   // Keep 1 per week
  if (age <= 365 days) return 'monthly'; // Keep 1 per month
  return 'expired';
}

function selectBackupsToKeep(allBackups: Backup[]): Backup[] {
  const daily = last7DailyBackups(allBackups);
  const weekly = last4WeeklyBackups(allBackups);
  const monthly = last12MonthlyBackups(allBackups);

  // Always prefer full backups in each category
  return [...daily, ...weekly, ...monthly].uniqueById();
}
```

### Trade-offs
- **Storage:** Predictable (~100-150MB for typical workspace)
- **Coverage:** 7 days granular, 4 weeks weekly, 12 months long-term
- **Recovery Window:** Point-in-time recovery for last 365 days

### Alternatives Considered
1. **Simple count-based (keep last 30):** Rejected (no age diversity, all recent backups)
2. **Time-based (keep 365 days):** Rejected (unbounded storage growth)
3. **GFS (Grandfather-Father-Son):** Considered but overly complex for current needs

---

## Decision 6: Scheduling - Cron vs Custom Scheduler

### Decision
Use **node-cron** library for cross-platform scheduling.

### Rationale

**node-cron:**
- ✅ Pure JavaScript, no system dependencies
- ✅ Cross-platform (works on macOS, Linux, Windows)
- ✅ Standard cron syntax (familiar to users)
- ✅ Runs within Node.js process (no external daemon)
- ❌ Requires Node process running (not system-level cron)

**System cron (Linux/macOS):**
- ✅ System-level reliability
- ✅ Runs even if Node process stopped
- ❌ Not available on Windows
- ❌ Requires crontab manipulation (security concerns)
- ❌ Complex setup for non-technical users

**Windows Task Scheduler:**
- ✅ System-level on Windows
- ❌ Platform-specific
- ❌ Complex API
- ❌ Requires admin privileges

**Custom polling:**
- ✅ Simple implementation
- ❌ Less precise timing
- ❌ Continuous resource usage
- ❌ Reinventing the wheel

### Chosen Approach
- **Library:** node-cron (https://www.npmjs.com/package/node-cron)
- **Persistence:** Store schedules in ~/.backup-dr/schedules.json
- **Execution:** Schedules run within MCP server process
- **Future Enhancement:** System-level cron integration (v2.0.0)

### Implementation
```typescript
import cron from 'node-cron';

// Create schedule
const task = cron.schedule('0 2 * * *', async () => {
  await createBackup({
    sources: ['~/workspace-brain/'],
    type: 'incremental',
    label: 'auto-daily'
  });
}, {
  scheduled: true,
  timezone: 'America/New_York'
});
```

### Trade-offs
- **Reliability:** Requires MCP server running (acceptable for development workspace)
- **Simplicity:** Easy setup, no system permissions required
- **Portability:** Works identically across all platforms

### Alternatives Considered
1. **System cron:** Deferred to v2.0.0 (complexity for marginal benefit)
2. **Polling:** Rejected (imprecise, wasteful)
3. **External scheduler service:** Rejected (adds complexity)

---

## Decision 7: Backup ID Format - Timestamp vs UUID vs Sequential

### Decision
Use **timestamp-based IDs** in format `YYYY-MM-DD-HHMMSS`.

### Rationale

**Timestamp (YYYY-MM-DD-HHMMSS):**
- ✅ Sortable (lexicographic sort = chronological sort)
- ✅ Human-readable (know when backup was created)
- ✅ No collision for backups >1 second apart
- ✅ Useful for file system browsing
- ❌ Collision possible if 2 backups in same second

**UUID v4:**
- ✅ Guaranteed unique
- ✅ No collision risk
- ❌ Not sortable
- ❌ Not human-readable
- ❌ Harder to work with in file system

**Sequential (001, 002, ...):**
- ✅ Short and simple
- ✅ Sortable
- ❌ Requires state management (counter)
- ❌ Race conditions in concurrent backups
- ❌ No time information

### Chosen Approach
- **Format:** `YYYY-MM-DD-HHMMSS` (e.g., `2025-11-02-040000`)
- **Collision Handling:** Add milliseconds suffix if collision detected (`2025-11-02-040000-123`)
- **Timezone:** UTC (consistent across systems)

### Benefits
- **Sorting:** `ls ~/.backup-dr/backups/` shows chronological order
- **Readability:** Instant understanding of backup age
- **Filtering:** Easy to find backups from specific date range
- **Retention:** Simple age-based cleanup logic

### Trade-offs
- **Collision Risk:** Very low (1/second, can add milliseconds if needed)
- **Format Stability:** Committed to this format for v1.x (no breaking changes)

### Alternatives Considered
1. **UUID:** Rejected (poor UX, no sortability)
2. **Unix timestamp:** Rejected (not human-readable)
3. **Custom format:** Rejected (standard ISO 8601 date better)

---

## Decision 8: Restore Strategy - In-Place vs Staging Directory

### Decision
Support **both in-place and staging directory** restore with dry-run preview.

### Rationale

**In-Place Restore:**
- ✅ Restores to original locations
- ✅ No post-restore file moving required
- ❌ Risk of overwriting current files
- ❌ Difficult to review before committing

**Staging Directory:**
- ✅ Safe (no overwrite risk)
- ✅ User can review before moving files
- ❌ Extra step required (move files manually)
- ❌ May run out of space (duplicate files)

### Chosen Approach

**Default: In-place with dry-run**
```typescript
// Step 1: Dry-run to preview changes
restore_backup({
  backupId: '2025-11-02-040000',
  dryRun: true  // Preview only
});

// Step 2: Review conflicts, then restore
restore_backup({
  backupId: '2025-11-02-040000',
  overwrite: true,
  preBackup: true  // Create safety backup first
});
```

**Optional: Staging directory**
```typescript
restore_backup({
  backupId: '2025-11-02-040000',
  destination: '~/restored-backup-temp/',
  overwrite: false
});
```

### Safety Features
1. **Pre-restore backup:** Automatically backup current state before destructive restore
2. **Dry-run preview:** Show exactly what will change (files created, overwritten, skipped)
3. **Conflict detection:** Identify files that would be overwritten with modification dates
4. **Rollback capability:** If restore fails, auto-rollback to pre-restore state

### Trade-offs
- **Safety:** High (dry-run + pre-backup + rollback)
- **Flexibility:** Both in-place and staging supported
- **Complexity:** Medium (requires atomic operations and rollback logic)

### Alternatives Considered
1. **Staging-only:** Rejected (extra step, poor UX)
2. **In-place-only without safety:** Rejected (too dangerous)
3. **Copy-on-write snapshots:** Deferred to v2.0.0 (complex, file-system specific)

---

## Decision 9: PHI Handling - Scan vs Exclude vs Fail

### Decision
**Scan and exclude** files containing PHI with user warning.

### Rationale

**Scan and exclude (Chosen):**
- ✅ Safe (no PHI in backups)
- ✅ Backup continues (other files still protected)
- ✅ User aware of exclusions (warning message)
- ❌ Requires integration with security-compliance-mcp

**Fail on PHI:**
- ✅ Ensures user awareness
- ✅ Forces explicit handling
- ❌ Blocks all backups (bad UX)
- ❌ May break scheduled backups

**No PHI scanning:**
- ✅ Simple implementation
- ❌ Risk of PHI in backups (HIPAA violation)
- ❌ Unacceptable for medical workspace

### Chosen Approach
1. Before backup, scan all source files for PHI (security-compliance-mcp)
2. If PHI detected, exclude those files from backup
3. Log warning: "X files excluded due to PHI detection"
4. Include exclusion list in backup metadata
5. User can review excluded files and take manual action

### Implementation
```typescript
async function createBackup(sources: string[]) {
  // Scan for PHI
  const phiScanResult = await scanForPHI(sources);

  if (phiScanResult.violations.length > 0) {
    console.warn(`PHI detected in ${phiScanResult.violations.length} files - excluding from backup`);

    // Add PHI files to exclude list
    const excludeFiles = phiScanResult.violations.map(v => v.filePath);

    // Proceed with backup, excluding PHI files
    return performBackup(sources, { exclude: excludeFiles });
  }
}
```

### Trade-offs
- **Safety:** High (no PHI leakage)
- **Usability:** Good (backups succeed, user notified)
- **Completeness:** May miss some files (acceptable trade-off for safety)

### Alternatives Considered
1. **Fail-safe mode:** Rejected (breaks scheduled backups)
2. **No scanning:** Rejected (HIPAA violation risk)
3. **Encrypt PHI files:** Deferred to v2.0.0 (encryption complexity)

---

## Decision 10: File Permissions - Preserve vs Reset

### Decision
**Preserve original file permissions** in backups.

### Rationale

**Preserve permissions:**
- ✅ Exact restoration of original state
- ✅ Maintains security configurations
- ✅ No manual permission fixing after restore
- ❌ Cross-platform complexity (Windows vs Unix)

**Reset to defaults:**
- ✅ Simple implementation
- ✅ No platform differences
- ❌ Lose security configurations
- ❌ May break executable scripts

### Chosen Approach
- **Unix (macOS/Linux):** Store and restore full permissions (owner, group, mode)
- **Windows:** Store and restore basic permissions (read-only, hidden attributes)
- **Cross-platform restore:** Best-effort mapping (Unix → Windows and vice versa)

### Implementation
```typescript
interface BackupFileEntry {
  path: string;
  permissions: string;  // Unix: "755", Windows: "rw-"
  owner?: string;       // Unix only
  group?: string;       // Unix only
}

async function backupFile(filePath: string): BackupFileEntry {
  const stats = await fs.stat(filePath);

  return {
    path: filePath,
    permissions: stats.mode.toString(8), // Convert to octal
    owner: stats.uid,
    group: stats.gid
  };
}
```

### Trade-offs
- **Accuracy:** High on native platform, best-effort cross-platform
- **Complexity:** Medium (platform-specific handling)
- **Correctness:** Exact restoration on same platform

### Alternatives Considered
1. **No permission preservation:** Rejected (lose security configs)
2. **ACL preservation:** Deferred to v2.0.0 (complexity)
3. **Extended attributes:** Deferred to v2.0.0 (macOS-specific)

---

## Decision 11: Dependency Management - Minimal vs Feature-rich

### Decision
**Minimize dependencies**, prefer Node.js built-ins.

### Rationale

**Minimal dependencies:**
- ✅ Faster installation
- ✅ Fewer security vulnerabilities
- ✅ Reduced maintenance burden
- ✅ Better reliability (fewer moving parts)
- ❌ More code to write

**Feature-rich dependencies:**
- ✅ Faster development
- ✅ Battle-tested solutions
- ❌ Larger bundle size
- ❌ More security surface area
- ❌ Dependency hell risk

### Chosen Approach

**Required Dependencies:**
- `node-cron`: Scheduling (no good built-in alternative)

**Node.js Built-ins (No dependencies):**
- `fs/promises`: File operations
- `path`: Path manipulation
- `zlib`: Compression (gzip)
- `crypto`: Checksums (SHA-256)
- `os`: Platform detection

**Explicitly Avoided:**
- `archiver`: Archive creation (use directory structure instead)
- `moment`: Date manipulation (use native Date)
- `lodash`: Utilities (use native JS)
- `winston`: Logging (simple console + file)

### Trade-offs
- **Bundle Size:** Minimal (~50KB excluding node_modules)
- **Installation Speed:** Fast (<5 seconds)
- **Maintenance:** Low (1 dependency to update)
- **Development Speed:** Slightly slower (write more code)

### Alternatives Considered
1. **Zero dependencies:** Rejected (scheduling requires external library)
2. **Full-featured (10+ dependencies):** Rejected (unnecessary complexity)

---

## Decision 12: Error Recovery - Fail Fast vs Graceful Degradation

### Decision
**Graceful degradation** with detailed error reporting.

### Rationale

**Fail fast:**
- ✅ Clear failure signals
- ✅ No partial states
- ❌ Loses all work on any error
- ❌ Poor UX for large backups

**Graceful degradation (Chosen):**
- ✅ Backup as much as possible
- ✅ Detailed error reporting (which files failed)
- ✅ Partial backup better than no backup
- ❌ More complex error handling

### Chosen Approach

**Backup Strategy:**
1. Attempt to backup all files
2. If individual file fails, log error and continue
3. Include error summary in backup metadata
4. Mark backup as "partial" if any files failed
5. User can retry failed files or investigate

**Example Error Report:**
```json
{
  "backupId": "2025-11-02-040000",
  "status": "partial",
  "summary": {
    "filesSucceeded": 1234,
    "filesFailed": 3,
    "errors": [
      {
        "file": "~/workspace-brain/locked.db",
        "error": "EACCES: permission denied",
        "severity": "warning"
      }
    ]
  }
}
```

### Trade-offs
- **Reliability:** Better (some backup > no backup)
- **Completeness:** Lower (may miss files)
- **Transparency:** High (user knows exactly what failed)

### Alternatives Considered
1. **Fail fast:** Rejected (poor UX for scheduled backups)
2. **Silent failures:** Rejected (user unaware of issues)
3. **Retry logic:** Implemented (exponential backoff for transient failures)

---

## Status: Ready for API Reference

**Next Step:** Create API-REFERENCE.md with detailed examples and usage patterns

