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
export declare class BackupManager {
    private adapter;
    private backupRoot;
    private retentionDays;
    constructor(adapter: ConfigurableWorkspaceAdapter, retentionDays?: number);
    /**
     * Create backup of files before consolidation
     */
    createBackup(files: string[], operation: string, reason: string): Promise<BackupResult>;
    /**
     * Restore files from a backup
     */
    restoreBackup(backupPath: string): Promise<RestoreResult>;
    /**
     * List all backups sorted by timestamp (newest first)
     */
    listBackups(): Promise<Array<{
        path: string;
        metadata: BackupMetadata;
    }>>;
    /**
     * Clean up backups older than retention period
     */
    cleanupOldBackups(): Promise<{
        deleted: number;
        kept: number;
    }>;
    /**
     * Get backup directory root path
     */
    getBackupRoot(): string;
    /**
     * Get retention policy in days
     */
    getRetentionDays(): number;
}
export {};
