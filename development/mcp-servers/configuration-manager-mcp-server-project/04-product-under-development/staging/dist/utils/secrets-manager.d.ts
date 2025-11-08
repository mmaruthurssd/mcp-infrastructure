/**
 * Secrets Manager - OS Keychain Integration
 * Handles secure storage and retrieval of secrets using native OS keychain
 */
import { SecretMetadata, SecretListItem } from '../types.js';
/**
 * Store a secret in OS keychain
 */
export declare function storeSecret(key: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
/**
 * Retrieve a secret from OS keychain
 */
export declare function retrieveSecret(key: string): Promise<string>;
/**
 * Rotate a secret (update its value and reset rotation timer)
 */
export declare function rotateSecret(key: string, newValue: string, rotationDays?: number): Promise<void>;
/**
 * Delete a secret from OS keychain
 */
export declare function deleteSecret(key: string): Promise<void>;
/**
 * List all secrets (returns keys and metadata, not values)
 */
export declare function listSecrets(): Promise<SecretListItem[]>;
/**
 * Get metadata for a secret
 */
export declare function getSecretMetadata(key: string): Promise<SecretMetadata>;
/**
 * Check if keychain is available
 */
export declare function isKeychainAvailable(): Promise<boolean>;
/**
 * Get service name for testing purposes
 */
export declare function getServiceName(): string;
//# sourceMappingURL=secrets-manager.d.ts.map