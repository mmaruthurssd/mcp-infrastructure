/**
 * Validate MCP Implementation Tool
 *
 * Validate MCP against workspace standards and best practices.
 */

import { StandardsValidator } from '../utils/standards-validator.js';
import type { ValidateMcpImplementationInput, ValidateMcpImplementationOutput } from '../types.js';

export class ValidateMcpImplementationTool {
  /**
   * Get tool definition for MCP server
   */
  static getToolDefinition() {
    return {
      name: 'validate_mcp_implementation',
      description: 'Validate MCP against workspace standards and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          mcpPath: {
            type: 'string',
            description: 'Path to MCP project root',
          },
          standards: {
            type: 'array',
            items: { type: 'string' },
            description: 'Standards to check: fileStructure, naming, documentation, code, mcp (default: all)',
          },
        },
        required: ['mcpPath'],
      },
    };
  }

  /**
   * Execute the tool
   */
  static async execute(input: ValidateMcpImplementationInput): Promise<ValidateMcpImplementationOutput> {
    try {
      // Validate input
      if (!input.mcpPath) {
        return {
          success: false,
          compliance: {
            overall: 0,
            categories: {
              fileStructure: { passed: 0, failed: 0, score: 0, issues: [] },
              naming: { passed: 0, failed: 0, score: 0, issues: [] },
              documentation: { passed: 0, failed: 0, score: 0, issues: [] },
              code: { passed: 0, failed: 0, score: 0, issues: [] },
              mcp: { passed: 0, failed: 0, score: 0, issues: [] },
            },
          },
          recommendations: [],
          error: 'mcpPath is required',
        };
      }

      // Create validator and execute
      const validator = new StandardsValidator(input.mcpPath, input.standards);
      const result = await validator.validate();

      // Add formatted summary
      const formatted = this.formatResults(result);

      return {
        ...result,
        formatted,
      } as any;
    } catch (error) {
      return {
        success: false,
        compliance: {
          overall: 0,
          categories: {
            fileStructure: { passed: 0, failed: 0, score: 0, issues: [] },
            naming: { passed: 0, failed: 0, score: 0, issues: [] },
            documentation: { passed: 0, failed: 0, score: 0, issues: [] },
            code: { passed: 0, failed: 0, score: 0, issues: [] },
            mcp: { passed: 0, failed: 0, score: 0, issues: [] },
          },
        },
        recommendations: [],
        error: `Tool execution failed: ${error}`,
      };
    }
  }

  /**
   * Format results for display
   */
  private static formatResults(result: ValidateMcpImplementationOutput): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('STANDARDS VALIDATION RESULTS');
    lines.push('='.repeat(60));
    lines.push('');

    if (!result.success) {
      lines.push(`❌ Validation Failed`);
      lines.push('');
      if (result.error) {
        lines.push(`Error: ${result.error}`);
      }
      return lines.join('\n');
    }

    // Overall compliance
    const { overall, categories } = result.compliance;
    const overallStatus = overall >= 90 ? '✅' : overall >= 70 ? '⚠️' : '❌';
    lines.push(`Overall Compliance: ${overall}% ${overallStatus}`);
    lines.push('');

    // Category breakdown
    lines.push('-'.repeat(60));
    lines.push('CATEGORY SCORES');
    lines.push('-'.repeat(60));
    lines.push('');

    for (const [category, categoryResult] of Object.entries(categories)) {
      const status = categoryResult.score >= 90 ? '✅' : categoryResult.score >= 70 ? '⚠️' : '❌';
      const categoryName = this.formatCategoryName(category);
      lines.push(`${categoryName.padEnd(20)} ${categoryResult.score}% ${status}`);
      lines.push(`${''.padEnd(20)} ${categoryResult.passed} passed, ${categoryResult.failed} failed`);
      lines.push('');
    }

    // Issues by severity
    const allIssues = Object.values(categories).flatMap((c) => c.issues);
    const errors = allIssues.filter((i) => i.severity === 'error');
    const warnings = allIssues.filter((i) => i.severity === 'warning');
    const info = allIssues.filter((i) => i.severity === 'info');

    if (errors.length > 0 || warnings.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('ISSUES');
      lines.push('-'.repeat(60));
      lines.push('');

      if (errors.length > 0) {
        lines.push(`❌ Errors (${errors.length}):`);
        for (const error of errors.slice(0, 10)) {
          lines.push(`   ${error.message}`);
          if (error.file) {
            lines.push(`   File: ${error.file}`);
          }
          if (error.recommendation) {
            lines.push(`   Fix: ${error.recommendation}`);
          }
          lines.push('');
        }
        if (errors.length > 10) {
          lines.push(`   ... and ${errors.length - 10} more errors`);
          lines.push('');
        }
      }

      if (warnings.length > 0) {
        lines.push(`⚠️  Warnings (${warnings.length}):`);
        for (const warning of warnings.slice(0, 5)) {
          lines.push(`   ${warning.message}`);
          if (warning.recommendation) {
            lines.push(`   Suggestion: ${warning.recommendation}`);
          }
          lines.push('');
        }
        if (warnings.length > 5) {
          lines.push(`   ... and ${warnings.length - 5} more warnings`);
          lines.push('');
        }
      }

      if (info.length > 0) {
        lines.push(`ℹ️  Info (${info.length}):`);
        lines.push(`   ${info.length} informational notices`);
        lines.push('');
      }
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('RECOMMENDATIONS');
      lines.push('-'.repeat(60));
      lines.push('');

      for (const recommendation of result.recommendations.slice(0, 10)) {
        lines.push(`• ${recommendation}`);
      }

      if (result.recommendations.length > 10) {
        lines.push(`... and ${result.recommendations.length - 10} more recommendations`);
      }
      lines.push('');
    }

    // Summary
    lines.push('-'.repeat(60));
    if (overall >= 90) {
      lines.push('✅ Excellent! MCP meets workspace standards');
    } else if (overall >= 70) {
      lines.push('⚠️  Good, but some improvements needed');
    } else {
      lines.push('❌ Significant issues found - review and fix before rollout');
    }
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Format category name for display
   */
  private static formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      fileStructure: 'File Structure',
      naming: 'Naming Conventions',
      documentation: 'Documentation',
      code: 'Code Standards',
      mcp: 'MCP Standards',
    };
    return names[category] || category;
  }
}
