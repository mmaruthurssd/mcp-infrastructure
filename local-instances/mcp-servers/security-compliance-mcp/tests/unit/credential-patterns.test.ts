/**
 * Tests for credential patterns
 */

import {
  CREDENTIAL_PATTERNS,
  testPattern,
  getHighConfidencePatterns,
  getCriticalPatterns,
} from '../../src/patterns/credential-patterns.js';
import { FAKE_CREDENTIALS, SAFE_STRINGS } from '../fixtures/sample-credentials.js';

describe('Credential Patterns', () => {
  describe('Pattern Detection', () => {
    it('should detect AWS Access Key', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'AWS Access Key ID');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, FAKE_CREDENTIALS.awsAccessKey)).toBe(true);
    });

    it('should detect JWT tokens', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'JWT Token');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, FAKE_CREDENTIALS.jwt)).toBe(true);
    });

    it('should detect RSA private keys', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'RSA Private Key');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, FAKE_CREDENTIALS.privateKey)).toBe(true);
    });

    it('should detect generic API keys', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic API Key');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, FAKE_CREDENTIALS.apiKey)).toBe(true);
    });

    it('should detect generic passwords', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic Password');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, FAKE_CREDENTIALS.password)).toBe(true);
    });

    it('should detect generic secrets', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic Secret');
      expect(pattern).toBeDefined();
      // Test with quoted secret
      expect(testPattern(pattern!, 'secret="my-secret-value-12345"')).toBe(true);
    });
  });

  describe('False Positive Avoidance', () => {
    it('should not trigger on comments about API keys', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic API Key');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, SAFE_STRINGS.comment)).toBe(false);
    });

    it('should not trigger on placeholder text', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic API Key');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, SAFE_STRINGS.placeholder)).toBe(false);
    });

    it('should not trigger on environment variable references', () => {
      const pattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Generic API Key');
      expect(pattern).toBeDefined();
      expect(testPattern(pattern!, SAFE_STRINGS.variable)).toBe(false);
    });
  });

  describe('Pattern Utilities', () => {
    it('should have multiple patterns defined', () => {
      expect(CREDENTIAL_PATTERNS.length).toBeGreaterThan(10);
    });

    it('should get high confidence patterns', () => {
      const highConfidence = getHighConfidencePatterns(0.95);
      expect(highConfidence.length).toBeGreaterThan(0);
      highConfidence.forEach((p) => {
        expect(p.confidence).toBeGreaterThanOrEqual(0.95);
      });
    });

    it('should get critical patterns', () => {
      const critical = getCriticalPatterns();
      expect(critical.length).toBeGreaterThan(0);
      critical.forEach((p) => {
        expect(p.severity).toBe('critical');
      });
    });

    it('should have confidence scores between 0 and 1', () => {
      CREDENTIAL_PATTERNS.forEach((p) => {
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      CREDENTIAL_PATTERNS.forEach((p) => {
        expect(validSeverities).toContain(p.severity);
      });
    });
  });

  describe('Specific Service Patterns', () => {
    it('should detect GitHub tokens', () => {
      const githubPattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'GitHub Personal Access Token');
      expect(githubPattern).toBeDefined();
      // Must be exactly 36 characters after 'ghp_'
      expect(testPattern(githubPattern!, 'ghp_123456789012345678901234567890123456')).toBe(true);
    });

    it('should detect Google Cloud API keys', () => {
      const googlePattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Google Cloud API Key');
      expect(googlePattern).toBeDefined();
      // Must be exactly 35 characters after 'AIza'
      expect(testPattern(googlePattern!, 'AIzaSyD12345678901234567890123456789012')).toBe(true);
    });

    it('should detect Slack webhooks', () => {
      const slackPattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Slack Webhook');
      expect(slackPattern).toBeDefined();
      expect(testPattern(slackPattern!, 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX')).toBe(true);
    });

    it('should detect Stripe live keys', () => {
      const stripePattern = CREDENTIAL_PATTERNS.find((p) => p.name === 'Stripe Secret Key');
      expect(stripePattern).toBeDefined();
      expect(testPattern(stripePattern!, 'sk_live_1234567890abcdefghijklmn')).toBe(true);
    });
  });
});
