/**
 * cleanup_old_backups tool - Apply retention policy and cleanup old backups
 */

import { RetentionEngine } from '../engines/RetentionEngine.js';
import { RetentionPolicy, CleanupOldBackupsResult } from '../types/backup.types.js';

export interface CleanupOldBackupsToolParams {
  dryRun?: boolean;
  retentionPolicy?: {
    dailyRetention?: number;
    weeklyRetention?: number;
    monthlyRetention?: number;
  };
}

export interface CleanupOldBackupsToolResult {
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

export class CleanupOldBackupsTool {
  private retentionEngine: RetentionEngine;

  constructor(
    retentionPolicy: RetentionPolicy = {
      dailyRetention: 7,
      weeklyRetention: 4,
      monthlyRetention: 12
    },
    backupDirectory: string = '~/.backup-dr/backups'
  ) {
    this.retentionEngine = new RetentionEngine(retentionPolicy, backupDirectory);
  }

  async execute(params: CleanupOldBackupsToolParams = {}): Promise<CleanupOldBackupsToolResult> {
    // Use custom retention policy if provided
    if (params.retentionPolicy) {
      const customPolicy: RetentionPolicy = {
        dailyRetention: params.retentionPolicy.dailyRetention ?? 7,
        weeklyRetention: params.retentionPolicy.weeklyRetention ?? 4,
        monthlyRetention: params.retentionPolicy.monthlyRetention ?? 12
      };

      this.retentionEngine = new RetentionEngine(customPolicy);
    }

    // Apply retention policy
    const result: CleanupOldBackupsResult = await this.retentionEngine.applyRetentionPolicy(
      params.dryRun ?? false
    );

    // Format response
    const formattedResult: CleanupOldBackupsToolResult = {
      success: result.success,
      backupsDeleted: result.backupsDeleted,
      backupsKept: result.backupsKept,
      spaceReclaimed: result.spaceReclaimed,
      duration: result.duration,
      dryRun: result.dryRun
    };

    if (result.dryRun && result.preview) {
      formattedResult.preview = result.preview;
    }

    if (!result.dryRun && result.deletedBackupIds) {
      formattedResult.deletedBackupIds = result.deletedBackupIds;
    }

    return formattedResult;
  }
}
