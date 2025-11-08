/**
 * Credential scanner engine
 *
 * Scans files and text content for potential credentials using pattern matching
 */
import type { Violation, CredentialPattern, AllowListEntry, ScanResult } from '../types/index.js';
/**
 * Scanner options
 */
export interface ScanOptions {
    /** Custom patterns to use (defaults to CREDENTIAL_PATTERNS) */
    patterns?: CredentialPattern[];
    /** Allow-list entries to filter out false positives */
    allowList?: AllowListEntry[];
    /** Minimum confidence threshold (0-1) */
    minConfidence?: number;
    /** Context lines to include before/after match */
    contextLines?: number;
}
/**
 * Credential scanner class
 */
export declare class CredentialScanner {
    private patterns;
    private allowList;
    private minConfidence;
    private contextLines;
    constructor(options?: ScanOptions);
    /**
     * Scan a file for credentials
     */
    scanFile(filePath: string): Promise<ScanResult>;
    /**
     * Scan text content for credentials
     */
    scanText(content: string, filePath?: string): Violation[];
    /**
     * Scan multiple files
     */
    scanFiles(filePaths: string[]): Promise<ScanResult[]>;
    /**
     * Scan directory recursively
     */
    scanDirectory(dirPath: string, options?: {
        exclude?: string[];
    }): Promise<ScanResult[]>;
    /**
     * Check if a match is allow-listed
     */
    private isAllowListed;
    /**
     * Match file path against pattern (supports wildcards)
     */
    private matchesPath;
    /**
     * Extract context lines around a match
     */
    private extractContext;
    /**
     * Generate a helpful suggestion for fixing the violation
     */
    private generateSuggestion;
    /**
     * Find all files in directory recursively
     */
    private findFiles;
}
/**
 * Convenience function to scan a file
 */
export declare function scanFile(filePath: string, options?: ScanOptions): Promise<ScanResult>;
/**
 * Convenience function to scan text
 */
export declare function scanText(content: string, filePath?: string, options?: ScanOptions): Violation[];
/**
 * Convenience function to scan multiple files
 */
export declare function scanFiles(filePaths: string[], options?: ScanOptions): Promise<ScanResult[]>;
/**
 * Convenience function to scan directory
 */
export declare function scanDirectory(dirPath: string, options?: ScanOptions & {
    exclude?: string[];
}): Promise<ScanResult[]>;
//# sourceMappingURL=credential-scanner.d.ts.map