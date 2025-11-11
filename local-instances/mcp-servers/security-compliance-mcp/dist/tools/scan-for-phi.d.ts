/**
 * Tool: scan_for_phi
 *
 * Scan files for Protected Health Information (PHI)
 */
import type { PHIDetectionResult, PHICategory } from '../types/index.js';
export interface ScanForPHIArgs {
    target: string;
    mode: 'file' | 'directory' | 'staged' | 'commit';
    commitHash?: string;
    minConfidence?: number;
    sensitivity?: 'low' | 'medium' | 'high';
    categories?: PHICategory[];
    exclude?: string[];
}
/**
 * Scan for PHI based on mode
 */
export declare function scanForPHI(args: ScanForPHIArgs): Promise<PHIDetectionResult>;
/**
 * Format PHI scan results for display
 */
export declare function formatPHIScanResults(result: PHIDetectionResult): string;
//# sourceMappingURL=scan-for-phi.d.ts.map