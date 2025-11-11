/**
 * File Analyzer
 *
 * AI-powered file type detection and placement suggestion.
 * Analyzes file paths, names, extensions, and content to suggest optimal placement
 * in the 8-folder template structure.
 *
 * Target: 80%+ accuracy on typical software projects
 */
export interface FileAnalysisResult {
    filePath: string;
    fileType: string;
    suggestedPath: string;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
}
export declare class FileAnalyzer {
    /**
     * Analyze a file and suggest where it should go in the template structure
     */
    static analyzeFile(filePath: string, projectRoot: string): FileAnalysisResult | null;
    private static isRootConfigFile;
    private static isDocumentationFile;
    private static isSourceCode;
    private static getSourceCodeSubPath;
    private static isTestFile;
    private static isBuildArtifact;
    private static isAsset;
    private static isScript;
    private static isPlanningDoc;
    /**
     * Calculate overall accuracy for a set of suggestions (for testing)
     */
    static calculateAccuracy(results: FileAnalysisResult[]): {
        overall: number;
        byConfidence: {
            high: number;
            medium: number;
            low: number;
        };
    };
}
//# sourceMappingURL=file-analyzer%202.d.ts.map