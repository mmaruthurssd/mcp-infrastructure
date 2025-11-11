/**
 * Backward Compatibility Integration Tests
 *
 * Tests dual-mode support for v0.8.0 and v1.0.0 project structures
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectStructureAdapter, ProjectVersion, detectProjectVersion, isFeatureAvailable, FEATURE_COMPATIBILITY_MATRIX } from '../utils/project-structure-adapter.js';
import { withBackwardCompatibility, withDualMode, getFeatureUnavailableMessage, shouldShowUpgradePrompt, getUpgradePromptText } from '../utils/backward-compatibility-wrapper.js';
const TEST_DIR = path.join(process.cwd(), 'temp/backward-compat-test');
const V080_PROJECT = path.join(TEST_DIR, 'v080-project');
const V100_PROJECT = path.join(TEST_DIR, 'v100-project');
const UNKNOWN_PROJECT = path.join(TEST_DIR, 'unknown-project');
/**
 * Setup v0.8.0 project structure
 */
async function setupV080Project() {
    await fs.mkdir(path.join(V080_PROJECT, 'brainstorming/future-goals/potential-goals'), { recursive: true });
    await fs.mkdir(path.join(V080_PROJECT, '08-archive/goals'), { recursive: true });
    // Create SELECTED-GOALS.md
    await fs.writeFile(path.join(V080_PROJECT, 'brainstorming/future-goals/SELECTED-GOALS.md'), `# Selected Goals

## Goal 001: First Goal
- Status: In Progress
- Priority: High

## Goal 002: Second Goal
- Status: Planning
- Priority: Medium
`);
    // Create potential goal
    await fs.writeFile(path.join(V080_PROJECT, 'brainstorming/future-goals/potential-goals/001-test-goal.md'), `---
id: "001"
name: Test Goal
impact: High
effort: Medium
---

# Test Goal

This is a test goal in v0.8.0 structure.
`);
}
/**
 * Setup v1.0.0 project structure
 */
async function setupV100Project() {
    await fs.mkdir(path.join(V100_PROJECT, '01-planning'), { recursive: true });
    await fs.mkdir(path.join(V100_PROJECT, '02-goals-and-roadmap/components/test-component/major-goals'), { recursive: true });
    await fs.mkdir(path.join(V100_PROJECT, 'brainstorming/future-goals/potential-goals'), { recursive: true });
    await fs.mkdir(path.join(V100_PROJECT, '08-archive/goals'), { recursive: true });
    // Create PROJECT OVERVIEW
    await fs.writeFile(path.join(V100_PROJECT, '01-planning/PROJECT-OVERVIEW.md'), `---
version: 1
---

# PROJECT OVERVIEW

Test project with v1.0.0 hierarchical structure.
`);
    // Create ROADMAP
    await fs.writeFile(path.join(V100_PROJECT, '02-goals-and-roadmap/ROADMAP.md'), `# Roadmap

## Components
- Test Component
`);
    // Create component overview
    await fs.writeFile(path.join(V100_PROJECT, '02-goals-and-roadmap/components/test-component/COMPONENT-OVERVIEW.md'), `---
id: test-component
name: Test Component
---

# Test Component

This is a test component.
`);
    // Create major goal
    await fs.writeFile(path.join(V100_PROJECT, '02-goals-and-roadmap/components/test-component/major-goals/001-test-goal.md'), `---
id: "001"
name: Test Goal
component: test-component
status: Planning
---

# Major Goal 001: Test Goal

This is a test major goal in v1.0.0 structure.
`);
}
/**
 * Setup unknown project (no clear markers)
 */
async function setupUnknownProject() {
    await fs.mkdir(UNKNOWN_PROJECT, { recursive: true });
    await fs.writeFile(path.join(UNKNOWN_PROJECT, 'README.md'), '# Unknown Project');
}
/**
 * Cleanup test directories
 */
