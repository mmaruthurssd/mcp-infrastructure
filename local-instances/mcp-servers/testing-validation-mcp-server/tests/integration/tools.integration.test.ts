/**
 * Integration tests for Testing & Validation MCP tools
 *
 * Tests all tools with real MCP project structure
 */

import { RunMcpTestsTool } from '../../src/tools/run-mcp-tests.js';
import { ValidateMcpImplementationTool } from '../../src/tools/validate-mcp-implementation.js';
import { CheckQualityGatesTool } from '../../src/tools/check-quality-gates.js';
import { GenerateCoverageReportTool } from '../../src/tools/generate-coverage-report.js';
import { RunSmokeTestsTool } from '../../src/tools/run-smoke-tests.js';
import { ValidateToolSchemaTool } from '../../src/tools/validate-tool-schema.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Testing & Validation MCP Tools - Integration Tests', () => {
  let testMcpPath: string;

  beforeAll(() => {
    // Create test MCP structure
    testMcpPath = join(process.cwd(), 'tests', 'fixtures', 'test-mcp');

    if (existsSync(testMcpPath)) {
      rmSync(testMcpPath, { recursive: true, force: true });
    }

    mkdirSync(testMcpPath, { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'test-mcp',
      version: '0.1.0',
      scripts: {
        test: 'jest',
        build: 'tsc'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.0.4'
      }
    };
    writeFileSync(join(testMcpPath, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create tests directory
    mkdirSync(join(testMcpPath, 'tests', 'unit'), { recursive: true });

    // Create a simple test file
    const testContent = `
describe('Sample test', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});
`;
    writeFileSync(join(testMcpPath, 'tests', 'unit', 'sample.test.ts'), testContent);

    // Create src directory with server.ts
    mkdirSync(join(testMcpPath, 'src'), { recursive: true });
    const serverContent = `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

class TestMCP {
  private server: Server;

  constructor() {
    this.server = new Server({ name: 'test-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
  }
}

export default TestMCP;
`;
    writeFileSync(join(testMcpPath, 'src', 'server.ts'), serverContent);

    // Create README.md
    const readmeContent = `---
type: readme
tags: [mcp, test]
---

# Test MCP

Test MCP server for integration testing.
`;
    writeFileSync(join(testMcpPath, 'README.md'), readmeContent);

    // Create tsconfig.json
    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ES2020',
        outDir: './dist',
        rootDir: './src',
        strict: true
      }
    };
    writeFileSync(join(testMcpPath, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2));
  });

  afterAll(() => {
    // Clean up test fixtures
    if (existsSync(testMcpPath)) {
      rmSync(testMcpPath, { recursive: true, force: true });
    }
  });

  describe('run_mcp_tests', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await RunMcpTestsTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should return error for non-existent MCP path', async () => {
      const result = await RunMcpTestsTool.execute({
        mcpPath: '/non/existent/path'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should return error for MCP without tests directory', async () => {
      const tempPath = join(process.cwd(), 'tests', 'fixtures', 'no-tests');
      mkdirSync(tempPath, { recursive: true });

      // Create package.json but no tests directory
      const packageJson = {
        name: 'test-mcp',
        version: '0.1.0',
        scripts: { test: 'jest' }
      };
      writeFileSync(join(tempPath, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = await RunMcpTestsTool.execute({ mcpPath: tempPath });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tests directory not found');

      rmSync(tempPath, { recursive: true, force: true });
    });
  });

  describe('validate_mcp_implementation', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await ValidateMcpImplementationTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should validate MCP structure', async () => {
      const result = await ValidateMcpImplementationTool.execute({
        mcpPath: testMcpPath
      });

      expect(result).toBeDefined();
      expect(result.compliance).toBeDefined();
      expect(result.compliance.overall).toBeGreaterThanOrEqual(0);
      expect(result.compliance.categories).toBeDefined();
    });

    test('should validate specific standards when provided', async () => {
      const result = await ValidateMcpImplementationTool.execute({
        mcpPath: testMcpPath,
        standards: ['fileStructure', 'documentation']
      });

      expect(result).toBeDefined();
      expect(result.compliance).toBeDefined();
    });
  });

  describe('check_quality_gates', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await CheckQualityGatesTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should check quality gates for MCP', async () => {
      const result = await CheckQualityGatesTool.execute({
        mcpPath: testMcpPath
      });

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.overall.passed).toBeGreaterThanOrEqual(0);
      expect(result.overall.failed).toBeGreaterThanOrEqual(0);
    });

    test('should check specific phase when provided', async () => {
      const result = await CheckQualityGatesTool.execute({
        mcpPath: testMcpPath,
        phase: 'development'
      });

      expect(result).toBeDefined();
      expect(result.gates).toBeDefined();
    });
  });

  describe('generate_coverage_report', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await GenerateCoverageReportTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should handle MCP without coverage data', async () => {
      const result = await GenerateCoverageReportTool.execute({
        mcpPath: testMcpPath
      });

      expect(result).toBeDefined();
      // Should handle gracefully even if no coverage exists
    });
  });

  describe('run_smoke_tests', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await RunSmokeTestsTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should run smoke tests on MCP', async () => {
      const result = await RunSmokeTestsTool.execute({
        mcpPath: testMcpPath
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('validate_tool_schema', () => {
    test('should validate input and return error for missing mcpPath', async () => {
      const result = await ValidateToolSchemaTool.execute({ mcpPath: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mcpPath is required');
    });

    test('should validate tool schemas', async () => {
      const result = await ValidateToolSchemaTool.execute({
        mcpPath: testMcpPath
      });

      expect(result).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
    });
  });

  describe('End-to-End workflow', () => {
    test('should run complete validation workflow', async () => {
      // 1. Validate MCP implementation
      const validationResult = await ValidateMcpImplementationTool.execute({
        mcpPath: testMcpPath
      });
      expect(validationResult).toBeDefined();
      expect(validationResult.compliance).toBeDefined();

      // 2. Validate tool schemas
      const schemaResult = await ValidateToolSchemaTool.execute({
        mcpPath: testMcpPath
      });
      expect(schemaResult).toBeDefined();
      expect(schemaResult.tools).toBeDefined();

      // 3. Run smoke tests
      const smokeResult = await RunSmokeTestsTool.execute({
        mcpPath: testMcpPath
      });
      expect(smokeResult).toBeDefined();
      expect(smokeResult.results).toBeDefined();

      // 4. Check quality gates
      const gatesResult = await CheckQualityGatesTool.execute({
        mcpPath: testMcpPath
      });
      expect(gatesResult).toBeDefined();
      expect(gatesResult.overall).toBeDefined();

      // All tools should execute without crashing
      expect(true).toBe(true);
    });
  });
});
