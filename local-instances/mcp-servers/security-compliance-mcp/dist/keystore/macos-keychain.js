/**
 * macOS Keychain integration
 */
import { execSync } from 'child_process';
const SERVICE_NAME = 'security-compliance-mcp';
/**
 * macOS Keychain keystore implementation
 */
export class MacOSKeychain {
    getType() {
        return 'macos-keychain';
    }
    async isAvailable() {
        if (process.platform !== 'darwin') {
            return false;
        }
        try {
            execSync('which security', { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    async setSecret(key, value) {
        try {
            // Delete existing entry if it exists
            try {
                await this.deleteSecret(key);
            }
            catch {
                // Ignore if doesn't exist
            }
            // Add new entry
            execSync(`security add-generic-password -s "${SERVICE_NAME}" -a "${key}" -w "${value}"`, { stdio: 'ignore' });
        }
        catch (error) {
            throw new Error(`Failed to store secret in keychain: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getSecret(key) {
        try {
            const result = execSync(`security find-generic-password -s "${SERVICE_NAME}" -a "${key}" -w`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
            return result.trim();
        }
        catch {
            return null;
        }
    }
    async deleteSecret(key) {
        try {
            execSync(`security delete-generic-password -s "${SERVICE_NAME}" -a "${key}"`, { stdio: 'ignore' });
        }
        catch (error) {
            // Ignore if doesn't exist
        }
    }
    async listSecrets() {
        try {
            const result = execSync(`security dump-keychain | grep -A 1 "svce.*${SERVICE_NAME}" | grep acct | cut -d'"' -f 4`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
            return result
                .trim()
                .split('\n')
                .filter((line) => line.length > 0);
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=macos-keychain.js.map