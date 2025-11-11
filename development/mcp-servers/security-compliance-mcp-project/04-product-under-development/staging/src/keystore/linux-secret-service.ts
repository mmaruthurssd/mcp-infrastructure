/**
 * Linux Secret Service integration
 */

import type { IKeystore } from './keystore-interface.js';

/**
 * Linux Secret Service keystore implementation
 *
 * Note: This requires libsecret and D-Bus integration.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export class LinuxSecretService implements IKeystore {
  getType(): string {
    return 'linux-secret-service';
  }

  async isAvailable(): Promise<boolean> {
    // Only available on Linux
    if (process.platform !== 'linux') {
      return false;
    }

    // Would need to check if secret-tool or similar is available
    // For now, return false to use file-based fallback
    return false;
  }

  async setSecret(_key: string, _value: string): Promise<void> {
    throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
  }

  async getSecret(_key: string): Promise<string | null> {
    throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
  }

  async deleteSecret(_key: string): Promise<void> {
    throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
  }

  async listSecrets(): Promise<string[]> {
    throw new Error('Linux Secret Service not yet implemented. Use file-based keystore.');
  }
}
