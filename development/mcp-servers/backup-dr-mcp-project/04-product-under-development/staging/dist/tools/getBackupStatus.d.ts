/**
 * get_backup_status tool - Get comprehensive backup system status
 */
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
export declare class GetBackupStatusTool {
    private index;
    private scheduler;
    private retentionEngine;
    constructor(compressionLevel?: number, backupDirectory?: string, retentionPolicy?: RetentionPolicy);
    execute(params?: GetBackupStatusToolParams): Promise<GetBackupStatusToolResult>;
}
//# sourceMappingURL=getBackupStatus.d.ts.map