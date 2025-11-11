/**
 * BackupIndex - Manages backup catalog and querying
 */

import { writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { BackupIndex as IBackupIndex, BackupIndexEntry, BackupType, SortOption } from '../types/backup.types.js';

export class BackupIndex {
  private indexPath: string;
  private index: IBackupIndex;

  constructor(backupDirectory: string = '~/.backup-dr/backups') {
    const resolvedDir = backupDirectory.startsWith('~')
      ? join(homedir(), backupDirectory.slice(2))
      : backupDirectory;

    this.indexPath = join(resolvedDir, '..', 'index.json');
    this.index = this.createEmptyIndex();
  }

  /**
   * Create empty index structure
   */
  private createEmptyIndex(): IBackupIndex {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      backups: [],
      statistics: {
        totalBackups: 0,
        totalSize: 0,
        totalCompressedSize: 0,
        fullBackups: 0,
        incrementalBackups: 0
      }
    };
  }

  /**
   * Load index from disk
   */
  async load(): Promise<void> {
    try {
      await access(this.indexPath);
      const content = await readFile(this.indexPath, 'utf-8');
      this.index = JSON.parse(content);
    } catch {
      // Index doesn't exist, use empty index
      this.index = this.createEmptyIndex();
    }
  }

  /**
   * Save index to disk (atomic operation)
   */
  async save(): Promise<void> {
    this.index.lastUpdated = new Date().toISOString();

    const tempPath = `${this.indexPath}.tmp`;
    await writeFile(tempPath, JSON.stringify(this.index, null, 2), 'utf-8');

    // Atomic operation - copy then delete temp
    const fs = await import('fs/promises');
    await fs.copyFile(tempPath, this.indexPath);
    await fs.rm(tempPath);
  }

  /**
   * Add backup to index
   */
  async addBackup(entry: BackupIndexEntry): Promise<void> {
    await this.load();

    // Remove existing entry with same ID if it exists
    this.index.backups = this.index.backups.filter(b => b.backupId !== entry.backupId);

    // Add new entry
    this.index.backups.push(entry);

    // Update statistics
    this.updateStatistics();

    await this.save();
  }

  /**
   * Update backup entry
   */
  async updateBackup(backupId: string, updates: Partial<BackupIndexEntry>): Promise<void> {
    await this.load();

    const index = this.index.backups.findIndex(b => b.backupId === backupId);
    if (index === -1) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    this.index.backups[index] = { ...this.index.backups[index], ...updates };

    // Update statistics
    this.updateStatistics();

    await this.save();
  }

  /**
   * Remove backup from index
   */
  async removeBackup(backupId: string): Promise<void> {
    await this.load();

    this.index.backups = this.index.backups.filter(b => b.backupId !== backupId);

    // Update statistics
    this.updateStatistics();

    await this.save();
  }

  /**
   * Query backups with filtering and sorting
   */
  async queryBackups(params?: {
    filter?: {
      type?: BackupType;
      sources?: string[];
      label?: string;
      dateRange?: {
        start: string;
        end: string;
      };
    };
    sort?: SortOption;
    limit?: number;
  }): Promise<BackupIndexEntry[]> {
    await this.load();

    let results = [...this.index.backups];

    // Apply filters
    if (params?.filter) {
      const { type, sources, label, dateRange } = params.filter;

      if (type) {
        results = results.filter(b => b.type === type);
      }

      if (sources && sources.length > 0) {
        results = results.filter(b =>
          sources.some(source => b.sources.includes(source))
        );
      }

      if (label) {
        results = results.filter(b => b.label === label);
      }

      if (dateRange) {
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime();
        results = results.filter(b => {
          const created = new Date(b.created).getTime();
          return created >= start && created <= end;
        });
      }
    }

    // Apply sorting
    const sort = params?.sort || 'date-desc';
    results = this.sortBackups(results, sort);

    // Apply limit
    if (params?.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * Get all backups
   */
  async getAllBackups(): Promise<BackupIndexEntry[]> {
    await this.load();
    return [...this.index.backups];
  }

  /**
   * Get backup by ID
   */
  async getBackup(backupId: string): Promise<BackupIndexEntry | null> {
    await this.load();
    return this.index.backups.find(b => b.backupId === backupId) || null;
  }

  /**
   * Get index statistics
   */
  async getStatistics(): Promise<IBackupIndex['statistics']> {
    await this.load();
    return { ...this.index.statistics };
  }

  /**
   * Update statistics based on current backups
   */
  private updateStatistics(): void {
    this.index.statistics = {
      totalBackups: this.index.backups.length,
      totalSize: this.index.backups.reduce((sum, b) => sum + b.totalSize, 0),
      totalCompressedSize: this.index.backups.reduce((sum, b) => sum + b.compressedSize, 0),
      fullBackups: this.index.backups.filter(b => b.type === 'full').length,
      incrementalBackups: this.index.backups.filter(b => b.type === 'incremental').length
    };
  }

  /**
   * Sort backups
   */
  private sortBackups(backups: BackupIndexEntry[], sort: SortOption): BackupIndexEntry[] {
    const sorted = [...backups];

    switch (sort) {
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      case 'size-asc':
        return sorted.sort((a, b) => a.totalSize - b.totalSize);
      case 'size-desc':
        return sorted.sort((a, b) => b.totalSize - a.totalSize);
      default:
        return sorted;
    }
  }
}
