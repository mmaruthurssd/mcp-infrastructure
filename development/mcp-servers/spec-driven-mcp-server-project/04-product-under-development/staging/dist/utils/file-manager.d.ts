/**
 * File Manager - Handles file operations for spec artifacts
 */
export declare class FileManager {
    /**
     * Ensure directory exists, create if not
     */
    static ensureDirectory(dirPath: string): void;
    /**
     * Write file to disk
     */
    static writeFile(filePath: string, content: string): void;
    /**
     * Read file from disk
     */
    static readFile(filePath: string): string | null;
    /**
     * Check if file exists
     */
    static exists(filePath: string): boolean;
    /**
     * Create spec directory structure
     */
    static createSpecStructure(projectPath: string, featureDirName: string): string;
    /**
     * Create constitution directory
     */
    static createConstitutionPath(projectPath: string): string;
}
//# sourceMappingURL=file-manager.d.ts.map