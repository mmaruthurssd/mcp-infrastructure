/**
 * Tool: scan_for_credentials
 *
 * Scan files, directories, or git commits for exposed credentials
 */
import type { CredentialScanResult } from '../types/index.js';
export interface ScanForCredentialsArgs {
    target: string;
    mode: 'file' | 'directory' | 'staged' | 'commit';
    commitHash?: string;
    minConfidence?: number;
    exclude?: string[];
}
/**
 * Scan for credentials based on mode
 */
export declare function scanForCredentials(args: ScanForCredentialsArgs): Promise<CredentialScanResult>;
/**
 * Format scan results for display
 */
export declare function formatScanResults(result: CredentialScanResult): string;
//# sourceMappingURL=scan-for-credentials.d.ts.map