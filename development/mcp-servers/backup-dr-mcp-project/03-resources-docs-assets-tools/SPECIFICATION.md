---
type: specification
tags: [backup, disaster-recovery, mcp-tools, technical-spec]
---

# Backup & Disaster Recovery MCP - Technical Specification

**Version:** 1.0.0
**Created:** 2025-11-02
**Status:** Active Development

---

## Overview

This MCP provides automated backup and disaster recovery capabilities for critical workspace data that exists outside git version control. It protects MCP-generated state, telemetry, configurations, and project artifacts with scheduled backups, point-in-time recovery, compression, and integrity verification.

---

## Architecture

### Core Components

```
backup-dr-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── tools/
│   │   ├── createBackup.ts      # Create backup tool
│   │   ├── restoreBackup.ts     # Restore backup tool
│   │   ├── listBackups.ts       # List backups tool
│   │   ├── verifyBackup.ts      # Verify backup integrity
│   │   ├── scheduleBackup.ts    # Schedule backup automation
│   │   ├── getBackupStatus.ts   # Get backup status/stats
│   │   ├── cleanupOldBackups.ts # Cleanup old backups
│   │   └── exportBackupConfig.ts # Export backup configuration
│   ├── engines/
│   │   ├── BackupEngine.ts      # Core backup logic
│   │   ├── RestoreEngine.ts     # Core restore logic
│   │   ├── CompressionEngine.ts # Compression/decompression
│   │   ├── IntegrityEngine.ts   # Checksum and verification
│   │   └── RetentionEngine.ts   # Retention policy management
│   ├── storage/
│   │   ├── BackupStorage.ts     # Backup storage abstraction
│   │   ├── BackupIndex.ts       # Backup catalog/index
│   │   └── BackupMetadata.ts    # Backup metadata management
│   ├── scheduler/
│   │   ├── BackupScheduler.ts   # Backup scheduling logic
│   │   └── CronManager.ts       # Cron job management
│   └── types/
│       ├── backup.types.ts      # Backup type definitions
│       └── config.types.ts      # Configuration types
└── config/
    └── default-backup-config.json # Default backup configuration
```

### Data Flow

```
┌─────────────────┐
│  MCP Tool Call  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Tool Handler Layer              │
│  (createBackup, restoreBackup, etc.)    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Engine Layer                    │
│  BackupEngine ──→ CompressionEngine    │
│       │              │                   │
│       ▼              ▼                   │
│  IntegrityEngine   RetentionEngine     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        Storage Layer                    │
│  BackupStorage → BackupIndex → Disk    │
└─────────────────────────────────────────┘
```

---

## MCP Tools

### 1. create_backup

**Purpose:** Create a new backup of specified data sources

**Parameters:**
```typescript
{
  sources: string[];           // Array of paths to backup (required)
  type: 'full' | 'incremental'; // Backup type (required)
  label?: string;              // Optional label for this backup
  compression?: boolean;       // Enable compression (default: true)
  verify?: boolean;            // Verify after creation (default: true)
  excludePatterns?: string[];  // Glob patterns to exclude
}
```

**Returns:**
```typescript
{
  success: boolean;
  backupId: string;            // Unique backup identifier (timestamp-based)
  backupPath: string;          // Path to backup directory
  metadata: {
    type: 'full' | 'incremental';
    sources: string[];
    created: string;           // ISO 8601 timestamp
    fileCount: number;
    totalSize: number;         // Bytes (uncompressed)
    compressedSize: number;    // Bytes (compressed)
    compressionRatio: number;  // Percentage
    checksum: string;          // SHA-256 of backup manifest
    label?: string;
  };
  duration: number;            // Milliseconds
  stats: {
    filesBackedUp: number;
    filesSkipped: number;
    bytesProcessed: number;
    compressionSavings: number;
  };
}
```

**Example:**
```typescript
// Create incremental backup of workspace-brain
create_backup({
  sources: ['~/workspace-brain/'],
  type: 'incremental',
  label: 'daily-telemetry-backup',
  compression: true,
  verify: true,
  excludePatterns: ['**/temp/**', '**/*.log']
})
```

