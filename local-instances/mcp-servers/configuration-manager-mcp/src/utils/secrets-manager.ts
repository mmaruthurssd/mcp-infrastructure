/**
 * Secrets Manager - OS Keychain Integration
 * Handles secure storage and retrieval of secrets using native OS keychain
 */

import * as keytar from 'keytar';
import { SecretMetadata, SecretListItem, SecretError } from '../types.js';

const SERVICE_NAME = 'workspace-config-manager';
const METADATA_PREFIX = 'metadata:';

/**
 * Redact secret key for logging (show first 3 chars + ***)
 */
function redactKey(key: string): string {
  if (key.length <= 3) return '***';
  return `${key.substring(0, 3)}***`;
}

/**
 * Store a secret in OS keychain
 */
export async function storeSecret(
  key: string,
  value: string,
  metadata: Partial<SecretMetadata> = {}
): Promise<void> {
  try {
    // Store the actual secret
    await keytar.setPassword(SERVICE_NAME, key, value);

    // Store metadata separately
    const fullMetadata: SecretMetadata = {
      description: metadata.description || '',
      createdBy: metadata.createdBy || 'unknown',
      createdAt: metadata.createdAt || new Date().toISOString(),
      rotationDays: metadata.rotationDays || 90,
      accessCount: 0,
      lastRotated: metadata.lastRotated,
      rotationDue: metadata.rotationDue || calculateRotationDue(metadata.rotationDays || 90),
      lastAccessed: undefined,
    };

    await keytar.setPassword(
      SERVICE_NAME,
      `${METADATA_PREFIX}${key}`,
      JSON.stringify(fullMetadata)
    );
  } catch (error) {
    throw new SecretError(
      'STORE_FAILED',
      `Failed to store secret: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { key: redactKey(key) }
    );
  }
}

/**
 * Retrieve a secret from OS keychain
 */
export async function retrieveSecret(key: string): Promise<string> {
  try {
    const value = await keytar.getPassword(SERVICE_NAME, key);

    if (value === null) {
      throw new SecretError('SECRET_NOT_FOUND', `Secret not found: ${redactKey(key)}`, { key: redactKey(key) });
    }

    // Update access metadata
    await updateAccessMetadata(key);

    return value;
  } catch (error) {
    if (error instanceof SecretError) throw error;
    throw new SecretError(
      'RETRIEVE_FAILED',
      `Failed to retrieve secret: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { key: redactKey(key) }
    );
  }
}

/**
 * Rotate a secret (update its value and reset rotation timer)
 */
export async function rotateSecret(
  key: string,
  newValue: string,
  rotationDays?: number
): Promise<void> {
  try {
    // Get existing metadata
    const metadata = await getSecretMetadata(key);

    // Update the secret value
    await keytar.setPassword(SERVICE_NAME, key, newValue);

    // Update metadata with rotation info
    const updatedMetadata: SecretMetadata = {
      ...metadata,
      lastRotated: new Date().toISOString(),
      rotationDays: rotationDays || metadata.rotationDays,
      rotationDue: calculateRotationDue(rotationDays || metadata.rotationDays),
    };

    await keytar.setPassword(
      SERVICE_NAME,
      `${METADATA_PREFIX}${key}`,
      JSON.stringify(updatedMetadata)
    );
  } catch (error) {
    throw new SecretError(
      'ROTATE_FAILED',
      `Failed to rotate secret: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { key: redactKey(key) }
    );
  }
}

/**
 * Delete a secret from OS keychain
 */
export async function deleteSecret(key: string): Promise<void> {
  try {
    // Delete the secret
    const deleted = await keytar.deletePassword(SERVICE_NAME, key);

    if (!deleted) {
      throw new SecretError('SECRET_NOT_FOUND', `Secret not found: ${redactKey(key)}`, { key: redactKey(key) });
    }

    // Delete metadata
    await keytar.deletePassword(SERVICE_NAME, `${METADATA_PREFIX}${key}`);
  } catch (error) {
    if (error instanceof SecretError) throw error;
    throw new SecretError(
      'DELETE_FAILED',
      `Failed to delete secret: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { key: redactKey(key) }
    );
  }
}

/**
 * List all secrets (returns keys and metadata, not values)
 */
export async function listSecrets(): Promise<SecretListItem[]> {
  try {
    const credentials = await keytar.findCredentials(SERVICE_NAME);

    const secrets: SecretListItem[] = [];
    const metadataKeys = new Set<string>();

    // Identify metadata entries
    for (const cred of credentials) {
      if (cred.account.startsWith(METADATA_PREFIX)) {
        metadataKeys.add(cred.account.substring(METADATA_PREFIX.length));
      }
    }

    // Build secret list with metadata
    for (const cred of credentials) {
      if (!cred.account.startsWith(METADATA_PREFIX)) {
        let metadata: SecretMetadata;

        if (metadataKeys.has(cred.account)) {
          metadata = await getSecretMetadata(cred.account);
        } else {
          // No metadata, create default
          metadata = {
            description: 'No description',
            createdBy: 'unknown',
            createdAt: 'unknown',
            rotationDays: 90,
            accessCount: 0,
            rotationDue: calculateRotationDue(90),
          };
        }

        secrets.push({
          key: cred.account,
          metadata,
        });
      }
    }

    return secrets.sort((a, b) => a.key.localeCompare(b.key));
  } catch (error) {
    throw new SecretError(
      'LIST_FAILED',
      `Failed to list secrets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get metadata for a secret
 */
export async function getSecretMetadata(key: string): Promise<SecretMetadata> {
  try {
    const metadataJson = await keytar.getPassword(SERVICE_NAME, `${METADATA_PREFIX}${key}`);

    if (metadataJson === null) {
      // Return default metadata if not found
      return {
        description: 'No description',
        createdBy: 'unknown',
        createdAt: 'unknown',
        rotationDays: 90,
        accessCount: 0,
        rotationDue: calculateRotationDue(90),
      };
    }

    return JSON.parse(metadataJson) as SecretMetadata;
  } catch (error) {
    throw new SecretError(
      'METADATA_FAILED',
      `Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { key: redactKey(key) }
    );
  }
}

/**
 * Update access metadata (increment count, update last accessed)
 */
async function updateAccessMetadata(key: string): Promise<void> {
  try {
    const metadata = await getSecretMetadata(key);

    const updatedMetadata: SecretMetadata = {
      ...metadata,
      accessCount: metadata.accessCount + 1,
      lastAccessed: new Date().toISOString(),
    };

    await keytar.setPassword(
      SERVICE_NAME,
      `${METADATA_PREFIX}${key}`,
      JSON.stringify(updatedMetadata)
    );
  } catch (error) {
    // Don't throw on metadata update failure
    console.error(`Failed to update access metadata for ${redactKey(key)}`);
  }
}

/**
 * Calculate rotation due date
 */
function calculateRotationDue(rotationDays: number): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + rotationDays);
  return dueDate.toISOString();
}

/**
 * Check if keychain is available
 */
export async function isKeychainAvailable(): Promise<boolean> {
  try {
    // Try to perform a simple operation
    await keytar.findCredentials(SERVICE_NAME);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get service name for testing purposes
 */
export function getServiceName(): string {
  return SERVICE_NAME;
}
