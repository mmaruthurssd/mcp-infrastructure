import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import { HealthAnalysisResult } from './types.js';
/**
 * Phase 4: Documentation Health Analyzer
 *
 * Detects superseded, redundant, and stale documentation with confidence-based scoring.
 */
export declare class DocumentationHealthAnalyzer {
    private adapter;
    private config;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    /**
     * Analyze workspace documentation health
     */
    analyzeHealth(): Promise<HealthAnalysisResult>;
    /**
     * Find all markdown files in workspace
     */
    private findMarkdownFiles;
    /**
     * Detect if a document has been superseded
     */
    private detectSupersession;
    /**
     * Detect redundant documentation (multiple docs with high overlap)
     * Enhanced version with cross-directory comparison and pattern-based clustering
     */
    private detectRedundancy;
    /**
     * Detect stale documentation (old and unreferenced)
     */
    private detectStaleness;
    /**
     * Find framework that may have superseded this doc
     */
    private findSupersedingFramework;
    /**
     * Find references to newer documentation
     */
    private findNewerDocumentReferences;
    /**
     * Find references to this file from other docs
     */
    private findReferences;
    /**
     * Calculate content overlap between two files
     */
    private calculateOverlap;
    /**
     * Calculate confidence factors for an issue
     */
    private calculateConfidence;
    /**
     * Aggregate confidence factors into final score
     */
    private aggregateConfidence;
    /**
     * Check if this is a first-time pattern
     */
    private isFirstTimePattern;
    /**
     * Generate unique issue ID
     */
    private generateIssueId;
    /**
     * Build summary from issues
     */
    private buildSummary;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
}
