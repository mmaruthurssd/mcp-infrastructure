/**
 * Secrets manager with rotation tracking
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { KeystoreFactory, type IKeystore } from '../keystore/keystore-interface.js';
import type { SecretMetadata } from '../types/index.js';
import { loadConfig } from '../config/security-config.js';

/**
 * Secrets manager
 */
export class SecretsManager {
  private keystore: IKeystore | null = null;
  private metadataPath: string;

  constructor(metadataPath?: string) {
    this.metadataPath = metadataPath || path.join(os.homedir(), '.security-compliance-mcp', 'secrets-metadata.json');
  }

  /**
   * Initialize keystore
   */
  private async getKeystore(): Promise<IKeystore> {
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
  private async loadMetadata(): Promise<Record<string, SecretMetadata>> {
    try {
      const data = await fs.readFile(this.metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  /**
   * Save metadata
   */
  private async saveMetadata(metadata: Record<string, SecretMetadata>): Promise<void> {
    await fs.mkdir(path.dirname(this.metadataPath), { recursive: true });
    await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Calculate rotation status
   */
  private calculateRotationStatus(nextRotation: string): 'current' | 'expiring' | 'expired' {
    const nextRotationDate = new Date(nextRotation);
    const now = new Date();
    const daysUntilRotation = Math.floor((nextRotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRotation < 0) {
      return 'expired';
    } else if (daysUntilRotation <= 7) {
      return 'expiring';
    } else {
      return 'current';
    }
  }

  /**
   * Store a secret
   */
  async setSecret(key: string, value: string, rotationDays?: number): Promise<void> {
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
  async getSecret(key: string): Promise<string | null> {
    const keystore = await this.getKeystore();
    return await keystore.getSecret(key);
  }

  /**
   * Delete a secret
   */
  async deleteSecret(key: string): Promise<void> {
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
  async listSecrets(): Promise<SecretMetadata[]> {
    const keystore = await this.getKeystore();
    const keys = await keystore.listSecrets();
    const metadata = await this.loadMetadata();

    return keys.map((key) => {
      const meta = metadata[key];
      if (meta) {
        // Recalculate rotation status
        meta.rotationStatus = this.calculateRotationStatus(meta.nextRotation);
        return meta;
      } else {
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
  async getSecretMetadata(key: string): Promise<SecretMetadata | null> {
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
  async getSecretsNeedingRotation(): Promise<SecretMetadata[]> {
    const secrets = await this.listSecrets();
    return secrets.filter((s) => s.rotationStatus === 'expired' || s.rotationStatus === 'expiring');
  }

  /**
   * Rotate a secret (update lastRotated timestamp)
   */
  async rotateSecret(key: string, newValue: string): Promise<void> {
    await this.setSecret(key, newValue);
  }

  /**
   * Get keystore info
   */
  async getKeystoreInfo(): Promise<{ type: string; available: boolean }> {
    const keystore = await this.getKeystore();
    return {
      type: keystore.getType(),
      available: await keystore.isAvailable(),
    };
  }
}
