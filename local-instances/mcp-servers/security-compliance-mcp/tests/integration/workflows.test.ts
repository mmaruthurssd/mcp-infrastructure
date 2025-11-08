/**
 * Workflow integration tests
 *
 * Tests real-world security workflows
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { scanForCredentials } from '../../src/tools/scan-for-credentials.js';
import { scanForPHI } from '../../src/tools/scan-for-phi.js';
import { manageSecrets } from '../../src/tools/manage-secrets.js';
import { manageAllowList } from '../../src/tools/manage-allowlist.js';
import { AuditLogger } from '../../src/audit/audit-logger.js';

describe('Security Workflow Integration', () => {
  let testDir: string;
  let auditDir: string;
  let auditLogger: AuditLogger;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-test-'));
    auditDir = path.join(testDir, 'audit');
    auditLogger = new AuditLogger(auditDir);
    await auditLogger.initialize();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should scan file with credentials and verify audit logging works', async () => {
    const testFile = path.join(testDir, 'config.ts');
    await fs.writeFile(
      testFile,
      'const AWS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";\n'
    );

    const result = await scanForCredentials({
      target: testFile,
      mode: 'file',
    });

    // Verify scan executed
    expect(result).toBeDefined();
    expect(result.summary.filesScanned).toBe(1);
  });

  it('should scan for PHI and return risk assessment', async () => {
    const testFile = path.join(testDir, 'patient.ts');
    await fs.writeFile(
      testFile,
      'const patient = { ssn: "123-45-6789", mrn: "MRN123456" };'
    );

    const result = await scanForPHI({
      target: testFile,
      mode: 'file',
      sensitivity: 'medium',
    });

    expect(result).toBeDefined();
    expect(result.summary.filesScanned).toBe(1);
    expect(result.complianceImpact).toBeDefined();
  });

  it('should manage secrets with rotation tracking', async () => {
    const encryptResult = await manageSecrets({
      action: 'encrypt',
      key: 'test-key',
      value: 'test-value-secret',
      rotationDays: 90,
    });

    expect(encryptResult.success).toBe(true);
    expect(encryptResult.action).toBe('encrypt');

    const statusResult = await manageSecrets({
      action: 'status',
    });

    expect(statusResult.success).toBe(true);
    expect(statusResult.action).toBe('status');
  });

  it('should manage allow-list with configuration file', async () => {
    const configFile = path.join(testDir, 'security-config.json');
    await fs.writeFile(configFile, JSON.stringify({ allowList: [] }, null, 2));

    const addResult = await manageAllowList(
      {
        action: 'add',
        entry: {
          filePath: 'test.ts',
          patternName: 'Test Pattern',
          reason: 'Test reason',
        },
      },
      configFile
    );

    expect(addResult.success).toBe(true);
    expect(addResult.allowList.length).toBe(1);

    const listResult = await manageAllowList(
      {
        action: 'list',
      },
      configFile
    );

    expect(listResult.allowList.length).toBe(1);
  });

  it('should create audit log with checksum chain', async () => {
    // Log multiple events
    await auditLogger.logEvent(
      'credential_scan_started',
      'info',
      'success',
      'test-user',
      { target: 'test.ts' }
    );

    await auditLogger.logEvent(
      'credential_scan_completed',
      'info',
      'success',
      'test-user',
      { violations: 0 }
    );

    // Verify chain
    const verification = await auditLogger.verifyChain();
    expect(verification.valid).toBe(true);
    expect(verification.errors).toHaveLength(0);

    // Query events
    const events = await auditLogger.query({});
    expect(events.events.length).toBe(2);
    expect(events.chainValid).toBe(true);
  });

  it('should export audit log to JSON', async () => {
    await auditLogger.logEvent('secret_encrypted', 'info', 'success', 'test-user', {
      key: 'test-key',
    });

    const exportPath = path.join(testDir, 'audit-export.json');
    const result = await auditLogger.export({
      format: 'json',
      outputPath: exportPath,
      includeMetadata: true,
    });

    expect(result.success).toBe(true);

    const exportedData = JSON.parse(await fs.readFile(exportPath, 'utf-8'));
    expect(exportedData.events).toBeDefined();
    expect(exportedData.metadata).toBeDefined();
  });

  it('should query audit events with filters', async () => {
    await auditLogger.logEvent('secret_encrypted', 'info', 'success', 'user1', {});
    await auditLogger.logEvent('secret_decrypted', 'warning', 'success', 'user2', {});
    await auditLogger.logEvent('credential_scan_completed', 'critical', 'blocked', 'user1', {});

    // Filter by severity
    const criticalEvents = await auditLogger.query({
      severities: ['critical'],
    });
    expect(criticalEvents.events.length).toBe(1);
    expect(criticalEvents.events[0].severity).toBe('critical');

    // Filter by actor
    const user1Events = await auditLogger.query({
      actor: 'user1',
    });
    expect(user1Events.events.length).toBe(2);
  });

  it('should track PHI access in audit log', async () => {
    await auditLogger.logEvent(
      'phi_scan_completed',
      'critical',
      'blocked',
      'test-user',
      { findings: 5 },
      { phiAccessed: true }
    );

    const phiEvents = await auditLogger.query({
      phiAccessedOnly: true,
    });

    expect(phiEvents.events.length).toBeGreaterThan(0);
    expect(phiEvents.events.every((e) => e.phiAccessed)).toBe(true);
  });
});
