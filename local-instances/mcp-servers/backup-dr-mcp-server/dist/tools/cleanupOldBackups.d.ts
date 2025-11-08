/**
 * cleanup_old_backups tool - Apply retention policy and cleanup old backups
 */
import { RetentionPolicy } from '../types/backup.types.js';
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
export declare class CleanupOldBackupsTool {
    private retentionEngine;
    constructor(retentionPolicy?: RetentionPolicy, backupDirectory?: string);
    execute(params?: CleanupOldBackupsToolParams): Promise<CleanupOldBackupsToolResult>;
}
//# sourceMappingURL=cleanupOldBackups.d.ts.map