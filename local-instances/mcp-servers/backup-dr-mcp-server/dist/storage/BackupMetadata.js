/**
 * BackupMetadata - Helper methods for backup metadata management
 */
export class BackupMetadataHelper {
    /**
     * Create new backup metadata
     */
    static createMetadata(params) {
        return {
            backupId: params.backupId,
            version: '1.0.0',
            type: params.type,
            created: new Date().toISOString(),
            sources: params.sources,
            label: params.label,
            fileCount: 0,
            totalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            checksum: '',
            files: [],
            config: {
                compression: params.compression,
                compressionLevel: params.compressionLevel,
                excludePatterns: params.excludePatterns
            },
            status: 'success'
        };
    }
    /**
     * Add file entry to metadata
     */
    static addFileEntry(metadata, entry) {
        metadata.files.push(entry);
        metadata.fileCount = metadata.files.length;
        metadata.totalSize += entry.size;
        metadata.compressedSize += entry.compressedSize || entry.size;
    }
    /**
     * Finalize metadata (calculate final statistics)
     */
    static finalizeMetadata(metadata, manifestChecksum) {
        metadata.checksum = manifestChecksum;
        if (metadata.totalSize > 0) {
            metadata.compressionRatio = Math.round(((metadata.totalSize - metadata.compressedSize) / metadata.totalSize) * 100);
        }
        else {
            metadata.compressionRatio = 0;
        }
        // Set status based on errors
        if (metadata.errors && metadata.errors.length > 0) {
            const hasErrors = metadata.errors.some(e => e.severity === 'error');
            metadata.status = hasErrors ? 'partial' : 'success';
        }
        else {
            metadata.status = 'success';
        }
    }
    /**
     * Add error to metadata
     */
    static addError(metadata, file, error, severity = 'error') {
        if (!metadata.errors) {
            metadata.errors = [];
        }
        metadata.errors.push({ file, error, severity });
    }
    /**
     * Convert metadata to index entry
     */
    static toIndexEntry(metadata) {
        return {
            backupId: metadata.backupId,
            type: metadata.type,
            created: metadata.created,
            sources: metadata.sources,
            fileCount: metadata.fileCount,
            totalSize: metadata.totalSize,
            compressedSize: metadata.compressedSize,
            compressionRatio: metadata.compressionRatio,
            label: metadata.label,
            status: metadata.status
        };
    }
    /**
     * Generate backup ID from timestamp
     */
    static generateBackupId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
    }
    /**
     * Validate metadata structure
     */
    static validateMetadata(metadata) {
        return (typeof metadata === 'object' &&
            typeof metadata.backupId === 'string' &&
            typeof metadata.version === 'string' &&
            (metadata.type === 'full' || metadata.type === 'incremental') &&
            typeof metadata.created === 'string' &&
            Array.isArray(metadata.sources) &&
            typeof metadata.fileCount === 'number' &&
            typeof metadata.totalSize === 'number' &&
            typeof metadata.compressedSize === 'number' &&
            typeof metadata.compressionRatio === 'number' &&
            typeof metadata.checksum === 'string' &&
            Array.isArray(metadata.files) &&
            typeof metadata.config === 'object');
    }
}
//# sourceMappingURL=BackupMetadata.js.map