/**
 * BackupStorage - File system abstraction for backup storage
 */
import { BackupMetadata, BackupFileEntry } from '../types/backup.types.js';
export declare class BackupStorage {
    private backupDirectory;
    constructor(backupDirectory?: string);
    /**
     * Initialize backup storage directory
     */
    initialize(): Promise<void>;
    /**
     * Get path to backup directory
     */
    getBackupPath(backupId: string): string;
    /**
     * Get path to backup data directory
     */
    getDataPath(backupId: string): string;
    /**
     * Get path to backup metadata file
     */
    getMetadataPath(backupId: string): string;
    /**
     * Get path to backup manifest file
     */
    getManifestPath(backupId: string): string;
    /**
     * Create backup directory structure
     */
    createBackupDirectory(backupId: string): Promise<string>;
    /**
     * Save backup metadata (atomic operation)
     */
    saveMetadata(backupId: string, metadata: BackupMetadata): Promise<void>;
    /**
     * Load backup metadata
     */
    loadMetadata(backupId: string): Promise<BackupMetadata>;
    /**
     * Save backup manifest (atomic operation)
     */
    saveManifest(backupId: string, files: BackupFileEntry[]): Promise<void>;
    /**
     * Load backup manifest
     */
    loadManifest(backupId: string): Promise<BackupFileEntry[]>;
    /**
     * Check if backup exists
     */
    backupExists(backupId: string): Promise<boolean>;
    /**
     * Delete backup directory
     */
    deleteBackup(backupId: string): Promise<void>;
    /**
     * Get relative path within backup data directory
     */
    getRelativeDataPath(backupId: string, absolutePath: string): string;
    /**
     * Ensure directory exists for a file path
     */
    ensureDirectoryExists(filePath: string): Promise<void>;
    /**
     * Get file statistics
     */
    getFileStats(filePath: string): Promise<{
        size: number;
        mtime: Date;
    }>;
}
//# sourceMappingURL=BackupStorage.d.ts.map