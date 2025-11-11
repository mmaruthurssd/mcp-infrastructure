import type { FunctionInfo, ClassInfo } from '../types/index.js';
/**
 * Parse TypeScript file and extract function/class information using Babel AST
 */
export declare function analyzeSourceFile(filePath: string): Promise<{
    functions: FunctionInfo[];
    classes: ClassInfo[];
    error?: string;
}>;
/**
 * Filter functions by name (for selective test generation)
 */
export declare function filterFunctionsByName(functions: FunctionInfo[], names: string[]): FunctionInfo[];
/**
 * Get only exported functions (for unit testing)
 */
export declare function getExportedFunctions(functions: FunctionInfo[]): FunctionInfo[];
//# sourceMappingURL=ast-analyzer.d.ts.map