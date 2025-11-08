/**
 * Security configuration management
 */
/**
 * Default security configuration
 */
export const DEFAULT_CONFIG = {
    version: '1.0.0',
    // Credential patterns will be loaded from patterns/credential-patterns.ts
    credentialPatterns: [],
    // PHI patterns will be loaded from patterns/phi-patterns.ts
    phiPatterns: [],
    // Allow-list for known safe patterns
    allowList: [],
    // Pre-commit hook configuration
    preCommitHooks: {
        enabled: true,
        blockOnViolations: true,
        scanCredentials: true,
        scanPHI: true,
        phiSensitivity: 'medium',
    },
    // Audit logging configuration
    auditLogging: {
        enabled: true,
        storePath: '~/workspace-brain/telemetry/security',
        retentionDays: 2190, // 6 years for HIPAA compliance
    },
    // Secrets management configuration
    secretsManagement: {
        enabled: true,
        keystoreType: 'macos-keychain', // Default to macOS, detect OS at runtime
        rotationDays: 90,
    },
};
/**
 * Validate security configuration
 */
export function validateConfig(config) {
    const errors = [];
    // Validate version
    if (config.version && typeof config.version !== 'string') {
        errors.push('version must be a string');
    }
    // Validate pre-commit hooks
    if (config.preCommitHooks) {
        const hooks = config.preCommitHooks;
        if (typeof hooks.enabled !== 'boolean') {
            errors.push('preCommitHooks.enabled must be a boolean');
        }
        if (hooks.phiSensitivity && !['low', 'medium', 'high'].includes(hooks.phiSensitivity)) {
            errors.push('preCommitHooks.phiSensitivity must be "low", "medium", or "high"');
        }
    }
    // Validate audit logging
    if (config.auditLogging) {
        const audit = config.auditLogging;
        if (typeof audit.enabled !== 'boolean') {
            errors.push('auditLogging.enabled must be a boolean');
        }
        if (audit.storePath && typeof audit.storePath !== 'string') {
            errors.push('auditLogging.storePath must be a string');
        }
        if (audit.retentionDays && (typeof audit.retentionDays !== 'number' || audit.retentionDays < 0)) {
            errors.push('auditLogging.retentionDays must be a positive number');
        }
        if (audit.retentionDays && audit.retentionDays < 2190) {
            errors.push('auditLogging.retentionDays must be at least 2190 days (6 years) for HIPAA compliance');
        }
    }
    // Validate secrets management
    if (config.secretsManagement) {
        const secrets = config.secretsManagement;
        const validKeystoreTypes = ['macos-keychain', 'windows-credential-manager', 'linux-secret-service', 'file'];
        if (secrets.keystoreType && !validKeystoreTypes.includes(secrets.keystoreType)) {
            errors.push(`secretsManagement.keystoreType must be one of: ${validKeystoreTypes.join(', ')}`);
        }
        if (secrets.rotationDays && (typeof secrets.rotationDays !== 'number' || secrets.rotationDays < 1)) {
            errors.push('secretsManagement.rotationDays must be a positive number');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig) {
    return {
        ...DEFAULT_CONFIG,
        ...userConfig,
        preCommitHooks: {
            ...DEFAULT_CONFIG.preCommitHooks,
            ...(userConfig.preCommitHooks || {}),
        },
        auditLogging: {
            ...DEFAULT_CONFIG.auditLogging,
            ...(userConfig.auditLogging || {}),
        },
        secretsManagement: {
            ...DEFAULT_CONFIG.secretsManagement,
            ...(userConfig.secretsManagement || {}),
        },
    };
}
/**
 * Detect OS and set appropriate keystore type
 */
export function detectKeystoreType() {
    const platform = process.platform;
    switch (platform) {
        case 'darwin':
            return 'macos-keychain';
        case 'win32':
            return 'windows-credential-manager';
        case 'linux':
            return 'linux-secret-service';
        default:
            console.warn(`Unknown platform: ${platform}, falling back to file-based keystore`);
            return 'file';
    }
}
/**
 * Load configuration with OS detection
 */
export function loadConfig(userConfig) {
    const merged = mergeConfig(userConfig || {});
    // Auto-detect keystore type if not explicitly set
    if (!userConfig?.secretsManagement?.keystoreType) {
        merged.secretsManagement.keystoreType = detectKeystoreType();
    }
    // Validate the final configuration
    const validation = validateConfig(merged);
    if (!validation.valid) {
        throw new Error(`Invalid security configuration:\n${validation.errors.join('\n')}`);
    }
    return merged;
}
//# sourceMappingURL=security-config.js.map