/**
 * RestoreEngine - Handles backup restoration with dry-run and conflict detection
 */

import { stat, copyFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { CompressionEngine } from './CompressionEngine.js';
import { BackupStorage } from '../storage/BackupStorage.js';
import { BackupEngine } from './BackupEngine.js';
import {
  RestoreBackupParams,
  RestoreBackupResult,
  RestoreConflict,
  BackupMetadata
} from '../types/backup.types.js';

export class RestoreEngine {
  private compressionEngine: CompressionEngine;
  private storage: BackupStorage;
  private backupEngine: BackupEngine;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    this.compressionEngine = new CompressionEngine();
    this.storage = new BackupStorage(backupDirectory);
    this.backupEngine = new BackupEngine(6, backupDirectory);
  }

  /**
   * Restore backup
   */
  async restoreBackup(params: RestoreBackupParams): Promise<RestoreBackupResult> {
    const startTime = Date.now();

    // Load backup metadata
    const metadata = await this.storage.loadMetadata(params.backupId);

    // Create pre-restore backup if requested and not dry-run
    let preBackupId: string | undefined;
    if (params.preBackup && !params.dryRun && params.overwrite) {
      preBackupId = await this.createPreRestoreBackup(metadata, params.destination);
    }

    // Detect conflicts
    const conflicts = await this.detectConflicts(metadata, params);

    // If dry-run, return preview
    if (params.dryRun) {
      return {
        success: true,
        backupId: params.backupId,
        operation: 'dry-run',
        changes: {
          filesRestored: 0,
          filesSkipped: conflicts.length,
          bytesRestored: 0,
          conflicts
        },
        duration: Date.now() - startTime,
        warnings: conflicts.length > 0 ? ['Found conflicts - use overwrite: true to replace existing files'] : []
      };
    }

    // Restore files
    const changes = await this.performRestore(metadata, params, conflicts);

    const duration = Date.now() - startTime;

    return {
      success: true,
      backupId: params.backupId,
      operation: 'restore',
      changes,
      duration,
      preBackupId,
      warnings: []
    };
  }

  /**
   * Detect conflicts between backup and existing files
   */
  private async detectConflicts(
    metadata: BackupMetadata,
    params: RestoreBackupParams
  ): Promise<RestoreConflict[]> {
    const conflicts: RestoreConflict[] = [];

    for (const fileEntry of metadata.files) {
      // Apply selective filter if provided
      if (params.selective && params.selective.length > 0) {
        const matches = params.selective.some(pattern => {
          // Simple glob matching - could be enhanced with minimatch
          return fileEntry.originalPath.includes(pattern.replace('**/', '').replace('/**', ''));
        });
        if (!matches) continue;
      }

      const targetPath = params.destination
        ? join(params.destination, fileEntry.path)
        : fileEntry.originalPath;

      // Check if file exists at target
      try {
        await access(targetPath);

        // File exists - check modification time
        const existingStat = await stat(targetPath);

        conflicts.push({
          path: targetPath,
          existingModified: existingStat.mtime.toISOString(),
          backupModified: fileEntry.modified,
          action: params.overwrite ? 'overwrite' : 'skip'
        });
      } catch {
        // File doesn't exist - no conflict
      }
    }

    return conflicts;
  }

  /**
   * Perform actual restore operation
   */
  private async performRestore(
    metadata: BackupMetadata,
    params: RestoreBackupParams,
    conflicts: RestoreConflict[]
  ): Promise<RestoreBackupResult['changes']> {
    let filesRestored = 0;
    let filesSkipped = 0;
    let bytesRestored = 0;

    for (const fileEntry of metadata.files) {
      // Apply selective filter if provided
      if (params.selective && params.selective.length > 0) {
        const matches = params.selective.some(pattern => {
          return fileEntry.originalPath.includes(pattern.replace('**/', '').replace('/**', ''));
        });
        if (!matches) {
          filesSkipped++;
          continue;
        }
      }

      const targetPath = params.destination
        ? join(params.destination, fileEntry.path)
        : fileEntry.originalPath;

      // Check for conflict
      const hasConflict = conflicts.some(c => c.path === targetPath);
      if (hasConflict && !params.overwrite) {
        filesSkipped++;
        continue;
      }

      // Ensure target directory exists
      await mkdir(dirname(targetPath), { recursive: true });

      // Get source path from backup
      const sourcePath = this.storage.getRelativeDataPath(metadata.backupId, fileEntry.path);

      // Restore file
      try {
        if (metadata.config.compression) {
          // Decompress file
          const compressedPath = `${sourcePath}.gz`;
          await this.compressionEngine.decompress(compressedPath, targetPath);
        } else {
          // Copy file directly
          await copyFile(sourcePath, targetPath);
        }

        filesRestored++;
        bytesRestored += fileEntry.size;
      } catch (error) {
        // File restore failed - skip
        filesSkipped++;
      }
    }

    return {
      filesRestored,
      filesSkipped,
      bytesRestored,
      conflicts
    };
  }

  /**
   * Create pre-restore safety backup
   */
  private async createPreRestoreBackup(
    metadata: BackupMetadata,
    customDestination?: string
  ): Promise<string> {
    // Determine sources for pre-restore backup
    const sources = customDestination
      ? [customDestination]
      : metadata.sources;

    // Create backup
    const result = await this.backupEngine.createBackup({
      sources,
      type: 'full',
      label: 'pre-restore-safety',
      compression: true,
      verify: false  // Skip verification for speed
    });

    return result.backupId;
  }
}
