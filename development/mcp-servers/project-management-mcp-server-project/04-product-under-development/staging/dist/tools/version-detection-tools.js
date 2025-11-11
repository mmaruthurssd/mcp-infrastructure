/**
 * Version Detection MCP Tools
 *
 * User-facing tools for version detection and migration recommendations.
 * Builds on ProjectStructureAdapter from Goal 014.
 */
import { z } from 'zod';
import { ProjectStructureAdapter, ProjectVersion, FEATURE_COMPATIBILITY_MATRIX } from '../utils/project-structure-adapter.js';
import * as fs from 'fs/promises';
import * as path from 'path';
const PREFERENCES_FILE = '.ai-planning-preferences.json';
async function loadUserPreferences(projectPath) {
    const prefsPath = path.join(projectPath, PREFERENCES_FILE);
    try {
        const content = await fs.readFile(prefsPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {};
    }
}
async function saveUserPreferences(projectPath, prefs) {
    const prefsPath = path.join(projectPath, PREFERENCES_FILE);
    await fs.writeFile(prefsPath, JSON.stringify(prefs, null, 2), 'utf-8');
}
// ============================================================================
// Schemas
// ============================================================================
export const DetectProjectVersionSchema = z.object({
    projectPath: z.string().describe('Absolute path to the project directory')
});
export const CheckMigrationRecommendedSchema = z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    includePrompt: z.boolean().optional().describe('Include formatted upgrade prompt text (default: false)')
});
export const GetVersionInfoSchema = z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    detailed: z.boolean().optional().describe('Include detailed feature availability matrix (default: false)')
});
export const SetMigrationPreferenceSchema = z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    dontShowAgain: z.boolean().describe('Set to true to stop showing migration prompts')
});
// ============================================================================
// Tool 1: Detect Project Version
// ============================================================================
/**
 * Detect the current project version (v0.8.0 or v1.0.0)
 *
 * Returns version information with confidence scores and markers found.
 */
export async function detectProjectVersion(params) {
    const startTime = Date.now();
    const adapter = new ProjectStructureAdapter(params.projectPath);
    const detection = await adapter.detectVersion();
    const detectionTime = Date.now() - startTime;
    return {
        version: detection.version,
        confidence: detection.confidence,
        markers: detection.markers,
        recommendMigration: detection.recommendMigration,
        reason: detection.reason,
        performance: {
            detectionTimeMs: detectionTime
        }
    };
}
// ============================================================================
// Tool 2: Check Migration Recommended
// ============================================================================
/**
 * Check if migration to v1.0.0 is recommended
 *
 * Considers project size, user preferences, and feature usage.
 * Respects user's "don't show again" preference.
 */
