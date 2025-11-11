/**
 * Core type definitions for Backup & DR MCP
 */

export type BackupType = 'full' | 'incremental';
export type BackupStatus = 'success' | 'partial' | 'failure';
export type SystemHealth = 'healthy' | 'warning' | 'critical';
export type VerificationSeverity = 'error' | 'warning';
export type VerificationIssueType = 'missing-file' | 'checksum-mismatch' | 'corrupt-metadata';
export type LogLevel = 'info' | 'warning' | 'error';
export type SortOption = 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
export type ScheduleAction = 'create' | 'update' | 'delete' | 'list';
export type ExportFormat = 'json' | 'yaml' | 'markdown';

export interface BackupMetadata {
  backupId: string;
  version: string;
  type: BackupType;
  created: string;
  sources: string[];
  label?: string;
  fileCount: number;
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  checksum: string;
  files: BackupFileEntry[];
  config: BackupConfig;
  status: BackupStatus;
  errors?: BackupError[];
}

export interface BackupFileEntry {
  path: string;
  originalPath: string;
  size: number;
  compressedSize?: number;
  checksum: string;
  modified: string;
  permissions: string;
}

export interface BackupConfig {
  compression: boolean;
  compressionLevel: number;
  excludePatterns: string[];
}

export interface BackupError {
  file: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface BackupStats {
  filesBackedUp: number;
  filesSkipped: number;
  bytesProcessed: number;
  compressionSavings: number;
}

export interface BackupIndexEntry {
  backupId: string;
  type: BackupType;
  created: string;
  sources: string[];
  fileCount: number;
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  label?: string;
  status: BackupStatus;
}

export interface BackupIndex {
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

export interface BackupSchedule {
  scheduleId: string;
  cronExpression: string;
  sources: string[];
  type: BackupType;
  label?: string;
  compression: boolean;
  verify: boolean;
  excludePatterns: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export interface RetentionPolicy {
  dailyRetention: number;
  weeklyRetention: number;
  monthlyRetention: number;
}

export interface RestoreConflict {
  path: string;
  existingModified: string;
  backupModified: string;
  action: 'skip' | 'overwrite';
}

export interface RestoreChanges {
  filesRestored: number;
  filesSkipped: number;
  bytesRestored: number;
  conflicts: RestoreConflict[];
}

export interface VerificationStatus {
  manifestValid: boolean;
  checksumValid: boolean;
  fileCountMatch: boolean;
  deepVerification: boolean;
}

export interface VerificationIssue {
  type: VerificationIssueType;
  file: string;
  expected?: string;
  actual?: string;
  severity: VerificationSeverity;
}

export interface RepairAction {
  action: string;
  result: 'success' | 'failure';
}

export interface StorageStats {
  totalBackups: number;
  totalStorageUsed: number;
  totalStorageUncompressed: number;
  averageCompressionRatio: number;
}

export interface SystemStatus {
  systemHealth: SystemHealth;
  lastBackup: {
    backupId: string;
    type: BackupType;
    created: string;
    status: BackupStatus;
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
    dailyBackups: number;
    weeklyBackups: number;
    monthlyBackups: number;
    expiredBackups: number;
  };
  recentActivity: {
    backupsLast7Days: number;
    backupsLast30Days: number;
    failuresLast7Days: number;
    averageBackupDuration: number;
  };
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  message: string;
}

export interface CleanupAnalysis {
  totalBackups: number;
  backupsToKeep: number;
  backupsToDelete: number;
  spaceToReclaim: number;
}

export interface DeletedBackup {
  backupId: string;
  type: BackupType;
  created: string;
  size: number;
  reason: string;
}

// Tool parameter interfaces
export interface CreateBackupParams {
  sources: string[];
  type: BackupType;
  label?: string;
  compression?: boolean;
  verify?: boolean;
  excludePatterns?: string[];
}

export interface RestoreBackupParams {
  backupId: string;
  destination?: string;
  dryRun?: boolean;
  selective?: string[];
  overwrite?: boolean;
  preBackup?: boolean;
}

export interface ListBackupsParams {
  filter?: {
    type?: BackupType;
    sources?: string[];
    label?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  sort?: SortOption;
  limit?: number;
  includeMetadata?: boolean;
}

export interface VerifyBackupParams {
  backupId: string;
  deep?: boolean;
  repair?: boolean;
}

export interface ScheduleBackupParams {
  scheduleId: string;
  cronExpression: string;
  sources: string[];
  type?: BackupType;
  label?: string;
  compression?: boolean;
  verify?: boolean;
  excludePatterns?: string[];
  enabled?: boolean;
}

export interface GetBackupStatusParams {
  includeLogs?: boolean;
  logLimit?: number;
}

export interface CleanupParams {
  policy?: RetentionPolicy;
  dryRun?: boolean;
  force?: boolean;
}

export interface ExportConfigParams {
  format: ExportFormat;
  includeSecrets?: boolean;
  includeSchedules?: boolean;
  includeHistory?: boolean;
  outputPath?: string;
}

// Tool result interfaces
export interface CreateBackupResult {
  success: boolean;
  backupId: string;
  backupPath: string;
  metadata: BackupMetadata;
  duration: number;
  stats: BackupStats;
}

export interface RestoreBackupResult {
  success: boolean;
  backupId: string;
  operation: 'restore' | 'dry-run';
  changes: RestoreChanges;
  duration: number;
  preBackupId?: string;
  warnings: string[];
}

export interface ListBackupsResult {
  success: boolean;
  backups: BackupIndexEntry[];
  total: number;
  filtered: number;
  storageStats: StorageStats;
}

export interface VerifyBackupResult {
  success: boolean;
  backupId: string;
  verification: VerificationStatus;
  issues: VerificationIssue[];
  repairActions?: RepairAction[];
  duration: number;
}

export interface ScheduleBackupResult {
  success: boolean;
  scheduleId: string;
  schedule: BackupSchedule;
}

export interface BackupStatusResult {
  success: boolean;
  status: SystemStatus;
  warnings: string[];
  logs?: LogEntry[];
}

export interface CleanupResult {
  success: boolean;
  operation: 'cleanup' | 'dry-run';
  policy: RetentionPolicy;
  analysis: CleanupAnalysis;
  deletedBackups?: DeletedBackup[];
  duration: number;
}

export interface ExportConfigResult {
  success: boolean;
  format: string;
  config: any;
  exportedTo?: string;
  warnings: string[];
}

export interface CleanupOldBackupsResult {
  success: boolean;
  backupsDeleted: number;
  backupsKept: number;
  spaceReclaimed: number;
  duration: number;
  dryRun: boolean;
  preview?: {
    toDelete: Array<{
      backupId: string;
      created: string;
      type: string;
      size: number;
    }>;
    toKeep: Array<{
      backupId: string;
      created: string;
      type: string;
      category: 'daily' | 'weekly' | 'monthly' | 'expired';
    }>;
    estimatedSpaceReclaimed: number;
  };
  deletedBackupIds?: string[];
}

// Error interface
export interface BackupDRError {
  code: string;
  message: string;
  details?: any;
  recovery?: string;
}
