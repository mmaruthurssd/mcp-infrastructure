/**
 * Unit tests for QualityGateValidator
 */

// Mock TestRunner to avoid circular dependency issues in tests
jest.mock('../../src/utils/test-runner', () => ({
  TestRunner: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue({
      success: true,
      results: {
        unit: { passed: 5, failed: 0, skipped: 0, executionTime: 1000 },
        total: { passed: 5, failed: 0, skipped: 0, executionTime: 1000 },
      },
      coverage: { overall: 85, statements: 85, branches: 80, functions: 90, lines: 85, files: [] },
    }),
  })),
}));

// Mock StandardsValidator to avoid dependency issues
jest.mock('../../src/utils/standards-validator', () => ({
  StandardsValidator: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({
      success: true,
      compliance: {
        overall: 85,
        categories: {
          fileStructure: { passed: 5, failed: 1, issues: [] },
          naming: { passed: 10, failed: 0, issues: [] },
          documentation: { passed: 3, failed: 0, issues: [] },
          code: { passed: 4, failed: 0, issues: [] },
          mcp: { passed: 5, failed: 0, issues: [] },
        },
      },
      recommendations: [],
    }),
  })),
}));

import { QualityGateValidator } from '../../src/utils/quality-gate-validator';

describe('QualityGateValidator', () => {
  describe('constructor', () => {
    it('should create a QualityGateValidator instance', () => {
      const validator = new QualityGateValidator('/fake/path');
      expect(validator).toBeInstanceOf(QualityGateValidator);
    });

    it('should accept custom phase', () => {
      const validator = new QualityGateValidator('/fake/path', 'testing');
      expect(validator).toBeInstanceOf(QualityGateValidator);
    });
  });

  describe('validate', () => {
    it('should return error for non-existent path', async () => {
      const validator = new QualityGateValidator('/non/existent/path');
      const result = await validator.validate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should validate current project', async () => {
      // Use current project as test subject
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new QualityGateValidator(projectPath);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(result.overall).toBeDefined();
      expect(result.overall.passed).toBeGreaterThanOrEqual(0);
      expect(result.overall.failed).toBeGreaterThanOrEqual(0);
      expect(typeof result.overall.percentComplete).toBe('number');
      expect(typeof result.overall.readyForRollout).toBe('boolean');
    });

    it('should return blockers and warnings', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new QualityGateValidator(projectPath);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.blockers)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('phase validation', () => {
    it('should validate specific phase', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new QualityGateValidator(projectPath, 'pre-development');
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(result.gates.preDevelopment).toBeDefined();
    });

    it('should validate all phases', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new QualityGateValidator(projectPath, 'all');
      const result = await validator.validate();

      expect(result.success).toBe(true);
      // At least some phases should be validated
      expect(Object.keys(result.gates).length).toBeGreaterThan(0);
    });
  });
});