export async function checkMigrationRecommended(params) {
    const adapter = new ProjectStructureAdapter(params.projectPath);
    const detection = await adapter.detectVersion();
    const prefs = await loadUserPreferences(params.projectPath);
    // If user said don't show again, respect that
    if (prefs.dontShowMigrationPrompt) {
        return {
            recommended: false,
            reason: 'User preference: migration prompts disabled',
            benefits: [],
            migrationTime: 'N/A',
            riskLevel: 'low',
            shouldPrompt: false,
            userPreferences: {
                dontShowAgain: true,
                promptCount: prefs.promptCount || 0,
                lastPromptDate: prefs.lastPromptDate
            }
        };
    }
    // If not v0.8.0, no migration needed
    if (detection.version !== ProjectVersion.V0_8_0) {
        return {
            recommended: false,
            reason: `Project is already ${detection.version}`,
            benefits: [],
            migrationTime: 'N/A',
            riskLevel: 'low',
            shouldPrompt: false,
            userPreferences: {
                dontShowAgain: false,
                promptCount: 0
            }
        };
    }
    // Get upgrade prompt info
    const upgradePrompt = await adapter.getUpgradePrompt();
    if (!upgradePrompt || !upgradePrompt.shouldPrompt) {
        return {
            recommended: false,
            reason: 'Migration not recommended at this time',
            benefits: [],
            migrationTime: 'N/A',
            riskLevel: 'low',
            shouldPrompt: false,
            userPreferences: {
                dontShowAgain: false,
                promptCount: prefs.promptCount || 0
            }
        };
    }
    // Count goals to determine prompting strategy
    let goalCount = 0;
    try {
        const potentialPath = path.join(params.projectPath, 'brainstorming/future-goals/potential-goals');
        const files = await fs.readdir(potentialPath);
        goalCount += files.filter(f => f.endsWith('.md')).length;
        const selectedPath = path.join(params.projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md');
        try {
            const content = await fs.readFile(selectedPath, 'utf-8');
            goalCount += (content.match(/^##\s+Goal\s+\d+/gm) || []).length;
        }
        catch {
            // No selected goals
        }
    }
    catch {
        // Can't read goals
    }
    // Smart prompting logic:
    // - Small projects (<10 goals): Don't prompt (v0.8.0 is fine)
    // - Medium projects (10-20 goals): Gentle prompt (but not too often)
    // - Large projects (>20 goals): Strong prompt
    let shouldPrompt = false;
    let promptFrequency = 'never';
    if (goalCount < 10) {
        shouldPrompt = false;
        promptFrequency = 'never';
    }
    else if (goalCount < 20) {
        // Prompt once per 5 tool uses
        const promptCount = prefs.promptCount || 0;
        shouldPrompt = promptCount % 5 === 0;
        promptFrequency = 'occasional';
    }
    else {
        // Large project - prompt more frequently
        const promptCount = prefs.promptCount || 0;
        shouldPrompt = promptCount % 3 === 0;
        promptFrequency = 'frequent';
    }
    // Check if we prompted recently (don't prompt more than once per day)
    if (shouldPrompt && prefs.lastPromptDate) {
        const lastPrompt = new Date(prefs.lastPromptDate);
        const daysSincePrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePrompt < 1) {
            shouldPrompt = false;
        }
    }
    // Increment prompt counter
    await saveUserPreferences(params.projectPath, {
        ...prefs,
        promptCount: (prefs.promptCount || 0) + 1,
        lastPromptDate: shouldPrompt ? new Date().toISOString() : prefs.lastPromptDate
    });
    let promptText;
    if (params.includePrompt && shouldPrompt) {
        promptText = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        promptText += `📊 Project has ${goalCount} goals in v0.8.0 flat structure\n`;
        promptText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        promptText += `${upgradePrompt.reason}\n\n`;
        promptText += `Benefits of upgrading to v1.0.0:\n`;
        upgradePrompt.benefits.forEach(benefit => {
            promptText += `  ✓ ${benefit}\n`;
        });
        promptText += `\n`;
        promptText += `⏱️  Estimated migration time: ${upgradePrompt.migrationTime}\n`;
        promptText += `🔒 Risk level: ${upgradePrompt.riskLevel}\n\n`;
        promptText += `To migrate: Use analyze_project_for_migration tool\n`;
        promptText += `To stop showing this: Use set_migration_preference tool\n`;
        promptText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }
    return {
        recommended: true,
        reason: `Project has ${goalCount} goals - ${goalCount < 20 ? 'gentle suggestion' : 'strong recommendation'} (prompt frequency: ${promptFrequency})`,
        goalCount,
        benefits: upgradePrompt.benefits,
        migrationTime: upgradePrompt.migrationTime,
        riskLevel: upgradePrompt.riskLevel,
        shouldPrompt,
        promptText,
        userPreferences: {
            dontShowAgain: false,
            promptCount: prefs.promptCount || 0,
            lastPromptDate: prefs.lastPromptDate
        }
    };
}
// ============================================================================
// Tool 3: Get Version Info
// ============================================================================
/**
 * Get comprehensive version information
 *
 * Includes version, feature availability, goal paths, and upgrade info.
 */
export async function getVersionInfo(params) {
    const adapter = new ProjectStructureAdapter(params.projectPath);
    const detection = await adapter.detectVersion();
    const paths = await adapter.getGoalPaths();
    const features = await adapter.getFeatureAvailability();
    // Build feature lists
    const coreFeatures = [];
    const v100OnlyFeatures = [];
    const migrationFeatures = [];
    Object.entries(features).forEach(([feature, available]) => {
        if (feature.includes('Migration') || feature.includes('migration')) {
            if (available)
                migrationFeatures.push(feature);
        }
        else if (available) {
            // Check if it's v1.0.0 only by seeing if it's unavailable in v0.8.0
            if (detection.version === ProjectVersion.V0_8_0) {
                coreFeatures.push(feature);
            }
            else {
                // In v1.0.0, need to check if it would be available in v0.8.0
                // For now, classify based on feature name
                if (feature.includes('component') || feature.includes('Component') ||
                    feature.includes('handoff') || feature.includes('Handoff') ||
                    feature.includes('majorGoal') || feature.includes('MajorGoal')) {
                    v100OnlyFeatures.push(feature);
                }
                else {
                    coreFeatures.push(feature);
                }
            }
        }
    });
    const upgradePrompt = await adapter.getUpgradePrompt();
    const result = {
        version: detection.version,
        confidence: detection.confidence,
        markers: detection.markers,
        paths: {
            potentialGoalsPath: paths.potentialGoalsPath,
            selectedGoalsPath: paths.selectedGoalsPath,
            archivedGoalsPath: paths.archivedGoalsPath,
            isHierarchical: paths.isHierarchical
        },
        features: {
            coreFeatures,
            v100OnlyFeatures,
            migrationFeatures
        }
    };
    if (params.detailed) {
        result.compatibilityMatrix = FEATURE_COMPATIBILITY_MATRIX;
    }
    if (upgradePrompt) {
        result.upgradeInfo = {
            recommended: upgradePrompt.shouldPrompt,
            benefits: upgradePrompt.benefits,
            migrationTime: upgradePrompt.migrationTime,
            riskLevel: upgradePrompt.riskLevel
        };
    }
    return result;
}
// ============================================================================
// Tool 4: Set Migration Preference
// ============================================================================
/**
 * Set user preference for migration prompts
 *
 * Allows users to disable "upgrade to v1.0.0" prompts.
 */
export async function setMigrationPreference(params) {
    const prefs = await loadUserPreferences(params.projectPath);
    const newPrefs = {
        ...prefs,
        dontShowMigrationPrompt: params.dontShowAgain,
        lastPromptDate: new Date().toISOString()
    };
    await saveUserPreferences(params.projectPath, newPrefs);
    return {
        success: true,
        message: params.dontShowAgain
            ? 'Migration prompts disabled. You can still migrate manually using migration tools.'
            : 'Migration prompts re-enabled.',
        preferences: newPrefs
    };
}
// ============================================================================
// Export all tools
// ============================================================================
export const versionDetectionTools = {
    detect_project_version: {
        schema: DetectProjectVersionSchema,
        handler: detectProjectVersion,
        description: 'Detect the current project version (v0.8.0 or v1.0.0) with confidence scores'
    },
    check_migration_recommended: {
        schema: CheckMigrationRecommendedSchema,
        handler: checkMigrationRecommended,
        description: 'Check if migration to v1.0.0 is recommended based on project size and user preferences'
    },
    get_version_info: {
        schema: GetVersionInfoSchema,
        handler: getVersionInfo,
        description: 'Get comprehensive version information including features, paths, and upgrade info'
    },
    set_migration_preference: {
        schema: SetMigrationPreferenceSchema,
        handler: setMigrationPreference,
        description: 'Set user preference to disable/enable migration prompts'
    }
};
//# sourceMappingURL=version-detection-tools.js.map