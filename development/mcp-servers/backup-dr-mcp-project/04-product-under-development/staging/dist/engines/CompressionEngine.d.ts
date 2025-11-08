/**
 * CompressionEngine - Handles gzip compression and decompression
 */
export interface CompressionResult {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}
export declare class CompressionEngine {
    private compressionLevel;
    constructor(compressionLevel?: number);
    /**
     * Compress a file using gzip
     */
    compress(inputPath: string, outputPath: string): Promise<CompressionResult>;
    /**
     * Decompress a gzip file
     */
    decompress(inputPath: string, outputPath: string): Promise<void>;
    /**
     * Get compression statistics for a file pair
     */
    getCompressionStats(originalPath: string, compressedPath: string): Promise<CompressionResult>;
}
//# sourceMappingURL=CompressionEngine.d.ts.map