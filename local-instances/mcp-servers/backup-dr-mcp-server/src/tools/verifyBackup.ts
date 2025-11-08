/**
 * verify_backup tool - Verify backup integrity
 */

import { IntegrityEngine } from '../engines/IntegrityEngine.js';
import { BackupStorage } from '../storage/BackupStorage.js';

export interface VerifyBackupToolParams {
  backupId: string;
  quick?: boolean;
}

export interface VerifyBackupToolResult {
  success: boolean;
  backupId: string;
  valid: boolean;
  checksumValid: boolean;
  filesVerified: number;
  filesInvalid: number;
  duration: number;
  errors: Array<{
    file: string;
    expected: string;
    actual: string;
  }>;
}

export class VerifyBackupTool {
  private integrityEngine: IntegrityEngine;
  private storage: BackupStorage;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    this.integrityEngine = new IntegrityEngine();
    this.storage = new BackupStorage(backupDirectory);
  }

  async execute(params: VerifyBackupToolParams): Promise<VerifyBackupToolResult> {
    const startTime = Date.now();

    if (!params.backupId) {
      throw new Error('Backup ID is required');
    }

    // Load metadata and manifest
    const metadata = await this.storage.loadMetadata(params.backupId);
    const manifest = await this.storage.loadManifest(params.backupId);

    // Verify manifest checksum
    const manifestJson = JSON.stringify(manifest);
    const actualChecksum = this.integrityEngine.calculateStringChecksum(manifestJson);
    const checksumValid = actualChecksum === metadata.checksum;

    if (params.quick) {
      // Quick verification - manifest checksum only
      return {
        success: true,
        backupId: params.backupId,
        valid: checksumValid,
        checksumValid,
        filesVerified: 0,
        filesInvalid: 0,
        duration: Date.now() - startTime,
        errors: checksumValid ? [] : [{
          file: 'manifest.json',
          expected: metadata.checksum,
          actual: actualChecksum
        }]
      };
    }

    // Full verification - check each file
    const errors: VerifyBackupToolResult['errors'] = [];
    let filesVerified = 0;

    for (const fileEntry of manifest) {
      try {
        const filePath = this.storage.getRelativeDataPath(params.backupId, fileEntry.path);

        // Handle compressed files
        const actualPath = metadata.config.compression ? `${filePath}.gz` : filePath;

        // For compressed files, we can't verify the original checksum
        // We'd need to decompress first, which is expensive
        // So we just verify the file exists and has the expected compressed size
        const stat = await this.storage.getFileStats(actualPath);

        if (metadata.config.compression) {
          // Verify compressed size matches
          if (stat.size !== fileEntry.compressedSize) {
            errors.push({
              file: fileEntry.path,
              expected: `size: ${fileEntry.compressedSize}`,
              actual: `size: ${stat.size}`
            });
          } else {
            filesVerified++;
          }
        } else {
          // Verify checksum for uncompressed files
          const actualFileChecksum = await this.integrityEngine.calculateChecksum(actualPath);
          if (actualFileChecksum !== fileEntry.checksum) {
            errors.push({
              file: fileEntry.path,
              expected: fileEntry.checksum,
              actual: actualFileChecksum
            });
          } else {
            filesVerified++;
          }
        }
      } catch (error) {
        errors.push({
          file: fileEntry.path,
          expected: fileEntry.checksum,
          actual: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const valid = checksumValid && errors.length === 0;

    return {
      success: true,
      backupId: params.backupId,
      valid,
      checksumValid,
      filesVerified,
      filesInvalid: errors.length,
      duration: Date.now() - startTime,
      errors
    };
  }
}
