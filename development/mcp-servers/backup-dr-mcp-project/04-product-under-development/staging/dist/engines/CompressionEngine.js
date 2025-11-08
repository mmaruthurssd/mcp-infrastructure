/**
 * CompressionEngine - Handles gzip compression and decompression
 */
import { createReadStream, createWriteStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
export class CompressionEngine {
    compressionLevel;
    constructor(compressionLevel = 6) {
        this.compressionLevel = compressionLevel;
    }
    /**
     * Compress a file using gzip
     */
    async compress(inputPath, outputPath) {
        try {
            // Get original file size
            const inputStats = await stat(inputPath);
            const originalSize = inputStats.size;
            // Create compression stream
            const gzip = createGzip({ level: this.compressionLevel });
            const source = createReadStream(inputPath);
            const destination = createWriteStream(outputPath);
            // Compress file
            await pipeline(source, gzip, destination);
            // Get compressed file size
            const outputStats = await stat(outputPath);
            const compressedSize = outputStats.size;
            // Calculate compression ratio
            const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);
            return {
                originalSize,
                compressedSize,
                compressionRatio
            };
        }
        catch (error) {
            // Clean up partial output file if compression failed
            try {
                await unlink(outputPath);
            }
            catch {
                // Ignore cleanup errors
            }
            throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Decompress a gzip file
     */
    async decompress(inputPath, outputPath) {
        try {
            const gunzip = createGunzip();
            const source = createReadStream(inputPath);
            const destination = createWriteStream(outputPath);
            await pipeline(source, gunzip, destination);
        }
        catch (error) {
            // Clean up partial output file if decompression failed
            try {
                await unlink(outputPath);
            }
            catch {
                // Ignore cleanup errors
            }
            throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}. File may be corrupted.`);
        }
    }
    /**
     * Get compression statistics for a file pair
     */
    async getCompressionStats(originalPath, compressedPath) {
        const originalStats = await stat(originalPath);
        const compressedStats = await stat(compressedPath);
        const originalSize = originalStats.size;
        const compressedSize = compressedStats.size;
        const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        return {
            originalSize,
            compressedSize,
            compressionRatio
        };
    }
}
//# sourceMappingURL=CompressionEngine.js.map