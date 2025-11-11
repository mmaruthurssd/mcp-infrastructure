/**
 * Secrets manager with rotation tracking
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { KeystoreFactory } from '../keystore/keystore-interface.js';
import { loadConfig } from '../config/security-config.js';
/**
 * Secrets manager
 */
export class SecretsManager {
    keystore = null;
    metadataPath;
    constructor(metadataPath) {
        this.metadataPath = metadataPath || path.join(os.homedir(), '.security-compliance-mcp', 'secrets-metadata.json');
    }
    /**
     * Initialize keystore
     */
    async getKeystore() {
        if (this.keystore) {
            return this.keystore;
        }
        const config = loadConfig();
        this.keystore = await KeystoreFactory.create(config.secretsManagement.keystoreType);
        return this.keystore;
    }
    /**
     * Load metadata for all secrets
     */
    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return {};
        }
    }
    /**
     * Save metadata
     */
    async saveMetadata(metadata) {
        await fs.mkdir(path.dirname(this.metadataPath), { recursive: true });
        await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    }
    /**
     * Calculate rotation status
     */
    calculateRotationStatus(nextRotation) {
        const nextRotationDate = new Date(nextRotation);
        const now = new Date();
        const daysUntilRotation = Math.floor((nextRotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilRotation < 0) {
            return 'expired';
        }
        else if (daysUntilRotation <= 7) {
            return 'expiring';
        }
        else {
            return 'current';
        }
    }
    /**
     * Store a secret
     */
    async setSecret(key, value, rotationDays) {
        const keystore = await this.getKeystore();
        const config = loadConfig();
        // Store in keystore
        await keystore.setSecret(key, value);
        // Update metadata
        const metadata = await this.loadMetadata();
        const now = new Date();
        const nowISO = now.toISOString();
        const rotDays = rotationDays ?? config.secretsManagement.rotationDays;
        const nextRotation = new Date(now.getTime() + rotDays * 24 * 60 * 60 * 1000).toISOString();
        metadata[key] = {
            key,
            lastRotated: nowISO,
            nextRotation,
            rotationStatus: 'current',
        };
        await this.saveMetadata(metadata);
    }
    /**
     * Retrieve a secret
     */
    async getSecret(key) {
        const keystore = await this.getKeystore();
        return await keystore.getSecret(key);
    }
    /**
     * Delete a secret
     */
    async deleteSecret(key) {
        const keystore = await this.getKeystore();
        await keystore.deleteSecret(key);
        // Remove metadata
        const metadata = await this.loadMetadata();
        delete metadata[key];
        await this.saveMetadata(metadata);
    }
    /**
     * List all secrets with metadata
     */
    async listSecrets() {
        const keystore = await this.getKeystore();
        const keys = await keystore.listSecrets();
        const metadata = await this.loadMetadata();
        return keys.map((key) => {
            const meta = metadata[key];
            if (meta) {
                // Recalculate rotation status
                meta.rotationStatus = this.calculateRotationStatus(meta.nextRotation);
                return meta;
            }
            else {
                // No metadata, create default
                const now = new Date();
                const nextRotation = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
                return {
                    key,
                    lastRotated: now.toISOString(),
                    nextRotation,
                    rotationStatus: 'current',
                };
            }
        });
    }
    /**
     * Get metadata for a specific secret
     */
    async getSecretMetadata(key) {
        const metadata = await this.loadMetadata();
        const meta = metadata[key];
        if (!meta) {
            return null;
        }
        // Recalculate rotation status
        meta.rotationStatus = this.calculateRotationStatus(meta.nextRotation);
        return meta;
    }
    /**
     * Get secrets that need rotation
     */
    async getSecretsNeedingRotation() {
        const secrets = await this.listSecrets();
        return secrets.filter((s) => s.rotationStatus === 'expired' || s.rotationStatus === 'expiring');
    }
    /**
     * Rotate a secret (update lastRotated timestamp)
     */
    async rotateSecret(key, newValue) {
        await this.setSecret(key, newValue);
    }
    /**
     * Get keystore info
     */
    async getKeystoreInfo() {
        const keystore = await this.getKeystore();
        return {
            type: keystore.getType(),
            available: await keystore.isAvailable(),
        };
    }
}
//# sourceMappingURL=secrets-manager.js.map