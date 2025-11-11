/**
 * File-based keystore with encryption
 *
 * Fallback for platforms without native keystore support
 */
import type { IKeystore } from './keystore-interface.js';
/**
 * File-based encrypted keystore
 */
export declare class FileKeystore implements IKeystore {
    private keystorePath;
    private masterKey;
    constructor(keystorePath?: string);
    getType(): string;
    isAvailable(): Promise<boolean>;
    /**
     * Get or create master encryption key
     */
    private getMasterKey;
    /**
     * Encrypt data
     */
    private encrypt;
    /**
     * Decrypt data
     */
    private decrypt;
    /**
     * Load keystore from disk
     */
    private loadKeystore;
    /**
     * Save keystore to disk
     */
    private saveKeystore;
    setSecret(key: string, value: string): Promise<void>;
    getSecret(key: string): Promise<string | null>;
    deleteSecret(key: string): Promise<void>;
    listSecrets(): Promise<string[]>;
}
//# sourceMappingURL=file-keystore.d.ts.map