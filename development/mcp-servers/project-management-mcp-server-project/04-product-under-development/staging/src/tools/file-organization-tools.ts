/**
 * File Organization Tools for Project Management MCP Server v1.0.0
 *
 * Provides tools for:
 * - Validating file and folder naming conventions
 * - Generating proper paths for hierarchical entities
 * - Creating files with proper YAML frontmatter
 * - Validating project structure compliance
 *
 * Ensures consistency across all hierarchical planning projects.
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// ============================================================================
// NAMING CONVENTIONS
// ============================================================================

/**
 * Naming convention rules for the hierarchical planning system
 */
export const NAMING_CONVENTIONS = {
  // Folder naming
  FOLDER_PATTERN: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  FOLDER_MAX_LENGTH: 50,

  // File naming
  FILE_PATTERN: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.(md|json|yaml|yml|ts|js)$/,
  FILE_MAX_LENGTH: 100,

  // Goal ID patterns
  MAJOR_GOAL_ID_PATTERN: /^[0-9]{3}$/, // e.g., "001", "002"
  SUB_GOAL_ID_PATTERN: /^[0-9]{1,2}\.[0-9]{1,2}$/, // e.g., "1.1", "12.3"
  TASK_ID_PATTERN: /^[0-9]+$/, // e.g., "1", "2", "10"

  // Required files
  REQUIRED_ROOT_FILES: [
    'README.md',
    'PROJECT-OVERVIEW.md',
    'NEXT-STEPS.md',
    'EVENT-LOG.md',
  ],

  REQUIRED_FOLDERS: [
    '01-planning',
    '02-goals-and-roadmap',
    '03-resources-docs-assets-tools',
    '04-product-under-development',
    '05-brainstorming',
    '06-project-documentation',
    '07-temp',
    '08-archive',
  ],
} as const;

/**
 * YAML frontmatter templates for different file types
 */
export const YAML_TEMPLATES = {
  'project-overview': {
    type: 'overview',
    tags: ['project', 'vision', 'constitution'],
  },
  'component': {
    type: 'component',
    tags: ['component', 'overview'],
  },
  'sub-area': {
    type: 'sub-area',
    tags: ['sub-area', 'overview'],
  },
  'major-goal': {
    type: 'plan',
    tags: ['major-goal', 'strategic'],
  },
  'sub-goal': {
    type: 'specification',
    tags: ['sub-goal', 'tactical'],
  },
  'task-workflow': {
    type: 'workflow',
    tags: ['tasks', 'execution'],
  },
  'readme': {
    type: 'readme',
    tags: ['documentation'],
  },
  'guide': {
    type: 'guide',
    tags: ['documentation'],
  },
  'reference': {
    type: 'reference',
    tags: ['documentation'],
  },
} as const;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ValidateNamingInputSchema = z.object({
  name: z.string().min(1).describe('Name to validate'),
  type: z
    .enum(['folder', 'file', 'major-goal-id', 'sub-goal-id', 'task-id'])
    .describe('Type of name to validate'),
  context: z.string().optional().describe('Optional context for more specific validation'),
});

const GeneratePathInputSchema = z.object({
  projectPath: z.string().min(1).describe('Absolute path to project root'),
  entityType: z
    .enum([
      'project-overview',
      'component',
      'sub-area',
      'major-goal',
      'sub-goal',
      'task-workflow',
    ])
    .describe('Type of entity to generate path for'),
  entityId: z.string().min(1).describe('Entity ID (e.g., "001", "1.1")'),
  parentIds: z
    .object({
      componentId: z.string().optional(),
      subAreaId: z.string().optional(),
      majorGoalId: z.string().optional(),
      subGoalId: z.string().optional(),
    })
    .optional()
    .describe('Parent entity IDs for hierarchical path generation'),
});

const CreateFileWithMetadataInputSchema = z.object({
  filePath: z.string().min(1).describe('Absolute path where file should be created'),
  fileType: z
    .enum([
      'project-overview',
      'component',
      'sub-area',
      'major-goal',
      'sub-goal',
      'task-workflow',
      'readme',
      'guide',
      'reference',
    ])
    .describe('Type of file to create'),
  content: z.string().describe('Content to write to file'),
  metadata: z
    .object({
      customTags: z.array(z.string()).optional(),
      customType: z.string().optional(),
    })
    .optional()
    .describe('Optional custom metadata overrides'),
});

