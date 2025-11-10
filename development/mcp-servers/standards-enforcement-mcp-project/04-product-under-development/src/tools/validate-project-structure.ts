import * as path from 'path';
import * as os from 'os';
import { ValidateProjectStructureParams } from '../types/tool-params.js';
import { ValidationResult } from '../types/validation.js';
import { ValidationContext } from '../types/rules.js';
import { RulesEngine, ValidatorRegistry, RulesRegistryManager, ComplianceCalculator } from '../core/index.js';
import {
  validateProjectStructure,
  validateEightFolderStructureStrict,
  validateFourFolderStructure,
} from '../validators/index.js';

/**
 * Tool 2: validate_project_structure
 * Validates project folder structure
 */
export async function validateProjectStructureTool(
  params: ValidateProjectStructureParams
): Promise<ValidationResult> {
  const { projectPath, expectedStructure, strictMode } = params;

  // Initialize registry and engine
  const registry = new RulesRegistryManager();
  const validators = new ValidatorRegistry();
  const calculator = new ComplianceCalculator();

  // Register validators based on expected structure
  if (expectedStructure === '8-folder' && strictMode) {
    validators.register('validateStructure', validateEightFolderStructureStrict);
  } else if (expectedStructure === '4-folder') {
    validators.register('validateStructure', validateFourFolderStructure);
  } else {
    validators.register('validateStructure', validateProjectStructure);
  }

  // Register a simple rule
  registry.registerRule({
    id: 'structure-validation',
    name: 'Project Structure Validation',
    category: 'project-structure',
    severity: 'critical',
    description: `Validate ${expectedStructure} project structure`,
    rationale: 'Standardized structure improves consistency',
    validator: 'validateStructure',
    documentation: {
      rationale: 'Consistent structure enables better tooling and navigation',
      examples: {
        good: ['Proper numbered folder structure'],
        bad: ['Missing or incorrectly named folders'],
      },
      fixes: ['Create missing folders', 'Rename folders to match standard'],
      references: ['PROJECT_STRUCTURE_GUIDE.md'],
    },
    enabled: true,
  });

  const engine = new RulesEngine(registry, validators, calculator);

  // Create validation context
  const context: ValidationContext = {
    workspacePath: getWorkspacePath(),
    targetPath: projectPath,
    targetType: 'project',
  };

  // Execute validation
  const result = await engine.validate(context);

  return result;
}

/**
 * Get workspace path
 */
function getWorkspacePath(): string {
  const envPath = process.env.WORKSPACE_PATH;
  if (envPath) {
    return envPath;
  }
  return path.join(os.homedir(), 'Desktop', 'operations-workspace');
}
