import type { ProjectIndex, IndexMetadata } from './types.js';
export declare class IndexGenerator {
    private projectRoot;
    private indexMetadata;
    private readonly INDEX_FILE_NAME;
    private readonly METADATA_FILE_NAME;
    constructor(projectRoot: string);
    /**
     * Generate complete project index
     */
    generateProjectIndex(): Promise<ProjectIndex>;
    /**
     * Update indexes for specific paths (Phase III - Targeted Updates)
     */
    updateIndexesForPaths(paths: string[]): Promise<{
        updated: string[];
        errors: string[];
    }>;
    /**
     * Check index freshness (Phase IV - Proactive Monitoring)
     */
    checkIndexFreshness(relativePath?: string): Promise<IndexMetadata[]>;
    /**
     * Scan directory and return files
     */
    private scanDirectory;
    /**
     * Categorize file by extension
     */
    private categorizeFile;
    /**
     * Categorize all files into categories
     */
    private categorizeFiles;
    /**
     * Generate full markdown index
     */
    private generateMarkdown;
    /**
     * Generate folder-specific markdown
     */
    private generateFolderMarkdown;
    /**
     * Write index file to directory
     */
    private writeIndexFile;
    /**
     * Load metadata from file
     */
    private loadMetadata;
    /**
     * Update metadata for a path
     */
    private updateMetadata;
    /**
     * Save metadata to file
     */
    private saveMetadata;
    /**
     * Generate workspace-wide compliance audit
     * Scans all MCPs and checks compliance scores
     */
    generateComplianceAudit(): Promise<{
        totalMCPs: number;
        avgScore: number;
        highCompliance: number;
        mediumCompliance: number;
        lowCompliance: number;
        mcpScores: Array<{
            name: string;
            score: number;
            compliant: boolean;
            criticalViolations: number;
            warnings: number;
        }>;
        lowComplianceMCPs: Array<{
            name: string;
            score: number;
            criticalViolations: number;
            suggestions: string[];
        }>;
    }>;
}
