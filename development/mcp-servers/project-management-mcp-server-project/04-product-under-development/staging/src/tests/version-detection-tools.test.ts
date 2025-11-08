/**
 * Version Detection Tools Integration Tests
 *
 * Tests MCP tools for version detection and smart prompting
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  detectProjectVersion,
  checkMigrationRecommended,
  getVersionInfo,
  setMigrationPreference
} from '../tools/version-detection-tools.js';
import { ProjectVersion } from '../utils/project-structure-adapter.js';

const TEST_DIR = path.join(process.cwd(), 'temp/version-detection-test');
const V080_SMALL = path.join(TEST_DIR, 'v080-small'); // 5 goals
const V080_MEDIUM = path.join(TEST_DIR, 'v080-medium'); // 15 goals
const V080_LARGE = path.join(TEST_DIR, 'v080-large'); // 30 goals
const V100_PROJECT = path.join(TEST_DIR, 'v100-project');
const NEW_PROJECT = path.join(TEST_DIR, 'new-project');

/**
 * Setup v0.8.0 project with specified goal count
 */
async function setupV080Project(projectPath: string, goalCount: number): Promise<void> {
  await fs.mkdir(path.join(projectPath, 'brainstorming/future-goals/potential-goals'), { recursive: true });
  await fs.mkdir(path.join(projectPath, '08-archive/goals'), { recursive: true });

  // Create SELECTED-GOALS.md with specified number of goals
  let selectedGoals = '# Selected Goals\n\n';
  for (let i = 1; i <= Math.floor(goalCount / 2); i++) {
    selectedGoals += `## Goal ${String(i).padStart(3, '0')}: Goal ${i}\n- Status: In Progress\n- Priority: High\n\n`;
  }
  await fs.writeFile(
    path.join(projectPath, 'brainstorming/future-goals/SELECTED-GOALS.md'),
    selectedGoals
  );

  // Create potential goals
  const potentialCount = Math.ceil(goalCount / 2);
  for (let i = 1; i <= potentialCount; i++) {
    await fs.writeFile(
      path.join(projectPath, `brainstorming/future-goals/potential-goals/${String(i).padStart(3, '0')}-goal-${i}.md`),
      `---\nid: "${String(i).padStart(3, '0')}"\nname: Goal ${i}\n---\n\n# Goal ${i}\n`
    );
  }
}

/**
 * Setup v1.0.0 project
 */
async function setupV100Project(projectPath: string): Promise<void> {
  await fs.mkdir(path.join(projectPath, '01-planning'), { recursive: true });
  await fs.mkdir(path.join(projectPath, '02-goals-and-roadmap/components/test-component'), { recursive: true });

  await fs.writeFile(
    path.join(projectPath, '01-planning/PROJECT-OVERVIEW.md'),
    '---\nversion: 1\n---\n\n# PROJECT OVERVIEW\n'
  );

  await fs.writeFile(
    path.join(projectPath, '02-goals-and-roadmap/ROADMAP.md'),
    '# Roadmap\n'
  );
}

/**
 * Setup new/empty project
 */
async function setupNewProject(projectPath: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });
  await fs.writeFile(path.join(projectPath, 'README.md'), '# New Project\n');
}

/**
 * Cleanup test directories
 */
