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
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Project version enum
 */
export var ProjectVersion;
(function (ProjectVersion) {
    ProjectVersion["V0_8_0"] = "v0.8.0";
    ProjectVersion["V1_0_0"] = "v1.0.0";
    ProjectVersion["UNKNOWN"] = "unknown";
})(ProjectVersion || (ProjectVersion = {}));
/**
 * Project Structure Adapter
 * Main class for dual-mode support
 */
export class ProjectStructureAdapter {
    projectPath;
    cachedVersion = null;
    cachedDetectionResult = null;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /**
     * Detect project version with caching
     */
    async detectVersion() {
        // Return cached result if available (valid for this instance)
        if (this.cachedDetectionResult) {
            return this.cachedDetectionResult;
        }
        const result = await this.performVersionDetection();
        this.cachedVersion = result.version;
        this.cachedDetectionResult = result;
        return result;
    }
    /**
     * Perform actual version detection (not cached)
     */
    async performVersionDetection() {
        const v080Markers = [];
        const v100Markers = [];
        // Check for v0.8.0 markers
        const v080Paths = [
            'brainstorming/future-goals/potential-goals',
            'brainstorming/future-goals/SELECTED-GOALS.md',
            'brainstorming/future-goals/ARCHIVED-GOALS.md'
        ];
        for (const marker of v080Paths) {
            const fullPath = path.join(this.projectPath, marker);
            try {
                await fs.access(fullPath);
                v080Markers.push(marker);
            }
            catch {
                // Marker doesn't exist
            }
        }
        // Check for v1.0.0 markers
        const v100Paths = [
            '01-planning/PROJECT-OVERVIEW.md',
            '02-goals-and-roadmap/components',
            '02-goals-and-roadmap/ROADMAP.md'
        ];
        for (const marker of v100Paths) {
            const fullPath = path.join(this.projectPath, marker);
            try {
                await fs.access(fullPath);
                v100Markers.push(marker);
            }
            catch {
                // Marker doesn't exist
            }
        }
        // Determine version based on markers
        let version;
        let confidence;
        let reason;
        let recommendMigration = false;
        if (v100Markers.length >= 2) {
            // Strong v1.0.0 signal (need at least PROJECT OVERVIEW + components folder)
            version = ProjectVersion.V1_0_0;
            confidence = v100Markers.length / 3; // 0.67-1.0
            reason = `Found ${v100Markers.length} v1.0.0 markers: ${v100Markers.join(', ')}`;
            if (v080Markers.length > 0) {
                // Hybrid state (probably mid-migration)
                confidence = 0.6; // Lower confidence
                reason += ` (Note: Also found ${v080Markers.length} v0.8.0 markers - possible migration in progress)`;
            }
        }
        else if (v080Markers.length >= 2) {
            // Strong v0.8.0 signal (need at least potential-goals + SELECTED-GOALS.md)
            version = ProjectVersion.V0_8_0;
            confidence = v080Markers.length / 3; // 0.67-1.0
            reason = `Found ${v080Markers.length} v0.8.0 markers: ${v080Markers.join(', ')}`;
            recommendMigration = true; // Suggest upgrading to v1.0.0
        }
        else if (v100Markers.length === 1) {
            // Weak v1.0.0 signal
            version = ProjectVersion.V1_0_0;
            confidence = 0.5;
            reason = `Found 1 v1.0.0 marker: ${v100Markers[0]} (weak signal)`;
        }
        else if (v080Markers.length === 1) {
            // Weak v0.8.0 signal
            version = ProjectVersion.V0_8_0;
            confidence = 0.5;
            reason = `Found 1 v0.8.0 marker: ${v080Markers[0]} (weak signal)`;
            recommendMigration = true;
        }
        else {
            // No clear markers - unknown or new project
            version = ProjectVersion.UNKNOWN;
            confidence = 0;
            reason = 'No clear version markers found - might be new project or non-standard structure';
        }
        return {
            version,
            confidence,
            markers: {
                v080: v080Markers,
                v100: v100Markers
            },
            recommendMigration,
            reason
        };
    }
    /**
     * Get feature availability for detected version
     */
    async getFeatureAvailability() {
        const detection = await this.detectVersion();
        if (detection.version === ProjectVersion.V1_0_0) {
            // All features available
            return {
                createPotentialGoal: true,
                promoteToSelected: true,
                viewGoalsDashboard: true,
                updateGoalProgress: true,
                extractIdeas: true,
                generateReviewReport: true,
                generateGoalsDiagram: true,
                checkReviewNeeded: true,
                generateProjectOverview: true,
                createComponent: true,
                identifyComponents: true,
                handoffToSpecDriven: true,
                createMajorGoal: true,
                promoteToMajorGoal: true,
                updateMajorGoalProgress: true,
                getMajorGoalStatus: true,
                analyzeForMigration: true,
                suggestGoalClustering: true,
                migrateToHierarchical: true,
                validateMigration: true,
                rollbackMigration: true
            };
        }
        else if (detection.version === ProjectVersion.V0_8_0) {
            // Only core features available
            return {
                createPotentialGoal: true,
                promoteToSelected: true,
                viewGoalsDashboard: true,
                updateGoalProgress: true,
                extractIdeas: true,
                generateReviewReport: true,
                generateGoalsDiagram: true,
                checkReviewNeeded: true,
                generateProjectOverview: false, // v1.0.0 only
                createComponent: false, // v1.0.0 only
                identifyComponents: false, // v1.0.0 only
                handoffToSpecDriven: false, // v1.0.0 only (needs hierarchical context)
                createMajorGoal: false, // v1.0.0 only
                promoteToMajorGoal: false, // v1.0.0 only
                updateMajorGoalProgress: false, // v1.0.0 only
                getMajorGoalStatus: false, // v1.0.0 only
                analyzeForMigration: true, // Migration tools work on v0.8.0
                suggestGoalClustering: true,
                migrateToHierarchical: true,
                validateMigration: false, // Only after migration
                rollbackMigration: false // Only after migration
            };
        }
        else {
            // Unknown version - assume v1.0.0 for new projects
            return await this.getFeatureAvailability(); // Default to v1.0.0
        }
    }
    /**
     * Get goal paths for detected version
     */
    async getGoalPaths() {
        const detection = await this.detectVersion();
        if (detection.version === ProjectVersion.V1_0_0) {
            return {
                potentialGoalsPath: path.join(this.projectPath, 'brainstorming/future-goals/potential-goals'),
                selectedGoalsPath: path.join(this.projectPath, '02-goals-and-roadmap/components'), // Hierarchical
                archivedGoalsPath: path.join(this.projectPath, '08-archive/goals'),
                isHierarchical: true
            };
        }
        else {
            // v0.8.0 or unknown (default to v0.8.0 paths)
            return {
                potentialGoalsPath: path.join(this.projectPath, 'brainstorming/future-goals/potential-goals'),
                selectedGoalsPath: path.join(this.projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md'), // Flat file
                archivedGoalsPath: path.join(this.projectPath, '08-archive/goals'),
                isHierarchical: false
            };
        }
    }
    /**
     * Check if a feature is available in current version
     */
    async isFeatureAvailable(featureName) {
        const features = await this.getFeatureAvailability();
        return features[featureName];
    }
    /**
     * Get upgrade prompt information (if migration recommended)
     */
    async getUpgradePrompt() {
        const detection = await this.detectVersion();
        if (!detection.recommendMigration) {
            return null;
        }
        // Count goals in v0.8.0 project
        let goalCount = 0;
        try {
            const potentialGoalsPath = path.join(this.projectPath, 'brainstorming/future-goals/potential-goals');
            const files = await fs.readdir(potentialGoalsPath);
            goalCount = files.filter(f => f.endsWith('.md')).length;
            const selectedGoalsPath = path.join(this.projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md');
            try {
                const content = await fs.readFile(selectedGoalsPath, 'utf-8');
                // Count goal entries (rough estimate)
                goalCount += (content.match(/^##\s+Goal\s+\d+/gm) || []).length;
            }
            catch {
                // No selected goals file
            }
        }
        catch {
            // Can't read goals
        }
        return {
            shouldPrompt: true,
            reason: `This project uses v0.8.0 flat structure (${goalCount} goals).`,
            benefits: [
                'Better organization with 5 components',
                'Progress tracking across 7 hierarchical levels',
                'Seamless Spec-Driven MCP integration',
                'Advanced visualization and documentation',
                'Automatic progress aggregation'
            ],
            migrationTime: goalCount < 10 ? '5-10 minutes' : goalCount < 25 ? '10-20 minutes' : '20-30 minutes',
            riskLevel: 'low' // Automatic backup created, rollback available
        };
    }
    /**
     * Throw error with helpful message if feature not available
     */
    async assertFeatureAvailable(featureName, featureDisplayName) {
        const available = await this.isFeatureAvailable(featureName);
        if (!available) {
            const detection = await this.detectVersion();
            const upgradePrompt = await this.getUpgradePrompt();
            let errorMessage = `⚠️  ${featureDisplayName} requires v1.0.0 hierarchical structure.\n\n`;
            errorMessage += `Current project version: ${detection.version}\n`;
            if (upgradePrompt) {
                errorMessage += `\n${upgradePrompt.reason}\n\n`;
                errorMessage += `✨ Consider upgrading to v1.0.0 for:\n`;
                upgradePrompt.benefits.forEach(benefit => {
                    errorMessage += `   • ${benefit}\n`;
                });
                errorMessage += `\n⏱️  Migration time: ~${upgradePrompt.migrationTime}\n`;
                errorMessage += `🔒 Risk level: ${upgradePrompt.riskLevel} (automatic backup + rollback available)\n\n`;
                errorMessage += `To migrate: Use analyze_project_for_migration tool\n`;
            }
            else {
                errorMessage += `\nThis feature is only available in v1.0.0 hierarchical projects.\n`;
            }
            throw new Error(errorMessage);
        }
    }
    /**
     * Format feature unavailable message (for non-throwing contexts)
     */
    async formatFeatureUnavailableMessage(featureName, featureDisplayName) {
        const detection = await this.detectVersion();
        const upgradePrompt = await this.getUpgradePrompt();
        let message = `⚠️  ${featureDisplayName} requires v1.0.0 hierarchical structure.\n\n`;
        message += `Current project version: ${detection.version}\n`;
        if (upgradePrompt) {
            message += `\n${upgradePrompt.reason}\n\n`;
            message += `Consider upgrading for these benefits:\n`;
            upgradePrompt.benefits.forEach(benefit => {
                message += `  • ${benefit}\n`;
            });
            message += `\nMigration time: ~${upgradePrompt.migrationTime}\n`;
            message += `Risk level: ${upgradePrompt.riskLevel}\n`;
        }
        return message;
    }
    /**
     * Clear cached version (call this if project structure changes)
     */
    clearCache() {
        this.cachedVersion = null;
        this.cachedDetectionResult = null;
    }
}
/**
 * Convenience function to create adapter
 */
export function createAdapter(projectPath) {
    return new ProjectStructureAdapter(projectPath);
}
/**
 * Convenience function to detect version without creating adapter
 */
export async function detectProjectVersion(projectPath) {
    const adapter = new ProjectStructureAdapter(projectPath);
    return adapter.detectVersion();
}
/**
 * Convenience function to check feature availability
 */
export async function isFeatureAvailable(projectPath, featureName) {
    const adapter = new ProjectStructureAdapter(projectPath);
    return adapter.isFeatureAvailable(featureName);
}
/**
 * Feature compatibility matrix (for documentation)
 */
export const FEATURE_COMPATIBILITY_MATRIX = {
    // Core features (work in both versions)
    core: [
        { tool: 'create_potential_goal', v080: true, v100: true, notes: 'Works with both structures' },
        { tool: 'promote_to_selected', v080: true, v100: true, notes: 'Detects structure automatically' },
        { tool: 'view_goals_dashboard', v080: true, v100: true, notes: 'Different layouts per version' },
        { tool: 'update_goal_progress', v080: true, v100: true, notes: 'Flat vs hierarchical aggregation' },
        { tool: 'extract_ideas', v080: true, v100: true, notes: 'Same functionality' },
        { tool: 'generate_review_report', v080: true, v100: true, notes: 'Adapted format' },
        { tool: 'generate_goals_diagram', v080: true, v100: true, notes: 'Different layouts' },
        { tool: 'check_review_needed', v080: true, v100: true, notes: 'Same logic' }
    ],
    // v1.0.0 only features
    v100Only: [
        { tool: 'generate_project_overview', v080: false, v100: true, notes: 'Hierarchical structure only' },
        { tool: 'create_component', v080: false, v100: true, notes: 'v1.0.0 concept' },
        { tool: 'identify_components', v080: false, v100: true, notes: 'v1.0.0 concept' },
        { tool: 'handoff_to_spec_driven', v080: false, v100: true, notes: 'Requires hierarchical context' },
        { tool: 'create_major_goal', v080: false, v100: true, notes: 'v1.0.0 concept' },
        { tool: 'promote_to_major_goal', v080: false, v100: true, notes: 'v1.0.0 concept' }
    ],
    // Migration features
    migration: [
        { tool: 'analyze_project_for_migration', v080: true, v100: true, notes: 'Analyzes for migration' },
        { tool: 'suggest_goal_clustering', v080: true, v100: true, notes: 'Groups goals into components' },
        { tool: 'migrate_to_hierarchical', v080: true, v100: false, notes: 'Migrates v0.8.0 → v1.0.0' },
        { tool: 'validate_migration', v080: false, v100: true, notes: 'After migration only' },
        { tool: 'rollback_migration', v080: false, v100: true, notes: 'After migration only' }
    ]
};
//# sourceMappingURL=project-structure-adapter%202.js.map