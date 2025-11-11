/**
 * Task Deployment Utility
 *
 * Provides deployment readiness checking for archived workflows
 * Integrates with Autonomous Deployment Framework
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface DeploymentReadinessOptions {
  projectPath: string;
  workflowName: string;
  checkBuild?: boolean;
  checkTests?: boolean;
  checkHealth?: boolean;
}

export interface DeploymentReadinessResult {
  ready: boolean;
  checks: {
    build?: {
      passed: boolean;
      output?: string;
      error?: string;
    };
    tests?: {
      passed: boolean;
      output?: string;
      error?: string;
    };
    health?: {
      passed: boolean;
      details?: string[];
    };
  };
  recommendations: string[];
  deploymentEligible: boolean;
}

export class TaskDeployment {
  /**
   * Check deployment readiness for an archived workflow
   *
   * Verifies that the component is ready to be deployed:
   * - Build passes
   * - Tests pass
   * - Health checks pass
   */
  static async checkReadiness(options: DeploymentReadinessOptions): Promise<DeploymentReadinessResult> {
    const result: DeploymentReadinessResult = {
      ready: true,
      checks: {},
      recommendations: [],
      deploymentEligible: true
    };

    const { projectPath, checkBuild = true, checkTests = true, checkHealth = true } = options;

    // Build check
    if (checkBuild) {
      result.checks.build = await this.checkBuild(projectPath);
      if (!result.checks.build.passed) {
        result.ready = false;
        result.deploymentEligible = false;
        result.recommendations.push('Fix build errors before deploying');
      }
    }

    // Test check
    if (checkTests) {
      result.checks.tests = await this.checkTests(projectPath);
      if (!result.checks.tests.passed) {
        result.ready = false;
        result.deploymentEligible = false;
        result.recommendations.push('Fix failing tests before deploying');
      }
    }

    // Health check
    if (checkHealth) {
      result.checks.health = await this.checkHealth(projectPath);
      if (!result.checks.health.passed) {
        result.ready = false;
        result.deploymentEligible = false;
        result.recommendations.push('Resolve health check issues before deploying');
      }
    }

    // Add positive recommendations
    if (result.ready) {
      result.recommendations.push('✅ Component is ready for deployment');
      result.recommendations.push('Consider using deployment-release-mcp for automated deployment');
    }

    return result;
  }

  /**
   * Check if project builds successfully
   */
  private static async checkBuild(projectPath: string): Promise<{
    passed: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return {
          passed: true,  // No package.json means no build required
          output: 'No package.json found (build check skipped)'
        };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (!packageJson.scripts || !packageJson.scripts.build) {
        return {
          passed: true,  // No build script means no build required
          output: 'No build script defined (build check skipped)'
        };
      }

      const output = execSync('npm run build', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes
        stdio: 'pipe'
      });

      return {
        passed: true,
        output: 'Build successful: ' + output.substring(0, 200)
      };
    } catch (error: any) {
      return {
        passed: false,
        error: 'Build failed: ' + (error.message || 'Unknown error'),
        output: error.stdout?.substring(0, 200)
      };
    }
  }

  /**
   * Check if tests pass
   */
  private static async checkTests(projectPath: string): Promise<{
    passed: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return {
          passed: true,
          output: 'No package.json found (test check skipped)'
        };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (!packageJson.scripts || !packageJson.scripts.test) {
        return {
          passed: true,
          output: 'No test script defined (test check skipped)'
        };
      }

      const output = execSync('npm test', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 180000, // 3 minutes
        stdio: 'pipe'
      });

      return {
        passed: true,
        output: 'Tests passed: ' + output.substring(0, 200)
      };
    } catch (error: any) {
      return {
        passed: false,
        error: 'Tests failed: ' + (error.message || 'Unknown error'),
        output: error.stdout?.substring(0, 200)
      };
    }
  }

  /**
   * Check component health
   */
  private static async checkHealth(projectPath: string): Promise<{
    passed: boolean;
    details?: string[];
  }> {
    const details: string[] = [];
    let passed = true;

    try {
      // Check for required files
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        passed = false;
        details.push('❌ package.json not found');
      } else {
        details.push('✓ package.json exists');

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Check for main entry point
        if (!packageJson.main && !packageJson.exports) {
          passed = false;
          details.push('⚠️  No main entry point defined');
        } else {
          details.push('✓ Entry point defined');
        }
      }

      // Check for src directory
      const srcPath = path.join(projectPath, 'src');
      if (!fs.existsSync(srcPath)) {
        details.push('⚠️  No src directory found');
      } else {
        details.push('✓ src directory exists');
      }

      // Check for build directory (if applicable)
      const buildPath = path.join(projectPath, 'build');
      const distPath = path.join(projectPath, 'dist');

      if (!fs.existsSync(buildPath) && !fs.existsSync(distPath)) {
        details.push('⚠️  No build output directory found');
      } else {
        details.push('✓ Build output directory exists');
      }

      return {
        passed,
        details
      };
    } catch (error: any) {
      return {
        passed: false,
        details: [`❌ Health check error: ${error.message}`]
      };
    }
  }
}
