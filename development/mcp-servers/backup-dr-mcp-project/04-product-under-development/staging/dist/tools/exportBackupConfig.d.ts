/**
 * export_backup_config tool - Export backup configuration for migration or documentation
 */
export interface ExportBackupConfigToolParams {
    includeSchedules?: boolean;
    includeStatistics?: boolean;
    outputPath?: string;
    format?: 'json' | 'yaml';
}
export interface ExportBackupConfigToolResult {
    success: boolean;
    config: {
        version: string;
        backupDirectory: string;
        compression: {
            enabled: boolean;
            level: number;
            algorithm: string;
        };
        retention: {
            dailyRetention: number;
            weeklyRetention: number;
            monthlyRetention: number;
        };
        schedules?: Array<{
            scheduleId: string;
            cronExpression: string;
            sources: string[];
            type: string;
            enabled: boolean;
        }>;
        statistics?: {
            totalBackups: number;
            totalSize: number;
            totalCompressedSize: number;
            fullBackups: number;
            incrementalBackups: number;
        };
    };
    exportedTo?: string;
}
export declare class ExportBackupConfigTool {
    private scheduler;
    private index;
    constructor(compressionLevel?: number, backupDirectory?: string);
    execute(params?: ExportBackupConfigToolParams): Promise<ExportBackupConfigToolResult>;
    /**
     * Convert config to YAML format (simple implementation)
     */
    private toYAML;
}
//# sourceMappingURL=exportBackupConfig.d.ts.map