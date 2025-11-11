/**
 * Keystore interface for secure credential storage
 *
 * Provides abstraction over OS-native keystores
 */

export interface KeystoreEntry {
  key: string;
  value: string;
}

/**
 * Abstract keystore interface
 */
export interface IKeystore {
  /**
   * Store a secret
   */
  setSecret(key: string, value: string): Promise<void>;

  /**
   * Retrieve a secret
   */
  getSecret(key: string): Promise<string | null>;

  /**
   * Delete a secret
   */
  deleteSecret(key: string): Promise<void>;

  /**
   * List all stored secret keys
   */
  listSecrets(): Promise<string[]>;

  /**
   * Check if keystore is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get keystore type name
   */
  getType(): string;
}

/**
 * Keystore factory
 */
export class KeystoreFactory {
  /**
   * Create appropriate keystore for current platform
   */
  static async create(type?: 'macos-keychain' | 'windows-credential-manager' | 'linux-secret-service' | 'file'): Promise<IKeystore> {
    // Import implementations dynamically
    const { MacOSKeychain } = await import('./macos-keychain.js');
    const { WindowsCredentialManager } = await import('./windows-credential-manager.js');
    const { LinuxSecretService } = await import('./linux-secret-service.js');
    const { FileKeystore } = await import('./file-keystore.js');

    // If type specified, try to use it
    if (type) {
      const keystore = this.createByType(type, { MacOSKeychain, WindowsCredentialManager, LinuxSecretService, FileKeystore });
      if (await keystore.isAvailable()) {
        return keystore;
      }
      throw new Error(`Requested keystore type "${type}" is not available on this platform`);
    }

    // Auto-detect platform
    const platform = process.platform;

    switch (platform) {
      case 'darwin': {
        const keystore = new MacOSKeychain();
        if (await keystore.isAvailable()) {
          return keystore;
        }
        break;
      }

      case 'win32': {
        const keystore = new WindowsCredentialManager();
        if (await keystore.isAvailable()) {
          return keystore;
        }
        break;
      }

      case 'linux': {
        const keystore = new LinuxSecretService();
        if (await keystore.isAvailable()) {
          return keystore;
        }
        break;
      }
    }

    // Fallback to file-based keystore
    console.warn('OS-native keystore not available, using file-based keystore');
    return new FileKeystore();
  }

  private static createByType(
    type: string,
    implementations: any
  ): IKeystore {
    switch (type) {
      case 'macos-keychain':
        return new implementations.MacOSKeychain();
      case 'windows-credential-manager':
        return new implementations.WindowsCredentialManager();
      case 'linux-secret-service':
        return new implementations.LinuxSecretService();
      case 'file':
        return new implementations.FileKeystore();
      default:
        throw new Error(`Unknown keystore type: ${type}`);
    }
  }
}
