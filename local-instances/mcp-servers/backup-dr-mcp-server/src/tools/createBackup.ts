/**
 * create_backup tool - Create a new backup with optional PHI scanning
 */

import { BackupEngine } from '../engines/BackupEngine.js';
import { CreateBackupParams, CreateBackupResult } from '../types/backup.types.js';

export interface CreateBackupToolParams {
  sources: string[];
  type?: 'full' | 'incremental';
  label?: string;
  compression?: boolean;
  verify?: boolean;
  excludePatterns?: string[];
  scanPHI?: boolean;
}

export interface CreateBackupToolResult {
  success: boolean;
  backupId: string;
  metadata: {
    fileCount: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    type: string;
    created: string;
  };
  duration: number;
  phiScanResults?: {
    filesScanned: number;
    phiDetected: boolean;
    warnings: string[];
  };
  warnings: string[];
}

export class CreateBackupTool {
  private backupEngine: BackupEngine;

  constructor(compressionLevel: number = 6, backupDirectory: string = '~/.backup-dr/backups') {
    this.backupEngine = new BackupEngine(compressionLevel, backupDirectory);
  }

  async execute(params: CreateBackupToolParams): Promise<CreateBackupToolResult> {
    // Validate sources
    if (!params.sources || params.sources.length === 0) {
      throw new Error('At least one source path is required');
    }

    // PHI scanning if requested
    let phiScanResults: CreateBackupToolResult['phiScanResults'];
    if (params.scanPHI) {
      phiScanResults = await this.scanForPHI(params.sources, params.excludePatterns || []);
    }

    // Create backup params
    const backupParams: CreateBackupParams = {
      sources: params.sources,
      type: params.type || 'incremental',
      label: params.label,
      compression: params.compression ?? true,
      verify: params.verify ?? false,
      excludePatterns: params.excludePatterns || []
    };

    // Execute backup
    const result: CreateBackupResult = await this.backupEngine.createBackup(backupParams);

    // Format response
    const warnings: string[] = [];

    if (phiScanResults?.phiDetected) {
      warnings.push('PHI detected in backup - ensure compliance with HIPAA regulations');
    }

    if (result.metadata.errors && result.metadata.errors.length > 0) {
      warnings.push(`${result.metadata.errors.length} errors occurred during backup`);
    }

    return {
      success: result.success,
      backupId: result.backupId,
      metadata: {
        fileCount: result.metadata.fileCount,
        totalSize: result.metadata.totalSize,
        compressedSize: result.metadata.compressedSize,
        compressionRatio: result.metadata.compressionRatio,
        type: result.metadata.type,
        created: result.metadata.created
      },
      duration: result.duration,
      phiScanResults,
      warnings
    };
  }

  /**
   * Scan sources for PHI (integrates with security-compliance-mcp if available)
   */
  private async scanForPHI(
    sources: string[],
    _excludePatterns: string[]
  ): Promise<NonNullable<CreateBackupToolResult['phiScanResults']>> {
    // This would integrate with security-compliance-mcp's scan_for_phi tool
    // For now, return a placeholder implementation

    const warnings: string[] = [];
    let phiDetected = false;

    // Placeholder: Check if sources include known PHI-containing directories
    const phiPaths = [
      '/patient-data',
      '/medical-records',
      '/phi',
      '/ehr-data',
      'patient-intake',
      'appointments'
    ];

    for (const source of sources) {
      const sourceLower = source.toLowerCase();
      if (phiPaths.some(path => sourceLower.includes(path))) {
        phiDetected = true;
        warnings.push(`Potential PHI detected in: ${source}`);
      }
    }

    return {
      filesScanned: sources.length,
      phiDetected,
      warnings
    };
  }
}