**Implementation Notes:**
- **Incremental Detection:** Compare file mtimes against last backup timestamp
- **Atomic Operation:** Write to temp directory, then atomic rename on success
- **PHI Scanning:** Integrate with security-compliance-mcp to scan for PHI before backup
- **Checksum:** Calculate SHA-256 for entire backup manifest (file list + checksums)
- **Metadata Storage:** Write backup-metadata.json alongside backup files

---

### 2. restore_backup

**Purpose:** Restore files from a backup to original or custom location

**Parameters:**
```typescript
{
  backupId: string;            // Backup ID to restore from (required)
  destination?: string;        // Custom destination (default: original locations)
  dryRun?: boolean;            // Preview without actual restore (default: false)
  selective?: string[];        // Restore only specific files/patterns
  overwrite?: boolean;         // Overwrite existing files (default: false)
  preBackup?: boolean;         // Backup current state before restore (default: true)
}
```

**Returns:**
```typescript
{
  success: boolean;
  backupId: string;
  operation: 'restore' | 'dry-run';
  changes: {
    filesRestored: number;
    filesSkipped: number;
    bytesRestored: number;
    conflicts: Array<{         // Files that would be overwritten
      path: string;
      existingModified: string;
      backupModified: string;
      action: 'skip' | 'overwrite';
    }>;
  };
  duration: number;
  preBackupId?: string;        // If preBackup was created
  warnings: string[];
}
```

**Example:**
```typescript
// Dry-run restore to preview changes
restore_backup({
  backupId: '2025-11-02-040000',
  dryRun: true
})

// Selective restore of workspace-brain analytics only
restore_backup({
  backupId: '2025-11-02-040000',
  selective: ['~/workspace-brain/analytics/**'],
  overwrite: true,
  preBackup: true
})
```

**Implementation Notes:**
- **Safety First:** Always dry-run by default to preview changes
- **Pre-Restore Backup:** Create safety backup before destructive restore
- **Conflict Detection:** Identify files that would be overwritten
- **Verification:** Verify checksums after restore
- **Rollback Capability:** If restore fails, automatically rollback to pre-restore state

---

### 3. list_backups

**Purpose:** List all available backups with filtering and sorting

**Parameters:**
```typescript
{
  filter?: {
    type?: 'full' | 'incremental';
    sources?: string[];        // Filter by source path
    label?: string;            // Filter by label
    dateRange?: {
      start: string;           // ISO 8601
      end: string;
    };
  };
  sort?: 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
  limit?: number;              // Limit results (default: 100)
  includeMetadata?: boolean;   // Include full metadata (default: false)
}
```

**Returns:**
```typescript
{
  success: boolean;
  backups: Array<{
    backupId: string;
    type: 'full' | 'incremental';
    created: string;
    sources: string[];
    fileCount: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    label?: string;
    metadata?: BackupMetadata; // If includeMetadata: true
  }>;
  total: number;
  filtered: number;
  storageStats: {
    totalBackups: number;
    totalStorageUsed: number;
    totalStorageUncompressed: number;
    averageCompressionRatio: number;
  };
}
```

**Example:**
```typescript
// List recent incremental backups
list_backups({
  filter: {
    type: 'incremental',
    dateRange: {
      start: '2025-11-01T00:00:00Z',
      end: '2025-11-02T23:59:59Z'
    }
  },
  sort: 'date-desc',
  limit: 10
})
```

---

### 4. verify_backup

**Purpose:** Verify backup integrity using checksums

**Parameters:**
```typescript
{
  backupId: string;            // Backup ID to verify (required)
  deep?: boolean;              // Deep verification (checksums all files, default: false)
  repair?: boolean;            // Attempt repair if corruption detected (default: false)
}
```

**Returns:**
```typescript
{
  success: boolean;
  backupId: string;
  verification: {
    manifestValid: boolean;
    checksumValid: boolean;
    fileCountMatch: boolean;
    deepVerification: boolean;
  };
  issues: Array<{
    type: 'missing-file' | 'checksum-mismatch' | 'corrupt-metadata';
    file: string;
    expected?: string;
    actual?: string;
    severity: 'error' | 'warning';
  }>;
  repairActions?: Array<{
    action: string;
    result: 'success' | 'failure';
  }>;
  duration: number;
}
```

