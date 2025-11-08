/**
 * End-to-end integration tests
 *
 * Tests full workflows across multiple components
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { scanForCredentials } from '../../src/tools/scan-for-credentials.js';
import { scanForPHI } from '../../src/tools/scan-for-phi.js';
import { manageSecrets } from '../../src/tools/manage-secrets.js';
import { manageAllowList } from '../../src/tools/manage-allowlist.js';
import { AuditLogger } from '../../src/audit/audit-logger.js';

describe('End-to-End Integration Tests', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'e2e-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Full Credential Scanning Workflow', () => {
    it('should scan file, detect credentials, log to audit trail, and verify chain', async () => {
      // 1. Create test file with credentials
      const testFile = path.join(testDir, 'config.ts');
      await fs.writeFile(
        testFile,
        'export const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";\n' +
        'export const GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuv";\n'
      );

      // 2. Scan for credentials
      const scanResult = await scanForCredentials({
        target: testFile,
        mode: 'file',
      });

      // 3. Verify scan detected violations
      expect(scanResult.success).toBe(false);
      expect(scanResult.violations.length).toBeGreaterThan(0);
      expect(scanResult.summary.filesScanned).toBe(1);

      // 4. Verify audit log was created
      const auditEvents = await auditLogger.query({
        eventTypes: ['credential_scan_completed'],
      });

      expect(auditEvents.events.length).toBeGreaterThan(0);
      expect(auditEvents.events[0].eventType).toBe('credential_scan_completed');
      expect(auditEvents.events[0].outcome).toBe('blocked');

      // 5. Verify checksum chain integrity
      const chainVerification = await auditLogger.verifyChain();
      expect(chainVerification.valid).toBe(true);
      expect(chainVerification.errors).toHaveLength(0);
    });

    it('should handle allow-list workflow and audit it', async () => {
      // 1. Create test file
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const token = "test-token-12345";\n');

      // 2. Create config file for allow-list
      const configFile = path.join(testDir, 'security-config.json');
      await fs.writeFile(configFile, JSON.stringify({ allowList: [] }, null, 2));

      // 3. Initial scan should find violation
      let scanResult = await scanForCredentials({
        target: testFile,
        mode: 'file',
      });
      expect(scanResult.violations.length).toBeGreaterThan(0);

      // 4. Add to allow-list
      const allowListResult = await manageAllowList(
        {
          action: 'add',
          entry: {
            filePath: testFile,
            patternName: 'Generic Secret',
            reason: 'Test file, not a real secret',
            addedBy: 'test-user',
          },
        },
        configFile
      );

      expect(allowListResult.success).toBe(true);
      expect(allowListResult.allowList.length).toBe(1);

      // 5. Verify allow-list add was audited
      const auditEvents = await auditLogger.query({
        eventTypes: ['allowlist_entry_added'],
      });
      expect(auditEvents.events.length).toBeGreaterThan(0);
    });
  });

  describe('Full PHI Detection Workflow', () => {
    it('should detect PHI, assess risk, and audit with PHI access flag', async () => {
      // 1. Create test file with PHI
      const testFile = path.join(testDir, 'patient-data.ts');
      await fs.writeFile(
        testFile,
        `const patientData = {
          ssn: "123-45-6789",
          mrn: "MRN-ABC123456",
          dob: "01/15/1980",
          name: "John Doe"
        };`
      );

      // 2. Scan for PHI
      const scanResult = await scanForPHI({
        target: testFile,
        mode: 'file',
        sensitivity: 'high',
      });

      // 3. Verify PHI was detected
      expect(scanResult.phiDetected).toBe(true);
      expect(scanResult.findings.length).toBeGreaterThan(0);
      expect(scanResult.summary.riskLevel).toBe('critical');
      expect(scanResult.summary.categoriesDetected).toContain('identifier');

      // 4. Verify audit log with PHI access flag
      const auditEvents = await auditLogger.query({
        eventTypes: ['phi_scan_completed'],
      });

      expect(auditEvents.events.length).toBeGreaterThan(0);
      const phiEvent = auditEvents.events.find((e) => e.eventType === 'phi_scan_completed');
      expect(phiEvent?.phiAccessed).toBe(true);

      // 5. Query only PHI-accessing events
      const phiOnlyEvents = await auditLogger.query({
        phiAccessedOnly: true,
      });

      expect(phiOnlyEvents.events.length).toBeGreaterThan(0);
      expect(phiOnlyEvents.events.every((e) => e.phiAccessed)).toBe(true);
    });
  });

  describe('Full Secrets Management Workflow', () => {
    it('should encrypt, decrypt, rotate secrets and audit all operations', async () => {
      // 1. Encrypt a secret
      const encryptResult = await manageSecrets({
        action: 'encrypt',
        key: 'test-api-key',
        value: 'secret-value-12345',
        rotationDays: 30,
      });

      expect(encryptResult.success).toBe(true);
      expect(encryptResult.encrypted).toBe(true);

      // 2. Check status
      const statusResult = await manageSecrets({
        action: 'status',
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.secrets).toBeDefined();
      expect(statusResult.secrets!.length).toBeGreaterThan(0);
      expect(statusResult.secrets![0].key).toBe('test-api-key');
      expect(statusResult.secrets![0].rotationStatus).toBe('current');

      // 3. Decrypt the secret
      const decryptResult = await manageSecrets({
        action: 'decrypt',
        key: 'test-api-key',
      });

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.message).toBe('secret-value-12345');

      // 4. Rotate the secret
      const rotateResult = await manageSecrets({
        action: 'rotate',
        key: 'test-api-key',
        value: 'new-secret-value-67890',
      });

      expect(rotateResult.success).toBe(true);

      // 5. Verify all operations were audited
      const auditEvents = await auditLogger.query({
        eventTypes: ['secret_encrypted', 'secret_decrypted', 'secret_rotated'],
      });

      expect(auditEvents.events.length).toBeGreaterThanOrEqual(3);

      const encryptEvent = auditEvents.events.find((e) => e.eventType === 'secret_encrypted');
      const decryptEvent = auditEvents.events.find((e) => e.eventType === 'secret_decrypted');
      const rotateEvent = auditEvents.events.find((e) => e.eventType === 'secret_rotated');

      expect(encryptEvent).toBeDefined();
      expect(decryptEvent).toBeDefined();
      expect(rotateEvent).toBeDefined();

      // 6. Verify all events have same correlation ID (from same workflow)
      const correlationIds = auditEvents.events.map((e) => e.correlationId).filter(Boolean);
      expect(correlationIds.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Trail Integrity and Querying', () => {
    it('should maintain checksum chain integrity across multiple operations', async () => {
      // Perform multiple operations
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Operation 1: Credential scan
      await scanForCredentials({
        target: testFile,
        mode: 'file',
      });

      // Operation 2: PHI scan
      await scanForPHI({
        target: testFile,
        mode: 'file',
      });

      // Operation 3: Secret encryption
      await manageSecrets({
        action: 'encrypt',
        key: 'test-key',
        value: 'test-value',
      });

      // Verify chain integrity
      const verification = await auditLogger.verifyChain();
      expect(verification.valid).toBe(true);
      expect(verification.errors).toHaveLength(0);

      // Verify event count
      const allEvents = await auditLogger.query({});
      expect(allEvents.events.length).toBeGreaterThanOrEqual(3);

      // Verify checksums are all different
      const checksums = allEvents.events.map((e) => e.checksum);
      const uniqueChecksums = new Set(checksums);
      expect(uniqueChecksums.size).toBe(checksums.length);
    });

    it('should support complex audit queries with filters', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const API_KEY = "sk-test";');

      // Perform operations
      await scanForCredentials({ target: testFile, mode: 'file' });
      await scanForPHI({ target: testFile, mode: 'file' });
      await manageSecrets({ action: 'encrypt', key: 'test', value: 'value' });

      // Query by event type
      const credentialEvents = await auditLogger.query({
        eventTypes: ['credential_scan_completed'],
      });
      expect(credentialEvents.events.every((e) => e.eventType === 'credential_scan_completed')).toBe(true);

      // Query by severity
      const criticalEvents = await auditLogger.query({
        severities: ['critical'],
      });
      expect(criticalEvents.events.every((e) => e.severity === 'critical')).toBe(true);

      // Query by outcome
      const blockedEvents = await auditLogger.query({
        outcomes: ['blocked'],
      });
      expect(blockedEvents.events.every((e) => e.outcome === 'blocked')).toBe(true);

      // Query with limit
      const limitedEvents = await auditLogger.query({
        limit: 2,
      });
      expect(limitedEvents.events.length).toBeLessThanOrEqual(2);
      expect(limitedEvents.totalCount).toBeGreaterThanOrEqual(limitedEvents.events.length);
    });

    it('should export audit logs in different formats', async () => {
      // Create events
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');
      await scanForCredentials({ target: testFile, mode: 'file' });

      // Export as JSON
      const jsonPath = path.join(testDir, 'audit-export.json');
      const jsonExport = await auditLogger.export({
        format: 'json',
        outputPath: jsonPath,
        includeMetadata: true,
        includeChecksumReport: true,
      });

      expect(jsonExport.success).toBe(true);
      expect(jsonExport.outputPath).toBe(jsonPath);

      // Verify JSON export file
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);
      expect(jsonData.events).toBeDefined();
      expect(jsonData.metadata).toBeDefined();
      expect(jsonData.checksumVerification).toBeDefined();
      expect(jsonData.checksumVerification.valid).toBe(true);

      // Export as CSV
      const csvPath = path.join(testDir, 'audit-export.csv');
      const csvExport = await auditLogger.export({
        format: 'csv',
        outputPath: csvPath,
      });

      expect(csvExport.success).toBe(true);

      // Verify CSV export file
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      expect(csvContent).toContain('ID,Timestamp,Event Type');
      expect(csvContent.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('Correlation ID Tracking', () => {
    it('should track related events with correlation IDs', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const API_KEY = "sk-test-12345";');

      // Scan will create multiple events with same correlation ID
      await scanForCredentials({
        target: testFile,
        mode: 'file',
      });

      const allEvents = await auditLogger.query({});

      // Find scan event
      const scanEvent = allEvents.events.find((e) => e.eventType === 'credential_scan_completed');
      expect(scanEvent).toBeDefined();
      expect(scanEvent!.correlationId).toBeDefined();

      // Query related events
      const relatedEvents = await auditLogger.query({
        correlationId: scanEvent!.correlationId,
      });

      expect(relatedEvents.events.length).toBeGreaterThan(0);
      expect(relatedEvents.events.every((e) => e.correlationId === scanEvent!.correlationId)).toBe(true);
    });
  });

  describe('HIPAA Compliance Features', () => {
    it('should track all required HIPAA audit elements', async () => {
      const testFile = path.join(testDir, 'patient.ts');
      await fs.writeFile(testFile, 'const ssn = "123-45-6789";');

      await scanForPHI({ target: testFile, mode: 'file' });

      const events = await auditLogger.query({
        eventTypes: ['phi_scan_completed'],
      });

      const event = events.events[0];

      // HIPAA requires: who, what, when, outcome, PHI accessed
      expect(event.actor).toBeDefined(); // Who
      expect(event.eventType).toBeDefined(); // What
      expect(event.timestamp).toBeDefined(); // When
      expect(event.outcome).toBeDefined(); // Outcome
      expect(event.phiAccessed).toBe(true); // PHI accessed flag
      expect(event.details).toBeDefined(); // Additional context
    });

    it('should maintain 6-year retention metadata', async () => {
      const metadata = await auditLogger.getMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.retentionUntil).toBeDefined();

      const retentionDate = new Date(metadata!.retentionUntil);
      const creationDate = new Date(metadata!.createdAt);
      const yearsDifference = (retentionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      expect(yearsDifference).toBeCloseTo(6, 0);
    });
  });
});
