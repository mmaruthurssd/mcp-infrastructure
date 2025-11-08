/**
 * Secrets manager with rotation tracking
 */
import type { SecretMetadata } from '../types/index.js';
/**
 * Secrets manager
 */
export declare class SecretsManager {
    private keystore;
    private metadataPath;
    constructor(metadataPath?: string);
    /**
     * Initialize keystore
     */
    private getKeystore;
    /**
     * Load metadata for all secrets
     */
    private loadMetadata;
    /**
     * Save metadata
     */
    private saveMetadata;
    /**
     * Calculate rotation status
     */
    private calculateRotationStatus;
    /**
     * Store a secret
     */
    setSecret(key: string, value: string, rotationDays?: number): Promise<void>;
    /**
     * Retrieve a secret
     */
    getSecret(key: string): Promise<string | null>;
    /**
     * Delete a secret
     */
    deleteSecret(key: string): Promise<void>;
    /**
     * List all secrets with metadata
     */
    listSecrets(): Promise<SecretMetadata[]>;
    /**
     * Get metadata for a specific secret
     */
    getSecretMetadata(key: string): Promise<SecretMetadata | null>;
    /**
     * Get secrets that need rotation
     */
    getSecretsNeedingRotation(): Promise<SecretMetadata[]>;
    /**
     * Rotate a secret (update lastRotated timestamp)
     */
    rotateSecret(key: string, newValue: string): Promise<void>;
    /**
     * Get keystore info
     */
    getKeystoreInfo(): Promise<{
        type: string;
        available: boolean;
    }>;
}
//# sourceMappingURL=secrets-manager.d.ts.map