**Example:**
```typescript
// Deep verification with repair
verify_backup({
  backupId: '2025-11-02-040000',
  deep: true,
  repair: true
})
```

**Implementation Notes:**
- **Quick Verification:** Validate manifest checksum only (~100ms)
- **Deep Verification:** Recompute checksums for all files (~2-5 seconds)
- **Repair:** Attempt to rebuild manifest from actual files if corrupted
- **Scheduled Verification:** Integrate with scheduler for weekly verification

---

### 5. schedule_backup

**Purpose:** Schedule automated backups with cron expressions

**Parameters:**
```typescript
{
  action: 'create' | 'update' | 'delete' | 'list';
  scheduleId?: string;         // Required for update/delete
  schedule?: {
    name: string;
    cronExpression: string;    // Standard cron syntax
    backupConfig: {
      sources: string[];
      type: 'full' | 'incremental';
      label?: string;
      compression?: boolean;
    };
    enabled: boolean;
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  action: string;
  schedules?: Array<{
    scheduleId: string;
    name: string;
    cronExpression: string;
    backupConfig: object;
    enabled: boolean;
    nextRun: string;           // ISO 8601
    lastRun?: string;
    lastStatus?: 'success' | 'failure';
  }>;
  message: string;
}
```

**Example:**
```typescript
// Create daily incremental backup schedule
schedule_backup({
  action: 'create',
  schedule: {
    name: 'daily-workspace-brain',
    cronExpression: '0 2 * * *',  // 2 AM daily
    backupConfig: {
      sources: ['~/workspace-brain/'],
      type: 'incremental',
      label: 'auto-daily',
      compression: true
    },
    enabled: true
  }
})

// Create weekly full backup schedule
schedule_backup({
  action: 'create',
  schedule: {
    name: 'weekly-full-backup',
    cronExpression: '0 3 * * 0',  // 3 AM Sunday
    backupConfig: {
      sources: ['~/workspace-brain/', 'checklist-registry.json', '.smart-file-organizer-rules.json'],
      type: 'full',
      label: 'auto-weekly-full',
      compression: true
    },
    enabled: true
  }
})
```

**Implementation Notes:**
- **Platform Support:** Use node-cron for cross-platform scheduling
- **Persistence:** Store schedules in ~/.backup-dr/schedules.json
- **Error Handling:** Retry failed backups with exponential backoff
- **Logging:** Log all scheduled backup results to ~/.backup-dr/schedule.log

---

### 6. get_backup_status

**Purpose:** Get backup system status, statistics, and health metrics

**Parameters:**
```typescript
{
  includeLogs?: boolean;       // Include recent backup logs (default: false)
  logLimit?: number;           // Number of log entries (default: 10)
}
```

**Returns:**
```typescript
{
  success: boolean;
  status: {
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastBackup: {
      backupId: string;
      type: 'full' | 'incremental';
      created: string;
      status: 'success' | 'failure';
      duration: number;
    };
    nextScheduledBackup: {
      scheduleName: string;
      scheduledTime: string;
    };
    storageUsage: {
      totalBackups: number;
      totalSize: number;
      totalSizeCompressed: number;
      averageCompressionRatio: number;
      oldestBackup: string;
      newestBackup: string;
    };
    retentionStatus: {
      dailyBackups: number;      // Target: 7
      weeklyBackups: number;     // Target: 4
      monthlyBackups: number;    // Target: 12
      expiredBackups: number;    // Pending cleanup
    };
    recentActivity: {
      backupsLast7Days: number;
      backupsLast30Days: number;
      failuresLast7Days: number;
      averageBackupDuration: number;
    };
  };
  warnings: string[];
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    operation: string;
    message: string;
  }>;
}
```

**Example:**
```typescript
// Get backup system status
get_backup_status({
  includeLogs: true,
  logLimit: 20
})
```

