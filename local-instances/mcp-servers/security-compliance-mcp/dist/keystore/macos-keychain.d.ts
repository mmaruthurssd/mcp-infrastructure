/**
 * macOS Keychain integration
 */
import type { IKeystore } from './keystore-interface.js';
/**
 * macOS Keychain keystore implementation
 */
export declare class MacOSKeychain implements IKeystore {
    getType(): string;
    isAvailable(): Promise<boolean>;
    setSecret(key: string, value: string): Promise<void>;
    getSecret(key: string): Promise<string | null>;
    deleteSecret(key: string): Promise<void>;
    listSecrets(): Promise<string[]>;
}
//# sourceMappingURL=macos-keychain.d.ts.map