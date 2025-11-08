/**
 * Unit tests for CoverageReporter
 */

import { CoverageReporter } from '../../src/utils/coverage-reporter';

describe('CoverageReporter', () => {
  describe('constructor', () => {
    it('should create a CoverageReporter instance with default format', () => {
      const reporter = new CoverageReporter('/fake/path');
      expect(reporter).toBeInstanceOf(CoverageReporter);
    });

    it('should accept custom format', () => {
      const reporter = new CoverageReporter('/fake/path', 'html');
      expect(reporter).toBeInstanceOf(CoverageReporter);
    });
  });

  describe('generate', () => {
    it('should return error for non-existent path', async () => {
      const reporter = new CoverageReporter('/non/existent/path');
      const result = await reporter.generate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should return error when coverage data not found', async () => {
      const projectPath = process.cwd().replace('/dev-instance', '');
      const reporter = new CoverageReporter(projectPath);
      const result = await reporter.generate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Coverage data not found');
    });

    it('should accept valid path but fail if no coverage data', async () => {
      // Use current project path which exists but may not have coverage yet
      const projectPath = process.cwd().replace('/dev-instance', '');
      const reporter = new CoverageReporter(projectPath, 'text');
      const result = await reporter.generate();

      // Should fail because coverage data doesn't exist
      expect(result.success).toBe(false);
      expect(result.error).toContain('Coverage data not found');
    });
  });

  describe('format types', () => {
    it('should support text format', () => {
      const reporter = new CoverageReporter('/fake/path', 'text');
      expect(reporter).toBeInstanceOf(CoverageReporter);
    });

    it('should support html format', () => {
      const reporter = new CoverageReporter('/fake/path', 'html');
      expect(reporter).toBeInstanceOf(CoverageReporter);
    });

    it('should support json format', () => {
      const reporter = new CoverageReporter('/fake/path', 'json');
      expect(reporter).toBeInstanceOf(CoverageReporter);
    });
  });
});
