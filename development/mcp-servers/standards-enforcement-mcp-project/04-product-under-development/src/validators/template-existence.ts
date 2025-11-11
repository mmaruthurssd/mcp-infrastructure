import * as fs from 'fs/promises';
import * as path from 'path';
import { ValidationContext, ValidationIssue } from '../types/rules.js';

/**
 * Template-Existence Validator
 * Ensures every production MCP has a corresponding drop-in template
 */

/**
 * Validate that MCP has a corresponding template
 */
export async function validateTemplateExists(
  context: ValidationContext
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (context.targetType !== 'mcp') {
    return issues;
  }

  if (!context.mcpName) {
    issues.push({
      ruleId: 'template-001',
      severity: 'critical',
      message: 'MCP name is required for template validation',
      location: { path: context.targetPath },
    });
    return issues;
  }

  const { workspacePath, mcpName } = context;

  // Expected template path (check new location first, then fallback to old location)
  const newTemplatePath = path.join(
    workspacePath,
    'templates-and-patterns',
    'mcp-server-templates',
    `${mcpName}-template`
  );

  const oldTemplatePath = path.join(
    workspacePath,
    'templates',
    'drop-in-templates',
    `${mcpName}-template`
  );

  // Check new location first
  let templatePath = newTemplatePath;
  let templateExists = await directoryExists(templatePath);

  // Fallback to old location for backward compatibility
  if (!templateExists) {
    templatePath = oldTemplatePath;
    templateExists = await directoryExists(templatePath);
  }

  if (!templateExists) {
    issues.push({
      ruleId: 'template-001',
      severity: 'critical',
      message: `Template missing for MCP "${mcpName}"`,
      location: { path: newTemplatePath },
      suggestion: `Create MCP template at: ${newTemplatePath}`,
      autoFixAvailable: false,
    });
    return issues; // Can't check further if template doesn't exist
  }

  // Validate template metadata
  const metadataIssues = await validateTemplateMetadata(templatePath, mcpName);
  issues.push(...metadataIssues);

  // Validate template structure
  const structureIssues = await validateTemplateStructure(templatePath, mcpName);
  issues.push(...structureIssues);

  // Validate template is installable
  const installableIssues = await validateTemplateInstallable(templatePath, mcpName);
  issues.push(...installableIssues);

  return issues;
}

/**
 * Validate template metadata files
 */
async function validateTemplateMetadata(
  templatePath: string,
  mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for README.md
  const readmePath = path.join(templatePath, 'README.md');
  const readmeExists = await fileExists(readmePath);

  if (!readmeExists) {
    issues.push({
      ruleId: 'template-002',
      severity: 'warning',
      message: 'Template missing README.md',
      location: { path: templatePath },
      suggestion: 'Create README.md with template documentation',
      autoFixAvailable: false,
    });
  } else {
    // Validate README content
    const readmeIssues = await validateReadmeContent(readmePath, mcpName);
    issues.push(...readmeIssues);
  }

  // Check for template.json (metadata file)
  const templateJsonPath = path.join(templatePath, 'template.json');
  const templateJsonExists = await fileExists(templateJsonPath);

  if (!templateJsonExists) {
    issues.push({
      ruleId: 'template-003',
      severity: 'warning',
      message: 'Template missing template.json metadata file',
      location: { path: templatePath },
      suggestion: 'Create template.json with template metadata (name, version, description, author)',
      autoFixAvailable: false,
    });
  } else {
    // Validate template.json content
    const templateJsonIssues = await validateTemplateJson(templateJsonPath, mcpName);
    issues.push(...templateJsonIssues);
  }

  return issues;
}

/**
 * Validate README.md content
 */
async function validateReadmeContent(
  readmePath: string,
  mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await fs.readFile(readmePath, 'utf-8');

    // Check for required sections
    const requiredSections = [
      { name: 'Installation', pattern: /##\s*Installation/i },
      { name: 'Usage', pattern: /##\s*Usage/i },
      { name: 'Configuration', pattern: /##\s*Configuration/i },
    ];

    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        issues.push({
          ruleId: 'template-004',
          severity: 'info',
          message: `README.md missing "${section.name}" section`,
          location: { path: readmePath },
          suggestion: `Add ## ${section.name} section to README.md`,
          autoFixAvailable: false,
        });
      }
    }

    // Check if MCP name is mentioned
    if (!content.toLowerCase().includes(mcpName.toLowerCase())) {
      issues.push({
        ruleId: 'template-005',
        severity: 'warning',
        message: 'README.md does not mention MCP name',
        location: { path: readmePath },
        suggestion: `Update README.md to include "${mcpName}" in the description`,
        autoFixAvailable: false,
      });
    }
  } catch (error) {
    issues.push({
      ruleId: 'template-006',
      severity: 'warning',
      message: 'Could not read README.md content',
      location: { path: readmePath },
    });
  }

  return issues;
}

