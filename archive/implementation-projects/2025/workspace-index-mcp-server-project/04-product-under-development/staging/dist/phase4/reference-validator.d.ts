import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
/**
 * Reference found in a document
 */
export interface DocumentReference {
    /** File containing the reference */
    sourceFile: string;
    /** Line number where reference appears */
    lineNumber: number;
    /** Type of reference */
    type: 'file-link' | 'section-link' | 'relative-link';
    /** Original link text */
    original: string;
    /** Target path (resolved) */
    target: string;
    /** Whether link is valid */
    isValid: boolean;
    /** Error if link is invalid */
    error?: string;
}
/**
 * Reference update operation
 */
export interface ReferenceUpdate {
    /** File to update */
    file: string;
    /** Line number */
    lineNumber: number;
    /** Old link text */
    oldLink: string;
    /** New link text */
    newLink: string;
    /** Reason for update */
    reason: string;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Total references checked */
    totalReferences: number;
    /** Valid references */
    validReferences: number;
    /** Broken references */
    brokenReferences: DocumentReference[];
    /** Files scanned */
    filesScanned: number;
    /** Timestamp */
    timestamp: string;
}
/**
 * Update result
 */
export interface UpdateResult {
    /** Number of files updated */
    filesUpdated: number;
    /** Number of links updated */
    linksUpdated: number;
    /** Errors encountered */
    errors: string[];
    /** Success */
    success: boolean;
}
/**
 * ReferenceValidator - Validates and updates cross-references in documentation
 *
 * Features:
 * - Scan all markdown files for links
 * - Validate internal file links
 * - Validate section/anchor links
 * - Auto-update references after consolidation
 * - Report broken links
 */
export declare class ReferenceValidator {
    private adapter;
    constructor(adapter: ConfigurableWorkspaceAdapter);
    /**
     * Scan workspace and validate all internal references
     */
    validateAllReferences(): Promise<ValidationResult>;
    /**
     * Update references after a file has moved or been consolidated
     */
    updateReferences(oldPath: string, newPath: string, dryRun?: boolean): Promise<UpdateResult>;
    /**
     * Batch update references for multiple file mappings
     */
    batchUpdateReferences(mappings: Array<{
        oldPath: string;
        newPath: string;
    }>, dryRun?: boolean): Promise<UpdateResult>;
    /**
     * Find all markdown files in workspace
     */
    private findMarkdownFiles;
    /**
     * Extract all references from a file
     */
    private extractReferences;
    /**
     * Validate a single link
     */
    private validateLink;
    /**
     * Find all references in a file to a specific target
     */
    private findReferencesTo;
    /**
     * Apply reference updates to files
     */
    private applyUpdates;
}
