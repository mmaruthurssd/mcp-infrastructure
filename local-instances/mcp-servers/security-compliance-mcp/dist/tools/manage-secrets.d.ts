/**
 * Tool: manage_secrets
 *
 * Encrypt, decrypt, and manage secrets with rotation tracking
 */
import type { SecretsResult, SecretAction } from '../types/index.js';
export interface ManageSecretsArgs {
    action: SecretAction;
    key?: string;
    value?: string;
    rotationDays?: number;
}
/**
 * Manage secrets
 */
export declare function manageSecrets(args: ManageSecretsArgs): Promise<SecretsResult>;
/**
 * Format secrets management results
 */
export declare function formatSecretsResult(result: SecretsResult): string;
//# sourceMappingURL=manage-secrets.d.ts.map