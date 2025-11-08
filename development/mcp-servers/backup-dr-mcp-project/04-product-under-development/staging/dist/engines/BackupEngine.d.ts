/**
 * BackupEngine - Core backup orchestration logic
 */
import { CreateBackupParams, CreateBackupResult } from '../types/backup.types.js';
export declare class BackupEngine {
    private compressionEngine;
    private integrityEngine;
    private storage;
    private index;
    constructor(compressionLevel?: number, backupDirectory?: string);
    /**
     * Create a new backup
     */
    createBackup(params: CreateBackupParams): Promise<CreateBackupResult>;
    /**
     * Backup a single source (file or directory)
     */
    private backupSource;
    /**
     * Backup a directory recursively
     */
    private backupDirectory;
    /**
     * Backup a single file
     */
    private backupFile;
    /**
     * Check if path should be excluded
     */
    private shouldExclude;
    /**
     * Get timestamp of last backup containing these sources
     */
    private getLastBackupTimestamp;
    /**
     * Quick verify backup (manifest checksum only)
     */
    private quickVerifyBackup;
}
//# sourceMappingURL=BackupEngine.d.ts.map