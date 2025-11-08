/**
 * export_backup_config tool - Export backup configuration for migration or documentation
 */

import { BackupScheduler } from '../engines/BackupScheduler.js';
import { BackupIndex } from '../storage/BackupIndex.js';
import { writeFile } from 'fs/promises';
import { DEFAULT_CONFIG } from '../types/config.types.js';

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

export class ExportBackupConfigTool {
  private scheduler: BackupScheduler;
  private index: BackupIndex;

  constructor(compressionLevel: number = 6, backupDirectory: string = '~/.backup-dr/backups') {
    this.scheduler = new BackupScheduler(compressionLevel, backupDirectory);
    this.index = new BackupIndex(backupDirectory);
  }

  async execute(params: ExportBackupConfigToolParams = {}): Promise<ExportBackupConfigToolResult> {
    // Build base config from defaults
    const config: ExportBackupConfigToolResult['config'] = {
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
    let exportedTo: string | undefined;
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
  private toYAML(obj: any, indent: number = 0): string {
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
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.toYAML(value, indent + 2);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}
