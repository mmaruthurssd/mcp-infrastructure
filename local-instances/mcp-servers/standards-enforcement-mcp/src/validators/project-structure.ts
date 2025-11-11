import * as fs from 'fs/promises';
import * as path from 'path';
import { ValidationContext, ValidationIssue } from '../types/rules.js';

/**
 * Project Structure Validator
 * Ensures projects follow standardized folder structure
 */

/**
 * Standard 8-folder structure
 */
const EIGHT_FOLDER_STRUCTURE = [
  '01-planning',
  '02-research',
  '03-design',
  '04-product-under-development',
  '05-testing',
  '06-deployment',
  '07-monitoring',
  '08-archive',
];

/**
 * Simplified 4-folder structure
 */
const FOUR_FOLDER_STRUCTURE = [
  '01-planning',
  '04-product-under-development',
  '05-testing',
  '08-archive',
];

/**
 * Required files in 01-planning folder
 */
const PLANNING_REQUIRED_FILES = ['SPECIFICATION.md', 'README.md'];

/**
 * Validate project structure
 */
export async function validateProjectStructure(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const { targetPath } = context;

  // Determine expected structure
  const expectedStructure = await detectExpectedStructure(targetPath);

  // Validate folder structure
  const structureIssues = await validateFolderStructure(
    targetPath,
    expectedStructure
  );
  issues.push(...structureIssues);

  // Validate planning folder content
  const planningIssues = await validatePlanningFolder(targetPath);
  issues.push(...planningIssues);

  // Validate product folder content
  const productIssues = await validateProductFolder(targetPath);
  issues.push(...productIssues);

  // Check for misplaced files
  const misplacedIssues = await validateNoMisplacedFiles(targetPath);
  issues.push(...misplacedIssues);

  return issues;
}

/**
 * Detect expected structure (8-folder or 4-folder)
 */
async function detectExpectedStructure(
  projectPath: string
): Promise<'8-folder' | '4-folder'> {
  // Check if 02-research exists (only in 8-folder)
  const researchPath = path.join(projectPath, '02-research');
  const researchExists = await directoryExists(researchPath);

  return researchExists ? '8-folder' : '4-folder';
}

/**
 * Validate folder structure matches expected pattern
 */
async function validateFolderStructure(
  projectPath: string,
  expectedStructure: '8-folder' | '4-folder'
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const requiredFolders =
    expectedStructure === '8-folder'
      ? EIGHT_FOLDER_STRUCTURE
      : FOUR_FOLDER_STRUCTURE;

  // Check each required folder
  for (const folderName of requiredFolders) {
    const folderPath = path.join(projectPath, folderName);
    const exists = await directoryExists(folderPath);

    if (!exists) {
      const severity =
        folderName === '01-planning' || folderName === '04-product-under-development'
          ? 'critical'
          : 'warning';

      issues.push({
        ruleId: 'structure-001',
        severity,
        message: `Missing required folder: ${folderName}`,
        location: { path: projectPath },
        suggestion: `Create ${folderName} folder following ${expectedStructure} structure`,
        autoFixAvailable: true,
      });
    }
  }

  // Check for unexpected numbered folders
  const unexpectedIssues = await validateNoUnexpectedFolders(
    projectPath,
    requiredFolders
  );
  issues.push(...unexpectedIssues);

  return issues;
}

/**
 * Validate no unexpected numbered folders exist
 */
async function validateNoUnexpectedFolders(
  projectPath: string,
  expectedFolders: string[]
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Check if it's a numbered folder (starts with digits and hyphen)
      const isNumberedFolder = /^\d{2}-/.test(entry.name);

      if (isNumberedFolder && !expectedFolders.includes(entry.name)) {
        issues.push({
          ruleId: 'structure-002',
          severity: 'warning',
          message: `Unexpected numbered folder: ${entry.name}`,
          location: { path: path.join(projectPath, entry.name) },
          suggestion: 'Remove non-standard numbered folders or rename to match expected structure',
          autoFixAvailable: false,
        });
      }
    }
  } catch (error) {
    // Ignore read errors
  }

  return issues;
}

/**
 * Validate 01-planning folder has required content
 */
async function validatePlanningFolder(
  projectPath: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const planningPath = path.join(projectPath, '01-planning');
  const planningExists = await directoryExists(planningPath);

  if (!planningExists) {
    return issues; // Already reported by structure validation
  }

  // Check for required files
  for (const fileName of PLANNING_REQUIRED_FILES) {
    const filePath = path.join(planningPath, fileName);
    const exists = await fileExists(filePath);

    if (!exists) {
      issues.push({
        ruleId: 'structure-003',
        severity: 'critical',
        message: `Missing required file in 01-planning: ${fileName}`,
        location: { path: planningPath },
        suggestion: `Create ${fileName} in 01-planning folder`,
        autoFixAvailable: false,
      });
    }
  }

  // Validate SPECIFICATION.md content
  const specPath = path.join(planningPath, 'SPECIFICATION.md');
  if (await fileExists(specPath)) {
    const specIssues = await validateSpecificationContent(specPath);
    issues.push(...specIssues);
  }

  return issues;
}

/**
 * Validate SPECIFICATION.md has required sections
 */