**Health Indicators:**
- **Healthy:** Last backup successful, storage usage <80%, no errors last 7 days
- **Warning:** Last backup failed OR storage usage 80-95% OR 1-2 errors last 7 days
- **Critical:** Multiple backup failures OR storage usage >95% OR 3+ errors last 7 days

---

### 7. cleanup_old_backups

**Purpose:** Clean up old backups according to retention policy

**Parameters:**
```typescript
{
  policy?: {
    dailyRetention: number;    // Days to keep daily backups (default: 7)
    weeklyRetention: number;   // Weeks to keep weekly backups (default: 4)
    monthlyRetention: number;  // Months to keep monthly backups (default: 12)
  };
  dryRun?: boolean;            // Preview without deleting (default: false)
  force?: boolean;             // Skip confirmation (default: false)
}
```

**Returns:**
```typescript
{
  success: boolean;
  operation: 'cleanup' | 'dry-run';
  policy: {
    dailyRetention: number;
    weeklyRetention: number;
    monthlyRetention: number;
  };
  analysis: {
    totalBackups: number;
    backupsToKeep: number;
    backupsToDelete: number;
    spaceToReclaim: number;    // Bytes
  };
  deletedBackups?: Array<{
    backupId: string;
    type: 'full' | 'incremental';
    created: string;
    size: number;
    reason: string;            // Why it was deleted
  }>;
  duration: number;
}
```

**Example:**
```typescript
// Dry-run cleanup with default retention
cleanup_old_backups({
  dryRun: true
})

// Execute cleanup with custom retention
cleanup_old_backups({
  policy: {
    dailyRetention: 14,        // Keep 14 daily
    weeklyRetention: 8,        // Keep 8 weekly
    monthlyRetention: 24       // Keep 24 monthly
  },
  force: true
})
```

**Retention Algorithm:**
1. **Daily Backups:** Keep last N daily backups
2. **Weekly Backups:** Keep last backup from each of last N weeks (Sunday backup preferred)
3. **Monthly Backups:** Keep last backup from each of last N months (last Sunday of month preferred)
4. **Full Backup Preference:** Always keep at least 1 full backup per retention period

---

### 8. export_backup_config

**Purpose:** Export backup configuration for migration or documentation

**Parameters:**
```typescript
{
  format: 'json' | 'yaml' | 'markdown';
  includeSecrets?: boolean;    // Include paths but not actual secrets (default: false)
  includeSchedules?: boolean;  // Include backup schedules (default: true)
  includeHistory?: boolean;    // Include backup history (default: false)
  outputPath?: string;         // Custom output path (default: print to stdout)
}
```

**Returns:**
```typescript
{
  success: boolean;
  format: string;
  config: {
    backupSources: string[];
    excludePatterns: string[];
    compression: boolean;
    retentionPolicy: object;
    schedules: object[];
    history?: object[];
  };
  exportedTo?: string;         // If outputPath provided
  warnings: string[];
}
```

**Example:**
```typescript
// Export configuration to markdown documentation
export_backup_config({
  format: 'markdown',
  includeSchedules: true,
  includeHistory: false,
  outputPath: '~/backup-dr-mcp-project/03-resources-docs-assets-tools/BACKUP-CONFIG.md'
})
```

---

## Data Structures

### BackupMetadata
```typescript
interface BackupMetadata {
  backupId: string;            // Format: YYYY-MM-DD-HHMMSS
  version: string;             // Backup format version (1.0.0)
  type: 'full' | 'incremental';
  created: string;             // ISO 8601 timestamp
  sources: string[];           // Original source paths
  label?: string;
  fileCount: number;
  totalSize: number;           // Uncompressed bytes
  compressedSize: number;
  compressionRatio: number;    // Percentage
  checksum: string;            // SHA-256 of manifest
  files: BackupFileEntry[];
  config: {
    compression: boolean;
    compressionLevel: number;
    excludePatterns: string[];
  };
}
```

