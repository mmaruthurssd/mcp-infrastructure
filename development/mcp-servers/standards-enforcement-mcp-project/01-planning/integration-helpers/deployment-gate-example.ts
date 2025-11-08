/**
 * DEPLOYMENT GATE INTEGRATION EXAMPLE
 *
 * Copy this code into deployment-release-mcp to add standards enforcement
 *
 * Location: deployment-release-mcp/src/tools/deploy_application.ts
 */

import { standardsValidator } from './standards-validator-client.js';

/**
 * Example: Deploy Application with Standards Enforcement
 */
export async function deploy_application(params: {
  projectPath: string;
  environment: 'dev' | 'staging' | 'production';
  target?: string;
  strategy?: string;
  dryRun?: boolean;
}) {
  const { projectPath, environment, target, strategy = 'rolling', dryRun = false } = params;

  // Extract MCP name from path or use provided target
  const mcpName = target || extractMcpNameFromPath(projectPath);

  console.log(`\n🚀 Deploying ${mcpName} to ${environment}...`);

  // ============================================
  // STANDARDS ENFORCEMENT GATE
  // ============================================

  if (!dryRun) {
    console.log('\n🔍 Running pre-deployment compliance check...');

    try {
      // Environment-specific validation
      const validationOptions = getValidationOptionsForEnvironment(environment, mcpName);

      // Run validation
      const result = await standardsValidator.validateMcpCompliance(validationOptions);

      // Production: Strict enforcement
      if (environment === 'production') {
        if (!result.compliant) {
          throw new Error(
            `🛑 DEPLOYMENT BLOCKED TO PRODUCTION\n\n` +
            `MCP: ${mcpName}\n` +
            `Compliance Score: ${result.summary.complianceScore}/100\n` +
            `Critical Violations: ${result.summary.criticalViolations}\n` +
            `Warnings: ${result.summary.warningViolations}\n\n` +
            `Production deployments require:\n` +
            `  ✓ Compliance score ≥ 90\n` +
            `  ✓ Zero critical violations\n` +
            `  ✓ All security checks passed\n\n` +
            `Fix violations and re-run deployment.`
          );
        }

        // Additional production check: minimum score
        if (result.summary.complianceScore < 90) {
          throw new Error(
            `🛑 DEPLOYMENT BLOCKED: Compliance score ${result.summary.complianceScore}/100 is below production threshold (90)`
          );
        }

        console.log(
          `✅ Production compliance check passed (Score: ${result.summary.complianceScore}/100)`
        );
      }

      // Staging: Warn but allow
      else if (environment === 'staging') {
        if (!result.compliant) {
          console.warn(
            `\n⚠️  COMPLIANCE WARNINGS FOR STAGING DEPLOYMENT:\n` +
            `Compliance Score: ${result.summary.complianceScore}/100\n` +
            `Critical: ${result.summary.criticalViolations}, Warnings: ${result.summary.warningViolations}\n` +
            `\nDeployment proceeding, but fix violations before promoting to production.\n`
          );
        } else {
          console.log(`✅ Staging compliance check passed (Score: ${result.summary.complianceScore}/100)`);
        }
      }

      // Dev: Info only
      else {
        console.log(
          `ℹ️  Dev compliance score: ${result.summary.complianceScore}/100 ` +
          `(${result.summary.criticalViolations} critical, ${result.summary.warningViolations} warnings)`
        );
      }
    } catch (error) {
      if (environment === 'production') {
        // Block production on any validation error
        throw error;
      } else {
        // Log but continue for non-production
        console.warn(`⚠️  Compliance check failed: ${error instanceof Error ? error.message : String(error)}`);
        console.warn(`Proceeding with ${environment} deployment...`);
      }
    }
  }

  // ============================================
  // PROCEED WITH DEPLOYMENT
  // ============================================

  console.log(`\n📦 Starting ${strategy} deployment to ${environment}...`);

  // ... existing deployment logic ...
  // performHealthChecks()
  // rollDeployment()
  // validateDeployment()

  console.log(`\n✅ Deployment to ${environment} complete!`);

  return {
    success: true,
    environment,
    mcpName,
    strategy,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get validation options based on environment
 */
function getValidationOptionsForEnvironment(
  environment: string,
  mcpName: string
) {
  switch (environment) {
    case 'production':
      // Strictest validation for production
      return {
        mcpName,
        categories: [
          'security',           // Must have no hardcoded secrets
          'dual-environment',   // Must exist in dev+prod
          'template-first',     // Must have template
          'configuration',      // Must have valid config
        ],
        failFast: false,       // Check all rules
        includeWarnings: true, // Include all violations
      };

    case 'staging':
      // Moderate validation for staging
      return {
        mcpName,
        categories: [
          'security',
          'dual-environment',
          'configuration',
        ],
        failFast: false,
        includeWarnings: true,
      };

    case 'dev':
      // Minimal validation for dev
      return {
        mcpName,
        categories: ['security'], // Only security checks
        failFast: false,
        includeWarnings: false,   // Critical only
      };

    default:
      return {
        mcpName,
        failFast: false,
        includeWarnings: true,
      };
  }
}

/**
 * Extract MCP name from project path
 */
function extractMcpNameFromPath(projectPath: string): string {
  const match = projectPath.match(/mcp-servers\/([^/]+)/);
  if (match) {
    // Remove '-project' suffix if present
    return match[1].replace(/-project$/, '');
  }

  // Fallback: use last directory name
  const parts = projectPath.split('/');
  return parts[parts.length - 1].replace(/-project$/, '');
}

/**
 * ALTERNATIVE: Simple integration for quick deployment gate
 */
export async function simpleDeploymentGate(
  mcpName: string,
  environment: string
): Promise<void> {
  if (environment !== 'production') {
    return; // Skip for non-production
  }

  console.log(`🔍 Running production compliance check for ${mcpName}...`);

  // Require compliance for production
  await standardsValidator.requireCompliance({
    mcpName,
    categories: ['security', 'dual-environment'],
  });

  console.log(`✅ Compliance check passed`);
}

/**
 * USAGE IN EXISTING deploy_application FUNCTION:
 *
 * // At the start of your deploy_application function, add:
 *
 * if (environment === 'production') {
 *   await simpleDeploymentGate(mcpName, environment);
 * }
 *
 * // Then proceed with normal deployment...
 */
