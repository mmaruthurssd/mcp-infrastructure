/**
 * BackupScheduler - Manages scheduled backups with node-cron
 */
import { BackupSchedule, ScheduleBackupParams, ScheduleBackupResult } from '../types/backup.types.js';
export declare class BackupScheduler {
    private backupEngine;
    private schedulePath;
    private registry;
    private activeCronJobs;
    constructor(compressionLevel?: number, backupDirectory?: string);
    /**
     * Initialize scheduler (load schedules and start cron jobs)
     */
    initialize(): Promise<void>;
    /**
     * Create a new backup schedule
     */
    createSchedule(params: ScheduleBackupParams): Promise<ScheduleBackupResult>;
    /**
     * List all schedules
     */
    listSchedules(filter?: {
        enabled?: boolean;
    }): Promise<BackupSchedule[]>;
    /**
     * Get a specific schedule
     */
    getSchedule(scheduleId: string): Promise<BackupSchedule | null>;
    /**
     * Update a schedule
     */
    updateSchedule(scheduleId: string, updates: Partial<Omit<ScheduleBackupParams, 'scheduleId'>>): Promise<ScheduleBackupResult>;
    /**
     * Delete a schedule
     */
    deleteSchedule(scheduleId: string): Promise<void>;
    /**
     * Enable a schedule
     */
    enableSchedule(scheduleId: string): Promise<void>;
    /**
     * Disable a schedule
     */
    disableSchedule(scheduleId: string): Promise<void>;
    /**
     * Start a specific schedule's cron job
     */
    private startSchedule;
    /**
     * Stop a specific schedule's cron job
     */
    private stopSchedule;
    /**
     * Start all enabled schedules
     */
    private startAllSchedules;
    /**
     * Stop all schedules
     */
    stopAllSchedules(): Promise<void>;
    /**
     * Execute a scheduled backup
     */
    private executeScheduledBackup;
    /**
     * Manually trigger a scheduled backup
     */
    triggerSchedule(scheduleId: string): Promise<void>;
    /**
     * Get next run time for a cron expression
     */
    private getNextRunTime;
    /**
     * Create empty registry
     */
    private createEmptyRegistry;
    /**
     * Load schedule registry from disk
     */
    private loadRegistry;
    /**
     * Save schedule registry to disk
     */
    private saveRegistry;
    /**
     * Get scheduler status
     */
    getStatus(): Promise<{
        totalSchedules: number;
        enabledSchedules: number;
        disabledSchedules: number;
        activeJobs: number;
        schedules: BackupSchedule[];
    }>;
}
//# sourceMappingURL=BackupScheduler.d.ts.map