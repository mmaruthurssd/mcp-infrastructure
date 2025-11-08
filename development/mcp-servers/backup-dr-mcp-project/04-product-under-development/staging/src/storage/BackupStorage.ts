/**
 * BackupStorage - File system abstraction for backup storage
 */

import { mkdir, writeFile, readFile, copyFile, rm, access, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { BackupMetadata, BackupFileEntry } from '../types/backup.types.js';

export class BackupStorage {
  private backupDirectory: string;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    // Resolve ~ to actual home directory
    this.backupDirectory = backupDirectory.startsWith('~')
      ? join(homedir(), backupDirectory.slice(2))
      : backupDirectory;
  }

  /**
   * Initialize backup storage directory
   */
  async initialize(): Promise<void> {
    await mkdir(this.backupDirectory, { recursive: true });
  }

  /**
   * Get path to backup directory
   */
  getBackupPath(backupId: string): string {
    return join(this.backupDirectory, backupId);
  }

  /**
   * Get path to backup data directory
   */
  getDataPath(backupId: string): string {
    return join(this.getBackupPath(backupId), 'data');
  }

  /**
   * Get path to backup metadata file
   */
  getMetadataPath(backupId: string): string {
    return join(this.getBackupPath(backupId), 'backup-metadata.json');
  }

  /**
   * Get path to backup manifest file
   */
  getManifestPath(backupId: string): string {
    return join(this.getBackupPath(backupId), 'manifest.json');
  }

  /**
   * Create backup directory structure
   */
  async createBackupDirectory(backupId: string): Promise<string> {
    const backupPath = this.getBackupPath(backupId);
    const dataPath = this.getDataPath(backupId);

    await mkdir(backupPath, { recursive: true });
    await mkdir(dataPath, { recursive: true });

    return backupPath;
  }

  /**
   * Save backup metadata (atomic operation)
   */
  async saveMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
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
  async loadMetadata(backupId: string): Promise<BackupMetadata> {
    const metadataPath = this.getMetadataPath(backupId);
    const content = await readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save backup manifest (atomic operation)
   */
  async saveManifest(backupId: string, files: BackupFileEntry[]): Promise<void> {
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
  async loadManifest(backupId: string): Promise<BackupFileEntry[]> {
    const manifestPath = this.getManifestPath(backupId);
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Check if backup exists
   */
  async backupExists(backupId: string): Promise<boolean> {
    try {
      await access(this.getBackupPath(backupId));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete backup directory
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = this.getBackupPath(backupId);
    await rm(backupPath, { recursive: true, force: true });
  }

  /**
   * Get relative path within backup data directory
   */
  getRelativeDataPath(backupId: string, absolutePath: string): string {
    const dataPath = this.getDataPath(backupId);
    return join(dataPath, absolutePath.replace(/^\//, '').replace(/^~/, 'home'));
  }

  /**
   * Ensure directory exists for a file path
   */
  async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{ size: number; mtime: Date }> {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime
    };
  }
}
