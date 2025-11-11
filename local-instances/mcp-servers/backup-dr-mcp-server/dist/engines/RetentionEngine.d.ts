/**
 * RetentionEngine - Manages backup retention policies and cleanup
 */
import { RetentionPolicy, BackupIndexEntry, CleanupOldBackupsResult } from '../types/backup.types.js';
export declare class RetentionEngine {
    private storage;
    private index;
    private policy;
    constructor(policy: RetentionPolicy, backupDirectory?: string);
    /**
     * Apply retention policy and cleanup old backups
     */
    applyRetentionPolicy(dryRun?: boolean): Promise<CleanupOldBackupsResult>;
    /**
     * Categorize backups by age
     */
    private categorizeBackups;
    /**
     * Select backups to keep based on retention policy
     */
    private selectBackupsToKeep;
    /**
     * Select weekly backups (one per week)
     */
    private selectWeeklyBackups;
    /**
     * Select monthly backups (one per month)
     */
    private selectMonthlyBackups;
    /**
     * Group backups by week number
     */
    private groupBackupsByWeek;
    /**
     * Group backups by month
     */
    private groupBackupsByMonth;
    /**
     * Get week number for a date
     */
    private getWeekNumber;
    /**
     * Prefer full backup over incremental
     */
    private preferFullBackup;
    /**
     * Get backup category for display
     */
    private getBackupCategory;
    /**
     * Delete a backup (files and index entry)
     */
    private deleteBackup;
    /**
     * Get retention policy preview (what would be kept/deleted)
     */
    getRetentionPreview(): Promise<{
        daily: BackupIndexEntry[];
        weekly: BackupIndexEntry[];
        monthly: BackupIndexEntry[];
        expired: BackupIndexEntry[];
        toKeep: BackupIndexEntry[];
        toDelete: BackupIndexEntry[];
    }>;
}
//# sourceMappingURL=RetentionEngine.d.ts.map