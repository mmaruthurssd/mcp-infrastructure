/**
 * macOS Keychain integration
 */

import { execSync } from 'child_process';
import type { IKeystore } from './keystore-interface.js';

const SERVICE_NAME = 'security-compliance-mcp';

/**
 * macOS Keychain keystore implementation
 */
export class MacOSKeychain implements IKeystore {
  getType(): string {
    return 'macos-keychain';
  }

  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return false;
    }

    try {
      execSync('which security', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async setSecret(key: string, value: string): Promise<void> {
    try {
      // Delete existing entry if it exists
      try {
        await this.deleteSecret(key);
      } catch {
        // Ignore if doesn't exist
      }

      // Add new entry
      execSync(
        `security add-generic-password -s "${SERVICE_NAME}" -a "${key}" -w "${value}"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      throw new Error(`Failed to store secret in keychain: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const result = execSync(
        `security find-generic-password -s "${SERVICE_NAME}" -a "${key}" -w`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return result.trim();
    } catch {
      return null;
    }
  }

  async deleteSecret(key: string): Promise<void> {
    try {
      execSync(
        `security delete-generic-password -s "${SERVICE_NAME}" -a "${key}"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      // Ignore if doesn't exist
    }
  }

  async listSecrets(): Promise<string[]> {
    try {
      const result = execSync(
        `security dump-keychain | grep -A 1 "svce.*${SERVICE_NAME}" | grep acct | cut -d'"' -f 4`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );

      return result
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);
    } catch {
      return [];
    }
  }
}
