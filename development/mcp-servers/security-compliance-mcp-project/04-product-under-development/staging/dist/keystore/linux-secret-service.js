/**
 * Linux Secret Service integration
 */
/**
 * Linux Secret Service keystore implementation
 *
 * Note: This requires libsecret and D-Bus integration.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export class LinuxSecretService {
    getType() {
        return 'linux-secret-service';
    }
    async isAvailable() {
        // Only available on Linux
        if (process.platform !== 'linux') {
            return false;
        }
        // Would need to check if secret-tool or similar is available
        // For now, return false to use file-based fallback
        return false;
    }
    async setSecret(_key, _value) {
        throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
    }
    async getSecret(_key) {
        throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
    }
    async deleteSecret(_key) {
        throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
    }
    async listSecrets() {
        throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
    }
}
//# sourceMappingURL=linux-secret-service.js.map