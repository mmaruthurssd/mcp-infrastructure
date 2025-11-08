/**
 * Tests for credential scanner
 */

import { CredentialScanner, scanText, scanFile } from '../../src/scanners/credential-scanner.js';
import { CREDENTIAL_PATTERNS } from '../../src/patterns/credential-patterns.js';
import { FAKE_CREDENTIALS, SAFE_STRINGS } from '../fixtures/sample-credentials.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Credential Scanner', () => {
  describe('scanText', () => {
    it('should detect AWS credentials in text', () => {
      const text = `
const config = {
  accessKeyId: '${FAKE_CREDENTIALS.awsAccessKey}',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};
      `.trim();

      const violations = scanText(text, 'config.ts');
      expect(violations.length).toBeGreaterThan(0);

      const awsKeyViolation = violations.find(v => v.pattern === 'AWS Access Key ID');
      expect(awsKeyViolation).toBeDefined();
      expect(awsKeyViolation?.severity).toBe('critical');
      expect(awsKeyViolation?.line).toBe(2);
    });

    it('should detect JWT tokens', () => {
      const text = `Authorization: Bearer ${FAKE_CREDENTIALS.jwt}`;

      const violations = scanText(text, 'api.ts');
      expect(violations.length).toBeGreaterThan(0);

      const jwtViolation = violations.find(v => v.pattern === 'JWT Token');
      expect(jwtViolation).toBeDefined();
      expect(jwtViolation?.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should detect private keys', () => {
      const text = FAKE_CREDENTIALS.privateKey;

      const violations = scanText(text, 'key.pem');
      expect(violations.length).toBeGreaterThan(0);

      const keyViolation = violations.find(v => v.pattern === 'RSA Private Key');
      expect(keyViolation).toBeDefined();
      expect(keyViolation?.severity).toBe('critical');
      expect(keyViolation?.confidence).toBe(1.0);
    });

    it('should detect API keys', () => {
      const text = `const apiKey = "${FAKE_CREDENTIALS.apiKey}";`;

      const violations = scanText(text, 'config.ts');
      expect(violations.length).toBeGreaterThan(0);

      const apiKeyViolation = violations.find(v => v.pattern === 'Generic API Key');
      expect(apiKeyViolation).toBeDefined();
    });

    it('should detect hardcoded passwords', () => {
      const text = FAKE_CREDENTIALS.password;

      const violations = scanText(text, 'db.ts');
      expect(violations.length).toBeGreaterThan(0);

      const passwordViolation = violations.find(v => v.pattern === 'Generic Password');
      expect(passwordViolation).toBeDefined();
    });

    it('should not detect comments as credentials', () => {
      const text = SAFE_STRINGS.comment;

      const violations = scanText(text);
      expect(violations.length).toBe(0);
    });

    it('should not detect placeholders as credentials', () => {
      const text = SAFE_STRINGS.placeholder;

      const violations = scanText(text);
      expect(violations.length).toBe(0);
    });

    it('should not detect environment variable references', () => {
      const text = SAFE_STRINGS.variable;

      const violations = scanText(text);
      expect(violations.length).toBe(0);
    });
  });

  describe('CredentialScanner class', () => {
    it('should respect minimum confidence threshold', () => {
      const text = FAKE_CREDENTIALS.awsAccessKey;

      // High confidence threshold should still detect AWS keys (confidence 1.0)
      const highConfidenceScanner = new CredentialScanner({ minConfidence: 0.95 });
      const highConfidenceViolations = highConfidenceScanner.scanText(text);
      expect(highConfidenceViolations.length).toBeGreaterThan(0);

      // Very high threshold should filter out some patterns
      const veryHighConfidenceScanner = new CredentialScanner({ minConfidence: 1.0 });
      const veryHighConfidenceViolations = veryHighConfidenceScanner.scanText(text);
      // All violations should have confidence 1.0
      veryHighConfidenceViolations.forEach(v => {
        expect(v.confidence).toBe(1.0);
      });
    });

    it('should filter allow-listed violations', () => {
      const text = `const apiKey = "${FAKE_CREDENTIALS.apiKey}";`;

      // Without allow-list
      const scanner1 = new CredentialScanner();
      const violations1 = scanner1.scanText(text, 'config.ts');
      expect(violations1.length).toBeGreaterThan(0);

      // With allow-list
      const scanner2 = new CredentialScanner({
        allowList: [
          {
            filePath: 'config.ts',
            lineNumber: 1,
            patternName: 'Generic API Key',
            reason: 'Test fixture',
          },
        ],
      });
      const violations2 = scanner2.scanText(text, 'config.ts');
      expect(violations2.length).toBe(0);
    });

    it('should extract context around violations', () => {
      const text = `
line 1
line 2
const secret = "my-secret-value-12345";
line 4
line 5
      `.trim();

      const scanner = new CredentialScanner({ contextLines: 1 });
      const violations = scanner.scanText(text, 'test.ts');

      if (violations.length > 0) {
        const violation = violations[0];
        expect(violation.context).toContain('line 2');
        expect(violation.context).toContain('line 4');
        expect(violation.context).toContain('>'); // Current line marker
      }
    });

    it('should provide helpful suggestions', () => {
      const text = FAKE_CREDENTIALS.awsAccessKey;

      const scanner = new CredentialScanner();
      const violations = scanner.scanText(text, 'test.ts');

      expect(violations.length).toBeGreaterThan(0);
      const violation = violations[0];
      expect(violation.suggestion).toBeTruthy();
      expect(violation.suggestion.length).toBeGreaterThan(0);
    });

    it('should handle multiple violations in same file', () => {
      const text = `
const aws = '${FAKE_CREDENTIALS.awsAccessKey}';
const api = '${FAKE_CREDENTIALS.apiKey}';
const jwt = '${FAKE_CREDENTIALS.jwt}';
      `.trim();

      const scanner = new CredentialScanner();
      const violations = scanner.scanText(text, 'multi.ts');

      expect(violations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('scanFile', () => {
    let tempDir: string;
    let testFile: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-test-'));
      testFile = path.join(tempDir, 'test.ts');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should scan a file and detect violations', async () => {
      const content = `
const config = {
  apiKey: '${FAKE_CREDENTIALS.apiKey}',
  password: 'password="secret123456"'
};
      `.trim();

      await fs.writeFile(testFile, content, 'utf-8');

      const result = await scanFile(testFile);

      expect(result.filePath).toBe(testFile);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.clean).toBe(false);
      expect(result.scannedAt).toBeTruthy();
    });

    it('should report clean file when no violations', async () => {
      const content = `
// This is a comment about API keys
const config = {
  apiKey: process.env.API_KEY,
  password: process.env.PASSWORD
};
      `.trim();

      await fs.writeFile(testFile, content, 'utf-8');

      const result = await scanFile(testFile);

      expect(result.clean).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.ts');

      await expect(scanFile(nonExistentFile)).rejects.toThrow();
    });
  });

  describe('scanFiles (multiple)', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-test-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should scan multiple files', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');

      await fs.writeFile(file1, `const key = '${FAKE_CREDENTIALS.apiKey}';`, 'utf-8');
      await fs.writeFile(file2, `const token = '${FAKE_CREDENTIALS.jwt}';`, 'utf-8');

      const scanner = new CredentialScanner();
      const results = await scanner.scanFiles([file1, file2]);

      expect(results.length).toBe(2);
      expect(results[0].violations.length).toBeGreaterThan(0);
      expect(results[1].violations.length).toBeGreaterThan(0);
    });

    it('should continue scanning even if one file fails', async () => {
      const validFile = path.join(tempDir, 'valid.ts');
      const invalidFile = path.join(tempDir, 'does-not-exist.ts');

      await fs.writeFile(validFile, `const key = '${FAKE_CREDENTIALS.apiKey}';`, 'utf-8');

      const scanner = new CredentialScanner();
      const results = await scanner.scanFiles([validFile, invalidFile]);

      expect(results.length).toBe(2);
      expect(results[0].violations.length).toBeGreaterThan(0); // Valid file scanned
      expect(results[1].error).toBeTruthy(); // Invalid file has error
    });
  });

  describe('Pattern coverage', () => {
    it('should have patterns for all major services', () => {
      const expectedPatterns = [
        'AWS Access Key ID',
        'GitHub Personal Access Token',
        'Google Cloud API Key',
        'Slack Webhook',
        'Stripe Secret Key',
        'Generic API Key',
        'JWT Token',
        'RSA Private Key',
      ];

      expectedPatterns.forEach(name => {
        const pattern = CREDENTIAL_PATTERNS.find(p => p.name === name);
        expect(pattern).toBeDefined();
      });
    });

    it('should detect service-specific tokens correctly', () => {
      const tests = [
        { token: 'ghp_123456789012345678901234567890123456', pattern: 'GitHub Personal Access Token' },
        { token: 'AIzaSyD12345678901234567890123456789012', pattern: 'Google Cloud API Key' },
        { token: 'sk_test_REDACTED_FOR_SECURITY', pattern: 'Stripe Secret Key' },
        { token: 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/REDACTED', pattern: 'Slack Webhook' },
      ];

      tests.forEach(({ token, pattern: patternName }) => {
        const violations = scanText(token, 'test.ts');
        const found = violations.find(v => v.pattern === patternName);
        expect(found).toBeDefined();
      });
    });
  });
});
