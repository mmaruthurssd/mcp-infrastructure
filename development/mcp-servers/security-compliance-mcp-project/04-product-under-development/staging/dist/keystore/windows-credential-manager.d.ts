/**
 * Windows Credential Manager integration
 */
import type { IKeystore } from './keystore-interface.js';
/**
 * Windows Credential Manager keystore implementation
 *
 * Note: This requires the 'keytar' or similar Node.js native module for Windows.
 * For now, this is a placeholder that will fall back to file-based storage.
 */
export declare class WindowsCredentialManager implements IKeystore {
    getType(): string;
    isAvailable(): Promise<boolean>;
    setSecret(_key: string, _value: string): Promise<void>;
    getSecret(_key: string): Promise<string | null>;
    deleteSecret(_key: string): Promise<void>;
    listSecrets(): Promise<string[]>;
}
//# sourceMappingURL=windows-credential-manager.d.ts.map