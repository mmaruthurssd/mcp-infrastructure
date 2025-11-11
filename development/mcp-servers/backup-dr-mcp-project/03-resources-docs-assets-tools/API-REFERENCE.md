---
type: reference
tags: [backup, api-reference, mcp-tools, examples]
---

# Backup & Disaster Recovery MCP - API Reference

**Version:** 1.0.0
**Created:** 2025-11-02
**Status:** Active Development

---

## Table of Contents

1. [create_backup](#1-create_backup)
2. [restore_backup](#2-restore_backup)
3. [list_backups](#3-list_backups)
4. [verify_backup](#4-verify_backup)
5. [schedule_backup](#5-schedule_backup)
6. [get_backup_status](#6-get_backup_status)
7. [cleanup_old_backups](#7-cleanup_old_backups)
8. [export_backup_config](#8-export_backup_config)

---

## 1. create_backup

Create a new backup of specified data sources with compression and integrity verification.

### Syntax

```typescript
create_backup(params: CreateBackupParams): Promise<CreateBackupResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sources` | `string[]` | ✅ Yes | - | Array of absolute paths to backup |
| `type` | `'full' \| 'incremental'` | ✅ Yes | - | Backup type |
| `label` | `string` | ❌ No | `undefined` | Optional label for organization |
| `compression` | `boolean` | ❌ No | `true` | Enable gzip compression |
| `verify` | `boolean` | ❌ No | `true` | Verify backup after creation |
| `excludePatterns` | `string[]` | ❌ No | `[]` | Glob patterns to exclude |

### Returns

```typescript
interface CreateBackupResult {
  success: boolean;
  backupId: string;
  backupPath: string;
  metadata: BackupMetadata;
  duration: number;
  stats: BackupStats;
}
```

### Examples

#### Example 1: Basic Incremental Backup

```typescript
const result = await create_backup({
  sources: ['/Users/user/workspace-brain/'],
  type: 'incremental'
});

console.log(result);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   backupPath: '/Users/user/.backup-dr/backups/2025-11-02-040000',
//   metadata: {
//     type: 'incremental',
//     sources: ['/Users/user/workspace-brain/'],
//     created: '2025-11-02T04:00:00.000Z',
//     fileCount: 1234,
//     totalSize: 52428800,      // 50MB
//     compressedSize: 15728640,  // 15MB
//     compressionRatio: 70,
//     checksum: 'abc123...'
//   },
//   duration: 15234,  // 15.2 seconds
//   stats: {
//     filesBackedUp: 1234,
//     filesSkipped: 0,
//     bytesProcessed: 52428800,
//     compressionSavings: 36700160  // 35MB saved
//   }
// }
```

#### Example 2: Full Backup with Exclusions

```typescript
const result = await create_backup({
  sources: [
    '/Users/user/workspace-brain/',
    '/Users/user/operations-workspace/checklist-registry.json',
    '/Users/user/.smart-file-organizer-rules.json'
  ],
  type: 'full',
  label: 'weekly-full-backup',
  compression: true,
  verify: true,
  excludePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/temp/**',
    '**/*.log',
    '**/.DS_Store'
  ]
});
```

#### Example 3: Uncompressed Backup (for debugging)

```typescript
const result = await create_backup({
  sources: ['/Users/user/workspace-brain/analytics/'],
  type: 'full',
  label: 'debug-backup',
  compression: false,  // No compression for easier inspection
  verify: true
});
```

#### Example 4: Selective Directory Backup

```typescript
// Backup only telemetry data
const result = await create_backup({
  sources: ['/Users/user/workspace-brain/telemetry/'],
  type: 'incremental',
  label: 'telemetry-only',
  compression: true
});
```

### Error Handling

```typescript
try {
  const result = await create_backup({
    sources: ['/invalid/path/'],
    type: 'full'
  });
} catch (error) {
  console.error(error);
  // {
  //   success: false,
  //   error: {
  //     code: 'SOURCE_NOT_FOUND',
  //     message: 'Source path does not exist: /invalid/path/',
  //     recovery: 'Verify the path exists and is accessible'
  //   }
  // }
}
```

### Common Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| `SOURCE_NOT_FOUND` | Source path doesn't exist | Verify path is correct |
| `PERMISSION_DENIED` | No read access to source | Check file permissions |
| `DISK_FULL` | Insufficient storage space | Free up disk space |
| `PHI_DETECTED` | PHI found in source files | Review excluded files, handle PHI appropriately |

### Performance

- **Incremental backup:** <30 seconds for typical workspace (~50MB changed data)
- **Full backup:** <2 minutes for entire workspace (~500MB)
- **Compression ratio:** 60-70% for JSON/text data

---

## 2. restore_backup

Restore files from a backup to original or custom location with dry-run preview.

### Syntax

```typescript
restore_backup(params: RestoreBackupParams): Promise<RestoreBackupResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `backupId` | `string` | ✅ Yes | - | Backup ID to restore from |
| `destination` | `string` | ❌ No | Original locations | Custom destination path |
| `dryRun` | `boolean` | ❌ No | `false` | Preview changes without restoring |
| `selective` | `string[]` | ❌ No | All files | Restore only matching patterns |
| `overwrite` | `boolean` | ❌ No | `false` | Overwrite existing files |
| `preBackup` | `boolean` | ❌ No | `true` | Backup current state first |

### Returns

```typescript
interface RestoreBackupResult {
  success: boolean;
  backupId: string;
  operation: 'restore' | 'dry-run';
  changes: RestoreChanges;
  duration: number;
  preBackupId?: string;
  warnings: string[];
}
```

### Examples

#### Example 1: Dry-Run Preview (Recommended First Step)

```typescript
// Always dry-run first to preview changes
const preview = await restore_backup({
  backupId: '2025-11-02-040000',
  dryRun: true
});

console.log(preview);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   operation: 'dry-run',
//   changes: {
//     filesRestored: 0,      // Dry-run doesn't actually restore
//     filesSkipped: 0,
//     bytesRestored: 0,
//     conflicts: [
//       {
//         path: '/Users/user/workspace-brain/telemetry/events.jsonl',
//         existingModified: '2025-11-02T05:00:00.000Z',
//         backupModified: '2025-11-02T03:00:00.000Z',
//         action: 'skip'  // Would be skipped without overwrite
//       }
//     ]
//   },
//   duration: 123,
//   warnings: [
//     'Found 1 conflict - use overwrite: true to replace existing files'
//   ]
// }
```

#### Example 2: Full Restore with Pre-Backup Safety

```typescript
// After reviewing dry-run, execute restore with safety backup
const result = await restore_backup({
  backupId: '2025-11-02-040000',
  overwrite: true,
  preBackup: true  // Create safety backup before restore
});

console.log(result);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   operation: 'restore',
//   changes: {
//     filesRestored: 1234,
//     filesSkipped: 0,
//     bytesRestored: 52428800,
//     conflicts: []
//   },
//   duration: 5432,
//   preBackupId: '2025-11-02-041500-pre-restore',  // Safety backup ID
//   warnings: []
// }
```

#### Example 3: Selective Restore

```typescript
// Restore only analytics data
const result = await restore_backup({
  backupId: '2025-11-02-040000',
  selective: ['/Users/user/workspace-brain/analytics/**'],
  overwrite: true,
  preBackup: true
});
```

#### Example 4: Restore to Staging Directory

```typescript
// Restore to custom location for review
const result = await restore_backup({
  backupId: '2025-11-02-040000',
  destination: '/Users/user/backup-review/',
  overwrite: false,
  preBackup: false  // No need for safety backup (not overwriting)
});

// User reviews files in /Users/user/backup-review/
// Then manually moves files to production locations
```

#### Example 5: Recovery from Accidental Deletion

```typescript
// Scenario: Accidentally deleted workspace-brain directory

// Step 1: Find most recent backup
const backups = await list_backups({ limit: 1, sort: 'date-desc' });
const latestBackup = backups.backups[0];

// Step 2: Preview restore
const preview = await restore_backup({
  backupId: latestBackup.backupId,
  dryRun: true
});

// Step 3: Execute restore
const result = await restore_backup({
  backupId: latestBackup.backupId,
  overwrite: true,
  preBackup: false  // Nothing to backup (directory deleted)
});
```

### Error Handling

```typescript
try {
  const result = await restore_backup({
    backupId: 'invalid-id',
    overwrite: true
  });
} catch (error) {
  console.error(error);
  // {
  //   success: false,
  //   error: {
  //     code: 'BACKUP_NOT_FOUND',
  //     message: 'Backup not found: invalid-id',
  //     recovery: 'Use list_backups to see available backups'
  //   }
  // }
}
```

### Common Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| `BACKUP_NOT_FOUND` | Invalid backup ID | List available backups |
| `BACKUP_CORRUPTED` | Checksum verification failed | Try different backup |
| `PERMISSION_DENIED` | No write access to destination | Check permissions |
| `DISK_FULL` | Insufficient storage space | Free up disk space |

### Best Practices

1. **Always dry-run first** - Preview changes before actual restore
2. **Enable preBackup** - Create safety backup before overwriting
3. **Use selective restore** - Restore only what you need
4. **Verify after restore** - Confirm restored files are correct

---

## 3. list_backups

List all available backups with filtering, sorting, and metadata.

### Syntax

```typescript
list_backups(params?: ListBackupsParams): Promise<ListBackupsResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filter` | `BackupFilter` | ❌ No | No filter | Filter criteria |
| `filter.type` | `'full' \| 'incremental'` | ❌ No | - | Filter by backup type |
| `filter.sources` | `string[]` | ❌ No | - | Filter by source paths |
| `filter.label` | `string` | ❌ No | - | Filter by label |
| `filter.dateRange` | `DateRange` | ❌ No | - | Filter by date range |
| `sort` | `SortOption` | ❌ No | `'date-desc'` | Sort order |
| `limit` | `number` | ❌ No | `100` | Max results |
| `includeMetadata` | `boolean` | ❌ No | `false` | Include full metadata |

### Returns

```typescript
interface ListBackupsResult {
  success: boolean;
  backups: BackupSummary[];
  total: number;
  filtered: number;
  storageStats: StorageStats;
}
```

### Examples

#### Example 1: List All Backups

```typescript
const result = await list_backups();

console.log(result);
// {
//   success: true,
//   backups: [
//     {
//       backupId: '2025-11-02-040000',
//       type: 'incremental',
//       created: '2025-11-02T04:00:00.000Z',
//       sources: ['/Users/user/workspace-brain/'],
//       fileCount: 1234,
//       totalSize: 52428800,
//       compressedSize: 15728640,
//       compressionRatio: 70,
//       label: 'daily-backup'
//     },
//     // ... more backups
//   ],
//   total: 45,
//   filtered: 45,
//   storageStats: {
//     totalBackups: 45,
//     totalStorageUsed: 125829120,  // 120MB compressed
//     totalStorageUncompressed: 419430400,  // 400MB uncompressed
//     averageCompressionRatio: 70
//   }
// }
```

#### Example 2: List Recent Incremental Backups

```typescript
const result = await list_backups({
  filter: {
    type: 'incremental',
    dateRange: {
      start: '2025-11-01T00:00:00Z',
      end: '2025-11-02T23:59:59Z'
    }
  },
  sort: 'date-desc',
  limit: 10
});
```

#### Example 3: Find Backups by Label

```typescript
const result = await list_backups({
  filter: {
    label: 'weekly-full-backup'
  },
  sort: 'date-desc'
});
```

#### Example 4: Find Backups Containing Specific Source

```typescript
const result = await list_backups({
  filter: {
    sources: ['/Users/user/workspace-brain/analytics/']
  },
  includeMetadata: true  // Get full metadata for each backup
});
```

#### Example 5: Find Largest Backups

```typescript
const result = await list_backups({
  sort: 'size-desc',
  limit: 5
});
```

### Sorting Options

| Option | Description |
|--------|-------------|
| `date-asc` | Oldest first |
| `date-desc` | Newest first (default) |
| `size-asc` | Smallest first |
| `size-desc` | Largest first |

---

## 4. verify_backup

Verify backup integrity using checksums and manifest validation.

### Syntax

```typescript
verify_backup(params: VerifyBackupParams): Promise<VerifyBackupResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `backupId` | `string` | ✅ Yes | - | Backup ID to verify |
| `deep` | `boolean` | ❌ No | `false` | Deep verification (checksums all files) |
| `repair` | `boolean` | ❌ No | `false` | Attempt repair if corruption detected |

### Returns

```typescript
interface VerifyBackupResult {
  success: boolean;
  backupId: string;
  verification: VerificationStatus;
  issues: VerificationIssue[];
  repairActions?: RepairAction[];
  duration: number;
}
```

### Examples

#### Example 1: Quick Verification (Default)

```typescript
// Quick verification (~100ms) - validates manifest checksum only
const result = await verify_backup({
  backupId: '2025-11-02-040000'
});

console.log(result);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   verification: {
//     manifestValid: true,
//     checksumValid: true,
//     fileCountMatch: true,
//     deepVerification: false
//   },
//   issues: [],
//   duration: 123
// }
```

#### Example 2: Deep Verification

```typescript
// Deep verification (~2-5 seconds) - recomputes all file checksums
const result = await verify_backup({
  backupId: '2025-11-02-040000',
  deep: true
});

console.log(result);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   verification: {
//     manifestValid: true,
//     checksumValid: true,
//     fileCountMatch: true,
//     deepVerification: true
//   },
//   issues: [],
//   duration: 3456
// }
```

#### Example 3: Verify and Repair

```typescript
// Detect and repair corrupted backup
const result = await verify_backup({
  backupId: '2025-11-02-040000',
  deep: true,
  repair: true
});

console.log(result);
// {
//   success: true,
//   backupId: '2025-11-02-040000',
//   verification: {
//     manifestValid: true,
//     checksumValid: true,
//     fileCountMatch: true,
//     deepVerification: true
//   },
//   issues: [
//     {
//       type: 'checksum-mismatch',
//       file: 'data/workspace-brain/telemetry/events.jsonl.gz',
//       expected: 'abc123...',
//       actual: 'def456...',
//       severity: 'error'
//     }
//   ],
//   repairActions: [
//     {
//       action: 'Rebuilt manifest from actual files',
//       result: 'success'
//     }
//   ],
//   duration: 4567
// }
```

#### Example 4: Batch Verification

```typescript
// Verify all backups (scheduled task)
const allBackups = await list_backups();

for (const backup of allBackups.backups) {
  const result = await verify_backup({
    backupId: backup.backupId,
    deep: false  // Quick verification
  });

  if (!result.success || result.issues.length > 0) {
    console.error(`Backup ${backup.backupId} has issues:`, result.issues);
  }
}
```

### Verification Levels

| Level | Duration | Checks | When to Use |
|-------|----------|--------|-------------|
| Quick | ~100ms | Manifest checksum, file count | Regular verification, pre-restore |
| Deep | ~2-5s | All file checksums | Weekly verification, corruption suspected |
| Repair | ~5-10s | Deep + rebuild manifest | Corruption detected |

---

## 5. schedule_backup

Schedule automated backups with cron expressions.

### Syntax

```typescript
schedule_backup(params: ScheduleBackupParams): Promise<ScheduleBackupResult>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | `'create' \| 'update' \| 'delete' \| 'list'` | ✅ Yes | Action to perform |
| `scheduleId` | `string` | Conditional | Required for update/delete |
| `schedule` | `BackupSchedule` | Conditional | Required for create/update |

### Returns

```typescript
interface ScheduleBackupResult {
  success: boolean;
  action: string;
  schedules?: BackupSchedule[];
  message: string;
}
```

### Examples

#### Example 1: Create Daily Backup Schedule

```typescript
const result = await schedule_backup({
  action: 'create',
  schedule: {
    name: 'daily-workspace-brain',
    cronExpression: '0 2 * * *',  // 2 AM daily
    backupConfig: {
      sources: ['/Users/user/workspace-brain/'],
      type: 'incremental',
      label: 'auto-daily',
      compression: true
    },
    enabled: true
  }
});

console.log(result);
// {
//   success: true,
//   action: 'create',
//   schedules: [
//     {
//       scheduleId: 'sched-1234567890',
//       name: 'daily-workspace-brain',
//       cronExpression: '0 2 * * *',
//       backupConfig: { ... },
//       enabled: true,
//       nextRun: '2025-11-03T02:00:00.000Z'
//     }
//   ],
//   message: 'Schedule created successfully'
// }
```

#### Example 2: Create Weekly Full Backup Schedule

```typescript
const result = await schedule_backup({
  action: 'create',
  schedule: {
    name: 'weekly-full-backup',
    cronExpression: '0 3 * * 0',  // 3 AM Sunday
    backupConfig: {
      sources: [
        '/Users/user/workspace-brain/',
        '/Users/user/operations-workspace/checklist-registry.json',
        '/Users/user/.smart-file-organizer-rules.json'
      ],
      type: 'full',
      label: 'auto-weekly-full',
      compression: true
    },
    enabled: true
  }
});
```

#### Example 3: List All Schedules

```typescript
const result = await schedule_backup({
  action: 'list'
});

console.log(result);
// {
//   success: true,
//   action: 'list',
//   schedules: [
//     {
//       scheduleId: 'sched-1234567890',
//       name: 'daily-workspace-brain',
//       cronExpression: '0 2 * * *',
//       backupConfig: { ... },
//       enabled: true,
//       lastRun: '2025-11-02T02:00:00.000Z',
//       lastStatus: 'success',
//       nextRun: '2025-11-03T02:00:00.000Z'
//     },
//     {
//       scheduleId: 'sched-0987654321',
//       name: 'weekly-full-backup',
//       cronExpression: '0 3 * * 0',
//       backupConfig: { ... },
//       enabled: true,
//       lastRun: '2025-10-29T03:00:00.000Z',
//       lastStatus: 'success',
//       nextRun: '2025-11-03T03:00:00.000Z'
//     }
//   ],
//   message: 'Retrieved 2 schedules'
// }
```

#### Example 4: Disable Schedule Temporarily

```typescript
const result = await schedule_backup({
  action: 'update',
  scheduleId: 'sched-1234567890',
  schedule: {
    name: 'daily-workspace-brain',
    cronExpression: '0 2 * * *',
    backupConfig: { ... },
    enabled: false  // Disable
  }
});
```

#### Example 5: Delete Schedule

```typescript
const result = await schedule_backup({
  action: 'delete',
  scheduleId: 'sched-1234567890'
});
```

### Cron Expression Examples

| Expression | Description |
|------------|-------------|
| `0 2 * * *` | Every day at 2:00 AM |
| `0 3 * * 0` | Every Sunday at 3:00 AM |
| `0 4 1 * *` | First day of every month at 4:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 */6 * * *` | Every 6 hours |

---

## 6. get_backup_status

Get backup system status, statistics, and health metrics.

### Syntax

```typescript
get_backup_status(params?: GetBackupStatusParams): Promise<BackupStatusResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeLogs` | `boolean` | ❌ No | `false` | Include recent backup logs |
| `logLimit` | `number` | ❌ No | `10` | Number of log entries |

### Returns

```typescript
interface BackupStatusResult {
  success: boolean;
  status: SystemStatus;
  warnings: string[];
  logs?: LogEntry[];
}
```

### Examples

#### Example 1: Basic Status Check

```typescript
const result = await get_backup_status();

console.log(result);
// {
//   success: true,
//   status: {
//     systemHealth: 'healthy',
//     lastBackup: {
//       backupId: '2025-11-02-040000',
//       type: 'incremental',
//       created: '2025-11-02T04:00:00.000Z',
//       status: 'success',
//       duration: 15234
//     },
//     nextScheduledBackup: {
//       scheduleName: 'daily-workspace-brain',
//       scheduledTime: '2025-11-03T02:00:00.000Z'
//     },
//     storageUsage: {
//       totalBackups: 45,
//       totalSize: 125829120,
//       totalSizeCompressed: 125829120,
//       averageCompressionRatio: 70,
//       oldestBackup: '2025-09-15T03:00:00.000Z',
//       newestBackup: '2025-11-02T04:00:00.000Z'
//     },
//     retentionStatus: {
//       dailyBackups: 7,
//       weeklyBackups: 4,
//       monthlyBackups: 12,
//       expiredBackups: 3
//     },
//     recentActivity: {
//       backupsLast7Days: 7,
//       backupsLast30Days: 31,
//       failuresLast7Days: 0,
//       averageBackupDuration: 16234
//     }
//   },
//   warnings: []
// }
```

#### Example 2: Status with Logs

```typescript
const result = await get_backup_status({
  includeLogs: true,
  logLimit: 20
});

console.log(result.logs);
// [
//   {
//     timestamp: '2025-11-02T04:00:00.000Z',
//     level: 'info',
//     operation: 'create_backup',
//     message: 'Backup completed successfully (backupId: 2025-11-02-040000)'
//   },
//   {
//     timestamp: '2025-11-01T02:00:00.000Z',
//     level: 'warning',
//     operation: 'create_backup',
//     message: '3 files excluded due to PHI detection'
//   }
// ]
```

#### Example 3: Health Monitoring

```typescript
const result = await get_backup_status();

if (result.status.systemHealth !== 'healthy') {
  console.warn('Backup system health issue:', result.warnings);

  // Alert user or take corrective action
  if (result.status.systemHealth === 'critical') {
    // Send notification
    // Investigate failures
  }
}
```

### Health Status

| Status | Criteria |
|--------|----------|
| `healthy` | Last backup successful, storage <80%, no errors last 7 days |
| `warning` | Last backup failed OR storage 80-95% OR 1-2 errors last 7 days |
| `critical` | Multiple failures OR storage >95% OR 3+ errors last 7 days |

---

## 7. cleanup_old_backups

Clean up old backups according to retention policy.

### Syntax

```typescript
cleanup_old_backups(params?: CleanupParams): Promise<CleanupResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `policy` | `RetentionPolicy` | ❌ No | Default policy | Retention policy |
| `policy.dailyRetention` | `number` | ❌ No | `7` | Days to keep daily backups |
| `policy.weeklyRetention` | `number` | ❌ No | `4` | Weeks to keep weekly backups |
| `policy.monthlyRetention` | `number` | ❌ No | `12` | Months to keep monthly backups |
| `dryRun` | `boolean` | ❌ No | `false` | Preview without deleting |
| `force` | `boolean` | ❌ No | `false` | Skip confirmation |

### Returns

```typescript
interface CleanupResult {
  success: boolean;
  operation: 'cleanup' | 'dry-run';
  policy: RetentionPolicy;
  analysis: CleanupAnalysis;
  deletedBackups?: DeletedBackup[];
  duration: number;
}
```

### Examples

#### Example 1: Dry-Run Cleanup Preview

```typescript
const result = await cleanup_old_backups({
  dryRun: true
});

console.log(result);
// {
//   success: true,
//   operation: 'dry-run',
//   policy: {
//     dailyRetention: 7,
//     weeklyRetention: 4,
//     monthlyRetention: 12
//   },
//   analysis: {
//     totalBackups: 45,
//     backupsToKeep: 23,
//     backupsToDelete: 22,
//     spaceToReclaim: 31457280  // 30MB
//   },
//   duration: 234
// }
```

#### Example 2: Execute Cleanup with Default Retention

```typescript
const result = await cleanup_old_backups({
  force: true
});

console.log(result);
// {
//   success: true,
//   operation: 'cleanup',
//   policy: {
//     dailyRetention: 7,
//     weeklyRetention: 4,
//     monthlyRetention: 12
//   },
//   analysis: {
//     totalBackups: 45,
//     backupsToKeep: 23,
//     backupsToDelete: 22,
//     spaceToReclaim: 31457280
//   },
//   deletedBackups: [
//     {
//       backupId: '2025-09-15-030000',
//       type: 'incremental',
//       created: '2025-09-15T03:00:00.000Z',
//       size: 1048576,
//       reason: 'Exceeded monthly retention (>12 months old)'
//     },
//     // ... more deleted backups
//   ],
//   duration: 1234
// }
```

#### Example 3: Custom Retention Policy

```typescript
// Keep more backups (longer retention)
const result = await cleanup_old_backups({
  policy: {
    dailyRetention: 14,   // 2 weeks of daily backups
    weeklyRetention: 8,   // 2 months of weekly backups
    monthlyRetention: 24  // 2 years of monthly backups
  },
  force: true
});
```

#### Example 4: Aggressive Cleanup (Low Storage)

```typescript
// Keep fewer backups (save storage)
const result = await cleanup_old_backups({
  policy: {
    dailyRetention: 3,    // Only 3 days
    weeklyRetention: 2,   // Only 2 weeks
    monthlyRetention: 6   // Only 6 months
  },
  dryRun: true  // Preview first
});
```

### Retention Algorithm

1. **Categorize backups** by age (daily/weekly/monthly/expired)
2. **Select backups to keep**:
   - Last N daily backups
   - Last backup from each of last N weeks (Sunday preferred)
   - Last backup from each of last N months (last Sunday of month preferred)
3. **Prefer full backups** - Always keep at least 1 full backup per retention period
4. **Delete expired backups** - Backups not selected for retention

---

## 8. export_backup_config

Export backup configuration for migration or documentation.

### Syntax

```typescript
export_backup_config(params: ExportConfigParams): Promise<ExportConfigResult>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | `'json' \| 'yaml' \| 'markdown'` | ✅ Yes | - | Export format |
| `includeSecrets` | `boolean` | ❌ No | `false` | Include secret paths (not values) |
| `includeSchedules` | `boolean` | ❌ No | `true` | Include backup schedules |
| `includeHistory` | `boolean` | ❌ No | `false` | Include backup history |
| `outputPath` | `string` | ❌ No | `undefined` | Custom output path |

### Returns

```typescript
interface ExportConfigResult {
  success: boolean;
  format: string;
  config: BackupConfig;
  exportedTo?: string;
  warnings: string[];
}
```

### Examples

#### Example 1: Export to JSON

```typescript
const result = await export_backup_config({
  format: 'json',
  includeSchedules: true,
  includeHistory: false,
  outputPath: '/Users/user/backup-config.json'
});

console.log(result);
// {
//   success: true,
//   format: 'json',
//   config: {
//     backupSources: [
//       '/Users/user/workspace-brain/',
//       '/Users/user/operations-workspace/checklist-registry.json'
//     ],
//     excludePatterns: [
//       '**/node_modules/**',
//       '**/.git/**'
//     ],
//     compression: true,
//     retentionPolicy: {
//       dailyRetention: 7,
//       weeklyRetention: 4,
//       monthlyRetention: 12
//     },
//     schedules: [
//       {
//         name: 'daily-workspace-brain',
//         cronExpression: '0 2 * * *',
//         backupConfig: { ... }
//       }
//     ]
//   },
//   exportedTo: '/Users/user/backup-config.json',
//   warnings: []
// }
```

#### Example 2: Export to Markdown Documentation

```typescript
const result = await export_backup_config({
  format: 'markdown',
  includeSchedules: true,
  includeHistory: true,
  outputPath: '/Users/user/backup-dr-mcp-project/03-resources-docs-assets-tools/BACKUP-CONFIG.md'
});

// Creates formatted markdown documentation:
// # Backup Configuration
//
// ## Backup Sources
// - `/Users/user/workspace-brain/`
// - `/Users/user/operations-workspace/checklist-registry.json`
//
// ## Schedules
// - **daily-workspace-brain**: 2 AM daily (incremental)
// - **weekly-full-backup**: 3 AM Sunday (full)
//
// ...
```

#### Example 3: Export to YAML

```typescript
const result = await export_backup_config({
  format: 'yaml',
  includeSchedules: true,
  outputPath: '/Users/user/backup-config.yaml'
});

// Creates YAML configuration:
// backupSources:
//   - /Users/user/workspace-brain/
//   - /Users/user/operations-workspace/checklist-registry.json
// excludePatterns:
//   - '**/node_modules/**'
// compression: true
// retentionPolicy:
//   dailyRetention: 7
//   weeklyRetention: 4
//   monthlyRetention: 12
```

---

## Complete Workflow Example

### Scenario: Set Up Automated Backup System

```typescript
// Step 1: Create initial full backup
const fullBackup = await create_backup({
  sources: [
    '/Users/user/workspace-brain/',
    '/Users/user/operations-workspace/checklist-registry.json',
    '/Users/user/.smart-file-organizer-rules.json'
  ],
  type: 'full',
  label: 'initial-full-backup',
  compression: true,
  verify: true
});

console.log(`Initial backup created: ${fullBackup.backupId}`);

// Step 2: Verify backup integrity
const verification = await verify_backup({
  backupId: fullBackup.backupId,
  deep: true
});

if (!verification.success) {
  console.error('Backup verification failed!', verification.issues);
  return;
}

// Step 3: Schedule daily incremental backups
const dailySchedule = await schedule_backup({
  action: 'create',
  schedule: {
    name: 'daily-incremental-backup',
    cronExpression: '0 2 * * *',  // 2 AM daily
    backupConfig: {
      sources: ['/Users/user/workspace-brain/'],
      type: 'incremental',
      label: 'auto-daily',
      compression: true
    },
    enabled: true
  }
});

// Step 4: Schedule weekly full backups
const weeklySchedule = await schedule_backup({
  action: 'create',
  schedule: {
    name: 'weekly-full-backup',
    cronExpression: '0 3 * * 0',  // 3 AM Sunday
    backupConfig: {
      sources: [
        '/Users/user/workspace-brain/',
        '/Users/user/operations-workspace/checklist-registry.json'
      ],
      type: 'full',
      label: 'auto-weekly-full',
      compression: true
    },
    enabled: true
  }
});

// Step 5: Set up automatic cleanup
const cleanupSchedule = await schedule_backup({
  action: 'create',
  schedule: {
    name: 'monthly-cleanup',
    cronExpression: '0 4 1 * *',  // 4 AM on 1st of month
    backupConfig: {
      sources: [],  // Cleanup doesn't need sources
      type: 'full',  // Dummy value
      label: 'auto-cleanup'
    },
    enabled: true
  }
});

// Step 6: Check status
const status = await get_backup_status({ includeLogs: true });

console.log('Backup system configured successfully!');
console.log(`System health: ${status.status.systemHealth}`);
console.log(`Next backup: ${status.status.nextScheduledBackup.scheduledTime}`);

// Step 7: Export configuration for documentation
await export_backup_config({
  format: 'markdown',
  includeSchedules: true,
  outputPath: '/Users/user/backup-dr-mcp-project/BACKUP-CONFIG.md'
});
```

---

## Error Reference

### Common Error Codes

| Error Code | HTTP Analogy | Description | Recovery |
|------------|--------------|-------------|----------|
| `SOURCE_NOT_FOUND` | 404 | Source path doesn't exist | Verify path |
| `BACKUP_NOT_FOUND` | 404 | Invalid backup ID | List backups |
| `PERMISSION_DENIED` | 403 | No file access | Check permissions |
| `DISK_FULL` | 507 | Insufficient storage | Free space |
| `BACKUP_CORRUPTED` | 500 | Checksum failure | Try repair or different backup |
| `PHI_DETECTED` | 422 | PHI in backup source | Review excluded files |
| `INVALID_SCHEDULE` | 400 | Invalid cron expression | Fix cron syntax |
| `SCHEDULE_CONFLICT` | 409 | Schedule name exists | Use different name |

### Error Handling Pattern

```typescript
try {
  const result = await create_backup({ ... });
  console.log('Success:', result);
} catch (error) {
  console.error('Error code:', error.code);
  console.error('Message:', error.message);
  console.error('Recovery:', error.recovery);

  // Handle specific errors
  switch (error.code) {
    case 'DISK_FULL':
      // Cleanup old backups
      await cleanup_old_backups({ force: true });
      // Retry
      break;

    case 'PHI_DETECTED':
      // Review excluded files
      console.log('Excluded files:', error.details.excludedFiles);
      break;

    default:
      // Generic error handling
      throw error;
  }
}
```

---

## Performance Guidelines

### Backup Performance

- **Incremental backup:** <30 seconds for ~50MB changed data
- **Full backup:** <2 minutes for ~500MB total data
- **Compression:** ~70 MB/s (50MB in <1 second)
- **Verification (quick):** ~100ms (manifest checksum only)
- **Verification (deep):** ~2-5 seconds (all file checksums)

### Optimization Tips

1. **Use incremental backups daily** - Much faster than full backups
2. **Schedule during low-usage hours** - Minimize performance impact
3. **Exclude large binary files** - Focus on critical data
4. **Use quick verification regularly** - Deep verification weekly
5. **Enable compression** - 60-70% size reduction with minimal CPU

---

## Best Practices

1. **Always dry-run restores** - Preview changes before executing
2. **Enable pre-restore backups** - Safety net for overwrites
3. **Verify backups regularly** - Catch corruption early
4. **Use labels consistently** - Easier backup organization
5. **Monitor backup status** - Catch failures promptly
6. **Test restores periodically** - Ensure backups are actually restorable
7. **Document backup sources** - Export config for documentation
8. **Review retention policy** - Adjust based on storage availability
9. **Exclude unnecessary files** - Reduce backup size and time
10. **Schedule backups during off-hours** - Minimize system impact

---

**Status:** Ready for Implementation
**Next Step:** Begin Phase 1 implementation (core backup tools)
