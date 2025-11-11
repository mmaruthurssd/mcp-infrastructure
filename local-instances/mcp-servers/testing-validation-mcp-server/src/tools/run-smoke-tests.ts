/**
 * Run Smoke Tests Tool
 *
 * Run basic smoke tests on MCP tools to verify they're callable
 * and handle basic scenarios correctly.
 */

import { SmokeTester } from '../utils/smoke-tester.js';
import type { RunSmokeTestsInput, RunSmokeTestsOutput } from '../types.js';

export class RunSmokeTestsTool {
  /**
   * Get tool definition for MCP server
   */
  static getToolDefinition() {
    return {
      name: 'run_smoke_tests',
      description: 'Run basic smoke tests on MCP tools',
      inputSchema: {
        type: 'object',
        properties: {
          mcpPath: {
            type: 'string',
            description: 'Path to MCP project',
          },
          tools: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific tools to test (default: all)',
          },
        },
        required: ['mcpPath'],
      },
    };
  }

  /**
   * Execute the tool
   */
  static async execute(input: RunSmokeTestsInput): Promise<RunSmokeTestsOutput> {
    try {
      // Validate input
      if (!input.mcpPath) {
        return {
          success: false,
          results: [],
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
          },
          error: 'mcpPath is required',
        };
      }

      // Create smoke tester and run tests
      const tester = new SmokeTester(input.mcpPath, input.tools);
      const result = await tester.run();

      // Add formatted output
      const formatted = this.formatResults(result);

      return {
        ...result,
        formatted,
      } as any;
    } catch (error) {
      return {
        success: false,
        results: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
        },
        error: `Tool execution failed: ${error}`,
      };
    }
  }

  /**
   * Format results for display
   */
  private static formatResults(result: RunSmokeTestsOutput): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('SMOKE TEST RESULTS');
    lines.push('='.repeat(60));
    lines.push('');

    if (!result.success) {
      lines.push(`❌ Smoke Tests Failed`);
      lines.push('');
      if (result.error) {
        lines.push(`Error: ${result.error}`);
      }
      return lines.join('\n');
    }

    // Summary
    const { summary } = result;
    const statusIcon = summary.failed === 0 ? '✅' : '❌';
    lines.push(`Status: ${statusIcon} ${summary.passed}/${summary.total} tools passed`);
    lines.push('');

    // Individual tool results
    if (result.results.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('TOOL RESULTS');
      lines.push('-'.repeat(60));
      lines.push('');

      for (const toolResult of result.results) {
        const allPassed =
          toolResult.available &&
          toolResult.schemaValid &&
          toolResult.basicInvocation === 'pass' &&
          toolResult.responseValid &&
          toolResult.errorHandling === 'pass';

        const icon = allPassed ? '✅' : '❌';
        lines.push(`${icon} ${toolResult.toolName}`);

        // Show details
        lines.push(`   Available:        ${toolResult.available ? '✅' : '❌'}`);
        lines.push(`   Schema Valid:     ${toolResult.schemaValid ? '✅' : '❌'}`);
        lines.push(`   Invocation:       ${toolResult.basicInvocation === 'pass' ? '✅' : '❌'}`);
        lines.push(`   Response Valid:   ${toolResult.responseValid ? '✅' : '❌'}`);
        lines.push(`   Error Handling:   ${toolResult.errorHandling === 'pass' ? '✅' : '❌'}`);

        // Show issues if any
        if (toolResult.issues.length > 0) {
          lines.push(`   Issues:`);
          for (const issue of toolResult.issues) {
            lines.push(`     • ${issue}`);
          }
        }

        lines.push('');
      }
    }

    lines.push('-'.repeat(60));
    if (summary.failed === 0) {
      lines.push('✅ ALL SMOKE TESTS PASSED');
      lines.push('');
      lines.push('All tools are operational and handle basic scenarios correctly.');
    } else {
      lines.push('❌ SOME SMOKE TESTS FAILED');
      lines.push('');
      lines.push(`${summary.failed} tool(s) failed smoke tests. Review the issues above.`);
    }
    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}
