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
export declare class KeystoreFactory {
    /**
     * Create appropriate keystore for current platform
     */
    static create(type?: 'macos-keychain' | 'windows-credential-manager' | 'linux-secret-service' | 'file'): Promise<IKeystore>;
    private static createByType;
}
//# sourceMappingURL=keystore-interface.d.ts.map