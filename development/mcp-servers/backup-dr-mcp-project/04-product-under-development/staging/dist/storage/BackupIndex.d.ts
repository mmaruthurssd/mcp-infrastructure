/**
 * BackupIndex - Manages backup catalog and querying
 */
import { BackupIndex as IBackupIndex, BackupIndexEntry, BackupType, SortOption } from '../types/backup.types.js';
export declare class BackupIndex {
    private indexPath;
    private index;
    constructor(backupDirectory?: string);
    /**
     * Create empty index structure
     */
    private createEmptyIndex;
    /**
     * Load index from disk
     */
    load(): Promise<void>;
    /**
     * Save index to disk (atomic operation)
     */
    save(): Promise<void>;
    /**
     * Add backup to index
     */
    addBackup(entry: BackupIndexEntry): Promise<void>;
    /**
     * Update backup entry
     */
    updateBackup(backupId: string, updates: Partial<BackupIndexEntry>): Promise<void>;
    /**
     * Remove backup from index
     */
    removeBackup(backupId: string): Promise<void>;
    /**
     * Query backups with filtering and sorting
     */
    queryBackups(params?: {
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
    }): Promise<BackupIndexEntry[]>;
    /**
     * Get all backups
     */
    getAllBackups(): Promise<BackupIndexEntry[]>;
    /**
     * Get backup by ID
     */
    getBackup(backupId: string): Promise<BackupIndexEntry | null>;
    /**
     * Get index statistics
     */
    getStatistics(): Promise<IBackupIndex['statistics']>;
    /**
     * Update statistics based on current backups
     */
    private updateStatistics;
    /**
     * Sort backups
     */
    private sortBackups;
}
//# sourceMappingURL=BackupIndex.d.ts.map