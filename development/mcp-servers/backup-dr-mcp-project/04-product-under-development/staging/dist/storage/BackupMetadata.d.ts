/**
 * BackupMetadata - Helper methods for backup metadata management
 */
import { BackupMetadata, BackupFileEntry, BackupType } from '../types/backup.types.js';
export declare class BackupMetadataHelper {
    /**
     * Create new backup metadata
     */
    static createMetadata(params: {
        backupId: string;
        type: BackupType;
        sources: string[];
        label?: string;
        compression: boolean;
        compressionLevel: number;
        excludePatterns: string[];
    }): BackupMetadata;
    /**
     * Add file entry to metadata
     */
    static addFileEntry(metadata: BackupMetadata, entry: BackupFileEntry): void;
    /**
     * Finalize metadata (calculate final statistics)
     */
    static finalizeMetadata(metadata: BackupMetadata, manifestChecksum: string): void;
    /**
     * Add error to metadata
     */
    static addError(metadata: BackupMetadata, file: string, error: string, severity?: 'error' | 'warning'): void;
    /**
     * Convert metadata to index entry
     */
    static toIndexEntry(metadata: BackupMetadata): import('../types/backup.types.js').BackupIndexEntry;
    /**
     * Generate backup ID from timestamp
     */
    static generateBackupId(): string;
    /**
     * Validate metadata structure
     */
    static validateMetadata(metadata: any): metadata is BackupMetadata;
}
//# sourceMappingURL=BackupMetadata.d.ts.map