### BackupFileEntry
```typescript
interface BackupFileEntry {
  path: string;                // Relative path from source
  originalPath: string;        // Absolute original path
  size: number;                // Uncompressed size
  compressedSize?: number;     // If compressed
  checksum: string;            // SHA-256
  modified: string;            // ISO 8601
  permissions: string;         // Unix permissions (e.g., "755")
}
```

### BackupIndex
```typescript
interface BackupIndex {
  version: string;
  lastUpdated: string;
  backups: BackupIndexEntry[];
  statistics: {
    totalBackups: number;
    totalSize: number;
    totalCompressedSize: number;
    fullBackups: number;
    incrementalBackups: number;
  };
}
```

### BackupSchedule
```typescript
interface BackupSchedule {
  scheduleId: string;
  name: string;
  cronExpression: string;
  backupConfig: {
    sources: string[];
    type: 'full' | 'incremental';
    label?: string;
    compression?: boolean;
  };
  enabled: boolean;
  created: string;
  lastRun?: string;
  lastStatus?: 'success' | 'failure';
  nextRun?: string;
}
```

---

## Storage Layout

```
~/.backup-dr/
├── backups/
│   ├── 2025-11-02-040000/           # Backup directory (YYYY-MM-DD-HHMMSS)
│   │   ├── backup-metadata.json     # Backup metadata
│   │   ├── manifest.json            # File manifest with checksums
│   │   └── data/                    # Actual backup files (compressed)
│   │       ├── workspace-brain/
│   │       │   └── telemetry/
│   │       │       └── events.jsonl.gz
│   │       └── checklist-registry.json.gz
│   └── 2025-11-01-040000/
│       └── ...
├── index.json                       # Backup index/catalog
├── schedules.json                   # Backup schedules
├── config.json                      # Backup configuration
└── logs/
    ├── backup.log                   # Backup operation logs
    └── schedule.log                 # Scheduled backup logs
```

---

## Error Handling

### Error Categories

1. **Validation Errors** (400-level)
   - Invalid backup ID
   - Invalid cron expression
   - Invalid path/source
   - Missing required parameters

2. **Storage Errors** (500-level)
   - Disk full
   - Permission denied
   - Backup directory not writable
   - Corrupted backup metadata

3. **Integrity Errors** (500-level)
   - Checksum mismatch
   - Missing files in backup
   - Corrupted manifest

4. **Scheduling Errors** (500-level)
   - Cron job creation failed
   - Schedule conflict
   - Invalid schedule configuration

### Error Response Format
```typescript
{
  success: false,
  error: {
    code: string;              // Error code (e.g., "BACKUP_FAILED")
    message: string;           // Human-readable message
    details?: object;          // Additional error context
    recovery?: string;         // Suggested recovery action
  }
}
```

---

## Integration Points

### 1. workspace-brain-mcp
- **Purpose:** Primary data source for backup
- **Integration:** Backup telemetry, analytics, learning patterns, cache
- **Frequency:** Daily incremental, weekly full

### 2. security-compliance-mcp
- **Purpose:** PHI detection before backup
- **Integration:** Call scan_for_phi before creating backup
- **Safety:** Exclude any files containing PHI

### 3. deployment-release-mcp
- **Purpose:** Pre-deployment backups
- **Integration:** Automatic backup before deploy_application
- **Safety:** Rollback capability if deployment fails

### 4. checklist-manager-mcp
- **Purpose:** Backup checklist registry and progress
- **Integration:** Include checklist-registry.json in backup sources
- **Frequency:** Daily incremental

### 5. project-management-mcp
- **Purpose:** Backup project orchestration state
- **Integration:** Backup .ai-planning/ directories
- **Frequency:** Weekly full

---

## Performance Requirements

### Backup Performance
- **Incremental Backup:** <30 seconds for typical workspace (<50MB changed data)
- **Full Backup:** <2 minutes for entire workspace (<500MB total data)
- **Compression Ratio:** ≥60% size reduction (JSON/text data)
- **CPU Usage:** <20% during backup operation
- **Memory Usage:** <200MB during backup operation

