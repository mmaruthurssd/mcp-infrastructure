/**
 * BackupStorage - File system abstraction for backup storage
 */
import { mkdir, writeFile, readFile, copyFile, rm, access, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
export class BackupStorage {
    backupDirectory;
    constructor(backupDirectory = '~/.backup-dr/backups') {
        // Resolve ~ to actual home directory
        this.backupDirectory = backupDirectory.startsWith('~')
            ? join(homedir(), backupDirectory.slice(2))
            : backupDirectory;
    }
    /**
     * Initialize backup storage directory
     */
    async initialize() {
        await mkdir(this.backupDirectory, { recursive: true });
    }
    /**
     * Get path to backup directory
     */
    getBackupPath(backupId) {
        return join(this.backupDirectory, backupId);
    }
    /**
     * Get path to backup data directory
     */
    getDataPath(backupId) {
        return join(this.getBackupPath(backupId), 'data');
    }
    /**
     * Get path to backup metadata file
     */
    getMetadataPath(backupId) {
        return join(this.getBackupPath(backupId), 'backup-metadata.json');
    }
    /**
     * Get path to backup manifest file
     */
    getManifestPath(backupId) {
        return join(this.getBackupPath(backupId), 'manifest.json');
    }
    /**
     * Create backup directory structure
     */
    async createBackupDirectory(backupId) {
        const backupPath = this.getBackupPath(backupId);
        const dataPath = this.getDataPath(backupId);
        await mkdir(backupPath, { recursive: true });
        await mkdir(dataPath, { recursive: true });
        return backupPath;
    }
    /**
     * Save backup metadata (atomic operation)
     */
    async saveMetadata(backupId, metadata) {
        const metadataPath = this.getMetadataPath(backupId);
        const tempPath = `${metadataPath}.tmp`;
        // Write to temp file first
        await writeFile(tempPath, JSON.stringify(metadata, null, 2), 'utf-8');
        // Atomic rename
        await copyFile(tempPath, metadataPath);
        await rm(tempPath);
    }
    /**
     * Load backup metadata
     */
    async loadMetadata(backupId) {
        const metadataPath = this.getMetadataPath(backupId);
        const content = await readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    /**
     * Save backup manifest (atomic operation)
     */
    async saveManifest(backupId, files) {
        const manifestPath = this.getManifestPath(backupId);
        const tempPath = `${manifestPath}.tmp`;
        // Write to temp file first
        await writeFile(tempPath, JSON.stringify(files, null, 2), 'utf-8');
        // Atomic rename
        await copyFile(tempPath, manifestPath);
        await rm(tempPath);
    }
    /**
     * Load backup manifest
     */
    async loadManifest(backupId) {
        const manifestPath = this.getManifestPath(backupId);
        const content = await readFile(manifestPath, 'utf-8');
        return JSON.parse(content);
    }
    /**
     * Check if backup exists
     */
    async backupExists(backupId) {
        try {
            await access(this.getBackupPath(backupId));
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Delete backup directory
     */
    async deleteBackup(backupId) {
        const backupPath = this.getBackupPath(backupId);
        await rm(backupPath, { recursive: true, force: true });
    }
    /**
     * Get relative path within backup data directory
     */
    getRelativeDataPath(backupId, absolutePath) {
        const dataPath = this.getDataPath(backupId);
        return join(dataPath, absolutePath.replace(/^\//, '').replace(/^~/, 'home'));
    }
    /**
     * Ensure directory exists for a file path
     */
    async ensureDirectoryExists(filePath) {
        const dir = dirname(filePath);
        await mkdir(dir, { recursive: true });
    }
    /**
     * Get file statistics
     */
    async getFileStats(filePath) {
        const stats = await stat(filePath);
        return {
            size: stats.size,
            mtime: stats.mtime
        };
    }
}
//# sourceMappingURL=BackupStorage.js.map