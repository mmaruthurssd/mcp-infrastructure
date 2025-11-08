/**
 * list_backups tool - Query and filter backups
 */
import { BackupIndex } from '../storage/BackupIndex.js';
export class ListBackupsTool {
    index;
    constructor(backupDirectory = '~/.backup-dr/backups') {
        this.index = new BackupIndex(backupDirectory);
    }
    async execute(params = {}) {
        // Query backups
        const backups = await this.index.queryBackups({
            filter: {
                type: params.type,
                sources: params.sources,
                label: params.label,
                dateRange: params.dateRange
            },
            sort: params.sort || 'date-desc',
            limit: params.limit
        });
        // Get statistics
        const statistics = await this.index.getStatistics();
        return {
            success: true,
            backups: backups.map(b => ({
                backupId: b.backupId,
                type: b.type,
                created: b.created,
                sources: b.sources,
                fileCount: b.fileCount,
                totalSize: b.totalSize,
                compressedSize: b.compressedSize,
                compressionRatio: b.compressionRatio,
                label: b.label,
                status: b.status
            })),
            totalBackups: backups.length,
            statistics
        };
    }
}
//# sourceMappingURL=listBackups.js.map