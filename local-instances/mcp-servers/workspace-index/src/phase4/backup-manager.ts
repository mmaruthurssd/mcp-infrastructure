import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';

/**
 * Backup metadata stored with each backup
 */
interface BackupMetadata {
  timestamp: string;
  operation: string;
  files: string[];
  reason: string;
  createdBy: string;
}

/**
 * Backup result information
 */
export interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
  filesBackedUp?: number;
}

/**
 * Restore result information
 */
export interface RestoreResult {
  success: boolean;
  filesRestored?: number;
  error?: string;
}

/**
 * BackupManager - Handles pre-consolidation backups with retention policy
 *
 * Features:
 * - Pre-consolidation backup to .doc-consolidation-backups/
 * - Timestamped backup directories
 * - 90-day retention policy
 * - Metadata tracking for each backup
 * - Restore capability
 */
export class BackupManager {
  private adapter: ConfigurableWorkspaceAdapter;
  private backupRoot: string;
  private retentionDays: number;

  constructor(adapter: ConfigurableWorkspaceAdapter, retentionDays: number = 90) {
    this.adapter = adapter;
    this.backupRoot = path.join(adapter.getWorkspaceRoot(), '.doc-consolidation-backups');
    this.retentionDays = retentionDays;
  }

  /**
   * Create backup of files before consolidation
   */
  async createBackup(
    files: string[],
    operation: string,
    reason: string
  ): Promise<BackupResult> {
    try {
      // Create backup directory with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupRoot, timestamp);

      await fs.mkdir(backupDir, { recursive: true });

      console.error(`[BackupManager] Creating backup in ${backupDir}...`);

      // Copy each file to backup directory, preserving relative structure
      let filesBackedUp = 0;
      const workspaceRoot = this.adapter.getWorkspaceRoot();

      for (const file of files) {
        try {
          // Handle both absolute and relative paths
          const absolutePath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
          const relativePath = this.adapter.getRelativePath(absolutePath);

          // Create backup path preserving directory structure
          const backupFilePath = path.join(backupDir, relativePath);
          const backupFileDir = path.dirname(backupFilePath);

          await fs.mkdir(backupFileDir, { recursive: true });

          // Copy file
          await fs.copyFile(absolutePath, backupFilePath);
          filesBackedUp++;

          console.error(`[BackupManager]   ✓ ${relativePath}`);
        } catch (error) {
          console.error(`[BackupManager]   ✗ Failed to backup ${file}:`, error);
          // Continue with other files
        }
      }

      // Create metadata file
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        operation,
        files: files.map(f => this.adapter.getRelativePath(f)),
        reason,
        createdBy: 'workspace-index-phase4'
      };

      await fs.writeFile(
        path.join(backupDir, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.error(`[BackupManager] Backup complete: ${filesBackedUp} files backed up`);

      return {
        success: true,
        backupPath: backupDir,
        filesBackedUp
      };
    } catch (error) {
      console.error(`[BackupManager] Backup failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Restore files from a backup
   */
  async restoreBackup(backupPath: string): Promise<RestoreResult> {
    try {
      console.error(`[BackupManager] Restoring from ${backupPath}...`);

      // Read metadata
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      let filesRestored = 0;
      const workspaceRoot = this.adapter.getWorkspaceRoot();

      // Restore each file
      for (const relativeFile of metadata.files) {
        try {
          const backupFilePath = path.join(backupPath, relativeFile);
          const targetPath = path.join(workspaceRoot, relativeFile);
          const targetDir = path.dirname(targetPath);

          // Ensure target directory exists
          await fs.mkdir(targetDir, { recursive: true });

          // Restore file
          await fs.copyFile(backupFilePath, targetPath);
          filesRestored++;

          console.error(`[BackupManager]   ✓ Restored ${relativeFile}`);
        } catch (error) {
          console.error(`[BackupManager]   ✗ Failed to restore ${relativeFile}:`, error);
        }
      }

      console.error(`[BackupManager] Restore complete: ${filesRestored} files restored`);

      return {
        success: true,
        filesRestored
      };
    } catch (error) {
      console.error(`[BackupManager] Restore failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * List all backups sorted by timestamp (newest first)
   */
  async listBackups(): Promise<Array<{ path: string; metadata: BackupMetadata }>> {
    try {
      // Ensure backup root exists
      try {
        await fs.access(this.backupRoot);
      } catch {
        return []; // No backups directory yet
      }

      const entries = await fs.readdir(this.backupRoot, { withFileTypes: true });
      const backups: Array<{ path: string; metadata: BackupMetadata }> = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const backupPath = path.join(this.backupRoot, entry.name);
            const metadataPath = path.join(backupPath, 'backup-metadata.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata: BackupMetadata = JSON.parse(metadataContent);

            backups.push({ path: backupPath, metadata });
          } catch {
            // Skip invalid backup directories
            console.error(`[BackupManager] Skipping invalid backup: ${entry.name}`);
          }
        }
      }

      // Sort by timestamp, newest first
      backups.sort((a, b) =>
        new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
      );

      return backups;
    } catch (error) {
      console.error(`[BackupManager] Failed to list backups:`, error);
      return [];
    }
  }

  /**
   * Clean up backups older than retention period
   */
  async cleanupOldBackups(): Promise<{ deleted: number; kept: number }> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deleted = 0;
      let kept = 0;

      for (const backup of backups) {
        const backupDate = new Date(backup.metadata.timestamp);

        if (backupDate < cutoffDate) {
          try {
            await fs.rm(backup.path, { recursive: true, force: true });
            deleted++;
            console.error(`[BackupManager] Deleted old backup: ${path.basename(backup.path)}`);
          } catch (error) {
            console.error(`[BackupManager] Failed to delete backup ${backup.path}:`, error);
          }
        } else {
          kept++;
        }
      }

      console.error(`[BackupManager] Cleanup complete: ${deleted} deleted, ${kept} kept`);

      return { deleted, kept };
    } catch (error) {
      console.error(`[BackupManager] Cleanup failed:`, error);
      return { deleted: 0, kept: 0 };
    }
  }

  /**
   * Get backup directory root path
   */
  getBackupRoot(): string {
    return this.backupRoot;
  }

  /**
   * Get retention policy in days
   */
  getRetentionDays(): number {
    return this.retentionDays;
  }
}
