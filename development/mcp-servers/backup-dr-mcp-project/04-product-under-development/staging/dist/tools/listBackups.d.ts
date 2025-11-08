/**
 * list_backups tool - Query and filter backups
 */
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
export declare class ListBackupsTool {
    private index;
    constructor(backupDirectory?: string);
    execute(params?: ListBackupsToolParams): Promise<ListBackupsToolResult>;
}
//# sourceMappingURL=listBackups.d.ts.map