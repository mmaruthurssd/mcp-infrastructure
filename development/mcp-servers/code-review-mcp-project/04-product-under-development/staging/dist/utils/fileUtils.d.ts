export interface FileInfo {
    path: string;
    content: string;
    language: string;
    linesOfCode: number;
}
export declare function readFile(filePath: string): Promise<string>;
export declare function writeFile(filePath: string, content: string): Promise<void>;
export declare function fileExists(filePath: string): Promise<boolean>;
export declare function getFiles(targetPath: string, extensions?: string[]): Promise<string[]>;
export declare function detectLanguage(filePath: string): string;
export declare function countLines(content: string): number;
export declare function analyzeFile(filePath: string): Promise<FileInfo>;
//# sourceMappingURL=fileUtils.d.ts.map