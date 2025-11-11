/**
 * schedule_backup tool - Manage backup schedules (CRUD operations)
 */
import { BackupSchedule } from '../types/backup.types.js';
export interface ScheduleBackupToolParams {
    action: 'create' | 'list' | 'update' | 'delete' | 'enable' | 'disable' | 'trigger';
    scheduleId?: string;
    cronExpression?: string;
    sources?: string[];
    type?: 'full' | 'incremental';
    label?: string;
    compression?: boolean;
    verify?: boolean;
    excludePatterns?: string[];
    enabled?: boolean;
    filter?: {
        enabled?: boolean;
    };
}
export interface ScheduleBackupToolResult {
    success: boolean;
    action: string;
    scheduleId?: string;
    schedule?: BackupSchedule;
    schedules?: BackupSchedule[];
    message?: string;
}
export declare class ScheduleBackupTool {
    private scheduler;
    constructor(compressionLevel?: number, backupDirectory?: string);
    execute(params: ScheduleBackupToolParams): Promise<ScheduleBackupToolResult>;
    private createSchedule;
    private listSchedules;
    private updateSchedule;
    private deleteSchedule;
    private enableSchedule;
    private disableSchedule;
    private triggerSchedule;
}
//# sourceMappingURL=scheduleBackup.d.ts.map