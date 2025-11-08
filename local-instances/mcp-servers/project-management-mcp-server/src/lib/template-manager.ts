/**
 * Template Manager
 *
 * Manages template file operations, placeholder replacement, and project structure creation
 * Integrates with the 8-folder project structure templates
 */

import * as fs from "fs";
import * as path from "path";
import { replacePlaceholders } from "./markdown-parser.js";
import { ProjectType } from "./component-types.js";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Base path to templates
 */
export const TEMPLATES_BASE = path.join(
  process.env.HOME || "",
  "Desktop/medical-practice-workspace/templates-and-patterns/project-structure-templates/base-template"
);

/**
 * Template file paths
 */
export const TEMPLATE_FILES = {
  README: "README.md",
  EVENT_LOG: "EVENT_LOG.md",
  NEXT_STEPS: "NEXT_STEPS.md",
  TROUBLESHOOTING: "TROUBLESHOOTING.md",
  PROJECT_DISCUSSION: "01-planning/project-discussion.md",
  PROJECT_OVERVIEW: "01-planning/project-overview-working.md",
  CONSTITUTION: "01-planning/CONSTITUTION.md",
  ROADMAP: "02-goals-and-roadmap/ROADMAP.md",
  RESOURCE_INDEX: "03-resources-docs-assets-tools/RESOURCE-INDEX.md",
  STAKEHOLDERS: "03-resources-docs-assets-tools/STAKEHOLDERS.md",
};

/**
 * Project folder structure (8-folder system)
 */
export const FOLDER_STRUCTURE = [
  "01-planning",
  "01-planning/brainstorming",
  "01-planning/decisions",
  "02-goals-and-roadmap",
  "02-goals-and-roadmap/potential-goals",
  "02-goals-and-roadmap/selected-goals",
  "02-goals-and-roadmap/completed-goals",
  "03-resources-docs-assets-tools",
  "03-resources-docs-assets-tools/documentation",
  "03-resources-docs-assets-tools/assets",
  "03-resources-docs-assets-tools/tools",
  "04-product-under-development",
  "04-product-under-development/source-code",
  "04-product-under-development/specifications",
  "05-workflows-and-testing",
  "05-workflows-and-testing/workflows",
  "05-workflows-and-testing/testing",
  "06-deployments-and-versioning",
  "06-deployments-and-versioning/deployments",
  "06-deployments-and-versioning/versions",
  "07-data-and-backups",
  "07-data-and-backups/backups",
  "08-archive",
];

// ============================================================================
// PROJECT INITIALIZATION
// ============================================================================

/**
 * Initialize a new project with template files and folder structure
 */
export function initializeProject(
  projectPath: string,
  projectName: string,
  projectType: ProjectType = "software"
): { filesCreated: string[]; foldersCreated: string[] } {
  const filesCreated: string[] = [];
  const foldersCreated: string[] = [];

  // Create project root
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    foldersCreated.push(projectPath);
  }

  // Create folder structure
  for (const folder of FOLDER_STRUCTURE) {
    const folderPath = path.join(projectPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      foldersCreated.push(folderPath);
    }
  }

  // Create placeholder map
  const placeholders = createPlaceholderMap(projectName, projectType);

  // Copy template files
  const templateBasePath = path.join(TEMPLATES_BASE, "file-templates");

  for (const [key, relativeTemplatePath] of Object.entries(TEMPLATE_FILES)) {
    const templatePath = path.join(templateBasePath, relativeTemplatePath);
    const destPath = path.join(projectPath, relativeTemplatePath);

    if (fs.existsSync(templatePath)) {
      // Read template
      let content = fs.readFileSync(templatePath, "utf-8");

      // Replace placeholders
      content = replacePlaceholders(content, placeholders);

      // Write to destination
      fs.writeFileSync(destPath, content, "utf-8");
      filesCreated.push(destPath);
    }
  }

  return { filesCreated, foldersCreated };
}

/**
 * Create placeholder replacement map
 */
export function createPlaceholderMap(
  projectName: string,
  projectType: ProjectType = "software"
): Record<string, string> {
  const now = new Date();

  return {
    PROJECT_NAME: projectName,
    PROJECT_TYPE: projectType,
    DATE_CREATED: now.toISOString().split("T")[0],
    DATE_UPDATED: now.toISOString().split("T")[0],
    DATE: now.toISOString().split("T")[0],
    TIME: now.toTimeString().split(" ")[0],
    DATETIME: now.toISOString(),
    YEAR: now.getFullYear().toString(),
  };
}

