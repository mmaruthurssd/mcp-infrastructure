/**
 * Tool: manage_secrets
 *
 * Encrypt, decrypt, and manage secrets with rotation tracking
 */

import { SecretsManager } from '../secrets/secrets-manager.js';
import type { SecretsResult, SecretAction } from '../types/index.js';
import {
  auditSecretEncrypted,
  auditSecretDecrypted,
  auditSecretRotated,
  auditSecretRotationWarning,
  generateCorrelationId,
} from '../audit/audit-helper.js';

export interface ManageSecretsArgs {
  action: SecretAction;
  key?: string;
  value?: string;
  rotationDays?: number;
}

/**
 * Manage secrets
 */
export async function manageSecrets(args: ManageSecretsArgs): Promise<SecretsResult> {
  const manager = new SecretsManager();
  const correlationId = generateCorrelationId();

  switch (args.action) {
    case 'encrypt': {
      if (!args.key || !args.value) {
        throw new Error('key and value required for encrypt action');
      }

      await manager.setSecret(args.key, args.value, args.rotationDays);

      // Audit event
      await auditSecretEncrypted(args.key, correlationId);

      return {
        success: true,
        action: 'encrypt',
        encrypted: true,
        message: `Secret "${args.key}" encrypted and stored securely`,
      };
    }

    case 'decrypt': {
      if (!args.key) {
        throw new Error('key required for decrypt action');
      }

      const value = await manager.getSecret(args.key);

      if (!value) {
        return {
          success: false,
          action: 'decrypt',
          encrypted: false,
          message: `Secret "${args.key}" not found`,
        };
      }

      // Audit event
      await auditSecretDecrypted(args.key, correlationId);

      return {
        success: true,
        action: 'decrypt',
        encrypted: false,
        message: value, // Return decrypted value in message
      };
    }

    case 'rotate': {
      if (!args.key || !args.value) {
        throw new Error('key and value required for rotate action');
      }

      await manager.rotateSecret(args.key, args.value);

      // Audit event
      await auditSecretRotated(args.key, correlationId);

      return {
        success: true,
        action: 'rotate',
        encrypted: true,
        message: `Secret "${args.key}" rotated successfully`,
      };
    }

    case 'status': {
      const secrets = await manager.listSecrets();
      const needingRotation = secrets.filter(
        (s) => s.rotationStatus === 'expired' || s.rotationStatus === 'expiring'
      );

      // Audit warnings for secrets needing rotation
      for (const secret of needingRotation) {
        const daysUntil = Math.floor(
          (new Date(secret.nextRotation).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        await auditSecretRotationWarning(secret.key, daysUntil, correlationId);
      }

      const keystoreInfo = await manager.getKeystoreInfo();

      return {
        success: true,
        action: 'status',
        encrypted: false,
        secrets,
        message: `Found ${secrets.length} stored secret(s). ${needingRotation.length} need rotation. Keystore: ${keystoreInfo.type}`,
      };
    }

    default:
      throw new Error(`Unknown action: ${args.action}`);
  }
}

/**
 * Format secrets management results
 */
export function formatSecretsResult(result: SecretsResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('SECRETS MANAGEMENT');
  lines.push('='.repeat(80));
  lines.push('');

  // Action header
  const actionIcon = {
    encrypt: '🔒',
    decrypt: '🔓',
    rotate: '🔄',
    status: 'ℹ️',
  }[result.action];

  lines.push(`${actionIcon} Action: ${result.action.toUpperCase()}`);
  lines.push('');

  // Status
  if (result.success) {
    lines.push(`✅ ${result.message}`);
  } else {
    lines.push(`❌ ${result.message}`);
  }

  lines.push('');

  // Secrets list (for status action)
  if (result.secrets && result.secrets.length > 0) {
    lines.push('Stored Secrets:');
    lines.push('-'.repeat(80));

    result.secrets.forEach((secret) => {
      const statusIcon = {
        current: '✅',
        expiring: '⚠️',
        expired: '❌',
      }[secret.rotationStatus];

      const daysSince = Math.floor(
        (new Date().getTime() - new Date(secret.lastRotated).getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysUntil = Math.floor(
        (new Date(secret.nextRotation).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      lines.push('');
      lines.push(`  ${statusIcon} ${secret.key}`);
      lines.push(`     Status: ${secret.rotationStatus.toUpperCase()}`);
      lines.push(`     Last Rotated: ${new Date(secret.lastRotated).toLocaleDateString()} (${daysSince} days ago)`);
      lines.push(`     Next Rotation: ${new Date(secret.nextRotation).toLocaleDateString()}`);

      if (secret.rotationStatus === 'expired') {
        lines.push(`     ⚠️  WARNING: Secret has expired! Rotate immediately.`);
      } else if (secret.rotationStatus === 'expiring') {
        lines.push(`     ⚠️  Expiring in ${daysUntil} days`);
      }
    });

    lines.push('');
    lines.push('-'.repeat(80));
  }

  // Usage hints
  if (result.action === 'encrypt') {
    lines.push('');
    lines.push('Usage:');
    lines.push('  To retrieve: manage_secrets with action="decrypt" and key="${args.key}"');
    lines.push('  To rotate: manage_secrets with action="rotate" and new value');
  }

  if (result.action === 'decrypt') {
    lines.push('');
    lines.push('⚠️  Security Note:');
    lines.push('  Never log or commit decrypted secrets');
    lines.push('  Use environment variables or secure injection methods');
  }

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
