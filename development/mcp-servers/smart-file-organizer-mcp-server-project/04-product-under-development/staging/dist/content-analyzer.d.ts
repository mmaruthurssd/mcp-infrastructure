/**
 * Content Analyzer
 * Analyzes file content to understand its purpose and appropriate placement
 */
export interface FileMetadataExtracted {
    type?: string;
    phase?: string;
    project?: string;
    tags?: string[];
    category?: string;
    status?: string;
    priority?: string;
    [key: string]: any;
}
export interface ContentAnalysis {
    fileType: 'code' | 'documentation' | 'config' | 'data' | 'secrets' | 'templates' | 'planning' | 'temp' | 'unknown';
    purpose: string;
    keywords: string[];
    isSecret: boolean;
    isTemplate: boolean;
    isTemporary: boolean;
    isPlanningDoc: boolean;
    projectAffiliation?: string;
    metadata?: FileMetadataExtracted;
    confidence: number;
    suggestedLocation?: string;
    reasoning: string[];
}
export interface FileMetadata {
    name: string;
    extension: string;
    size: number;
    path: string;
    modifiedTime: Date;
    content?: string;
}
export declare class ContentAnalyzer {
    private maxContentSize;
    private folderMap;
    constructor(folderMap: any);
    /**
     * Analyze a file's content to determine its purpose and placement
     */
    analyzeFile(filePath: string): Promise<ContentAnalysis>;
    /**
     * Get file metadata
     */
    private getFileMetadata;
    /**
     * Analyze file extension to determine type
     */
    private analyzeExtension;
    /**
     * Analyze file name for patterns
     */
    private analyzeFileName;
    /**
     * Analyze file content
     */
    private analyzeContent;
    /**
     * Suggest location based on analysis
     */
    private suggestLocation;
    /**
     * Check if file is a text file that can be analyzed
     */
    private isTextFile;
    /**
     * Parse YAML frontmatter from markdown files
     * Format: ---\nkey: value\n---
     */
    private parseYAMLFrontmatter;
    /**
     * Parse JSON metadata blocks from code files
     * Formats:
     * - /** @metadata {...} *\/ (JSDoc-style)
     * - /* @metadata {...} *\/ (C-style comment)
     */
    private parseJSONMetadata;
    /**
     * Parse HTML/XML style comment tags
     * Format: <!-- key: value -->
     * Also handles multi-line: <!--\n key: value\n key2: value2\n -->
     */
    private parseCommentTags;
    /**
     * Extract all metadata from content using all available parsers
     */
    private extractAllMetadata;
    /**
     * Batch analyze multiple files
     */
    analyzeFiles(filePaths: string[]): Promise<Map<string, ContentAnalysis>>;
}
//# sourceMappingURL=content-analyzer.d.ts.map