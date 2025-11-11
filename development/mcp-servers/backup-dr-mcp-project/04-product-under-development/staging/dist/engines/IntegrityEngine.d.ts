/**
 * IntegrityEngine - Handles SHA-256 checksum calculation and verification
 */
export declare class IntegrityEngine {
    /**
     * Calculate SHA-256 checksum for a file
     */
    calculateChecksum(filePath: string): Promise<string>;
    /**
     * Calculate SHA-256 checksum for a buffer
     */
    calculateBufferChecksum(buffer: Buffer): string;
    /**
     * Calculate SHA-256 checksum for a string
     */
    calculateStringChecksum(data: string): string;
    /**
     * Verify a file's checksum matches expected value
     */
    verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean>;
    /**
     * Verify a buffer's checksum matches expected value
     */
    verifyBufferChecksum(buffer: Buffer, expectedChecksum: string): boolean;
}
//# sourceMappingURL=IntegrityEngine.d.ts.map