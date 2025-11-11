/**
 * Unit tests for StandardsValidator
 */

import { StandardsValidator } from '../../src/utils/standards-validator';

describe('StandardsValidator', () => {
  describe('constructor', () => {
    it('should create a StandardsValidator instance', () => {
      const validator = new StandardsValidator('/fake/path');
      expect(validator).toBeInstanceOf(StandardsValidator);
    });

    it('should accept custom standards array', () => {
      const validator = new StandardsValidator('/fake/path', ['fileStructure', 'naming']);
      expect(validator).toBeInstanceOf(StandardsValidator);
    });
  });

  describe('validate', () => {
    it('should return error for non-existent path', async () => {
      const validator = new StandardsValidator('/non/existent/path');
      const result = await validator.validate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should validate current project structure', async () => {
      // Use current project as test subject
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new StandardsValidator(projectPath);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(result.compliance.overall).toBeGreaterThan(0);
      expect(result.compliance.categories).toHaveProperty('fileStructure');
      expect(result.compliance.categories).toHaveProperty('naming');
      expect(result.compliance.categories).toHaveProperty('documentation');
      expect(result.compliance.categories).toHaveProperty('code');
      expect(result.compliance.categories).toHaveProperty('mcp');
    });

    it('should provide recommendations for low scores', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new StandardsValidator(projectPath);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('validation categories', () => {
    it('should validate file structure', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new StandardsValidator(projectPath, ['fileStructure']);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(result.compliance.categories.fileStructure).toBeDefined();
      expect(typeof result.compliance.categories.fileStructure.passed).toBe('number');
      expect(typeof result.compliance.categories.fileStructure.failed).toBe('number');
    });

    it('should validate code standards', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const validator = new StandardsValidator(projectPath, ['code']);
      const result = await validator.validate();

      expect(result.success).toBe(true);
      expect(result.compliance.categories.code).toBeDefined();
      expect(typeof result.compliance.categories.code.score).toBe('number');
    });
  });
});
