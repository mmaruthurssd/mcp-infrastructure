/**
 * list_backups tool - Query and filter backups
 */

import { BackupIndex } from '../storage/BackupIndex.js';

export interface ListBackupsToolParams {
  type?: 'full' | 'incremental';
  sources?: string[];
  label?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sort?: 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
  limit?: number;
}

export interface ListBackupsToolResult {
  success: boolean;
  backups: Array<{
    backupId: string;
    type: 'full' | 'incremental';
    created: string;
    sources: string[];
    fileCount: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    label?: string;
    status: string;
  }>;
  totalBackups: number;
  statistics?: {
    totalBackups: number;
    totalSize: number;
    totalCompressedSize: number;
    fullBackups: number;
    incrementalBackups: number;
  };
}

export class ListBackupsTool {
  private index: BackupIndex;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    this.index = new BackupIndex(backupDirectory);
  }

  async execute(params: ListBackupsToolParams = {}): Promise<ListBackupsToolResult> {
    // Query backups
    const backups = await this.index.queryBackups({
      filter: {
        type: params.type,
        sources: params.sources,
        label: params.label,
        dateRange: params.dateRange
      },
      sort: params.sort || 'date-desc',
      limit: params.limit
    });

    // Get statistics
    const statistics = await this.index.getStatistics();

    return {
      success: true,
      backups: backups.map(b => ({
        backupId: b.backupId,
        type: b.type,
        created: b.created,
        sources: b.sources,
        fileCount: b.fileCount,
        totalSize: b.totalSize,
        compressedSize: b.compressedSize,
        compressionRatio: b.compressionRatio,
        label: b.label,
        status: b.status
      })),
      totalBackups: backups.length,
      statistics
    };
  }
}
