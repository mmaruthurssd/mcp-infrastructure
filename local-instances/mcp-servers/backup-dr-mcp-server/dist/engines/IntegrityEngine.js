/**
 * IntegrityEngine - Handles SHA-256 checksum calculation and verification
 */
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
export class IntegrityEngine {
    /**
     * Calculate SHA-256 checksum for a file
     */
    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = createHash('sha256');
            const stream = createReadStream(filePath);
            stream.on('data', (chunk) => {
                hash.update(chunk);
            });
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
            stream.on('error', (error) => {
                reject(new Error(`Failed to calculate checksum: ${error.message}`));
            });
        });
    }
    /**
     * Calculate SHA-256 checksum for a buffer
     */
    calculateBufferChecksum(buffer) {
        return createHash('sha256').update(buffer).digest('hex');
    }
    /**
     * Calculate SHA-256 checksum for a string
     */
    calculateStringChecksum(data) {
        return createHash('sha256').update(data).digest('hex');
    }
    /**
     * Verify a file's checksum matches expected value
     */
    async verifyChecksum(filePath, expectedChecksum) {
        const actualChecksum = await this.calculateChecksum(filePath);
        return actualChecksum === expectedChecksum;
    }
    /**
     * Verify a buffer's checksum matches expected value
     */
    verifyBufferChecksum(buffer, expectedChecksum) {
        const actualChecksum = this.calculateBufferChecksum(buffer);
        return actualChecksum === expectedChecksum;
    }
}
//# sourceMappingURL=IntegrityEngine.js.map