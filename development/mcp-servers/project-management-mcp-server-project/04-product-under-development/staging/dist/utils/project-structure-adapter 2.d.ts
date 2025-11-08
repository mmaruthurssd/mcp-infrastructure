/**
 * Project Structure Adapter
 *
 * Provides dual-mode support for v0.8.0 (flat structure) and v1.0.0 (hierarchical structure).
 * Automatically detects project version and adapts operations accordingly.
 *
 * Key Features:
 * - Automatic version detection on every operation
 * - Unified interface for both structures
 * - Graceful degradation for v1.0.0-only features
 * - Clear error messages and upgrade prompts
 * - Feature availability matrix
 *
 * v0.8.0 Structure:
 * - brainstorming/future-goals/potential-goals/
 * - brainstorming/future-goals/SELECTED-GOALS.md
 * - 08-archive/goals/
 *
 * v1.0.0 Structure:
 * - 01-planning/PROJECT-OVERVIEW.md
 * - 02-goals-and-roadmap/components/[component]/major-goals/
 * - 08-archive/goals/
 */
/**
 * Project version enum
 */
export declare enum ProjectVersion {
    V0_8_0 = "v0.8.0",
    V1_0_0 = "v1.0.0",
    UNKNOWN = "unknown"
}
/**
 * Version detection result
 */
export interface VersionDetectionResult {
    version: ProjectVersion;
    confidence: number;
    markers: {
        v080: string[];
        v100: string[];
    };
    recommendMigration: boolean;
    reason: string;
}
/**
 * Feature availability for a version
 */
export interface FeatureAvailability {
    createPotentialGoal: boolean;
    promoteToSelected: boolean;
    viewGoalsDashboard: boolean;
    updateGoalProgress: boolean;
    extractIdeas: boolean;
    generateReviewReport: boolean;
    generateGoalsDiagram: boolean;
    checkReviewNeeded: boolean;
    generateProjectOverview: boolean;
    createComponent: boolean;
    identifyComponents: boolean;
    handoffToSpecDriven: boolean;
    createMajorGoal: boolean;
    promoteToMajorGoal: boolean;
    updateMajorGoalProgress: boolean;
    getMajorGoalStatus: boolean;
    analyzeForMigration: boolean;
    suggestGoalClustering: boolean;
    migrateToHierarchical: boolean;
    validateMigration: boolean;
    rollbackMigration: boolean;
}
/**
 * Goal path information (abstracted across versions)
 */
export interface GoalPathInfo {
    potentialGoalsPath: string;
    selectedGoalsPath: string;
    archivedGoalsPath: string;
    isHierarchical: boolean;
}
/**
 * Upgrade prompt information
 */
export interface UpgradePrompt {
    shouldPrompt: boolean;
    reason: string;
    benefits: string[];
    migrationTime: string;
    riskLevel: 'low' | 'medium' | 'high';
}
/**
 * Project Structure Adapter
 * Main class for dual-mode support
 */
export declare class ProjectStructureAdapter {
    private projectPath;
    private cachedVersion;
    private cachedDetectionResult;
    constructor(projectPath: string);
    /**
     * Detect project version with caching
     */
    detectVersion(): Promise<VersionDetectionResult>;
    /**
     * Perform actual version detection (not cached)
     */
    private performVersionDetection;
    /**
     * Get feature availability for detected version
     */
    getFeatureAvailability(): Promise<FeatureAvailability>;
    /**
     * Get goal paths for detected version
     */
    getGoalPaths(): Promise<GoalPathInfo>;
    /**
     * Check if a feature is available in current version
     */
    isFeatureAvailable(featureName: keyof FeatureAvailability): Promise<boolean>;
    /**
     * Get upgrade prompt information (if migration recommended)
     */
    getUpgradePrompt(): Promise<UpgradePrompt | null>;
    /**
     * Throw error with helpful message if feature not available
     */
    assertFeatureAvailable(featureName: keyof FeatureAvailability, featureDisplayName: string): Promise<void>;
    /**
     * Format feature unavailable message (for non-throwing contexts)
     */
    formatFeatureUnavailableMessage(featureName: keyof FeatureAvailability, featureDisplayName: string): Promise<string>;
    /**
     * Clear cached version (call this if project structure changes)
     */
    clearCache(): void;
}
/**
 * Convenience function to create adapter
 */
export declare function createAdapter(projectPath: string): ProjectStructureAdapter;
/**
 * Convenience function to detect version without creating adapter
 */
export declare function detectProjectVersion(projectPath: string): Promise<VersionDetectionResult>;
/**
 * Convenience function to check feature availability
 */
export declare function isFeatureAvailable(projectPath: string, featureName: keyof FeatureAvailability): Promise<boolean>;
/**
 * Feature compatibility matrix (for documentation)
 */
export declare const FEATURE_COMPATIBILITY_MATRIX: {
    core: {
        tool: string;
        v080: boolean;
        v100: boolean;
        notes: string;
    }[];
    v100Only: {
        tool: string;
        v080: boolean;
        v100: boolean;
        notes: string;
    }[];
    migration: {
        tool: string;
        v080: boolean;
        v100: boolean;
        notes: string;
    }[];
};
//# sourceMappingURL=project-structure-adapter%202.d.ts.map