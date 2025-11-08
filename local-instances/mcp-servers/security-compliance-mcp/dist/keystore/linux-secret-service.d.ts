/**
 * Linux Secret Service integration
 */
import type { IKeystore } from './keystore-interface.js';
/**
 * Linux Secret Service keystore implementation
 *
 * Note: This requires libsecret and D-Bus integration.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export declare class LinuxSecretService implements IKeystore {
    getType(): string;
    isAvailable(): Promise<boolean>;
    setSecret(_key: string, _value: string): Promise<void>;
    getSecret(_key: string): Promise<string | null>;
    deleteSecret(_key: string): Promise<void>;
    listSecrets(): Promise<string[]>;
}
//# sourceMappingURL=linux-secret-service.d.ts.map