/**
 * create_backup tool - Create a new backup with optional PHI scanning
 */
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
export declare class CreateBackupTool {
    private backupEngine;
    constructor(compressionLevel?: number, backupDirectory?: string);
    execute(params: CreateBackupToolParams): Promise<CreateBackupToolResult>;
    /**
     * Scan sources for PHI (integrates with security-compliance-mcp if available)
     */
    private scanForPHI;
}
//# sourceMappingURL=createBackup.d.ts.map