const ValidateProjectStructureInputSchema = z.object({
  projectPath: z.string().min(1).describe('Absolute path to project root'),
  checkLevel: z
    .enum(['basic', 'standard', 'strict'])
    .default('standard')
    .describe('Validation strictness level'),
  autoFix: z
    .boolean()
    .default(false)
    .describe('Automatically create missing required files/folders'),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate naming conventions
 */
export function validateNaming(input: z.infer<typeof ValidateNamingInputSchema>): {
  valid: boolean;
  errors: string[];
  suggestions?: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  switch (input.type) {
    case 'folder':
      // Check pattern
      if (!NAMING_CONVENTIONS.FOLDER_PATTERN.test(input.name)) {
        errors.push(
          'Folder name must be kebab-case (lowercase letters, numbers, hyphens only)'
        );
        suggestions.push(toKebabCase(input.name));
      }

      // Check length
      if (input.name.length > NAMING_CONVENTIONS.FOLDER_MAX_LENGTH) {
        errors.push(
          `Folder name exceeds maximum length of ${NAMING_CONVENTIONS.FOLDER_MAX_LENGTH} characters`
        );
      }

      // Check for generic names
      const genericNames = ['folder', 'dir', 'files', 'stuff', 'misc', 'other', 'temp'];
      if (genericNames.includes(input.name.toLowerCase())) {
        errors.push('Avoid generic folder names - be descriptive');
      }
      break;

    case 'file':
      // Check pattern
      if (!NAMING_CONVENTIONS.FILE_PATTERN.test(input.name)) {
        errors.push(
          'File name must be kebab-case with valid extension (.md, .json, .yaml, .yml, .ts, .js)'
        );
        const baseName = path.basename(input.name, path.extname(input.name));
        const extension = path.extname(input.name);
        suggestions.push(toKebabCase(baseName) + (extension || '.md'));
      }

      // Check length
      if (input.name.length > NAMING_CONVENTIONS.FILE_MAX_LENGTH) {
        errors.push(
          `File name exceeds maximum length of ${NAMING_CONVENTIONS.FILE_MAX_LENGTH} characters`
        );
      }
      break;

    case 'major-goal-id':
      if (!NAMING_CONVENTIONS.MAJOR_GOAL_ID_PATTERN.test(input.name)) {
        errors.push('Major goal ID must be 3 digits (e.g., "001", "002", "015")');
        const num = parseInt(input.name, 10);
        if (!isNaN(num)) {
          suggestions.push(num.toString().padStart(3, '0'));
        }
      }
      break;

    case 'sub-goal-id':
      if (!NAMING_CONVENTIONS.SUB_GOAL_ID_PATTERN.test(input.name)) {
        errors.push('Sub-goal ID must be format X.Y (e.g., "1.1", "2.3", "12.5")');
      }
      break;

    case 'task-id':
      if (!NAMING_CONVENTIONS.TASK_ID_PATTERN.test(input.name)) {
        errors.push('Task ID must be a positive integer (e.g., "1", "2", "10")');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Generate proper file system path for a hierarchical entity
 */
export function generatePath(input: z.infer<typeof GeneratePathInputSchema>): {
  folderPath: string;
  filePath: string;
  createDirectories: string[];
} {
  const { projectPath, entityType, entityId, parentIds } = input;
  const createDirectories: string[] = [];

  let folderPath = projectPath;
  let fileName = '';

  switch (entityType) {
    case 'project-overview':
      folderPath = path.join(projectPath, '01-planning');
      fileName = 'PROJECT-OVERVIEW.md';
      createDirectories.push(folderPath);
      break;

    case 'component': {
      const componentFolder = toKebabCase(entityId);
      folderPath = path.join(projectPath, '02-goals-and-roadmap', 'components', componentFolder);
      fileName = 'COMPONENT-OVERVIEW.md';
      createDirectories.push(
        path.join(projectPath, '02-goals-and-roadmap'),
        path.join(projectPath, '02-goals-and-roadmap', 'components'),
        folderPath
      );
      break;
    }

    case 'sub-area': {
      if (!parentIds?.componentId) {
        throw new Error('componentId required for sub-area path generation');
      }
      const componentFolder = toKebabCase(parentIds.componentId);
      const subAreaFolder = toKebabCase(entityId);
      folderPath = path.join(
        projectPath,
        '02-goals-and-roadmap',
        'components',
        componentFolder,
        subAreaFolder
      );
      fileName = 'SUB-AREA-OVERVIEW.md';
      createDirectories.push(
        path.join(projectPath, '02-goals-and-roadmap', 'components', componentFolder),
        folderPath
      );
      break;
    }

    case 'major-goal': {
      if (!parentIds?.componentId) {
        throw new Error('componentId required for major-goal path generation');
      }

      const componentFolder = toKebabCase(parentIds.componentId);
      const goalFolder = `${entityId}-${toKebabCase(entityId)}`;

      if (parentIds.subAreaId) {
        // Goal within a sub-area
        const subAreaFolder = toKebabCase(parentIds.subAreaId);
        folderPath = path.join(
          projectPath,
          '02-goals-and-roadmap',
          'components',
          componentFolder,
          subAreaFolder,
          'major-goals',
          goalFolder
        );
        createDirectories.push(
          path.join(
            projectPath,
            '02-goals-and-roadmap',
            'components',
            componentFolder,
            subAreaFolder
          ),
          path.join(
            projectPath,
            '02-goals-and-roadmap',
            'components',
            componentFolder,
            subAreaFolder,
            'major-goals'
          ),
          folderPath
        );
      } else {
        // Goal directly under component
        folderPath = path.join(
          projectPath,
          '02-goals-and-roadmap',
          'components',
          componentFolder,
          'major-goals',
          goalFolder
        );
        createDirectories.push(
          path.join(projectPath, '02-goals-and-roadmap', 'components', componentFolder),
          path.join(
            projectPath,
            '02-goals-and-roadmap',
            'components',
            componentFolder,
            'major-goals'
          ),
          folderPath
        );
      }

      fileName = `${entityId}-${toKebabCase(entityId)}.md`;
      break;
    }

    case 'sub-goal': {
      if (!parentIds?.componentId || !parentIds?.majorGoalId) {
        throw new Error('componentId and majorGoalId required for sub-goal path generation');
      }

      const componentFolder = toKebabCase(parentIds.componentId);
      const majorGoalFolder = `${parentIds.majorGoalId}-${toKebabCase(parentIds.majorGoalId)}`;
      const subGoalFolder = `${entityId}-${toKebabCase(entityId)}`;

      if (parentIds.subAreaId) {
        const subAreaFolder = toKebabCase(parentIds.subAreaId);
        folderPath = path.join(
          projectPath,
          '02-goals-and-roadmap',
          'components',
          componentFolder,
          subAreaFolder,
          'major-goals',
          majorGoalFolder,
          'sub-goals',
          subGoalFolder
        );
      } else {
        folderPath = path.join(
          projectPath,
          '02-goals-and-roadmap',
          'components',
          componentFolder,
          'major-goals',
          majorGoalFolder,
          'sub-goals',
          subGoalFolder
        );
      }

      fileName = 'SPECIFICATION.md';
      createDirectories.push(folderPath);
      break;
    }

    case 'task-workflow': {
      folderPath = path.join(projectPath, 'temp', 'workflows', toKebabCase(entityId));
      fileName = 'workflow.json';
      createDirectories.push(
        path.join(projectPath, 'temp'),
        path.join(projectPath, 'temp', 'workflows'),
        folderPath
      );
      break;
    }
  }

  return {
    folderPath,
    filePath: path.join(folderPath, fileName),
    createDirectories: [...new Set(createDirectories)], // Remove duplicates
  };
}

/**
 * Create file with proper YAML frontmatter
 */
export function createFileWithMetadata(
  input: z.infer<typeof CreateFileWithMetadataInputSchema>
): {
  success: boolean;
  filePath: string;
  error?: string;
} {
  try {
    const { filePath, fileType, content, metadata } = input;

    // Get template for file type
    const template = YAML_TEMPLATES[fileType];
    const finalType = metadata?.customType || template.type;
    const finalTags = metadata?.customTags || template.tags;

    // Generate YAML frontmatter
    const yaml = `---
type: ${finalType}
tags: [${finalTags.join(', ')}]
---

`;

    // Combine YAML + content
    const fullContent = yaml + content;

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, fullContent, 'utf-8');

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      filePath: input.filePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate project structure
 */
export function validateProjectStructure(
  input: z.infer<typeof ValidateProjectStructureInputSchema>
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixed: string[];
} {
  const { projectPath, checkLevel, autoFix } = input;
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixed: string[] = [];

  // Check if project root exists
  if (!fs.existsSync(projectPath)) {
    errors.push(`Project path does not exist: ${projectPath}`);
    return { valid: false, errors, warnings, fixed };
  }

  // Check required folders
  for (const folder of NAMING_CONVENTIONS.REQUIRED_FOLDERS) {
    const folderPath = path.join(projectPath, folder);
    if (!fs.existsSync(folderPath)) {
      if (checkLevel === 'strict') {
        errors.push(`Missing required folder: ${folder}`);
      } else {
        warnings.push(`Missing recommended folder: ${folder}`);
      }

      if (autoFix) {
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          fixed.push(`Created folder: ${folder}`);
        } catch (error) {
          errors.push(`Failed to create folder ${folder}: ${error}`);
        }
      }
    }
  }

  // Check required files (only for standard and strict)
  if (checkLevel !== 'basic') {
    for (const file of NAMING_CONVENTIONS.REQUIRED_ROOT_FILES) {
      const filePath = path.join(projectPath, file);
      if (!fs.existsSync(filePath)) {
        if (checkLevel === 'strict') {
          errors.push(`Missing required file: ${file}`);
        } else {
          warnings.push(`Missing recommended file: ${file}`);
        }

        // Don't auto-create files - only folders
      }
    }
  }

  // Check for PROJECT-OVERVIEW.md in 01-planning
  const projectOverviewPath = path.join(projectPath, '01-planning', 'PROJECT-OVERVIEW.md');
  if (!fs.existsSync(projectOverviewPath) && checkLevel === 'strict') {
    errors.push('Missing PROJECT-OVERVIEW.md in 01-planning/');
  }

  // Check naming conventions for existing files/folders
  if (checkLevel === 'strict') {
    const checkNaming = (dirPath: string, depth: number = 0) => {
      if (depth > 10) return; // Prevent infinite recursion

      try {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          // Skip hidden files and node_modules
          if (item.startsWith('.') || item === 'node_modules') continue;

          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            // Validate folder name
            const validation = validateNaming({ name: item, type: 'folder' });
            if (!validation.valid) {
              warnings.push(`Invalid folder name: ${item} - ${validation.errors.join(', ')}`);
            }
            checkNaming(itemPath, depth + 1);
          } else if (stat.isFile() && item.endsWith('.md')) {
            // Validate markdown file name
            const validation = validateNaming({ name: item, type: 'file' });
            if (!validation.valid) {
              warnings.push(`Invalid file name: ${item} - ${validation.errors.join(', ')}`);
            }
          }
        }
      } catch (error) {
        // Silently skip inaccessible directories
      }
    };

    checkNaming(projectPath);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixed,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

export const fileOrganizationTools = {
  validate_naming: {
    description: 'Validate file or folder naming conventions',
    inputSchema: ValidateNamingInputSchema,
    handler: validateNaming,
  },

  generate_entity_path: {
    description: 'Generate proper file system path for a hierarchical entity',
    inputSchema: GeneratePathInputSchema,
    handler: generatePath,
  },

  create_file_with_metadata: {
    description: 'Create a file with proper YAML frontmatter metadata',
    inputSchema: CreateFileWithMetadataInputSchema,
    handler: createFileWithMetadata,
  },

  validate_project_structure: {
    description: 'Validate project follows organizational standards',
    inputSchema: ValidateProjectStructureInputSchema,
    handler: validateProjectStructure,
  },
};

export type FileOrganizationTools = typeof fileOrganizationTools;
