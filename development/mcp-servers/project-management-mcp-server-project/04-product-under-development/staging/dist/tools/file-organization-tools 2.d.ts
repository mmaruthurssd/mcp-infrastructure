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
import { z } from 'zod';
/**
 * Naming convention rules for the hierarchical planning system
 */
export declare const NAMING_CONVENTIONS: {
    readonly FOLDER_PATTERN: RegExp;
    readonly FOLDER_MAX_LENGTH: 50;
    readonly FILE_PATTERN: RegExp;
    readonly FILE_MAX_LENGTH: 100;
    readonly MAJOR_GOAL_ID_PATTERN: RegExp;
    readonly SUB_GOAL_ID_PATTERN: RegExp;
    readonly TASK_ID_PATTERN: RegExp;
    readonly REQUIRED_ROOT_FILES: readonly ["README.md", "PROJECT-OVERVIEW.md", "NEXT-STEPS.md", "EVENT-LOG.md"];
    readonly REQUIRED_FOLDERS: readonly ["01-planning", "02-goals-and-roadmap", "03-resources-docs-assets-tools", "04-product-under-development", "05-brainstorming", "06-project-documentation", "07-temp", "08-archive"];
};
/**
 * YAML frontmatter templates for different file types
 */
export declare const YAML_TEMPLATES: {
    readonly 'project-overview': {
        readonly type: "overview";
        readonly tags: readonly ["project", "vision", "constitution"];
    };
    readonly component: {
        readonly type: "component";
        readonly tags: readonly ["component", "overview"];
    };
    readonly 'sub-area': {
        readonly type: "sub-area";
        readonly tags: readonly ["sub-area", "overview"];
    };
    readonly 'major-goal': {
        readonly type: "plan";
        readonly tags: readonly ["major-goal", "strategic"];
    };
    readonly 'sub-goal': {
        readonly type: "specification";
        readonly tags: readonly ["sub-goal", "tactical"];
    };
    readonly 'task-workflow': {
        readonly type: "workflow";
        readonly tags: readonly ["tasks", "execution"];
    };
    readonly readme: {
        readonly type: "readme";
        readonly tags: readonly ["documentation"];
    };
    readonly guide: {
        readonly type: "guide";
        readonly tags: readonly ["documentation"];
    };
    readonly reference: {
        readonly type: "reference";
        readonly tags: readonly ["documentation"];
    };
};
declare const ValidateNamingInputSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<{
        "major-goal-id": "major-goal-id";
        folder: "folder";
        file: "file";
        "sub-goal-id": "sub-goal-id";
        "task-id": "task-id";
    }>;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GeneratePathInputSchema: z.ZodObject<{
    projectPath: z.ZodString;
    entityType: z.ZodEnum<{
        component: "component";
        "sub-area": "sub-area";
        "major-goal": "major-goal";
        "sub-goal": "sub-goal";
        "task-workflow": "task-workflow";
        "project-overview": "project-overview";
    }>;
    entityId: z.ZodString;
    parentIds: z.ZodOptional<z.ZodObject<{
        componentId: z.ZodOptional<z.ZodString>;
        subAreaId: z.ZodOptional<z.ZodString>;
        majorGoalId: z.ZodOptional<z.ZodString>;
        subGoalId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const CreateFileWithMetadataInputSchema: z.ZodObject<{
    filePath: z.ZodString;
    fileType: z.ZodEnum<{
        component: "component";
        "sub-area": "sub-area";
        "major-goal": "major-goal";
        "sub-goal": "sub-goal";
        "task-workflow": "task-workflow";
        "project-overview": "project-overview";
        guide: "guide";
        readme: "readme";
        reference: "reference";
    }>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodObject<{
        customTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        customType: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const ValidateProjectStructureInputSchema: z.ZodObject<{
    projectPath: z.ZodString;
    checkLevel: z.ZodDefault<z.ZodEnum<{
        strict: "strict";
        basic: "basic";
        standard: "standard";
    }>>;
    autoFix: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Validate naming conventions
 */
export declare function validateNaming(input: z.infer<typeof ValidateNamingInputSchema>): {
    valid: boolean;
    errors: string[];
    suggestions?: string[];
};
/**
 * Generate proper file system path for a hierarchical entity
 */
export declare function generatePath(input: z.infer<typeof GeneratePathInputSchema>): {
    folderPath: string;
    filePath: string;
    createDirectories: string[];
};
/**
 * Create file with proper YAML frontmatter
 */
export declare function createFileWithMetadata(input: z.infer<typeof CreateFileWithMetadataInputSchema>): {
    success: boolean;
    filePath: string;
    error?: string;
};
/**
 * Validate project structure
 */
export declare function validateProjectStructure(input: z.infer<typeof ValidateProjectStructureInputSchema>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    fixed: string[];
};
export declare const fileOrganizationTools: {
    validate_naming: {
        description: string;
        inputSchema: z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<{
                "major-goal-id": "major-goal-id";
                folder: "folder";
                file: "file";
                "sub-goal-id": "sub-goal-id";
                "task-id": "task-id";
            }>;
            context: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        handler: typeof validateNaming;
    };
    generate_entity_path: {
        description: string;
        inputSchema: z.ZodObject<{
            projectPath: z.ZodString;
            entityType: z.ZodEnum<{
                component: "component";
                "sub-area": "sub-area";
                "major-goal": "major-goal";
                "sub-goal": "sub-goal";
                "task-workflow": "task-workflow";
                "project-overview": "project-overview";
            }>;
            entityId: z.ZodString;
            parentIds: z.ZodOptional<z.ZodObject<{
                componentId: z.ZodOptional<z.ZodString>;
                subAreaId: z.ZodOptional<z.ZodString>;
                majorGoalId: z.ZodOptional<z.ZodString>;
                subGoalId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        handler: typeof generatePath;
    };
    create_file_with_metadata: {
        description: string;
        inputSchema: z.ZodObject<{
            filePath: z.ZodString;
            fileType: z.ZodEnum<{
                component: "component";
                "sub-area": "sub-area";
                "major-goal": "major-goal";
                "sub-goal": "sub-goal";
                "task-workflow": "task-workflow";
                "project-overview": "project-overview";
                guide: "guide";
                readme: "readme";
                reference: "reference";
            }>;
            content: z.ZodString;
            metadata: z.ZodOptional<z.ZodObject<{
                customTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                customType: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        handler: typeof createFileWithMetadata;
    };
    validate_project_structure: {
        description: string;
        inputSchema: z.ZodObject<{
            projectPath: z.ZodString;
            checkLevel: z.ZodDefault<z.ZodEnum<{
                strict: "strict";
                basic: "basic";
                standard: "standard";
            }>>;
            autoFix: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        handler: typeof validateProjectStructure;
    };
};
export type FileOrganizationTools = typeof fileOrganizationTools;
export {};
//# sourceMappingURL=file-organization-tools%202.d.ts.map