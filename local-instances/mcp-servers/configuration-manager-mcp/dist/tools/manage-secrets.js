/**
 * manage_secrets tool
 * Store, retrieve, rotate, and delete secrets using OS keychain
 */
import { SecretError, } from '../types.js';
import * as secretsManager from '../utils/secrets-manager.js';
export async function manageSecrets(params) {
    const { action, key, value, rotationDays, metadata } = params;
    try {
        // Check keychain availability
        const available = await secretsManager.isKeychainAvailable();
        if (!available) {
            throw new SecretError('KEYCHAIN_UNAVAILABLE', 'OS keychain is not available on this system');
        }
        switch (action) {
            case 'store': {
                if (!key || !value) {
                    throw new SecretError('INVALID_PARAMS', 'Key and value are required for store action');
                }
                await secretsManager.storeSecret(key, value, {
                    ...metadata,
                    rotationDays: rotationDays || 90,
                });
                return {
                    success: true,
                    action: 'store',
                    key,
                    message: `Secret stored successfully: ${key}`,
                };
            }
            case 'retrieve': {
                if (!key) {
                    throw new SecretError('INVALID_PARAMS', 'Key is required for retrieve action');
                }
                const retrievedValue = await secretsManager.retrieveSecret(key);
                return {
                    success: true,
                    action: 'retrieve',
                    key,
                    value: retrievedValue,
                    message: `Secret retrieved successfully: ${key}`,
                };
            }
            case 'rotate': {
                if (!key || !value) {
                    throw new SecretError('INVALID_PARAMS', 'Key and new value are required for rotate action');
                }
                await secretsManager.rotateSecret(key, value, rotationDays);
                return {
                    success: true,
                    action: 'rotate',
                    key,
                    message: `Secret rotated successfully: ${key}`,
                };
            }
            case 'delete': {
                if (!key) {
                    throw new SecretError('INVALID_PARAMS', 'Key is required for delete action');
                }
                await secretsManager.deleteSecret(key);
                return {
                    success: true,
                    action: 'delete',
                    key,
                    message: `Secret deleted successfully: ${key}`,
                };
            }
            case 'list': {
                const secrets = await secretsManager.listSecrets();
                return {
                    success: true,
                    action: 'list',
                    secrets,
                    message: `Found ${secrets.length} secret(s)`,
                };
            }
            default: {
                throw new SecretError('INVALID_ACTION', `Unknown action: ${action}`);
            }
        }
    }
    catch (error) {
        if (error instanceof SecretError) {
            return {
                success: false,
                action,
                key: key ? `${key.substring(0, 3)}***` : undefined,
                message: `Error: ${error.message}`,
            };
        }
        return {
            success: false,
            action,
            key: key ? `${key.substring(0, 3)}***` : undefined,
            message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
//# sourceMappingURL=manage-secrets.js.map