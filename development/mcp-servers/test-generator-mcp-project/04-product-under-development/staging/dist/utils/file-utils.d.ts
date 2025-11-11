/**
 * Check if a file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Safely read a file with error handling
 */
export declare function readFileSafe(filePath: string): Promise<string | null>;
/**
 * Safely write a file with error handling
 */
export declare function writeFileSafe(filePath: string, content: string): Promise<boolean>;
/**
 * Validate that a path is absolute and exists
 */
export declare function validateFilePath(filePath: string): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Validate file extension
 */
export declare function validateFileExtension(filePath: string, allowedExtensions: string[]): {
    valid: boolean;
    error?: string;
};
/**
 * Generate test file path from source file path
 * e.g., /path/to/utils.ts → /path/to/utils.test.ts
 */
export declare function generateTestFilePath(sourceFile: string, framework?: string): string;
/**
 * Resolve relative path from project root
 */
export declare function resolveProjectPath(projectPath: string, relativePath: string): string;
/**
 * Prevent path traversal attacks
 */
export declare function sanitizePath(filePath: string): string;
/**
 * Check if path is within allowed directory
 */
export declare function isPathWithinDirectory(filePath: string, allowedDir: string): boolean;
//# sourceMappingURL=file-utils.d.ts.map