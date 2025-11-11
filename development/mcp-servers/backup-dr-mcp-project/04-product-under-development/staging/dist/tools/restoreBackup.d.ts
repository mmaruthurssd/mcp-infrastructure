/**
 * restore_backup tool - Restore backup with safety features
 */
export interface RestoreBackupToolParams {
    backupId: string;
    destination?: string;
    overwrite?: boolean;
    preBackup?: boolean;
    dryRun?: boolean;
    selective?: string[];
}
export interface RestoreBackupToolResult {
    success: boolean;
    backupId: string;
    operation: 'restore' | 'dry-run';
    changes: {
        filesRestored: number;
        filesSkipped: number;
        bytesRestored: number;
        conflicts: Array<{
            path: string;
            existingModified: string;
            backupModified: string;
            action: 'overwrite' | 'skip';
        }>;
    };
    duration: number;
    preBackupId?: string;
    warnings: string[];
}
export declare class RestoreBackupTool {
    private restoreEngine;
    constructor(backupDirectory?: string);
    execute(params: RestoreBackupToolParams): Promise<RestoreBackupToolResult>;
}
//# sourceMappingURL=restoreBackup.d.ts.map