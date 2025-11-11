/**
 * File-based keystore with encryption
 *
 * Fallback for platforms without native keystore support
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
/**
 * File-based encrypted keystore
 */
export class FileKeystore {
    keystorePath;
    masterKey = null;
    constructor(keystorePath) {
        this.keystorePath = keystorePath || path.join(os.homedir(), '.security-compliance-mcp', 'keystore.enc');
    }
    getType() {
        return 'file';
    }
    async isAvailable() {
        return true; // Always available as fallback
    }
    /**
     * Get or create master encryption key
     */
    async getMasterKey() {
        if (this.masterKey) {
            return this.masterKey;
        }
        const keyPath = path.join(path.dirname(this.keystorePath), '.master.key');
        try {
            // Try to read existing key
            const keyData = await fs.readFile(keyPath);
            this.masterKey = keyData;
            return this.masterKey;
        }
        catch {
            // Generate new key
            this.masterKey = crypto.randomBytes(KEY_LENGTH);
            // Ensure directory exists
            await fs.mkdir(path.dirname(keyPath), { recursive: true });
            // Save key with restrictive permissions
            await fs.writeFile(keyPath, this.masterKey, { mode: 0o600 });
            return this.masterKey;
        }
    }
    /**
     * Encrypt data
     */
    async encrypt(plaintext) {
        const masterKey = await this.getMasterKey();
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        // Derive key from master key + salt
        const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
        // Encrypt
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        // Format: salt:iv:tag:encrypted
        return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }
    /**
     * Decrypt data
     */
    async decrypt(ciphertext) {
        const masterKey = await this.getMasterKey();
        const parts = ciphertext.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format');
        }
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];
        // Derive key
        const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
        // Decrypt
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Load keystore from disk
     */
    async loadKeystore() {
        try {
            const data = await fs.readFile(this.keystorePath, 'utf-8');
            const encrypted = JSON.parse(data);
            const decrypted = {};
            for (const [key, value] of Object.entries(encrypted)) {
                decrypted[key] = await this.decrypt(value);
            }
            return decrypted;
        }
        catch {
            return {};
        }
    }
    /**
     * Save keystore to disk
     */
    async saveKeystore(data) {
        const encrypted = {};
        for (const [key, value] of Object.entries(data)) {
            encrypted[key] = await this.encrypt(value);
        }
        // Ensure directory exists
        await fs.mkdir(path.dirname(this.keystorePath), { recursive: true });
        // Save with restrictive permissions
        await fs.writeFile(this.keystorePath, JSON.stringify(encrypted, null, 2), { mode: 0o600 });
    }
    async setSecret(key, value) {
        const keystore = await this.loadKeystore();
        keystore[key] = value;
        await this.saveKeystore(keystore);
    }
    async getSecret(key) {
        const keystore = await this.loadKeystore();
        return keystore[key] || null;
    }
    async deleteSecret(key) {
        const keystore = await this.loadKeystore();
        delete keystore[key];
        await this.saveKeystore(keystore);
    }
    async listSecrets() {
        const keystore = await this.loadKeystore();
        return Object.keys(keystore);
    }
}
//# sourceMappingURL=file-keystore.js.map