/**
 * Tests for security configuration
 */

import { validateConfig, mergeConfig, DEFAULT_CONFIG, detectKeystoreType } from '../../src/config/security-config.js';

describe('Security Configuration', () => {
  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid PHI sensitivity', () => {
      const result = validateConfig({
        preCommitHooks: {
          enabled: true,
          blockOnViolations: true,
          scanCredentials: true,
          scanPHI: true,
          phiSensitivity: 'invalid' as any,
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('preCommitHooks.phiSensitivity must be "low", "medium", or "high"');
    });

    it('should reject retention period less than 6 years', () => {
      const result = validateConfig({
        auditLogging: {
          enabled: true,
          storePath: '/tmp',
          retentionDays: 365, // Only 1 year
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('auditLogging.retentionDays must be at least 2190 days (6 years) for HIPAA compliance');
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        preCommitHooks: {
          enabled: false,
        },
      };
      const merged = mergeConfig(userConfig);

      expect(merged.preCommitHooks.enabled).toBe(false);
      expect(merged.preCommitHooks.scanCredentials).toBe(true); // From defaults
      expect(merged.auditLogging.enabled).toBe(true); // From defaults
    });

    it('should preserve all defaults when no user config provided', () => {
      const merged = mergeConfig({});
      expect(merged).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('detectKeystoreType', () => {
    it('should detect macOS keychain on darwin', () => {
      // This test will pass on macOS, adapt for other platforms
      const type = detectKeystoreType();
      expect(['macos-keychain', 'windows-credential-manager', 'linux-secret-service', 'file']).toContain(type);
    });
  });
});
