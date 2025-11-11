/**
 * Format TypeScript code using Prettier
 */
export declare function formatCode(code: string, parser?: 'typescript' | 'babel'): Promise<string>;
/**
 * Validate that code can be formatted (i.e., it's syntactically valid)
 */
export declare function isValidCode(code: string, parser?: 'typescript' | 'babel'): Promise<boolean>;
/**
 * Clean up generated code (remove excessive newlines, fix indentation)
 */
export declare function cleanupCode(code: string): string;
/**
 * Add header comment to generated test file
 */
export declare function addFileHeader(sourceFile: string, framework: string): string;
//# sourceMappingURL=format-utils.d.ts.map