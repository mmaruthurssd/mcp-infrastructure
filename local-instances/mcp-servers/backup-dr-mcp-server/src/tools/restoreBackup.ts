/**
 * restore_backup tool - Restore backup with safety features
 */

import { RestoreEngine } from '../engines/RestoreEngine.js';
import { RestoreBackupParams, RestoreBackupResult } from '../types/backup.types.js';

export interface RestoreBackupToolParams {
  backupId: string;
  destination?: string;
  overwrite?: boolean;
  preBackup?: boolean;
  dryRun?: boolean;
  selective?: string[];
}

export interface RestoreBackupToolResult {
  success: boolean;
  backupId: string;
  operation: 'restore' | 'dry-run';
  changes: {
    filesRestored: number;
    filesSkipped: number;
    bytesRestored: number;
    conflicts: Array<{
      path: string;
      existingModified: string;
      backupModified: string;
      action: 'overwrite' | 'skip';
    }>;
  };
  duration: number;
  preBackupId?: string;
  warnings: string[];
}

export class RestoreBackupTool {
  private restoreEngine: RestoreEngine;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    this.restoreEngine = new RestoreEngine(backupDirectory);
  }

  async execute(params: RestoreBackupToolParams): Promise<RestoreBackupToolResult> {
    // Validate backup ID
    if (!params.backupId) {
      throw new Error('Backup ID is required');
    }

    // Validate overwrite + preBackup combination
    if (params.preBackup && !params.overwrite) {
      throw new Error('Pre-backup safety feature requires overwrite: true');
    }

    // Build restore params
    const restoreParams: RestoreBackupParams = {
      backupId: params.backupId,
      destination: params.destination,
      overwrite: params.overwrite ?? false,
      preBackup: params.preBackup ?? true, // Default to true for safety
      dryRun: params.dryRun ?? false,
      selective: params.selective
    };

    // Execute restore
    const result: RestoreBackupResult = await this.restoreEngine.restoreBackup(restoreParams);

    // Format response
    const warnings: string[] = [...result.warnings];

    if (params.dryRun && result.changes.conflicts.length > 0) {
      warnings.push(
        `Found ${result.changes.conflicts.length} conflicts - use overwrite: true to replace existing files`
      );
    }

    if (result.preBackupId) {
      warnings.push(
        `Pre-restore backup created: ${result.preBackupId} - can be used to rollback if needed`
      );
    }

    return {
      success: result.success,
      backupId: result.backupId,
      operation: result.operation,
      changes: result.changes,
      duration: result.duration,
      preBackupId: result.preBackupId,
      warnings
    };
  }
}