async function cleanup(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Version Detection Tools - detect_project_version', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_SMALL, 5);
    await setupV100Project(V100_PROJECT);
    await setupNewProject(NEW_PROJECT);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should detect v0.8.0 project', async () => {
    const result = await detectProjectVersion({ projectPath: V080_SMALL });

    expect(result.version).toBe(ProjectVersion.V0_8_0);
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.markers.v080.length).toBeGreaterThan(0);
    expect(result.performance.detectionTimeMs).toBeLessThan(100);
  });

  test('should detect v1.0.0 project', async () => {
    const result = await detectProjectVersion({ projectPath: V100_PROJECT });

    expect(result.version).toBe(ProjectVersion.V1_0_0);
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.markers.v100.length).toBeGreaterThan(0);
  });

  test('should detect unknown/new project', async () => {
    const result = await detectProjectVersion({ projectPath: NEW_PROJECT });

    expect(result.version).toBe(ProjectVersion.UNKNOWN);
    expect(result.confidence).toBe(0);
  });

  test('should provide detailed reason for detection', async () => {
    const result = await detectProjectVersion({ projectPath: V080_SMALL });

    expect(result.reason).toContain('v0.8.0');
    expect(result.reason.length).toBeGreaterThan(10);
  });

  test('should recommend migration for v0.8.0', async () => {
    const result = await detectProjectVersion({ projectPath: V080_SMALL });

    expect(result.recommendMigration).toBe(true);
  });

  test('should not recommend migration for v1.0.0', async () => {
    const result = await detectProjectVersion({ projectPath: V100_PROJECT });

    expect(result.recommendMigration).toBe(false);
  });

  test('should complete detection quickly (<100ms)', async () => {
    const result = await detectProjectVersion({ projectPath: V080_SMALL });

    expect(result.performance.detectionTimeMs).toBeLessThan(100);
  });
});

describe('Version Detection Tools - check_migration_recommended', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_SMALL, 5);
    await setupV080Project(V080_MEDIUM, 15);
    await setupV080Project(V080_LARGE, 30);
    await setupV100Project(V100_PROJECT);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should not recommend migration for small projects (<10 goals)', async () => {
    const result = await checkMigrationRecommended({ projectPath: V080_SMALL });

    expect(result.recommended).toBe(true); // Migration is available
    expect(result.shouldPrompt).toBe(false); // But don't prompt for small projects
    expect(result.goalCount).toBeLessThan(10);
  });

  test('should occasionally prompt for medium projects (10-20 goals)', async () => {
    // Call multiple times to test frequency logic
    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      const result = await checkMigrationRecommended({ projectPath: V080_MEDIUM });
      results.push(result.shouldPrompt);
    }

    // Should prompt occasionally (not every time, not never)
    const promptCount = results.filter(p => p).length;
    expect(promptCount).toBeGreaterThan(0);
    expect(promptCount).toBeLessThan(10);
  });

  test('should frequently prompt for large projects (>20 goals)', async () => {
    // Call multiple times
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const result = await checkMigrationRecommended({ projectPath: V080_LARGE });
      results.push(result.shouldPrompt);
    }

    // Should prompt more frequently
    const promptCount = results.filter(p => p).length;
    expect(promptCount).toBeGreaterThan(1);
  });

  test('should respect user "don\'t show again" preference', async () => {
    // Set preference
    await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: true
    });

    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });

    expect(result.shouldPrompt).toBe(false);
    expect(result.userPreferences.dontShowAgain).toBe(true);
  });

  test('should not recommend migration for v1.0.0 projects', async () => {
    const result = await checkMigrationRecommended({ projectPath: V100_PROJECT });

    expect(result.recommended).toBe(false);
    expect(result.shouldPrompt).toBe(false);
    expect(result.reason).toContain('v1.0.0');
  });

  test('should include upgrade benefits', async () => {
    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });

    expect(result.benefits.length).toBeGreaterThan(0);
    expect(result.benefits.some(b => b.includes('component'))).toBe(true);
  });

  test('should estimate migration time', async () => {
    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });

    expect(result.migrationTime).toBeDefined();
    expect(result.migrationTime).toMatch(/\d+-\d+ minutes/);
  });

  test('should provide risk level', async () => {
    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });

    expect(result.riskLevel).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(result.riskLevel);
  });

  test('should include formatted prompt text when requested', async () => {
    const result = await checkMigrationRecommended({
      projectPath: V080_LARGE,
      includePrompt: true
    });

    if (result.shouldPrompt) {
      expect(result.promptText).toBeDefined();
      expect(result.promptText).toContain('v0.8.0');
      expect(result.promptText).toContain('analyze_project_for_migration');
    }
  });

  test('should track prompt count', async () => {
    // Call multiple times
    await checkMigrationRecommended({ projectPath: V080_LARGE });
    await checkMigrationRecommended({ projectPath: V080_LARGE });
    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });

    expect(result.userPreferences.promptCount).toBeGreaterThan(0);
  });
});

