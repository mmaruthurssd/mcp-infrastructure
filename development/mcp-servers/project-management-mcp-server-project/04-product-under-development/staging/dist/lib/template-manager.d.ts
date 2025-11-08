/**
 * Template Manager
 *
 * Manages template file operations, placeholder replacement, and project structure creation
 * Integrates with the 8-folder project structure templates
 */
import { ProjectType } from "./component-types.js";
/**
 * Base path to templates
 */
export declare const TEMPLATES_BASE: string;
/**
 * Template file paths
 */
export declare const TEMPLATE_FILES: {
    README: string;
    EVENT_LOG: string;
    NEXT_STEPS: string;
    TROUBLESHOOTING: string;
    PROJECT_DISCUSSION: string;
    PROJECT_OVERVIEW: string;
    CONSTITUTION: string;
    ROADMAP: string;
    RESOURCE_INDEX: string;
    STAKEHOLDERS: string;
};
/**
 * Project folder structure (8-folder system)
 */
export declare const FOLDER_STRUCTURE: string[];
/**
 * Initialize a new project with template files and folder structure
 */
export declare function initializeProject(projectPath: string, projectName: string, projectType?: ProjectType): {
    filesCreated: string[];
    foldersCreated: string[];
};
/**
 * Create placeholder replacement map
 */
export declare function createPlaceholderMap(projectName: string, projectType?: ProjectType): Record<string, string>;
/**
 * Update placeholders in a file
 */
export declare function updatePlaceholders(filePath: string, placeholders: Record<string, string>): void;
/**
 * Get project structure (folder paths)
 */
export declare function getProjectStructure(projectPath: string): string[];
/**
 * Get key file paths
 */
export declare function getKeyFilePaths(projectPath: string): Record<string, string>;
/**
 * Validate project structure
 */
export declare function validateProjectStructure(projectPath: string): {
    valid: boolean;
    missingFolders: string[];
    missingFiles: string[];
};
/**
 * Quick validation check
 */
export declare function isValidProject(projectPath: string): boolean;
/**
 * Get templates base path
 */
export declare function getTemplatesBasePath(): string;
/**
 * List available template files
 */
export declare function listTemplateFiles(): string[];
/**
 * Copy a single template file
 */
export declare function copySingleTemplate(templateName: string, destPath: string, placeholders?: Record<string, string>): void;
/**
 * Create a backup of the project
 */
export declare function backupProject(projectPath: string): string;
/**
 * Get project metadata from README
 */
export declare function getProjectMetadata(projectPath: string): {
    name?: string;
    type?: string;
    created?: string;
} | null;
//# sourceMappingURL=template-manager.d.ts.map