async function validateSpecificationContent(
  specPath: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await fs.readFile(specPath, 'utf-8');

    // Required sections in specification
    const requiredSections = [
      { name: 'Executive Summary', pattern: /##\s*Executive\s*Summary/i },
      { name: 'Requirements', pattern: /##\s*Requirements/i },
      { name: 'Architecture', pattern: /##\s*Architecture/i },
    ];

    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        issues.push({
          ruleId: 'structure-004',
          severity: 'warning',
          message: `SPECIFICATION.md missing "${section.name}" section`,
          location: { path: specPath },
          suggestion: `Add ## ${section.name} section to SPECIFICATION.md`,
          autoFixAvailable: false,
        });
      }
    }

    // Check minimum length (specification should be substantial)
    if (content.length < 500) {
      issues.push({
        ruleId: 'structure-005',
        severity: 'warning',
        message: 'SPECIFICATION.md appears incomplete (< 500 characters)',
        location: { path: specPath },
        suggestion: 'Expand SPECIFICATION.md with detailed requirements and architecture',
        autoFixAvailable: false,
      });
    }
  } catch (error) {
    // Ignore read errors
  }

  return issues;
}

/**
 * Validate 04-product-under-development folder
 */
async function validateProductFolder(
  projectPath: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const productPath = path.join(projectPath, '04-product-under-development');
  const productExists = await directoryExists(productPath);

  if (!productExists) {
    return issues; // Already reported by structure validation
  }

  // Check for package.json
  const packageJsonPath = path.join(productPath, 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    issues.push({
      ruleId: 'structure-006',
      severity: 'critical',
      message: 'Missing package.json in 04-product-under-development',
      location: { path: productPath },
      suggestion: 'Create package.json with project dependencies',
      autoFixAvailable: false,
    });
  }

  // Check for src directory
  const srcPath = path.join(productPath, 'src');
  const srcExists = await directoryExists(srcPath);

  if (!srcExists) {
    issues.push({
      ruleId: 'structure-007',
      severity: 'critical',
      message: 'Missing src directory in 04-product-under-development',
      location: { path: productPath },
      suggestion: 'Create src directory for source code',
      autoFixAvailable: true,
    });
  }

  // Check for build configuration (tsconfig.json or similar)
  const tsconfigPath = path.join(productPath, 'tsconfig.json');
  const webpackPath = path.join(productPath, 'webpack.config.js');
  const rollupPath = path.join(productPath, 'rollup.config.js');

  const hasBuildConfig =
    (await fileExists(tsconfigPath)) ||
    (await fileExists(webpackPath)) ||
    (await fileExists(rollupPath));

  if (!hasBuildConfig && packageJsonExists) {
    // Check if TypeScript or bundler is in dependencies
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.typescript || deps.webpack || deps.rollup) {
        issues.push({
          ruleId: 'structure-008',
          severity: 'warning',
          message: 'Build tool dependencies found but missing configuration file',
          location: { path: productPath },
          suggestion: 'Create tsconfig.json, webpack.config.js, or rollup.config.js',
          autoFixAvailable: false,
        });
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return issues;
}

/**
 * Validate no misplaced files in project root
 */
async function validateNoMisplacedFiles(
  projectPath: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });

    // Allowed files in project root
    const allowedRootFiles = new Set([
      'README.md',
      '.gitignore',
      '.git',
      'package.json', // Sometimes at root for monorepo
      '.DS_Store', // macOS
    ]);

    for (const entry of entries) {
      if (entry.isFile() && !allowedRootFiles.has(entry.name)) {
        // Check if it's a numbered folder or hidden file
        const isNumberedFolder = /^\d{2}-/.test(entry.name);
        const isHiddenFile = entry.name.startsWith('.');

        if (!isNumberedFolder && !isHiddenFile) {
          issues.push({
            ruleId: 'structure-009',
            severity: 'info',
            message: `File in project root should be in appropriate folder: ${entry.name}`,
            location: { path: path.join(projectPath, entry.name) },
            suggestion: 'Move file to appropriate numbered folder (e.g., 01-planning, 04-product-under-development)',
            autoFixAvailable: false,
          });
        }
      }
    }
  } catch (error) {
    // Ignore read errors
  }

  return issues;
}

/**
 * Validate 8-folder structure (strict mode)
 */
export async function validateEightFolderStructureStrict(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const { targetPath } = context;

  // Check all 8 folders exist
  for (const folderName of EIGHT_FOLDER_STRUCTURE) {
    const folderPath = path.join(targetPath, folderName);
    const exists = await directoryExists(folderPath);

    if (!exists) {
      issues.push({
        ruleId: 'structure-010',
        severity: 'critical',
        message: `Missing required folder in 8-folder structure: ${folderName}`,
        location: { path: targetPath },
        suggestion: `Create ${folderName} folder`,
        autoFixAvailable: true,
      });
    }
  }

  return issues;
}

/**
 * Validate 4-folder structure (simplified mode)
 */
export async function validateFourFolderStructure(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const { targetPath } = context;

  // Check all 4 folders exist
  for (const folderName of FOUR_FOLDER_STRUCTURE) {
    const folderPath = path.join(targetPath, folderName);
    const exists = await directoryExists(folderPath);

    if (!exists) {
      issues.push({
        ruleId: 'structure-011',
        severity: 'critical',
        message: `Missing required folder in 4-folder structure: ${folderName}`,
        location: { path: targetPath },
        suggestion: `Create ${folderName} folder`,
        autoFixAvailable: true,
      });
    }
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
