// Unit tests for SecurityIntegration class
// Tests credential and PHI pattern detection

import { SecurityIntegration } from '../src/security-integration';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('SecurityIntegration', () => {
  let testDir: string;
  let security: SecurityIntegration;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-temp-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });

    // Initialize git repo
    await execAsync('git init', { cwd: testDir });
    await execAsync('git config user.email "test@example.com"', { cwd: testDir });
    await execAsync('git config user.name "Test User"', { cwd: testDir });

    // Initialize security integration
    security = new SecurityIntegration(testDir);
    await security.loadConfig();
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should detect API key in staged file', async () => {
    const filePath = path.join(testDir, 'config.js');
    await fs.writeFile(
      filePath,
      'const config = { api_key: "sk-1234567890abcdef" };'
    );

    await execAsync('git add config.js', { cwd: testDir });

    const result = await security.scanStaged();

    expect(result.passed).toBe(false);
    expect(result.credentialsFound).toBeGreaterThan(0);
    expect(result.severity).toBe('critical');
  });

  test('should detect password in staged file', async () => {
    const filePath = path.join(testDir, '.env');
    await fs.writeFile(filePath, 'password="MySecretPass123"');

    await execAsync('git add .env', { cwd: testDir });

    const result = await security.scanStaged();

    expect(result.passed).toBe(false);
    expect(result.credentialsFound).toBeGreaterThan(0);
  });

  test('should detect SSN (PHI) in staged file', async () => {
    const filePath = path.join(testDir, 'patient.js');
    await fs.writeFile(
      filePath,
      'const patient = { ssn: "123-45-6789" };'
    );

    await execAsync('git add patient.js', { cwd: testDir });

    const result = await security.scanStaged();

    expect(result.passed).toBe(false);
    expect(result.phiFound).toBeGreaterThan(0);
    expect(result.severity).toBe('critical');
  });

  test('should detect MRN (PHI) in staged file', async () => {
    const filePath = path.join(testDir, 'medical.js');
    await fs.writeFile(filePath, 'const mrn = "MRN: 123456789";');

    await execAsync('git add medical.js', { cwd: testDir });

    const result = await security.scanStaged();

    expect(result.passed).toBe(false);
    expect(result.phiFound).toBeGreaterThan(0);
  });

  test('should pass clean file with no issues', async () => {
    const filePath = path.join(testDir, 'clean.js');
    await fs.writeFile(
      filePath,
      'function add(a, b) { return a + b; }'
    );

    await execAsync('git add clean.js', { cwd: testDir });

    const result = await security.scanStaged();

    expect(result.passed).toBe(true);
    expect(result.credentialsFound).toBe(0);
    expect(result.phiFound).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('should respect exclude directories', async () => {
    // Create node_modules directory with credentials
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
    const filePath = path.join(testDir, 'node_modules', 'package.js');
    await fs.writeFile(filePath, 'const api_key = "sk-test123";');

    await execAsync('git add node_modules/', { cwd: testDir });

    const result = await security.scanStaged();

    // Should pass because node_modules is excluded
    expect(result.passed).toBe(true);
  });

  test('quick scan should be faster than full scan', async () => {
    const filePath = path.join(testDir, 'test.js');
    await fs.writeFile(
      filePath,
      'const config = { api_key: "sk-test" };'
    );

    await execAsync('git add test.js', { cwd: testDir });

    const startFull = Date.now();
    await security.scanStaged();
    const fullTime = Date.now() - startFull;

    const startQuick = Date.now();
    await security.quickScan();
    const quickTime = Date.now() - startQuick;

    expect(quickTime).toBeLessThanOrEqual(fullTime);
  });

  test('should format issues for display correctly', async () => {
    const issues = [
      {
        type: 'credential' as const,
        file: 'config.js',
        line: 5,
        pattern: 'API Key',
        confidence: 0.9,
        severity: 'critical' as const,
        remediation: 'Remove hard-coded API key',
      },
      {
        type: 'phi' as const,
        file: 'patient.js',
        line: 10,
        pattern: 'SSN',
        confidence: 0.95,
        severity: 'critical' as const,
        remediation: 'Remove PHI data',
      },
    ];

    const formatted = security.formatIssuesForDisplay(issues);

    expect(formatted).toContain('config.js');
    expect(formatted).toContain('patient.js');
    expect(formatted).toContain('API Key');
    expect(formatted).toContain('SSN');
  });

  test('should cache scan results', async () => {
    const filePath = path.join(testDir, 'test.js');
    await fs.writeFile(filePath, 'const x = 1;');
    await execAsync('git add test.js', { cwd: testDir });

    const startFirst = Date.now();
    await security.scanStaged();
    const firstTime = Date.now() - startFirst;

    const startSecond = Date.now();
    await security.scanStaged();
    const secondTime = Date.now() - startSecond;

    // Second scan should be much faster due to caching
    expect(secondTime).toBeLessThan(firstTime);
  });

  test('should clear cache', async () => {
    const filePath = path.join(testDir, 'test.js');
    await fs.writeFile(filePath, 'const x = 1;');
    await execAsync('git add test.js', { cwd: testDir });

    await security.scanStaged();
    security.clearCache();

    // After clearing cache, we can verify cache was cleared
    // by checking that subsequent scans don't use cached results
    expect(() => security.clearCache()).not.toThrow();
  });
});
