/**
 * BackupEngine - Core backup orchestration logic
 */

import { readdir, stat, copyFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import { minimatch } from 'minimatch';
import { CompressionEngine } from './CompressionEngine.js';
import { IntegrityEngine } from './IntegrityEngine.js';
import { BackupStorage } from '../storage/BackupStorage.js';
import { BackupIndex } from '../storage/BackupIndex.js';
import { BackupMetadataHelper } from '../storage/BackupMetadata.js';
import {
  BackupMetadata,
  BackupFileEntry,
  CreateBackupParams,
  CreateBackupResult,
  BackupStats
} from '../types/backup.types.js';

export class BackupEngine {
  private compressionEngine: CompressionEngine;
  private integrityEngine: IntegrityEngine;
  private storage: BackupStorage;
  private index: BackupIndex;

  constructor(
    compressionLevel: number = 6,
    backupDirectory: string = '~/.backup-dr/backups'
  ) {
    this.compressionEngine = new CompressionEngine(compressionLevel);
    this.integrityEngine = new IntegrityEngine();
    this.storage = new BackupStorage(backupDirectory);
    this.index = new BackupIndex(backupDirectory);
  }

  /**
   * Create a new backup
   */
  async createBackup(params: CreateBackupParams): Promise<CreateBackupResult> {
    const startTime = Date.now();

    // Initialize storage
    await this.storage.initialize();

    // Generate backup ID
    const backupId = BackupMetadataHelper.generateBackupId();

    // Create backup directory
    const backupPath = await this.storage.createBackupDirectory(backupId);

    // Create metadata
    const metadata = BackupMetadataHelper.createMetadata({
      backupId,
      type: params.type,
      sources: params.sources,
      label: params.label,
      compression: params.compression ?? true,
      compressionLevel: 6,
      excludePatterns: params.excludePatterns || []
    });

    // Collect statistics
    const stats: BackupStats = {
      filesBackedUp: 0,
      filesSkipped: 0,
      bytesProcessed: 0,
      compressionSavings: 0
    };

    // Determine last backup timestamp for incremental
    let lastBackupTime: number | null = null;
    if (params.type === 'incremental') {
      lastBackupTime = await this.getLastBackupTimestamp(params.sources);
    }

    // Process each source
    for (const source of params.sources) {
      try {
        await this.backupSource(
          source,
          backupId,
          metadata,
          stats,
          params.excludePatterns || [],
          params.compression ?? true,
          lastBackupTime
        );
      } catch (error) {
        BackupMetadataHelper.addError(
          metadata,
          source,
          `Failed to backup source: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
      }
    }

    // Calculate manifest checksum
    const manifestJson = JSON.stringify(metadata.files);
    const manifestChecksum = this.integrityEngine.calculateStringChecksum(manifestJson);

    // Finalize metadata
    BackupMetadataHelper.finalizeMetadata(metadata, manifestChecksum);

    // Save metadata and manifest
    await this.storage.saveMetadata(backupId, metadata);
    await this.storage.saveManifest(backupId, metadata.files);

    // Verify backup if requested
    if (params.verify) {
      const verified = await this.quickVerifyBackup(backupId, metadata);
      if (!verified) {
        BackupMetadataHelper.addError(
          metadata,
          backupId,
          'Backup verification failed',
          'warning'
        );
      }
    }

    // Add to index
    await this.index.addBackup(BackupMetadataHelper.toIndexEntry(metadata));

    const duration = Date.now() - startTime;

    return {
      success: true,
      backupId,
      backupPath,
      metadata,
      duration,
      stats
    };
  }

  /**
   * Backup a single source (file or directory)
   */
  private async backupSource(
    source: string,
    backupId: string,
    metadata: BackupMetadata,
    stats: BackupStats,
    excludePatterns: string[],
    compression: boolean,
    lastBackupTime: number | null
  ): Promise<void> {
    const sourceStat = await stat(source);

    if (sourceStat.isFile()) {
      await this.backupFile(
        source,
        source,
        backupId,
        metadata,
        stats,
        compression,
        lastBackupTime
      );
    } else if (sourceStat.isDirectory()) {
      await this.backupDirectory(
        source,
        source,
        backupId,
        metadata,
        stats,
        excludePatterns,
        compression,
        lastBackupTime
      );
    }
  }

  /**
   * Backup a directory recursively
   */
  private async backupDirectory(
    dirPath: string,
    basePath: string,
    backupId: string,
    metadata: BackupMetadata,
    stats: BackupStats,
    excludePatterns: string[],
    compression: boolean,
    lastBackupTime: number | null
  ): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(basePath, fullPath);

      // Check exclusion patterns
      if (this.shouldExclude(relativePath, excludePatterns)) {
        stats.filesSkipped++;
        continue;
      }

      try {
        if (entry.isFile()) {
          await this.backupFile(
            fullPath,
            basePath,
            backupId,
            metadata,
            stats,
            compression,
            lastBackupTime
          );
        } else if (entry.isDirectory()) {
          await this.backupDirectory(
            fullPath,
            basePath,
            backupId,
            metadata,
            stats,
            excludePatterns,
            compression,
            lastBackupTime
          );
        }
      } catch (error) {
        BackupMetadataHelper.addError(
          metadata,
          fullPath,
          `Failed to backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'warning'
        );
        stats.filesSkipped++;
      }
    }
  }

  /**
   * Backup a single file
   */
  private async backupFile(
    filePath: string,
    basePath: string,
    backupId: string,
    metadata: BackupMetadata,
    stats: BackupStats,
    compression: boolean,
    lastBackupTime: number | null
  ): Promise<void> {
    const fileStat = await stat(filePath);

    // Skip if incremental and file not modified
    if (lastBackupTime && fileStat.mtimeMs <= lastBackupTime) {
      stats.filesSkipped++;
      return;
    }

    const relativePath = relative(basePath, filePath);
    const destPath = this.storage.getRelativeDataPath(backupId, relativePath);

    // Ensure destination directory exists
    await this.storage.ensureDirectoryExists(destPath);

    // Calculate checksum of original file
    const checksum = await this.integrityEngine.calculateChecksum(filePath);

    let compressedSize = fileStat.size;

    if (compression) {
      // Compress file
      const compressedPath = `${destPath}.gz`;
      const compressionResult = await this.compressionEngine.compress(filePath, compressedPath);
      compressedSize = compressionResult.compressedSize;
      stats.compressionSavings += compressionResult.originalSize - compressionResult.compressedSize;
    } else {
      // Copy file without compression
      await copyFile(filePath, destPath);
    }

    // Add file entry
    const fileEntry: BackupFileEntry = {
      path: relativePath,
      originalPath: filePath,
      size: fileStat.size,
      compressedSize,
      checksum,
      modified: fileStat.mtime.toISOString(),
      permissions: fileStat.mode.toString(8)
    };

    BackupMetadataHelper.addFileEntry(metadata, fileEntry);

    stats.filesBackedUp++;
    stats.bytesProcessed += fileStat.size;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(path: string, patterns: string[]): boolean {
    // Normalize path separators for consistent matching
    const normalizedPath = path.split(sep).join('/');

    return patterns.some(pattern => {
      // Handle negation patterns (!)
      if (pattern.startsWith('!')) {
        return !minimatch(normalizedPath, pattern.slice(1), { dot: true });
      }
      return minimatch(normalizedPath, pattern, { dot: true });
    });
  }

  /**
   * Get timestamp of last backup containing these sources
   */
  private async getLastBackupTimestamp(sources: string[]): Promise<number | null> {
    const backups = await this.index.queryBackups({
      filter: { sources },
      sort: 'date-desc',
      limit: 1
    });

    if (backups.length === 0) {
      return null;
    }

    return new Date(backups[0].created).getTime();
  }

  /**
   * Quick verify backup (manifest checksum only)
   */
  private async quickVerifyBackup(
    backupId: string,
    metadata: BackupMetadata
  ): Promise<boolean> {
    try {
      // Load manifest
      const manifest = await this.storage.loadManifest(backupId);

      // Recalculate checksum
      const manifestJson = JSON.stringify(manifest);
      const actualChecksum = this.integrityEngine.calculateStringChecksum(manifestJson);

      return actualChecksum === metadata.checksum;
    } catch {
      return false;
    }
  }
}