describe('Version Detection Tools - get_version_info', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_SMALL, 5);
    await setupV100Project(V100_PROJECT);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should return comprehensive version info for v0.8.0', async () => {
    const result = await getVersionInfo({ projectPath: V080_SMALL });

    expect(result.version).toBe(ProjectVersion.V0_8_0);
    expect(result.confidence).toBeDefined();
    expect(result.markers).toBeDefined();
    expect(result.paths).toBeDefined();
    expect(result.features).toBeDefined();
  });

  test('should return comprehensive version info for v1.0.0', async () => {
    const result = await getVersionInfo({ projectPath: V100_PROJECT });

    expect(result.version).toBe(ProjectVersion.V1_0_0);
    expect(result.paths.isHierarchical).toBe(true);
  });

  test('should include feature lists', async () => {
    const result = await getVersionInfo({ projectPath: V080_SMALL });

    expect(result.features.coreFeatures).toBeDefined();
    expect(result.features.v100OnlyFeatures).toBeDefined();
    expect(result.features.migrationFeatures).toBeDefined();
    expect(result.features.coreFeatures.length).toBeGreaterThan(0);
  });

  test('should include goal paths', async () => {
    const result = await getVersionInfo({ projectPath: V080_SMALL });

    expect(result.paths.potentialGoalsPath).toContain('potential-goals');
    expect(result.paths.selectedGoalsPath).toContain('SELECTED-GOALS.md');
    expect(result.paths.archivedGoalsPath).toContain('archive');
    expect(result.paths.isHierarchical).toBe(false);
  });

  test('should include upgrade info for v0.8.0', async () => {
    const result = await getVersionInfo({ projectPath: V080_SMALL });

    expect(result.upgradeInfo).toBeDefined();
    expect(result.upgradeInfo!.benefits.length).toBeGreaterThan(0);
  });

  test('should not include upgrade info for v1.0.0', async () => {
    const result = await getVersionInfo({ projectPath: V100_PROJECT });

    expect(result.upgradeInfo).toBeUndefined();
  });

  test('should include compatibility matrix when detailed=true', async () => {
    const result = await getVersionInfo({
      projectPath: V080_SMALL,
      detailed: true
    });

    expect(result.compatibilityMatrix).toBeDefined();
    expect(result.compatibilityMatrix!.core).toBeDefined();
    expect(result.compatibilityMatrix!.v100Only).toBeDefined();
    expect(result.compatibilityMatrix!.migration).toBeDefined();
  });

  test('should not include compatibility matrix when detailed=false', async () => {
    const result = await getVersionInfo({
      projectPath: V080_SMALL,
      detailed: false
    });

    expect(result.compatibilityMatrix).toBeUndefined();
  });
});

describe('Version Detection Tools - set_migration_preference', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_LARGE, 30);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should save "don\'t show again" preference', async () => {
    const result = await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: true
    });

    expect(result.success).toBe(true);
    expect(result.preferences.dontShowMigrationPrompt).toBe(true);
    expect(result.message).toContain('disabled');
  });

  test('should save "show prompts" preference', async () => {
    // First disable
    await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: true
    });

    // Then re-enable
    const result = await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: false
    });

    expect(result.success).toBe(true);
    expect(result.preferences.dontShowMigrationPrompt).toBe(false);
    expect(result.message).toContain('enabled');
  });

  test('should persist preference across tool calls', async () => {
    // Set preference
    await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: true
    });

    // Check that it persists
    const checkResult = await checkMigrationRecommended({
      projectPath: V080_LARGE
    });

    expect(checkResult.shouldPrompt).toBe(false);
    expect(checkResult.userPreferences.dontShowAgain).toBe(true);
  });

  test('should create preferences file', async () => {
    await setMigrationPreference({
      projectPath: V080_LARGE,
      dontShowAgain: true
    });

    const prefsPath = path.join(V080_LARGE, '.ai-planning-preferences.json');
    const exists = await fs.access(prefsPath).then(() => true).catch(() => false);

    expect(exists).toBe(true);
  });
});

