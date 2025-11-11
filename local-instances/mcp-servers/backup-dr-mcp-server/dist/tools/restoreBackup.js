/**
 * restore_backup tool - Restore backup with safety features
 */
import { RestoreEngine } from '../engines/RestoreEngine.js';
export class RestoreBackupTool {
    restoreEngine;
    constructor(backupDirectory = '~/.backup-dr/backups') {
        this.restoreEngine = new RestoreEngine(backupDirectory);
    }
    async execute(params) {
        // Validate backup ID
        if (!params.backupId) {
            throw new Error('Backup ID is required');
        }
        // Validate overwrite + preBackup combination
        if (params.preBackup && !params.overwrite) {
            throw new Error('Pre-backup safety feature requires overwrite: true');
        }
        // Build restore params
        const restoreParams = {
            backupId: params.backupId,
            destination: params.destination,
            overwrite: params.overwrite ?? false,
            preBackup: params.preBackup ?? true, // Default to true for safety
            dryRun: params.dryRun ?? false,
            selective: params.selective
        };
        // Execute restore
        const result = await this.restoreEngine.restoreBackup(restoreParams);
        // Format response
        const warnings = [...result.warnings];
        if (params.dryRun && result.changes.conflicts.length > 0) {
            warnings.push(`Found ${result.changes.conflicts.length} conflicts - use overwrite: true to replace existing files`);
        }
        if (result.preBackupId) {
            warnings.push(`Pre-restore backup created: ${result.preBackupId} - can be used to rollback if needed`);
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
//# sourceMappingURL=restoreBackup.js.map