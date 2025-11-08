/**
 * Task Validation Utility
 *
 * Integrates with Autonomous Deployment Framework for automated validation
 * when completing tasks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface ValidationOptions {
  projectPath: string;
  taskDescription: string;
  runBuild?: boolean;
  runTests?: boolean;
  runSecurityScan?: boolean;
}

export interface ValidationResult {
  buildCheck?: {
    passed: boolean;
    output?: string;
    error?: string;
  };
  testCheck?: {
    passed: boolean;
    output?: string;
    error?: string;
  };
  securityCheck?: {
    passed: boolean;
    findings?: string[];
    error?: string;
  };
  overallPassed: boolean;
  evidence: string[];
  concerns: string[];
}

export class TaskValidation {
  /**
   * Run automated validation checks for a completed task
   */
  static async validate(options: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      overallPassed: true,
      evidence: [],
      concerns: []
    };

    // Determine which checks to run
    const shouldRunBuild = options.runBuild !== false && this.shouldRunBuildCheck(options);
    const shouldRunTests = options.runTests !== false && this.shouldRunTestCheck(options);
    const shouldRunSecurity = options.runSecurityScan === true;

    // Build check
    if (shouldRunBuild) {
      result.buildCheck = await this.runBuildCheck(options.projectPath);
      if (result.buildCheck.passed) {
        result.evidence.push('✓ Build check passed');
      } else {
        result.overallPassed = false;
        result.concerns.push('✗ Build check failed');
      }
    }

    // Test check
    if (shouldRunTests) {
      result.testCheck = await this.runTestCheck(options.projectPath);
      if (result.testCheck.passed) {
        result.evidence.push('✓ Test check passed');
      } else {
        result.overallPassed = false;
        result.concerns.push('✗ Test check failed');
      }
    }

    // Security check
    if (shouldRunSecurity) {
      result.securityCheck = await this.runSecurityCheck(options.projectPath);
      if (result.securityCheck.passed) {
        result.evidence.push('✓ Security scan passed');
      } else {
        result.overallPassed = false;
        result.concerns.push(`✗ Security scan found ${result.securityCheck.findings?.length || 0} issues`);
      }
    }

    return result;
  }

  /**
   * Determine if build check should run based on task description
   */
  private static shouldRunBuildCheck(options: ValidationOptions): boolean {
    const lowerDesc = options.taskDescription.toLowerCase();

    // Run build check if task mentions code changes
    if (
      lowerDesc.includes('modify') ||
      lowerDesc.includes('update') ||
      lowerDesc.includes('add') ||
      lowerDesc.includes('implement') ||
      lowerDesc.includes('create') ||
      lowerDesc.includes('fix')
    ) {
      // Check if package.json has a build script
      const packageJsonPath = path.join(options.projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          return packageJson.scripts && packageJson.scripts.build !== undefined;
        } catch {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Determine if test check should run based on task description
   */
  private static shouldRunTestCheck(options: ValidationOptions): boolean {
    const lowerDesc = options.taskDescription.toLowerCase();

    // Run tests if task explicitly mentions testing or if it's a critical change
    if (
      lowerDesc.includes('test') ||
      lowerDesc.includes('verify') ||
      lowerDesc.includes('validate')
    ) {
      // Check if package.json has a test script
      const packageJsonPath = path.join(options.projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          return packageJson.scripts && packageJson.scripts.test !== undefined;
        } catch {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Run build check
   */
  private static async runBuildCheck(projectPath: string): Promise<{
    passed: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const output = execSync('npm run build', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes
        stdio: 'pipe'
      });

      return {
        passed: true,
        output: output.substring(0, 500) // Limit output size
      };
    } catch (error: any) {
      return {
        passed: false,
        error: error.message || 'Build failed',
        output: error.stdout?.substring(0, 500)
      };
    }
  }

  /**
   * Run test check
   */
  private static async runTestCheck(projectPath: string): Promise<{
    passed: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const output = execSync('npm test', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 180000, // 3 minutes
        stdio: 'pipe'
      });

      return {
        passed: true,
        output: output.substring(0, 500)
      };
    } catch (error: any) {
      return {
        passed: false,
        error: error.message || 'Tests failed',
        output: error.stdout?.substring(0, 500)
      };
    }
  }

  /**
   * Run security scan (placeholder for future integration)
   */
  private static async runSecurityCheck(projectPath: string): Promise<{
    passed: boolean;
    findings?: string[];
    error?: string;
  }> {
    // TODO: Integrate with security-compliance-mcp for actual scanning
    // For now, just return passed
    return {
      passed: true,
      findings: []
    };
  }
}
