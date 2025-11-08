/**
 * PHI (Protected Health Information) scanner engine
 *
 * Scans files and text for HIPAA-regulated PHI
 */
import type { PHIFinding, PHIPattern, PHICategory, RiskLevel } from '../types/index.js';
/**
 * PHI scanner options
 */
export interface PHIScanOptions {
    /** Custom patterns to use */
    patterns?: PHIPattern[];
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Categories to scan for */
    categories?: PHICategory[];
    /** Context lines to include */
    contextLines?: number;
    /** Sensitivity level */
    sensitivity?: 'low' | 'medium' | 'high';
}
/**
 * Result of scanning a single file for PHI
 */
export interface PHIScanResult {
    filePath: string;
    findings: PHIFinding[];
    clean: boolean;
    riskLevel: RiskLevel;
    scannedAt: string;
    error?: string;
}
/**
 * PHI scanner class
 */
export declare class PHIScanner {
    private patterns;
    private minConfidence;
    private categories;
    private contextLines;
    constructor(options?: PHIScanOptions);
    /**
     * Get confidence threshold based on sensitivity level
     */
    private getSensitivityThreshold;
    /**
     * Scan a file for PHI
     */
    scanFile(filePath: string): Promise<PHIScanResult>;
    /**
     * Scan text content for PHI
     */
    scanText(content: string, filePath?: string): PHIFinding[];
    /**
     * Scan multiple files
     */
    scanFiles(filePaths: string[]): Promise<PHIScanResult[]>;
    /**
     * Detect if content is in medical context
     */
    private detectMedicalContext;
    /**
     * Calculate overall risk level based on findings
     */
    private calculateRiskLevel;
    /**
     * Extract context lines around a match
     */
    private extractContext;
    /**
     * Generate anonymization suggestion
     */
    private generateAnonymizationSuggestion;
}
/**
 * Convenience function to scan a file for PHI
 */
export declare function scanFileForPHI(filePath: string, options?: PHIScanOptions): Promise<PHIScanResult>;
/**
 * Convenience function to scan text for PHI
 */
export declare function scanTextForPHI(content: string, filePath?: string, options?: PHIScanOptions): PHIFinding[];
/**
 * Convenience function to scan multiple files for PHI
 */
export declare function scanFilesForPHI(filePaths: string[], options?: PHIScanOptions): Promise<PHIScanResult[]>;
//# sourceMappingURL=phi-scanner.d.ts.map