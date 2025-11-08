/**
 * Run MCP Tests Tool
 *
 * Execute unit and integration tests for an MCP server with optional coverage reporting.
 */

import { TestRunner } from '../utils/test-runner.js';
import type { RunMcpTestsInput, RunMcpTestsOutput } from '../types.js';

export class RunMcpTestsTool {
  /**
   * Get tool definition for MCP server
   */
  static getToolDefinition() {
    return {
      name: 'run_mcp_tests',
      description: 'Execute unit and integration tests for an MCP server',
      inputSchema: {
        type: 'object',
        properties: {
          mcpPath: {
            type: 'string',
            description: 'Path to MCP dev-instance or local-instance',
          },
          testType: {
            type: 'string',
            enum: ['unit', 'integration', 'all'],
            description: 'Type of tests to run (default: all)',
          },
          coverage: {
            type: 'boolean',
            description: 'Generate coverage report (default: false)',
          },
          verbose: {
            type: 'boolean',
            description: 'Detailed output (default: false)',
          },
        },
        required: ['mcpPath'],
      },
    };
  }

  /**
   * Execute the tool
   */
  static async execute(input: RunMcpTestsInput): Promise<RunMcpTestsOutput> {
    try {
      // Validate input
      if (!input.mcpPath) {
        return {
          success: false,
          results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
          error: 'mcpPath is required',
        };
      }

      // Set defaults
      const testType = input.testType || 'all';
      const coverage = input.coverage || false;
      const verbose = input.verbose || false;

      // Create test runner and execute tests
      const runner = new TestRunner(input.mcpPath, verbose);
      const result = await runner.run(testType, coverage);

      // Add formatted summary
      const formatted = this.formatResults(result);

      return {
        ...result,
        formatted,
      } as any;
    } catch (error) {
      return {
        success: false,
        results: { total: { passed: 0, failed: 0, skipped: 0, executionTime: 0 } },
        error: `Tool execution failed: ${error}`,
      };
    }
  }

  /**
   * Format results for display
   */
  private static formatResults(result: RunMcpTestsOutput): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('TEST RESULTS');
    lines.push('='.repeat(60));
    lines.push('');

    if (!result.success) {
      lines.push(`❌ Tests Failed`);
      lines.push('');
      if (result.error) {
        lines.push(`Error: ${result.error}`);
      }
      return lines.join('\n');
    }

    // Overall results
    const { total } = result.results;
    lines.push(`Status: ${total.failed === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');

    // Test counts
    if (result.results.unit) {
      lines.push(`Unit Tests:        ${result.results.unit.passed} passed, ${result.results.unit.failed} failed, ${result.results.unit.skipped} skipped`);
    }
    if (result.results.integration) {
      lines.push(`Integration Tests: ${result.results.integration.passed} passed, ${result.results.integration.failed} failed, ${result.results.integration.skipped} skipped`);
    }
    lines.push(`Total:             ${total.passed} passed, ${total.failed} failed, ${total.skipped} skipped`);
    lines.push('');

    // Execution time
    const timeInSeconds = (total.executionTime / 1000).toFixed(2);
    lines.push(`Execution Time: ${timeInSeconds}s`);
    lines.push('');

    // Coverage
    if (result.coverage) {
      lines.push('-'.repeat(60));
      lines.push('COVERAGE');
      lines.push('-'.repeat(60));
      lines.push('');
      lines.push(`Overall:    ${result.coverage.overall}% ${result.coverage.overall >= 70 ? '✅' : '⚠️'}`);
      lines.push(`Statements: ${result.coverage.statements}%`);
      lines.push(`Branches:   ${result.coverage.branches}%`);
      lines.push(`Functions:  ${result.coverage.functions}%`);
      lines.push(`Lines:      ${result.coverage.lines}%`);
      lines.push('');

      if (result.coverage.overall < 70) {
        lines.push('⚠️  Coverage below 70% threshold');
        lines.push('');
      }

      // Show files with low coverage
      const lowCoverageFiles = result.coverage.files
        .filter((f) => f.statements < 70)
        .sort((a, b) => a.statements - b.statements)
        .slice(0, 5);

      if (lowCoverageFiles.length > 0) {
        lines.push('Files with low coverage (<70%):');
        for (const file of lowCoverageFiles) {
          lines.push(`  ${file.statements}% - ${file.path}`);
        }
        lines.push('');
      }
    }

    // Failures
    if (result.failures && result.failures.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('FAILURES');
      lines.push('-'.repeat(60));
      lines.push('');

      for (const failure of result.failures.slice(0, 10)) {
        lines.push(`❌ ${failure.test}`);
        lines.push(`   Suite: ${failure.suite}`);
        lines.push(`   Error: ${failure.error.split('\n')[0]}`);
        lines.push('');
      }

      if (result.failures.length > 10) {
        lines.push(`... and ${result.failures.length - 10} more failures`);
        lines.push('');
      }
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}
