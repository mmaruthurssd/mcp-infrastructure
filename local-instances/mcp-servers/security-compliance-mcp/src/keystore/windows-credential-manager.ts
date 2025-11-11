/**
 * Windows Credential Manager integration
 */

import type { IKeystore } from './keystore-interface.js';

/**
 * Windows Credential Manager keystore implementation
 *
 * Note: This requires the 'keytar' or similar Node.js native module for Windows.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export class WindowsCredentialManager implements IKeystore {
  getType(): string {
    return 'windows-credential-manager';
  }

  async isAvailable(): Promise<boolean> {
    // Only available on Windows
    if (process.platform !== 'win32') {
      return false;
    }

    // Would need to check if credential manager is accessible
    // For now, return false to use file-based fallback
    return false;
  }

  async setSecret(_key: string, _value: string): Promise<void> {
    throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
  }

  async getSecret(_key: string): Promise<string | null> {
    throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
  }

  async deleteSecret(_key: string): Promise<void> {
    throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
  }

  async listSecrets(): Promise<string[]> {
    throw new Error('Windows Credential Manager not yet implemented. Use file-based keystore.');
  }
}
