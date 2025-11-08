/**
 * verify_backup tool - Verify backup integrity
 */
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
export declare class VerifyBackupTool {
    private integrityEngine;
    private storage;
    constructor(backupDirectory?: string);
    execute(params: VerifyBackupToolParams): Promise<VerifyBackupToolResult>;
}
//# sourceMappingURL=verifyBackup.d.ts.map