/**
 * Validate template.json content
 */
async function validateTemplateJson(
  templateJsonPath: string,
  mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await fs.readFile(templateJsonPath, 'utf-8');
    const metadata = JSON.parse(content);

    // Validate required fields
    const requiredFields = ['name', 'version', 'description', 'author'];

    for (const field of requiredFields) {
      if (!metadata[field]) {
        issues.push({
          ruleId: 'template-007',
          severity: 'warning',
          message: `template.json missing required field: ${field}`,
          location: { path: templateJsonPath },
          suggestion: `Add "${field}" field to template.json`,
          autoFixAvailable: false,
        });
      }
    }

    // Validate name matches MCP name
    if (metadata.name && !metadata.name.includes(mcpName)) {
      issues.push({
        ruleId: 'template-008',
        severity: 'info',
        message: `template.json name "${metadata.name}" does not match MCP name "${mcpName}"`,
        location: { path: templateJsonPath },
        suggestion: `Update template.json name to include "${mcpName}"`,
        autoFixAvailable: true,
      });
    }

    // Validate version format (semantic versioning)
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      issues.push({
        ruleId: 'template-009',
        severity: 'info',
        message: 'template.json version does not follow semantic versioning (x.y.z)',
        location: { path: templateJsonPath },
        suggestion: 'Use semantic versioning format (e.g., 1.0.0)',
        autoFixAvailable: false,
      });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      issues.push({
        ruleId: 'template-010',
        severity: 'critical',
        message: 'template.json has invalid JSON syntax',
        location: { path: templateJsonPath },
        suggestion: 'Fix JSON syntax errors in template.json',
        autoFixAvailable: false,
      });
    } else {
      issues.push({
        ruleId: 'template-011',
        severity: 'warning',
        message: 'Could not read template.json',
        location: { path: templateJsonPath },
      });
    }
  }

  return issues;
}

/**
 * Validate template structure
 */
async function validateTemplateStructure(
  templatePath: string,
  _mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for package.json template
  const packageJsonPath = path.join(templatePath, 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    issues.push({
      ruleId: 'template-012',
      severity: 'critical',
      message: 'Template missing package.json',
      location: { path: templatePath },
      suggestion: 'Create package.json with MCP dependencies',
      autoFixAvailable: false,
    });
  }

  // Check for src directory template
  const srcPath = path.join(templatePath, 'src');
  const srcExists = await directoryExists(srcPath);

  if (!srcExists) {
    issues.push({
      ruleId: 'template-013',
      severity: 'critical',
      message: 'Template missing src directory',
      location: { path: templatePath },
      suggestion: 'Create src directory with template MCP code',
      autoFixAvailable: false,
    });
  }

  // Check for tsconfig.json (if TypeScript project)
  const tsconfigPath = path.join(templatePath, 'tsconfig.json');
  const tsconfigExists = await fileExists(tsconfigPath);

  if (packageJsonExists && !tsconfigExists) {
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // If TypeScript is a dependency, tsconfig.json should exist
      if (packageJson.devDependencies?.typescript) {
        issues.push({
          ruleId: 'template-014',
          severity: 'warning',
          message: 'Template has TypeScript dependency but missing tsconfig.json',
          location: { path: templatePath },
          suggestion: 'Create tsconfig.json with TypeScript configuration',
          autoFixAvailable: false,
        });
      }
    } catch {
      // Ignore parsing errors (already caught by other validators)
    }
  }

  return issues;
}

/**
 * Validate template is installable (can be copied and used)
 */
async function validateTemplateInstallable(
  templatePath: string,
  _mcpName: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Check for .gitkeep or placeholder files that should be removed
  const gitkeepPath = path.join(templatePath, '.gitkeep');
  const gitkeepExists = await fileExists(gitkeepPath);

  if (gitkeepExists) {
    issues.push({
      ruleId: 'template-015',
      severity: 'info',
      message: 'Template contains .gitkeep placeholder file',
      location: { path: gitkeepPath },
      suggestion: 'Remove .gitkeep file from template',
      autoFixAvailable: true,
    });
  }

  // Check for install script or instructions
  const installScriptPath = path.join(templatePath, 'install.sh');
  const installScriptExists = await fileExists(installScriptPath);

  if (!installScriptExists) {
    issues.push({
      ruleId: 'template-016',
      severity: 'info',
      message: 'Template missing install.sh script',
      location: { path: templatePath },
      suggestion: 'Create install.sh script to automate template installation',
      autoFixAvailable: false,
    });
  }

  // Check for .template-config file (installation configuration)
  const templateConfigPath = path.join(templatePath, '.template-config');
  const templateConfigExists = await fileExists(templateConfigPath);

  if (!templateConfigExists) {
    issues.push({
      ruleId: 'template-017',
      severity: 'info',
      message: 'Template missing .template-config file',
      location: { path: templatePath },
      suggestion: 'Create .template-config with installation parameters and placeholders',
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