describe('Version Detection Tools - Smart Prompting Logic', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_SMALL, 5);
    await setupV080Project(V080_MEDIUM, 15);
    await setupV080Project(V080_LARGE, 30);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should never prompt for small projects', async () => {
    // Call 10 times
    let promptedAtLeastOnce = false;
    for (let i = 0; i < 10; i++) {
      const result = await checkMigrationRecommended({ projectPath: V080_SMALL });
      if (result.shouldPrompt) {
        promptedAtLeastOnce = true;
      }
    }

    expect(promptedAtLeastOnce).toBe(false);
  });

  test('should respect daily rate limit', async () => {
    // First call should prompt (for large project)
    const result1 = await checkMigrationRecommended({ projectPath: V080_LARGE });

    // If it prompted, subsequent calls within same day should not
    if (result1.shouldPrompt) {
      // Wait 1ms (same day)
      await new Promise(resolve => setTimeout(resolve, 1));

      const result2 = await checkMigrationRecommended({ projectPath: V080_LARGE });
      expect(result2.shouldPrompt).toBe(false);
    }
  });

  test('should provide different frequency recommendations based on project size', async () => {
    const smallResult = await checkMigrationRecommended({ projectPath: V080_SMALL });
    const mediumResult = await checkMigrationRecommended({ projectPath: V080_MEDIUM });
    const largeResult = await checkMigrationRecommended({ projectPath: V080_LARGE });

    // Small: never prompt
    expect(smallResult.shouldPrompt).toBe(false);

    // Medium and large: different strategies (reflected in reason)
    expect(mediumResult.reason).toBeDefined();
    expect(largeResult.reason).toBeDefined();
  });
});

describe('Version Detection Tools - Performance', () => {
  beforeEach(async () => {
    await cleanup();
    await setupV080Project(V080_LARGE, 30);
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should detect version in < 100ms', async () => {
    const start = Date.now();
    await detectProjectVersion({ projectPath: V080_LARGE });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  test('should check migration recommendation quickly', async () => {
    const start = Date.now();
    await checkMigrationRecommended({ projectPath: V080_LARGE });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200); // Allow extra time for goal counting
  });

  test('should get version info quickly', async () => {
    const start = Date.now();
    await getVersionInfo({ projectPath: V080_LARGE });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });

  test('should handle concurrent detections efficiently', async () => {
    const start = Date.now();

    await Promise.all([
      detectProjectVersion({ projectPath: V080_LARGE }),
      checkMigrationRecommended({ projectPath: V080_LARGE }),
      getVersionInfo({ projectPath: V080_LARGE })
    ]);

    const duration = Date.now() - start;

    // Should complete all 3 in < 300ms
    expect(duration).toBeLessThan(300);
  });
});

describe('Version Detection Tools - Edge Cases', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('should handle non-existent project path', async () => {
    const nonExistentPath = path.join(TEST_DIR, 'does-not-exist');

    await expect(
      detectProjectVersion({ projectPath: nonExistentPath })
    ).resolves.toBeDefined(); // Should not throw
  });

  test('should handle project with no goals', async () => {
    await setupV080Project(V080_SMALL, 0);

    const result = await checkMigrationRecommended({ projectPath: V080_SMALL });

    expect(result.goalCount).toBe(0);
    expect(result.shouldPrompt).toBe(false);
  });

  test('should handle corrupt preferences file gracefully', async () => {
    await setupV080Project(V080_LARGE, 30);

    // Write invalid JSON
    await fs.writeFile(
      path.join(V080_LARGE, '.ai-planning-preferences.json'),
      '{ invalid json',
      'utf-8'
    );

    // Should not throw
    const result = await checkMigrationRecommended({ projectPath: V080_LARGE });
    expect(result).toBeDefined();
  });
});
