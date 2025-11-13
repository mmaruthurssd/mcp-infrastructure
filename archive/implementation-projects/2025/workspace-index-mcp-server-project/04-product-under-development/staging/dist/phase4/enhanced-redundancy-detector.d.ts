import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import { DocumentationIssue } from './types.js';
/**
 * Enhanced redundancy detector with cross-directory comparison and pattern-based clustering
 *
 * Enhancements over original:
 * 1. Cross-directory comparison (not just same directory)
 * 2. Pattern-based clustering (workspace-architecture-family, etc.)
 * 3. Section-level overlap identification
 * 4. Configurable similarity thresholds
 */
export declare class EnhancedRedundancyDetector {
    private adapter;
    private config;
    private patterns;
    constructor(adapter: ConfigurableWorkspaceAdapter, patterns: DocumentationPatternConfig);
    /**
     * Detect redundancy across ALL files (cross-directory)
     */
    detectCrossDirectoryRedundancy(files: string[]): Promise<DocumentationIssue[]>;
    /**
     * Detect redundancy using configured patterns (e.g., workspace-architecture-family)
     */
    private detectPatternBasedClusters;
    /**
     * Detect redundancy via pairwise comparison (for files not in patterns)
     */
    private detectPairwiseRedundancy;
    /**
     * Calculate detailed overlap including section-level analysis
     */
    private calculateDetailedOverlap;
    /**
     * Normalize content for comparison (remove boilerplate, code blocks, etc.)
     */
    private normalizeContent;
    /**
     * Extract sections from markdown content
     */
    private extractSections;
    /**
     * Normalize header for comparison
     */
    private normalizeHeader;
    /**
     * Calculate string similarity using Levenshtein distance ratio
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    /**
     * Find files matching a pattern configuration
     */
    private findMatchingFiles;
    /**
     * Identify the most comprehensive document in a cluster
     */
    private identifyPrimaryDocument;
    /**
     * Generate consolidation steps based on strategy
     */
    private generateConsolidationSteps;
    private calculateConfidence;
    private aggregateConfidence;
    private generateIssueId;
    private isFirstTimePattern;
}
/**
 * Configuration for documentation patterns
 */
export interface DocumentationPatternConfig {
    [patternName: string]: {
        description: string;
        patterns: string[];
        suggested_strategy: 'hierarchical' | 'split-by-audience' | 'merge-and-redirect';
    };
}
/**
 * Default documentation patterns
 */
export declare const DEFAULT_DOCUMENTATION_PATTERNS: DocumentationPatternConfig;
