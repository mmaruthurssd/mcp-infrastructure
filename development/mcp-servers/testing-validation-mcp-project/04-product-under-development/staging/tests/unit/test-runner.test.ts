/**
 * Unit tests for TestRunner
 */

import { TestRunner } from '../../src/utils/test-runner';

describe('TestRunner', () => {
  describe('constructor', () => {
    it('should create a TestRunner instance', () => {
      const runner = new TestRunner('/fake/path');
      expect(runner).toBeInstanceOf(TestRunner);
    });

    it('should accept verbose flag', () => {
      const runner = new TestRunner('/fake/path', true);
      expect(runner).toBeInstanceOf(TestRunner);
    });
  });

  describe('run', () => {
    it('should return error for non-existent path', async () => {
      const runner = new TestRunner('/non/existent/path');
      const result = await runner.run();

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should return error for path without tests directory', async () => {
      const runner = new TestRunner('/tmp');
      const result = await runner.run();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tests directory not found');
    });
  });

  describe('validation', () => {
    it('should validate empty path', async () => {
      const runner = new TestRunner('');
      const result = await runner.run();

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
