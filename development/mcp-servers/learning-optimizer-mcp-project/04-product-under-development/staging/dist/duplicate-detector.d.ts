/**
 * Duplicate Detector
 * Finds duplicate issues based on symptom similarity
 */
import { TrackedIssue } from './types.js';
export interface DuplicateGroup {
    primaryIssue: TrackedIssue;
    duplicates: TrackedIssue[];
    combinedFrequency: number;
}
export declare class DuplicateDetector {
    /**
     * Detect duplicate issues
     */
    detectDuplicates(issues: TrackedIssue[]): DuplicateGroup[];
    /**
     * Check if two issues are duplicates
     */
    private areDuplicates;
    /**
     * Normalize text for comparison
     */
    private normalizeText;
    /**
     * Calculate text similarity (Jaccard similarity)
     */
    private calculateSimilarity;
    /**
     * Calculate text overlap
     */
    private calculateOverlap;
    /**
     * Extract error message pattern
     */
    private extractErrorPattern;
    /**
     * Merge duplicate issues
     */
    mergeDuplicates(duplicateGroup: DuplicateGroup): TrackedIssue;
}
//# sourceMappingURL=duplicate-detector.d.ts.map