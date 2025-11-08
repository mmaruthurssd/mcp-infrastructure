/**
 * get_backup_status tool - Get comprehensive backup system status
 */

import { BackupIndex } from '../storage/BackupIndex.js';
import { BackupScheduler } from '../engines/BackupScheduler.js';
import { RetentionEngine } from '../engines/RetentionEngine.js';
import { RetentionPolicy } from '../types/backup.types.js';

export interface GetBackupStatusToolParams {
  includeSchedules?: boolean;
  includeRetention?: boolean;
}

export interface GetBackupStatusToolResult {
  success: boolean;
  statistics: {
    totalBackups: number;
    totalSize: number;
    totalCompressedSize: number;
    fullBackups: number;
    incrementalBackups: number;
    compressionRatio: number;
  };
  recentBackups: Array<{
    backupId: string;
    type: string;
    created: string;
    fileCount: number;
    totalSize: number;
  }>;
  schedules?: {
    totalSchedules: number;
    enabledSchedules: number;
    disabledSchedules: number;
    activeJobs: number;
    nextScheduledBackup?: {
      scheduleId: string;
      nextRun: string;
    };
  };
  retention?: {
    daily: number;
    weekly: number;
    monthly: number;
    expired: number;
    estimatedSpaceReclaimed: number;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  };
}

export class GetBackupStatusTool {
  private index: BackupIndex;
  private scheduler: BackupScheduler;
  private retentionEngine: RetentionEngine;

  constructor(
    compressionLevel: number = 6,
    backupDirectory: string = '~/.backup-dr/backups',
    retentionPolicy: RetentionPolicy = {
      dailyRetention: 7,
      weeklyRetention: 4,
      monthlyRetention: 12
    }
  ) {
    this.index = new BackupIndex(backupDirectory);
    this.scheduler = new BackupScheduler(compressionLevel, backupDirectory);
    this.retentionEngine = new RetentionEngine(retentionPolicy, backupDirectory);
  }

  async execute(params: GetBackupStatusToolParams = {}): Promise<GetBackupStatusToolResult> {
    // Get backup statistics
    const statistics = await this.index.getStatistics();

    // Calculate overall compression ratio
    const compressionRatio = statistics.totalSize > 0
      ? Math.round(((statistics.totalSize - statistics.totalCompressedSize) / statistics.totalSize) * 100)
      : 0;

    // Get recent backups
    const recentBackups = await this.index.queryBackups({
      sort: 'date-desc',
      limit: 5
    });

    // Build result
    const result: GetBackupStatusToolResult = {
      success: true,
      statistics: {
        ...statistics,
        compressionRatio
      },
      recentBackups: recentBackups.map(b => ({
        backupId: b.backupId,
        type: b.type,
        created: b.created,
        fileCount: b.fileCount,
        totalSize: b.totalSize
      })),
      health: {
        status: 'healthy',
        issues: []
      }
    };

    // Include schedule information if requested
    if (params.includeSchedules) {
      await this.scheduler.initialize();
      const schedulerStatus = await this.scheduler.getStatus();

      const enabledSchedules = schedulerStatus.schedules.filter(s => s.enabled);

      if (enabledSchedules.length > 0) {
        // Find next scheduled backup
        const sortedSchedules = enabledSchedules.sort((a, b) => {
          if (!a.nextRun || !b.nextRun) return 0;
          return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime();
        });

        const next = sortedSchedules[0];
        if (next.nextRun) {
          result.schedules = {
            totalSchedules: schedulerStatus.totalSchedules,
            enabledSchedules: schedulerStatus.enabledSchedules,
            disabledSchedules: schedulerStatus.disabledSchedules,
            activeJobs: schedulerStatus.activeJobs,
            nextScheduledBackup: {
              scheduleId: next.scheduleId,
              nextRun: next.nextRun
            }
          };
        }
      } else {
        result.schedules = {
          totalSchedules: schedulerStatus.totalSchedules,
          enabledSchedules: schedulerStatus.enabledSchedules,
          disabledSchedules: schedulerStatus.disabledSchedules,
          activeJobs: schedulerStatus.activeJobs
        };
      }
    }

    // Include retention information if requested
    if (params.includeRetention) {
      const retentionPreview = await this.retentionEngine.getRetentionPreview();

      const estimatedSpaceReclaimed = retentionPreview.toDelete.reduce(
        (sum, b) => sum + b.compressedSize,
        0
      );

      result.retention = {
        daily: retentionPreview.daily.length,
        weekly: retentionPreview.weekly.length,
        monthly: retentionPreview.monthly.length,
        expired: retentionPreview.expired.length,
        estimatedSpaceReclaimed
      };

      // Add health warnings for expired backups
      if (retentionPreview.expired.length > 0) {
        result.health.issues.push(
          `${retentionPreview.expired.length} backup(s) exceeded retention policy`
        );
        result.health.status = 'warning';
      }
    }

    // Check for other health issues
    if (statistics.totalBackups === 0) {
      result.health.issues.push('No backups found');
      result.health.status = 'warning';
    }

    if (params.includeSchedules && result.schedules && result.schedules.enabledSchedules === 0) {
      result.health.issues.push('No active backup schedules');
      result.health.status = 'warning';
    }

    return result;
  }
}