async function cleanup() {
    try {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    }
    catch {
        // Directory doesn't exist
    }
}
// ============================================================================
// Test Suites
// ============================================================================
describe('ProjectStructureAdapter - Version Detection', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
        await setupUnknownProject();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should detect v0.8.0 project correctly', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const detection = await adapter.detectVersion();
        expect(detection.version).toBe(ProjectVersion.V0_8_0);
        expect(detection.confidence).toBeGreaterThan(0.6);
        expect(detection.markers.v080.length).toBeGreaterThan(0);
        expect(detection.recommendMigration).toBe(true);
    });
    test('should detect v1.0.0 project correctly', async () => {
        const adapter = new ProjectStructureAdapter(V100_PROJECT);
        const detection = await adapter.detectVersion();
        expect(detection.version).toBe(ProjectVersion.V1_0_0);
        expect(detection.confidence).toBeGreaterThan(0.6);
        expect(detection.markers.v100.length).toBeGreaterThan(0);
        expect(detection.recommendMigration).toBe(false);
    });
    test('should detect unknown project', async () => {
        const adapter = new ProjectStructureAdapter(UNKNOWN_PROJECT);
        const detection = await adapter.detectVersion();
        expect(detection.version).toBe(ProjectVersion.UNKNOWN);
        expect(detection.confidence).toBe(0);
    });
    test('should cache detection result', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const detection1 = await adapter.detectVersion();
        const detection2 = await adapter.detectVersion();
        // Should be same object (cached)
        expect(detection1).toBe(detection2);
    });
    test('should clear cache when requested', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const detection1 = await adapter.detectVersion();
        adapter.clearCache();
        const detection2 = await adapter.detectVersion();
        // Should be different objects (re-detected)
        expect(detection1).not.toBe(detection2);
        // But same content
        expect(detection1.version).toBe(detection2.version);
    });
    test('should use convenience function for detection', async () => {
        const detection = await detectProjectVersion(V100_PROJECT);
        expect(detection.version).toBe(ProjectVersion.V1_0_0);
    });
});
describe('ProjectStructureAdapter - Feature Availability', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should allow all features in v1.0.0', async () => {
        const adapter = new ProjectStructureAdapter(V100_PROJECT);
        const features = await adapter.getFeatureAvailability();
        // Core features
        expect(features.createPotentialGoal).toBe(true);
        expect(features.promoteToSelected).toBe(true);
        expect(features.viewGoalsDashboard).toBe(true);
        // v1.0.0 features
        expect(features.generateProjectOverview).toBe(true);
        expect(features.createComponent).toBe(true);
        expect(features.handoffToSpecDriven).toBe(true);
        // Migration features
        expect(features.analyzeForMigration).toBe(true);
        expect(features.migrateToHierarchical).toBe(true);
    });
    test('should restrict v1.0.0 features in v0.8.0', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const features = await adapter.getFeatureAvailability();
        // Core features - should work
        expect(features.createPotentialGoal).toBe(true);
        expect(features.promoteToSelected).toBe(true);
        expect(features.viewGoalsDashboard).toBe(true);
        // v1.0.0 features - should NOT work
        expect(features.generateProjectOverview).toBe(false);
        expect(features.createComponent).toBe(false);
        expect(features.handoffToSpecDriven).toBe(false);
        // Migration features - should work (to migrate TO v1.0.0)
        expect(features.analyzeForMigration).toBe(true);
        expect(features.migrateToHierarchical).toBe(true);
    });
    test('should check individual feature availability', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const canCreateGoal = await adapter.isFeatureAvailable('createPotentialGoal');
        const canCreateComponent = await adapter.isFeatureAvailable('createComponent');
        expect(canCreateGoal).toBe(true); // Works in v0.8.0
        expect(canCreateComponent).toBe(false); // Doesn't work in v0.8.0
    });
    test('should use convenience function for feature check', async () => {
        const available = await isFeatureAvailable(V080_PROJECT, 'createComponent');
        expect(available).toBe(false);
    });
});
describe('ProjectStructureAdapter - Goal Paths', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should return flat paths for v0.8.0', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const paths = await adapter.getGoalPaths();
        expect(paths.isHierarchical).toBe(false);
        expect(paths.selectedGoalsPath).toContain('SELECTED-GOALS.md');
        expect(paths.potentialGoalsPath).toContain('potential-goals');
    });
    test('should return hierarchical paths for v1.0.0', async () => {
        const adapter = new ProjectStructureAdapter(V100_PROJECT);
        const paths = await adapter.getGoalPaths();
        expect(paths.isHierarchical).toBe(true);
        expect(paths.selectedGoalsPath).toContain('components');
        expect(paths.potentialGoalsPath).toContain('potential-goals');
    });
});
describe('ProjectStructureAdapter - Upgrade Prompts', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should recommend migration for v0.8.0', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const prompt = await adapter.getUpgradePrompt();
        expect(prompt).not.toBeNull();
        expect(prompt.shouldPrompt).toBe(true);
        expect(prompt.benefits.length).toBeGreaterThan(0);
        expect(prompt.riskLevel).toBe('low');
    });
    test('should not recommend migration for v1.0.0', async () => {
        const adapter = new ProjectStructureAdapter(V100_PROJECT);
        const prompt = await adapter.getUpgradePrompt();
        expect(prompt).toBeNull();
    });
    test('should estimate migration time based on goal count', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const prompt = await adapter.getUpgradePrompt();
        expect(prompt.migrationTime).toMatch(/\d+-\d+ minutes/);
    });
});
describe('ProjectStructureAdapter - Error Handling', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should throw helpful error for unavailable feature', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        await expect(adapter.assertFeatureAvailable('createComponent', 'Create Component')).rejects.toThrow('Create Component requires v1.0.0');
    });
    test('should include upgrade info in error', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        try {
            await adapter.assertFeatureAvailable('createComponent', 'Create Component');
            fail('Should have thrown error');
        }
        catch (error) {
            expect(error.message).toContain('v0.8.0');
            expect(error.message).toContain('analyze_project_for_migration');
        }
    });
    test('should format unavailable message without throwing', async () => {
        const adapter = new ProjectStructureAdapter(V080_PROJECT);
        const message = await adapter.formatFeatureUnavailableMessage('createComponent', 'Create Component');
        expect(message).toContain('Create Component requires v1.0.0');
        expect(message).toContain('v0.8.0');
    });
});
describe('Backward Compatibility Wrapper - withDualMode', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should work with v0.8.0 project', async () => {
        const result = await withDualMode(V080_PROJECT, async (adapter, paths, version) => {
            expect(version).toBe(ProjectVersion.V0_8_0);
            expect(paths.isHierarchical).toBe(false);
            return { success: true, version };
        });
        expect(result.success).toBe(true);
        expect(result.version).toBe(ProjectVersion.V0_8_0);
    });
    test('should work with v1.0.0 project', async () => {
        const result = await withDualMode(V100_PROJECT, async (adapter, paths, version) => {
            expect(version).toBe(ProjectVersion.V1_0_0);
            expect(paths.isHierarchical).toBe(true);
            return { success: true, version };
        });
        expect(result.success).toBe(true);
        expect(result.version).toBe(ProjectVersion.V1_0_0);
    });
    test('should provide adapter to handler', async () => {
        await withDualMode(V100_PROJECT, async (adapter) => {
            const detection = await adapter.detectVersion();
            expect(detection.version).toBe(ProjectVersion.V1_0_0);
            return {};
        });
    });
});
describe('Backward Compatibility Wrapper - withBackwardCompatibility', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should allow v1.0.0-only feature in v1.0.0 project', async () => {
        const result = await withBackwardCompatibility(V100_PROJECT, 'createComponent', 'Create Component', async () => {
            return { success: true };
        });
        expect(result.success).toBe(true);
    });
    test('should reject v1.0.0-only feature in v0.8.0 project', async () => {
        await expect(withBackwardCompatibility(V080_PROJECT, 'createComponent', 'Create Component', async () => {
            return { success: true };
        })).rejects.toThrow('Create Component requires v1.0.0');
    });
    test('should provide context in error messages', async () => {
        try {
            await withBackwardCompatibility(V080_PROJECT, 'createComponent', 'Create Component', async () => {
                throw new Error('Internal error');
            });
            fail('Should have thrown');
        }
        catch (error) {
            // First checks feature availability, so should throw that error
            expect(error.message).toContain('Create Component requires v1.0.0');
        }
    });
});
describe('Backward Compatibility Wrapper - Helper Functions', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should check if upgrade prompt needed', async () => {
        const shouldPromptV080 = await shouldShowUpgradePrompt(V080_PROJECT);
        const shouldPromptV100 = await shouldShowUpgradePrompt(V100_PROJECT);
        expect(shouldPromptV080).toBe(true);
        expect(shouldPromptV100).toBe(false);
    });
    test('should get upgrade prompt text', async () => {
        const promptText = await getUpgradePromptText(V080_PROJECT);
        expect(promptText).not.toBeNull();
        expect(promptText).toContain('Upgrade Available');
        expect(promptText).toContain('v0.8.0');
        expect(promptText).toContain('analyze_project_for_migration');
    });
    test('should return null for no upgrade needed', async () => {
        const promptText = await getUpgradePromptText(V100_PROJECT);
        expect(promptText).toBeNull();
    });
    test('should get feature unavailable message', async () => {
        const message = await getFeatureUnavailableMessage(V080_PROJECT, 'createComponent', 'Create Component');
        expect(message).not.toBeNull();
        expect(message).toContain('Create Component requires v1.0.0');
    });
    test('should return null if feature available', async () => {
        const message = await getFeatureUnavailableMessage(V100_PROJECT, 'createComponent', 'Create Component');
        expect(message).toBeNull();
    });
});
describe('Feature Compatibility Matrix', () => {
    test('should have correct structure', () => {
        expect(FEATURE_COMPATIBILITY_MATRIX.core).toBeDefined();
        expect(FEATURE_COMPATIBILITY_MATRIX.v100Only).toBeDefined();
        expect(FEATURE_COMPATIBILITY_MATRIX.migration).toBeDefined();
        expect(FEATURE_COMPATIBILITY_MATRIX.core.length).toBeGreaterThan(0);
        expect(FEATURE_COMPATIBILITY_MATRIX.v100Only.length).toBeGreaterThan(0);
        expect(FEATURE_COMPATIBILITY_MATRIX.migration.length).toBeGreaterThan(0);
    });
    test('should have correct format for each entry', () => {
        const allEntries = [
            ...FEATURE_COMPATIBILITY_MATRIX.core,
            ...FEATURE_COMPATIBILITY_MATRIX.v100Only,
            ...FEATURE_COMPATIBILITY_MATRIX.migration
        ];
        allEntries.forEach(entry => {
            expect(entry.tool).toBeDefined();
            expect(typeof entry.v080).toBe('boolean');
            expect(typeof entry.v100).toBe('boolean');
            expect(entry.notes).toBeDefined();
        });
    });
    test('should mark v1.0.0-only features correctly', () => {
        FEATURE_COMPATIBILITY_MATRIX.v100Only.forEach(entry => {
            expect(entry.v080).toBe(false);
            expect(entry.v100).toBe(true);
        });
    });
    test('should mark core features as working in both', () => {
        FEATURE_COMPATIBILITY_MATRIX.core.forEach(entry => {
            expect(entry.v080).toBe(true);
            expect(entry.v100).toBe(true);
        });
    });
});
describe('Performance', () => {
    beforeEach(async () => {
        await cleanup();
        await setupV080Project();
        await setupV100Project();
    });
    afterEach(async () => {
        await cleanup();
    });
    test('should detect version quickly (< 100ms)', async () => {
        const start = Date.now();
        await detectProjectVersion(V100_PROJECT);
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100);
    });
    test('should benefit from caching on repeated calls', async () => {
        const adapter = new ProjectStructureAdapter(V100_PROJECT);
        // First call - no cache
        const start1 = Date.now();
        await adapter.detectVersion();
        const duration1 = Date.now() - start1;
        // Second call - cached
        const start2 = Date.now();
        await adapter.detectVersion();
        const duration2 = Date.now() - start2;
        // Cached call should be much faster (< 1ms)
        expect(duration2).toBeLessThan(duration1);
        expect(duration2).toBeLessThan(1);
    });
    test('should handle concurrent detections efficiently', async () => {
        const start = Date.now();
        await Promise.all([
            detectProjectVersion(V080_PROJECT),
            detectProjectVersion(V100_PROJECT),
            detectProjectVersion(V080_PROJECT),
            detectProjectVersion(V100_PROJECT)
        ]);
        const duration = Date.now() - start;
        // Should complete all 4 in < 200ms
        expect(duration).toBeLessThan(200);
    });
});
//# sourceMappingURL=backward-compatibility.test%202.js.map