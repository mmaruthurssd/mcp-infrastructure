/**
 * QualityGateValidator Utility
 *
 * Validates MCP implementations against ROLLOUT-CHECKLIST.md quality gates.
 * Executes comprehensive checks for production readiness.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { TestRunner } from './test-runner.js';
import { StandardsValidator } from './standards-validator.js';
import type {
  CheckQualityGatesOutput,
  GateCategory,
  Gate,
} from '../types.js';

export class QualityGateValidator {
  private mcpPath: string;
  private phase: string;

  constructor(mcpPath: string, phase?: string) {
    this.mcpPath = mcpPath;
    this.phase = phase || 'all';
  }

  /**
   * Validate quality gates
   */
  async validate(): Promise<CheckQualityGatesOutput> {
    try {
      // Check if path exists
      if (!existsSync(this.mcpPath)) {
        return this.createErrorResult(`MCP path does not exist: ${this.mcpPath}`);
      }

      const gates: Record<string, GateCategory> = {};

      // Run validation for each phase
      if (this.phase === 'all' || this.phase === 'pre-development') {
        gates.preDevelopment = await this.validatePreDevelopment();
      }

      if (this.phase === 'all' || this.phase === 'development') {
        gates.development = await this.validateDevelopment();
      }

      if (this.phase === 'all' || this.phase === 'testing') {
        gates.testing = await this.validateTesting();
      }

      if (this.phase === 'all' || this.phase === 'documentation') {
        gates.documentation = await this.validateDocumentation();
      }

      if (this.phase === 'all' || this.phase === 'pre-rollout') {
        gates.preRollout = await this.validatePreRollout();
      }

      // Calculate overall results
      const totalPassed = Object.values(gates).reduce((sum, g) => sum + g.passed, 0);
      const totalFailed = Object.values(gates).reduce((sum, g) => sum + g.failed, 0);
      const totalGates = totalPassed + totalFailed;
      const percentComplete = totalGates > 0 ? Math.round((totalPassed / totalGates) * 100) : 0;

      // Identify blockers (critical failures)
      const blockers = this.identifyBlockers(gates);
      const warnings = this.identifyWarnings(gates);

      // Determine readiness
      const readyForRollout = blockers.length === 0 && percentComplete >= 95;

      return {
        success: true,
        gates,
        overall: {
          passed: totalPassed,
          failed: totalFailed,
          percentComplete,
          readyForRollout,
        },
        blockers,
        warnings,
      };
    } catch (error) {
      return this.createErrorResult(`Validation failed: ${error}`);
    }
  }

  /**
   * Validate pre-development gates
   */
  private async validatePreDevelopment(): Promise<GateCategory> {
    const gates: Gate[] = [];

    // Check if specification exists
    const specPath = join(this.mcpPath, '01-planning', 'SPECIFICATION.md');
    gates.push({
      name: 'Specification exists',
      status: existsSync(specPath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(specPath)
        ? 'SPECIFICATION.md found in 01-planning/'
        : 'SPECIFICATION.md not found',
      recommendation: existsSync(specPath) ? undefined : 'Create SPECIFICATION.md in 01-planning/',
    });

    // Check if dependencies documented
    const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');
    const packageJsonPath = join(devInstancePath, 'package.json');
    gates.push({
      name: 'Dependencies documented',
      status: existsSync(packageJsonPath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(packageJsonPath)
        ? 'package.json exists with dependencies'
        : 'package.json not found',
      recommendation: existsSync(packageJsonPath) ? undefined : 'Create package.json',
    });

    // Check if test plan exists
    if (existsSync(specPath)) {
      const specContent = readFileSync(specPath, 'utf-8');
      const hasTestPlan = specContent.includes('## Testing') || specContent.includes('Test');
      gates.push({
        name: 'Test plan defined',
        status: hasTestPlan ? 'pass' : 'fail',
        required: true,
        details: hasTestPlan
          ? 'Testing section found in specification'
          : 'No testing section in specification',
        recommendation: hasTestPlan ? undefined : 'Add testing section to SPECIFICATION.md',
      });
    }

    return this.createGateCategory('Pre-Development', gates);
  }

  /**
   * Validate development gates
   */
  private async validateDevelopment(): Promise<GateCategory> {
    const gates: Gate[] = [];

    const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');

    // Check if code is complete
    const serverPath = join(devInstancePath, 'src', 'server.ts');
    gates.push({
      name: 'Code complete',
      status: existsSync(serverPath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(serverPath)
        ? 'server.ts exists'
        : 'server.ts not found',
      recommendation: existsSync(serverPath) ? undefined : 'Implement src/server.ts',
    });

    // Check if follows standards
    const validator = new StandardsValidator(this.mcpPath);
    const standardsResult = await validator.validate();
    const meetsStandards = standardsResult.success && standardsResult.compliance.overall >= 70;
    gates.push({
      name: 'Follows workspace standards',
      status: meetsStandards ? 'pass' : 'fail',
      required: true,
      details: `Standards compliance: ${standardsResult.compliance.overall}%`,
      recommendation: meetsStandards ? undefined : 'Fix standards violations',
    });

    // Check if builds successfully
    const distPath = join(devInstancePath, 'dist');
    gates.push({
      name: 'Builds successfully',
      status: existsSync(distPath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(distPath)
        ? 'dist/ directory exists (build successful)'
        : 'dist/ not found - run npm run build',
      recommendation: existsSync(distPath) ? undefined : 'Run npm run build',
    });

    return this.createGateCategory('Development', gates);
  }

  /**
   * Validate testing gates
   */
  private async validateTesting(): Promise<GateCategory> {
    const gates: Gate[] = [];

    const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');

    // Check if tests exist
    const testsPath = join(devInstancePath, 'tests');
    const hasTests = existsSync(testsPath);
    gates.push({
      name: 'Tests exist',
      status: hasTests ? 'pass' : 'fail',
      required: true,
      details: hasTests
        ? 'tests/ directory exists'
        : 'tests/ directory not found',
      recommendation: hasTests ? undefined : 'Create tests/ directory with unit and integration tests',
    });

    // Run tests if they exist
    if (hasTests) {
      try {
        const runner = new TestRunner(devInstancePath);
        const testResult = await runner.run('all', true);

        // Check if tests pass
        gates.push({
          name: 'Unit tests pass',
          status: testResult.success && (testResult.results.unit?.failed || 0) === 0 ? 'pass' : 'fail',
          required: true,
          details: testResult.success
            ? `${testResult.results.unit?.passed || 0} tests passed`
            : `${testResult.results.unit?.failed || 0} tests failed`,
          recommendation: testResult.success ? undefined : 'Fix failing tests',
        });

        // Check coverage
        const coverageThreshold = 70;
        const meetsCoverage = testResult.coverage && testResult.coverage.overall >= coverageThreshold;
        gates.push({
          name: 'Coverage >= 70%',
          status: meetsCoverage ? 'pass' : 'fail',
          required: true,
          details: testResult.coverage
            ? `Coverage: ${testResult.coverage.overall}%`
            : 'No coverage data available',
          recommendation: meetsCoverage ? undefined : 'Increase test coverage to >= 70%',
        });
      } catch (error) {
        gates.push({
          name: 'Tests execution',
          status: 'fail',
          required: true,
          details: `Test execution failed: ${error}`,
          recommendation: 'Fix test configuration and execution',
        });
      }
    }

    return this.createGateCategory('Testing', gates);
  }

  /**
   * Validate documentation gates
   */
  private async validateDocumentation(): Promise<GateCategory> {
    const gates: Gate[] = [];

    // Check README.md
    const readmePath = join(this.mcpPath, 'README.md');
    const hasReadme = existsSync(readmePath);
    gates.push({
      name: 'README complete',
      status: hasReadme ? 'pass' : 'fail',
      required: true,
      details: hasReadme
        ? 'README.md exists'
        : 'README.md not found',
      recommendation: hasReadme ? undefined : 'Create README.md',
    });

    // Check README content
    if (hasReadme) {
      const readmeContent = readFileSync(readmePath, 'utf-8');
      const hasOverview = readmeContent.includes('## Overview');
      gates.push({
        name: 'README has required sections',
        status: hasOverview ? 'pass' : 'fail',
        required: true,
        details: hasOverview
          ? 'README has Overview section'
          : 'README missing Overview section',
        recommendation: hasOverview ? undefined : 'Add Overview section to README',
      });
    }

    // Check API documentation (tools documented)
    const devInstanceReadme = join(this.mcpPath, '04-product-under-development', 'dev-instance', 'README.md');
    gates.push({
      name: 'API/Tools documented',
      status: existsSync(devInstanceReadme) ? 'pass' : 'fail',
      required: true,
      details: existsSync(devInstanceReadme)
        ? 'dev-instance README exists'
        : 'dev-instance README not found',
      recommendation: existsSync(devInstanceReadme) ? undefined : 'Document tools in dev-instance/README.md',
    });

    return this.createGateCategory('Documentation', gates);
  }

  /**
   * Validate pre-rollout gates
   */
  private async validatePreRollout(): Promise<GateCategory> {
    const gates: Gate[] = [];

    // Check if staging validated
    const devInstancePath = join(this.mcpPath, '04-product-under-development', 'dev-instance');
    gates.push({
      name: 'Staging instance validated',
      status: existsSync(devInstancePath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(devInstancePath)
        ? 'dev-instance exists and tested'
        : 'dev-instance not found',
    });

    // Check EVENT-LOG
    const eventLogPath = join(this.mcpPath, 'EVENT-LOG.md');
    gates.push({
      name: 'Development history documented',
      status: existsSync(eventLogPath) ? 'pass' : 'fail',
      required: true,
      details: existsSync(eventLogPath)
        ? 'EVENT-LOG.md exists'
        : 'EVENT-LOG.md not found',
      recommendation: existsSync(eventLogPath) ? undefined : 'Create EVENT-LOG.md',
    });

    // Check NEXT-STEPS
    const nextStepsPath = join(this.mcpPath, 'NEXT-STEPS.md');
    gates.push({
      name: 'Next steps documented',
      status: existsSync(nextStepsPath) ? 'pass' : 'fail',
      required: false,
      details: existsSync(nextStepsPath)
        ? 'NEXT-STEPS.md exists'
        : 'NEXT-STEPS.md not found',
      recommendation: existsSync(nextStepsPath) ? undefined : 'Create NEXT-STEPS.md',
    });

    return this.createGateCategory('Pre-Rollout', gates);
  }

  /**
   * Create gate category from gates
   */
  private createGateCategory(name: string, gates: Gate[]): GateCategory {
    const passed = gates.filter((g) => g.status === 'pass').length;
    const failed = gates.filter((g) => g.status === 'fail').length;

    return {
      name,
      passed,
      failed,
      gates,
    };
  }

  /**
   * Identify blockers (critical failures)
   */
  private identifyBlockers(gates: Record<string, GateCategory>): string[] {
    const blockers: string[] = [];

    for (const [phase, category] of Object.entries(gates)) {
      for (const gate of category.gates) {
        if (gate.status === 'fail' && gate.required) {
          blockers.push(`${phase}: ${gate.name} - ${gate.details}`);
        }
      }
    }

    return blockers;
  }

  /**
   * Identify warnings (non-critical failures)
   */
  private identifyWarnings(gates: Record<string, GateCategory>): string[] {
    const warnings: string[] = [];

    for (const [phase, category] of Object.entries(gates)) {
      for (const gate of category.gates) {
        if (gate.status === 'fail' && !gate.required) {
          warnings.push(`${phase}: ${gate.name} - ${gate.details}`);
        }
      }
    }

    return warnings;
  }

  /**
   * Create error result
   */
  private createErrorResult(error: string): CheckQualityGatesOutput {
    return {
      success: false,
      gates: {},
      overall: {
        passed: 0,
        failed: 0,
        percentComplete: 0,
        readyForRollout: false,
      },
      blockers: [error],
      warnings: [],
      error,
    };
  }
}
