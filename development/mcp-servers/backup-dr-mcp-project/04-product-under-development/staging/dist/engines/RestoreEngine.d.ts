/**
 * RestoreEngine - Handles backup restoration with dry-run and conflict detection
 */
import { RestoreBackupParams, RestoreBackupResult } from '../types/backup.types.js';
export declare class RestoreEngine {
    private compressionEngine;
    private storage;
    private backupEngine;
    constructor(backupDirectory?: string);
    /**
     * Restore backup
     */
    restoreBackup(params: RestoreBackupParams): Promise<RestoreBackupResult>;
    /**
     * Detect conflicts between backup and existing files
     */
    private detectConflicts;
    /**
     * Perform actual restore operation
     */
    private performRestore;
    /**
     * Create pre-restore safety backup
     */
    private createPreRestoreBackup;
}
//# sourceMappingURL=RestoreEngine.d.ts.map