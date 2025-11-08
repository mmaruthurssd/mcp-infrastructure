/**
 * cleanup_old_backups tool - Apply retention policy and cleanup old backups
 */
import { RetentionEngine } from '../engines/RetentionEngine.js';
export class CleanupOldBackupsTool {
    retentionEngine;
    constructor(retentionPolicy = {
        dailyRetention: 7,
        weeklyRetention: 4,
        monthlyRetention: 12
    }, backupDirectory = '~/.backup-dr/backups') {
        this.retentionEngine = new RetentionEngine(retentionPolicy, backupDirectory);
    }
    async execute(params = {}) {
        // Use custom retention policy if provided
        if (params.retentionPolicy) {
            const customPolicy = {
                dailyRetention: params.retentionPolicy.dailyRetention ?? 7,
                weeklyRetention: params.retentionPolicy.weeklyRetention ?? 4,
                monthlyRetention: params.retentionPolicy.monthlyRetention ?? 12
            };
            this.retentionEngine = new RetentionEngine(customPolicy);
        }
        // Apply retention policy
        const result = await this.retentionEngine.applyRetentionPolicy(params.dryRun ?? false);
        // Format response
        const formattedResult = {
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
//# sourceMappingURL=cleanupOldBackups.js.map