/**
 * export_backup_config tool - Export backup configuration for migration or documentation
 */
import { BackupScheduler } from '../engines/BackupScheduler.js';
import { BackupIndex } from '../storage/BackupIndex.js';
import { writeFile } from 'fs/promises';
import { DEFAULT_CONFIG } from '../types/config.types.js';
export class ExportBackupConfigTool {
    scheduler;
    index;
    constructor(compressionLevel = 6, backupDirectory = '~/.backup-dr/backups') {
        this.scheduler = new BackupScheduler(compressionLevel, backupDirectory);
        this.index = new BackupIndex(backupDirectory);
    }
    async execute(params = {}) {
        // Build base config from defaults
        const config = {
            version: DEFAULT_CONFIG.version,
            backupDirectory: DEFAULT_CONFIG.backupDirectory,
            compression: {
                enabled: DEFAULT_CONFIG.compression.enabled,
                level: DEFAULT_CONFIG.compression.level,
                algorithm: DEFAULT_CONFIG.compression.algorithm
            },
            retention: {
                dailyRetention: DEFAULT_CONFIG.retention.dailyRetention,
                weeklyRetention: DEFAULT_CONFIG.retention.weeklyRetention,
                monthlyRetention: DEFAULT_CONFIG.retention.monthlyRetention
            }
        };
        // Include schedules if requested
        if (params.includeSchedules) {
            await this.scheduler.initialize();
            const schedules = await this.scheduler.listSchedules();
            config.schedules = schedules.map(s => ({
                scheduleId: s.scheduleId,
                cronExpression: s.cronExpression,
                sources: s.sources,
                type: s.type,
                enabled: s.enabled
            }));
        }
        // Include statistics if requested
        if (params.includeStatistics) {
            const statistics = await this.index.getStatistics();
            config.statistics = statistics;
        }
        // Export to file if output path provided
        let exportedTo;
        if (params.outputPath) {
            const content = params.format === 'yaml'
                ? this.toYAML(config)
                : JSON.stringify(config, null, 2);
            await writeFile(params.outputPath, content, 'utf-8');
            exportedTo = params.outputPath;
        }
        return {
            success: true,
            config,
            exportedTo
        };
    }
    /**
     * Convert config to YAML format (simple implementation)
     */
    toYAML(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
                continue;
            }
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                for (const item of value) {
                    if (typeof item === 'object') {
                        yaml += `${spaces}  -\n`;
                        yaml += this.toYAML(item, indent + 4);
                    }
                    else {
                        yaml += `${spaces}  - ${item}\n`;
                    }
                }
            }
            else if (typeof value === 'object') {
                yaml += `${spaces}${key}:\n`;
                yaml += this.toYAML(value, indent + 2);
            }
            else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
        return yaml;
    }
}
//# sourceMappingURL=exportBackupConfig.js.map