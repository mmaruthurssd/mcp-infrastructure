/**
 * Security configuration management
 */
import type { SecurityConfig } from '../types/index.js';
/**
 * Default security configuration
 */
export declare const DEFAULT_CONFIG: SecurityConfig;
/**
 * Validate security configuration
 */
export declare function validateConfig(config: Partial<SecurityConfig>): {
    valid: boolean;
    errors: string[];
};
/**
 * User configuration with deep partial support
 */
export type UserSecurityConfig = Partial<Omit<SecurityConfig, 'preCommitHooks' | 'auditLogging' | 'secretsManagement'>> & {
    preCommitHooks?: Partial<SecurityConfig['preCommitHooks']>;
    auditLogging?: Partial<SecurityConfig['auditLogging']>;
    secretsManagement?: Partial<SecurityConfig['secretsManagement']>;
};
/**
 * Merge user configuration with defaults
 */
export declare function mergeConfig(userConfig: UserSecurityConfig): SecurityConfig;
/**
 * Detect OS and set appropriate keystore type
 */
export declare function detectKeystoreType(): SecurityConfig['secretsManagement']['keystoreType'];
/**
 * Load configuration with OS detection
 */
export declare function loadConfig(userConfig?: UserSecurityConfig): SecurityConfig;
//# sourceMappingURL=security-config.d.ts.map