/**
 * Version Detection MCP Tools
 *
 * User-facing tools for version detection and migration recommendations.
 * Builds on ProjectStructureAdapter from Goal 014.
 */
import { z } from 'zod';
import { ProjectVersion, FEATURE_COMPATIBILITY_MATRIX } from '../utils/project-structure-adapter.js';
interface UserPreferences {
    dontShowMigrationPrompt?: boolean;
    lastPromptDate?: string;
    promptCount?: number;
}
export declare const DetectProjectVersionSchema: z.ZodObject<{
    projectPath: z.ZodString;
}, z.core.$strip>;
export declare const CheckMigrationRecommendedSchema: z.ZodObject<{
    projectPath: z.ZodString;
    includePrompt: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const GetVersionInfoSchema: z.ZodObject<{
    projectPath: z.ZodString;
    detailed: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const SetMigrationPreferenceSchema: z.ZodObject<{
    projectPath: z.ZodString;
    dontShowAgain: z.ZodBoolean;
}, z.core.$strip>;
/**
 * Detect the current project version (v0.8.0 or v1.0.0)
 *
 * Returns version information with confidence scores and markers found.
 */
export declare function detectProjectVersion(params: z.infer<typeof DetectProjectVersionSchema>): Promise<{
    version: ProjectVersion;
    confidence: number;
    markers: {
        v080: string[];
        v100: string[];
    };
    recommendMigration: boolean;
    reason: string;
    performance: {
        detectionTimeMs: number;
    };
}>;
/**
 * Check if migration to v1.0.0 is recommended
 *
 * Considers project size, user preferences, and feature usage.
 * Respects user's "don't show again" preference.
 */
export declare function checkMigrationRecommended(params: z.infer<typeof CheckMigrationRecommendedSchema>): Promise<{
    recommended: boolean;
    reason: string;
    goalCount?: number;
    benefits: string[];
    migrationTime: string;
    riskLevel: 'low' | 'medium' | 'high';
    shouldPrompt: boolean;
    promptText?: string;
    userPreferences: {
        dontShowAgain: boolean;
        promptCount: number;
        lastPromptDate?: string;
    };
}>;
/**
 * Get comprehensive version information
 *
 * Includes version, feature availability, goal paths, and upgrade info.
 */
export declare function getVersionInfo(params: z.infer<typeof GetVersionInfoSchema>): Promise<{
    version: ProjectVersion;
    confidence: number;
    markers: {
        v080: string[];
        v100: string[];
    };
    paths: {
        potentialGoalsPath: string;
        selectedGoalsPath: string;
        archivedGoalsPath: string;
        isHierarchical: boolean;
    };
    features: {
        coreFeatures: string[];
        v100OnlyFeatures: string[];
        migrationFeatures: string[];
    };
    compatibilityMatrix?: typeof FEATURE_COMPATIBILITY_MATRIX;
    upgradeInfo?: {
        recommended: boolean;
        benefits: string[];
        migrationTime: string;
        riskLevel: string;
    };
}>;
/**
 * Set user preference for migration prompts
 *
 * Allows users to disable "upgrade to v1.0.0" prompts.
 */
export declare function setMigrationPreference(params: z.infer<typeof SetMigrationPreferenceSchema>): Promise<{
    success: boolean;
    message: string;
    preferences: UserPreferences;
}>;
export declare const versionDetectionTools: {
    detect_project_version: {
        schema: z.ZodObject<{
            projectPath: z.ZodString;
        }, z.core.$strip>;
        handler: typeof detectProjectVersion;
        description: string;
    };
    check_migration_recommended: {
        schema: z.ZodObject<{
            projectPath: z.ZodString;
            includePrompt: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        handler: typeof checkMigrationRecommended;
        description: string;
    };
    get_version_info: {
        schema: z.ZodObject<{
            projectPath: z.ZodString;
            detailed: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        handler: typeof getVersionInfo;
        description: string;
    };
    set_migration_preference: {
        schema: z.ZodObject<{
            projectPath: z.ZodString;
            dontShowAgain: z.ZodBoolean;
        }, z.core.$strip>;
        handler: typeof setMigrationPreference;
        description: string;
    };
};
export {};
//# sourceMappingURL=version-detection-tools%202.d.ts.map