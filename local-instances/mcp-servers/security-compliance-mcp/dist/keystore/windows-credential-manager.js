/**
 * Windows Credential Manager integration
 */
/**
 * Windows Credential Manager keystore implementation
 *
 * Note: This requires the 'keytar' or similar Node.js native module for Windows.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export class WindowsCredentialManager {
    getType() {
        return 'windows-credential-manager';
    }
    async isAvailable() {
        // Only available on Windows
        if (process.platform !== 'win32') {
            return false;
        }
        // Would need to check if credential manager is accessible
        // For now, return false to use file-based fallback
        return false;
    }
    async setSecret(_key, _value) {
        throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
    }
    async getSecret(_key) {
        throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
    }
    async deleteSecret(_key) {
        throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
    }
    async listSecrets() {
        throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
    }
}
//# sourceMappingURL=windows-credential-manager.js.map