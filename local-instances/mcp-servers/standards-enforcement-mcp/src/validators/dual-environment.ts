import * as fs from 'fs/promises';
import * as path from 'path';
import { ValidationContext, ValidationIssue } from '../types/rules.js';

/**
 * Dual-Environment Validator
 * Ensures MCPs exist in both development and production environments
 */

/**
 * Check if MCP has both development and production versions
 */
export async function validateDualEnvironment(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (context.targetType !== 'mcp') {
    return issues;
  }

  if (!context.mcpName) {
    issues.push({
      ruleId: 'dual-env-001',
      severity: 'critical',
      message: 'MCP name is required for dual-environment validation',
      location: { path: context.targetPath },
    });
    return issues;
  }

  const { workspacePath, mcpName } = context;

  // Expected paths
  const devPath = path.join(
    workspacePath,
    'development',
    'mcp-servers',
    `${mcpName}-project`
  );
  const prodPath = path.join(
    workspacePath,
    'local-instances',
    'mcp-servers',
    mcpName
  );

  // Check development environment
  const devExists = await directoryExists(devPath);
  if (!devExists) {
    issues.push({
      ruleId: 'dual-env-001',
      severity: 'critical',
      message: `Development environment missing for MCP "${mcpName}"`,
      location: { path: devPath },
      suggestion: `Create development directory at: ${devPath}`,
      autoFixAvailable: false,
    });
  }

  // Check production environment
  const prodExists = await directoryExists(prodPath);
  if (!prodExists) {
    issues.push({
      ruleId: 'dual-env-002',
      severity: 'critical',
      message: `Production environment missing for MCP "${mcpName}"`,
      location: { path: prodPath },
      suggestion: `Create production directory at: ${prodPath}`,
      autoFixAvailable: false,
    });
  }

  // If both exist, check for required files
  if (devExists) {
    const devIssues = await validateDevelopmentStructure(devPath, mcpName);
    issues.push(...devIssues);
  }

  if (prodExists) {
    const prodIssues = await validateProductionStructure(prodPath, mcpName);
    issues.push(...prodIssues);
  }

  return issues;
}

/**
 * Validate development environment structure
 */
async function validateDevelopmentStructure(
  devPath: string,
  _mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for 04-product-under-development folder
  const productPath = path.join(devPath, '04-product-under-development');
  const productExists = await directoryExists(productPath);

  if (!productExists) {
    issues.push({
      ruleId: 'dual-env-003',
      severity: 'warning',
      message: `Missing 04-product-under-development folder in development environment`,
      location: { path: devPath },
      suggestion: 'Create 04-product-under-development directory following 8-folder structure',
      autoFixAvailable: false,
    });
    return issues; // Can't check further if folder doesn't exist
  }

  // Check for package.json
  const packageJsonPath = path.join(productPath, 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    issues.push({
      ruleId: 'dual-env-004',
      severity: 'critical',
      message: 'Missing package.json in development environment',
      location: { path: productPath },
      suggestion: 'Create package.json with MCP dependencies',
      autoFixAvailable: false,
    });
  }

  // Check for src directory
  const srcPath = path.join(productPath, 'src');
  const srcExists = await directoryExists(srcPath);

  if (!srcExists) {
    issues.push({
      ruleId: 'dual-env-005',
      severity: 'critical',
      message: 'Missing src directory in development environment',
      location: { path: productPath },
      suggestion: 'Create src directory with MCP source code',
      autoFixAvailable: false,
    });
  }

  return issues;
}

/**
 * Validate production environment structure
 */
async function validateProductionStructure(
  prodPath: string,
  mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for package.json
  const packageJsonPath = path.join(prodPath, 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    issues.push({
      ruleId: 'dual-env-006',
      severity: 'critical',
      message: 'Missing package.json in production environment',
      location: { path: prodPath },
      suggestion: 'Copy and build from development environment',
      autoFixAvailable: false,
    });
  } else {
    // Validate package.json has correct name
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      if (packageJson.name !== mcpName) {
        issues.push({
          ruleId: 'dual-env-007',
          severity: 'warning',
          message: `Package name mismatch: expected "${mcpName}", got "${packageJson.name}"`,
          location: { path: packageJsonPath },
          suggestion: `Update package.json name to "${mcpName}"`,
          autoFixAvailable: true,
        });
      }
    } catch (error) {
      issues.push({
        ruleId: 'dual-env-008',
        severity: 'warning',
        message: 'Invalid package.json format',
        location: { path: packageJsonPath },
        suggestion: 'Fix JSON syntax errors in package.json',
        autoFixAvailable: false,
      });
    }
  }

  // Check for dist or build directory (built code)
  const distPath = path.join(prodPath, 'dist');
  const buildPath = path.join(prodPath, 'build');
  const distExists = await directoryExists(distPath);
  const buildExists = await directoryExists(buildPath);

  if (!distExists && !buildExists) {
    issues.push({
      ruleId: 'dual-env-009',
      severity: 'critical',
      message: 'Missing built code in production environment (no dist/ or build/ directory)',
      location: { path: prodPath },
      suggestion: 'Build the project from development environment',
      autoFixAvailable: false,
    });
  }

  // Check for node_modules (dependencies installed)
  const nodeModulesPath = path.join(prodPath, 'node_modules');
  const nodeModulesExists = await directoryExists(nodeModulesPath);

  if (!nodeModulesExists) {
    issues.push({
      ruleId: 'dual-env-010',
      severity: 'warning',
      message: 'Dependencies not installed in production environment',
      location: { path: prodPath },
      suggestion: 'Run npm install in production directory',
      autoFixAvailable: false,
    });
  }

  return issues;
}

/**
 * Check if directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Validate development-to-production sync
 * Checks if production version is in sync with development
 */
export async function validateDevProdSync(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (context.targetType !== 'mcp' || !context.mcpName) {
    return issues;
  }

  const { workspacePath, mcpName } = context;

  const devPackageJsonPath = path.join(
    workspacePath,
    'development',
    'mcp-servers',
    `${mcpName}-project`,
    '04-product-under-development',
    'package.json'
  );

  const prodPackageJsonPath = path.join(
    workspacePath,
    'local-instances',
    'mcp-servers',
    mcpName,
    'package.json'
  );

  // Check if both package.json files exist
  const devExists = await fileExists(devPackageJsonPath);
  const prodExists = await fileExists(prodPackageJsonPath);

  if (!devExists || !prodExists) {
    return issues; // Skip sync check if either doesn't exist
  }

  try {
    const devContent = await fs.readFile(devPackageJsonPath, 'utf-8');
    const prodContent = await fs.readFile(prodPackageJsonPath, 'utf-8');

    const devPackage = JSON.parse(devContent);
    const prodPackage = JSON.parse(prodContent);

    // Compare versions
    if (devPackage.version !== prodPackage.version) {
      issues.push({
        ruleId: 'dual-env-011',
        severity: 'warning',
        message: `Version mismatch: dev (${devPackage.version}) vs prod (${prodPackage.version})`,
        location: { path: prodPackageJsonPath },
        suggestion: 'Rebuild and deploy from development to production',
        autoFixAvailable: false,
      });
    }
  } catch (error) {
    issues.push({
      ruleId: 'dual-env-012',
      severity: 'info',
      message: 'Could not compare development and production versions',
      location: { path: prodPackageJsonPath },
    });
  }

  return issues;
}