### Restore Performance
- **Selective Restore:** <10 seconds for individual files
- **Full Restore:** <60 seconds for entire backup
- **Verification:** <5 seconds for quick verify, <30 seconds for deep verify

### Storage Efficiency
- **Compression:** gzip level 6 (balance of speed vs compression)
- **Total Storage:** <500MB for typical retention policy (7 daily, 4 weekly, 12 monthly)
- **Incremental Efficiency:** Only store changed files (deduplication via hardlinks in future versions)

---

## Security Considerations

### Data Privacy
- ✅ **PHI Exclusion:** Scan for PHI before backup, exclude matching files
- ✅ **Secret Exclusion:** Backup secrets metadata only, not actual values
- ✅ **Path Sanitization:** Validate all paths to prevent directory traversal

### Access Control
- ✅ **User-Level Permissions:** No sudo required, respects file permissions
- ✅ **Backup Permissions:** Preserve original file permissions in backups
- ✅ **Config Protection:** Store backup config in user home directory (~/.backup-dr/)

### Integrity
- ✅ **Checksums:** SHA-256 for all files and manifests
- ✅ **Atomic Operations:** Write to temp, then atomic rename
- ✅ **Verification:** Automatic verification after backup creation

---

## Testing Strategy

### Unit Tests
- Backup creation (full and incremental)
- Restore operations (full and selective)
- Compression and decompression
- Checksum calculation and verification
- Retention policy enforcement
- Schedule creation and management

### Integration Tests
- End-to-end backup and restore workflow
- PHI detection integration (security-compliance-mcp)
- Scheduled backup execution
- Cross-platform file path handling
- Storage quota handling

### Performance Tests
- Large file handling (100MB+)
- Many small files (10,000+)
- Compression efficiency benchmarks
- Backup duration under load

### Recovery Tests
- Restore from various backup ages
- Partial backup recovery
- Corrupted backup recovery
- Dry-run accuracy validation

---

## Migration & Upgrade Path

### v1.0.0 → v1.1.0
- Backward compatible backup format
- Automatic index regeneration if format changes
- Config migration tool for schedule updates

### v1.1.0 → v2.0.0 (Future)
- Cloud storage migration
- Encryption migration (plaintext → encrypted)
- Index format upgrade

---

## Configuration

### Default Configuration (~/.backup-dr/config.json)
```json
{
  "version": "1.0.0",
  "backupDirectory": "~/.backup-dr/backups",
  "compression": {
    "enabled": true,
    "level": 6,
    "algorithm": "gzip"
  },
  "retention": {
    "dailyBackups": 7,
    "weeklyBackups": 4,
    "monthlyBackups": 12
  },
  "defaults": {
    "backupType": "incremental",
    "verify": true,
    "excludePatterns": [
      "**/node_modules/**",
      "**/.git/**",
      "**/temp/**",
      "**/*.log"
    ]
  },
  "sources": [
    "~/workspace-brain/",
    "checklist-registry.json",
    ".smart-file-organizer-rules.json"
  ],
  "integrations": {
    "phiScanningEnabled": true,
    "preDeploymentBackup": true
  }
}
```

---

## Logging

### Log Levels
- **INFO:** Routine operations (backup started, backup completed)
- **WARNING:** Non-critical issues (file skipped, low disk space warning)
- **ERROR:** Critical failures (backup failed, restore failed)

### Log Format
```
[2025-11-02T04:00:00.000Z] [INFO] [create_backup] Starting incremental backup (sources: 1)
[2025-11-02T04:00:15.234Z] [INFO] [create_backup] Backup completed (backupId: 2025-11-02-040000, files: 1234, duration: 15234ms)
[2025-11-02T04:00:15.235Z] [INFO] [verify_backup] Verification passed (checksum: abc123...)
```

### Log Rotation
- Daily rotation
- Keep last 30 days
- Compress old logs (gzip)

---

## Status: Ready for Implementation

**Next Steps:**
1. Create DESIGN-DECISIONS.md (implementation approach, library selection)
2. Create API-REFERENCE.md (detailed API docs with examples)
3. Begin Phase 1 implementation (core backup tools)