/**
 * Update placeholders in a file
 */
export function updatePlaceholders(
  filePath: string,
  placeholders: Record<string, string>
): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let content = fs.readFileSync(filePath, "utf-8");
  content = replacePlaceholders(content, placeholders);
  fs.writeFileSync(filePath, content, "utf-8");
}

// ============================================================================
// PROJECT STRUCTURE
// ============================================================================

/**
 * Get project structure (folder paths)
 */
export function getProjectStructure(projectPath: string): string[] {
  return FOLDER_STRUCTURE.map((folder) => path.join(projectPath, folder));
}

/**
 * Get key file paths
 */
export function getKeyFilePaths(projectPath: string): Record<string, string> {
  const paths: Record<string, string> = {};

  for (const [key, relativePath] of Object.entries(TEMPLATE_FILES)) {
    paths[key] = path.join(projectPath, relativePath);
  }

  return paths;
}

/**
 * Validate project structure
 */
export function validateProjectStructure(projectPath: string): {
  valid: boolean;
  missingFolders: string[];
  missingFiles: string[];
} {
  const missingFolders: string[] = [];
  const missingFiles: string[] = [];

  // Check folders
  for (const folder of FOLDER_STRUCTURE) {
    const folderPath = path.join(projectPath, folder);
    if (!fs.existsSync(folderPath)) {
      missingFolders.push(folder);
    }
  }

  // Check key files
  for (const [key, relativePath] of Object.entries(TEMPLATE_FILES)) {
    const filePath = path.join(projectPath, relativePath);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(relativePath);
    }
  }

  return {
    valid: missingFolders.length === 0 && missingFiles.length === 0,
    missingFolders,
    missingFiles,
  };
}

/**
 * Quick validation check
 */
export function isValidProject(projectPath: string): boolean {
  // Check for essential files
  const essentialFiles = [
    path.join(projectPath, "README.md"),
    path.join(projectPath, "01-planning/project-overview-working.md"),
  ];

  return essentialFiles.every((file) => fs.existsSync(file));
}

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

/**
 * Get templates base path
 */
export function getTemplatesBasePath(): string {
  return TEMPLATES_BASE;
}

/**
 * List available template files
 */
export function listTemplateFiles(): string[] {
  const templateBasePath = path.join(TEMPLATES_BASE, "file-templates");

  if (!fs.existsSync(templateBasePath)) {
    return [];
  }

  const files: string[] = [];
  const walk = (dir: string, prefix = "") => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(relativePath);
      }
    }
  };

  walk(templateBasePath);
  return files;
}

/**
 * Copy a single template file
 */
export function copySingleTemplate(
  templateName: string,
  destPath: string,
  placeholders?: Record<string, string>
): void {
  const templateBasePath = path.join(TEMPLATES_BASE, "file-templates");
  const templatePath = path.join(templateBasePath, templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  let content = fs.readFileSync(templatePath, "utf-8");

  if (placeholders) {
    content = replacePlaceholders(content, placeholders);
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.writeFileSync(destPath, content, "utf-8");
}

/**
 * Create a backup of the project
 */
export function backupProject(projectPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const projectName = path.basename(projectPath);
  const backupPath = path.join(path.dirname(projectPath), `${projectName}-backup-${timestamp}`);

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project not found: ${projectPath}`);
  }

  // Copy project to backup location
  fs.cpSync(projectPath, backupPath, { recursive: true });

  return backupPath;
}

/**
 * Get project metadata from README
 */
export function getProjectMetadata(projectPath: string): {
  name?: string;
  type?: string;
  created?: string;
} | null {
  const readmePath = path.join(projectPath, "README.md");

  if (!fs.existsSync(readmePath)) {
    return null;
  }

  const content = fs.readFileSync(readmePath, "utf-8");

  const nameMatch = content.match(/# (.+)/);
  const typeMatch = content.match(/Type:\s*(.+)/i);
  const createdMatch = content.match(/Created:\s*(.+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    type: typeMatch ? typeMatch[1].trim() : undefined,
    created: createdMatch ? createdMatch[1].trim() : undefined,
  };
}
