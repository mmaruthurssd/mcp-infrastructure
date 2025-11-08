/**
 * Integration Tests for Migration Tools (Goal 013)
 *
 * Tests for v0.8.0 → v1.0.0 migration tools including:
 * - Project analysis
 * - Goal clustering
 * - Migration execution
 * - Validation
 * - Rollback
 *
 * Created: 2025-10-28
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdir, writeFile, rm, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { analyzeProjectForMigration, suggestGoalClustering, migrateToHierarchical, validateMigration, rollbackMigration, } from '../tools/migration-tools';
const TEST_PROJECT_PATH = join(process.cwd(), 'temp', 'migration-test');
// ============================================================================
// TEST HELPERS
// ============================================================================
/**
 * Create a mock v0.8.0 project structure
 */
async function createMockV080Project() {
    // Create brainstorming structure
    await mkdir(join(TEST_PROJECT_PATH, 'brainstorming', 'future-goals', 'potential-goals'), { recursive: true });
    // Create potential goals
    const potentialGoals = [
        {
            id: '01',
            name: 'build-rest-api',
            content: `---
type: potential-goal
status: potential
---

# Build REST API

Create a RESTful API for the backend service with authentication.
`,
        },
        {
            id: '02',
            name: 'design-frontend-components',
            content: `---
type: potential-goal
status: potential
---

# Design Frontend Components

Build reusable UI components for the frontend application.
`,
        },
        {
            id: '03',
            name: 'setup-ci-cd-pipeline',
            content: `---
type: potential-goal
status: potential
---

# Setup CI/CD Pipeline

Implement continuous integration and deployment pipeline.
`,
        },
    ];
    for (const goal of potentialGoals) {
        const filePath = join(TEST_PROJECT_PATH, 'brainstorming', 'future-goals', 'potential-goals', `${goal.id}-${goal.name}.md`);
        await writeFile(filePath, goal.content, 'utf-8');
    }
    // Create SELECTED-GOALS.md
    const selectedGoalsContent = `# Selected Goals

## Active Goals

- [04] Create API Documentation - Document all API endpoints
- [05] Write Integration Tests - Comprehensive test coverage
`;
    await writeFile(join(TEST_PROJECT_PATH, 'brainstorming', 'future-goals', 'SELECTED-GOALS.md'), selectedGoalsContent, 'utf-8');
}
/**
 * Clean up test project
 */
async function cleanupTestProject() {
    try {
        await rm(TEST_PROJECT_PATH, { recursive: true, force: true });
    }
    catch {
        // Already deleted
    }
}
// ============================================================================
// TEST SUITES
// ============================================================================
describe('Migration Tools - Goal 013', () => {
    beforeEach(async () => {
        await cleanupTestProject();
        await createMockV080Project();
    });
    afterEach(async () => {
        await cleanupTestProject();
    });
    // ==========================================================================
    // TOOL 1: ANALYZE PROJECT FOR MIGRATION
    // ==========================================================================
    describe('analyze_project_for_migration', () => {
        test('should detect v0.8.0 project structure', async () => {
            const result = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(result.isV080).toBe(true);
            expect(result.version).toBe('v0.8.0');
            expect(result.structure.hasBrainstorming).toBe(true);
            expect(result.structure.hasPotentialGoals).toBe(true);
            expect(result.structure.hasSelectedGoals).toBe(true);
        });
        test('should extract potential goals', async () => {
            const result = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(result.goals.potential.length).toBe(3);
            expect(result.goals.potential[0].name).toContain('api');
            expect(result.goals.potential[0].description).toBeTruthy();
        });
        test('should extract selected goals', async () => {
            const result = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(result.goals.selected.length).toBe(2);
            expect(result.goals.selected[0].id).toBe('04');
            expect(result.goals.selected[0].status).toBe('selected');
        });
        test('should calculate correct total goal count', async () => {
            const result = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(result.goals.total).toBe(5); // 3 potential + 2 selected
        });
        test('should suggest migration when goals exist', async () => {
            const result = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(result.suggestedMigration.needsMigration).toBe(true);
            expect(result.suggestedMigration.confidence).toBe('high');
            expect(result.suggestedMigration.recommendations.length).toBeGreaterThan(0);
        });
        test('should handle non-existent project', async () => {
            await expect(analyzeProjectForMigration({
                projectPath: '/non/existent/path',
                includeArchived: false,
            })).rejects.toThrow('does not exist');
        });
    });
    // ==========================================================================
    // TOOL 2: SUGGEST GOAL CLUSTERING
    // ==========================================================================
    describe('suggest_goal_clustering', () => {
        test('should cluster goals by keywords', async () => {
            const goals = [
                { id: '01', name: 'Build REST API', description: 'API with authentication', status: 'potential' },
                { id: '02', name: 'Design UI Components', description: 'Frontend components', status: 'potential' },
                { id: '03', name: 'Setup CI/CD', description: 'DevOps pipeline', status: 'potential' },
            ];
            const result = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 3,
            });
            expect(result.components.length).toBeGreaterThan(0);
            expect(result.components.length).toBeLessThanOrEqual(3);
            expect(result.metadata.totalGoals).toBe(3);
            expect(result.metadata.clusteredGoals).toBe(3);
        });
        test('should assign goals to appropriate components', async () => {
            const goals = [
                { id: '01', name: 'Build REST API', description: 'Backend API service', status: 'potential' },
                { id: '02', name: 'Database Schema', description: 'Database design', status: 'potential' },
            ];
            const result = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 3,
            });
            // Both should be in Backend component
            const backendComponent = result.components.find(c => c.name.includes('Backend'));
            expect(backendComponent).toBeDefined();
            expect(backendComponent.goals.length).toBe(2);
        });
        test('should handle unclassified goals', async () => {
            const goals = [
                { id: '01', name: 'Random Task', description: 'No clear category', status: 'potential' },
            ];
            const result = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 3,
            });
            // Should create a "General" component
            const generalComponent = result.components.find(c => c.name === 'General');
            expect(generalComponent).toBeDefined();
            expect(generalComponent.goals.length).toBe(1);
        });
        test('should respect target component count', async () => {
            const goals = Array.from({ length: 10 }, (_, i) => ({
                id: String(i + 1).padStart(2, '0'),
                name: `Goal ${i + 1}`,
                description: `Description ${i + 1}`,
                status: 'potential',
            }));
            const result = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 4,
            });
            expect(result.components.length).toBeLessThanOrEqual(4);
        });
        test('should provide confidence scores', async () => {
            const goals = [
                { id: '01', name: 'API Development', description: 'REST API', status: 'potential' },
            ];
            const result = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 3,
            });
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(result.components[0].confidence).toBeDefined();
        });
    });
    // ==========================================================================
    // TOOL 3: MIGRATE TO HIERARCHICAL
    // ==========================================================================
    describe('migrate_to_hierarchical', () => {
        test('should perform dry-run without making changes', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01', '04'],
                    },
                ],
            };
            const result = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: true,
                dryRun: true,
            });
            expect(result.success).toBe(true);
            expect(result.warnings.some(w => w.includes('DRY RUN'))).toBe(true);
            expect(result.changes.foldersCreated.length).toBeGreaterThan(0);
        });
        test('should create component structure', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                    {
                        name: 'Frontend Development',
                        description: 'Frontend UI',
                        goalIds: ['02'],
                    },
                ],
            };
            const result = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            expect(result.success).toBe(true);
            // Verify component folders created
            const componentsPath = join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components');
            const components = await readdir(componentsPath);
            expect(components).toContain('backend-development');
            expect(components).toContain('frontend-development');
        });
        test('should create component overview files', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            const overviewPath = join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'backend-development', 'COMPONENT-OVERVIEW.md');
            const content = await readFile(overviewPath, 'utf-8');
            expect(content).toContain('Backend Development');
            expect(content).toContain('Backend services');
        });
        test('should migrate goals to components', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            const goalPath = join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'backend-development', 'major-goals');
            const goals = await readdir(goalPath);
            expect(goals.length).toBeGreaterThan(0);
            expect(goals[0]).toMatch(/^001-.*\.md$/);
        });
        test('should create backup when requested', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            const result = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: true,
                dryRun: false,
            });
            expect(result.backupPath).toBeDefined();
            expect(result.backupPath).toContain('migration-backups');
        });
        test('should create PROJECT OVERVIEW if missing', async () => {
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            const overviewPath = join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md');
            const content = await readFile(overviewPath, 'utf-8');
            expect(content).toContain('PROJECT OVERVIEW');
            expect(content).toContain('Backend Development');
        });
    });
    // ==========================================================================
    // TOOL 4: VALIDATE MIGRATION
    // ==========================================================================
    describe('validate_migration', () => {
        test('should validate successful migration', async () => {
            // First migrate
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01', '04'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            // Then validate
            const result = await validateMigration({
                projectPath: TEST_PROJECT_PATH,
                originalGoalCount: 2,
            });
            expect(result.valid).toBe(true);
            expect(result.checks.structureExists).toBe(true);
            expect(result.checks.goalsAccounted).toBe(true);
            expect(result.goalCount.found).toBe(2);
        });
        test('should detect missing goals', async () => {
            // Migrate with fewer goals than expected
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            const result = await validateMigration({
                projectPath: TEST_PROJECT_PATH,
                originalGoalCount: 5,
            });
            expect(result.valid).toBe(false);
            expect(result.goalCount.missing).toBe(4);
            expect(result.issues.length).toBeGreaterThan(0);
        });
        test('should detect missing structure', async () => {
            const result = await validateMigration({
                projectPath: TEST_PROJECT_PATH,
            });
            expect(result.checks.structureExists).toBe(false);
            expect(result.issues.some(i => i.includes('structure not found'))).toBe(true);
        });
    });
    // ==========================================================================
    // TOOL 5: ROLLBACK MIGRATION
    // ==========================================================================
    describe('rollback_migration', () => {
        test('should require confirmation', async () => {
            await expect(rollbackMigration({
                projectPath: TEST_PROJECT_PATH,
                confirm: false,
            })).rejects.toThrow('not confirmed');
        });
        test('should rollback successful migration', async () => {
            // Migrate with backup
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            const migrationResult = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: true,
                dryRun: false,
            });
            // Rollback
            const rollbackResult = await rollbackMigration({
                projectPath: TEST_PROJECT_PATH,
                backupPath: migrationResult.backupPath,
                confirm: true,
            });
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.restored.length).toBeGreaterThan(0);
            expect(rollbackResult.removed.length).toBeGreaterThan(0);
        });
        test('should auto-detect latest backup', async () => {
            // Migrate with backup
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: true,
                dryRun: false,
            });
            // Rollback without specifying backup
            const rollbackResult = await rollbackMigration({
                projectPath: TEST_PROJECT_PATH,
                confirm: true,
            });
            expect(rollbackResult.success).toBe(true);
        });
        test('should restore original structure', async () => {
            // Get original goal count
            const originalAnalysis = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            // Migrate
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01', '04'],
                    },
                ],
            };
            const migrationResult = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: true,
                dryRun: false,
            });
            // Rollback
            await rollbackMigration({
                projectPath: TEST_PROJECT_PATH,
                backupPath: migrationResult.backupPath,
                confirm: true,
            });
            // Verify original structure restored
            const restoredAnalysis = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(restoredAnalysis.isV080).toBe(true);
            expect(restoredAnalysis.goals.potential.length).toBe(originalAnalysis.goals.potential.length);
        });
    });
    // ==========================================================================
    // INTEGRATION TESTS
    // ==========================================================================
    describe('Full Migration Workflow', () => {
        test('should complete full migration cycle', async () => {
            // Step 1: Analyze
            const analysis = await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            expect(analysis.suggestedMigration.needsMigration).toBe(true);
            // Step 2: Cluster
            const allGoals = [...analysis.goals.potential, ...analysis.goals.selected];
            const clustering = await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals: allGoals,
                targetComponents: 3,
            });
            expect(clustering.components.length).toBeGreaterThan(0);
            // Step 3: Migrate
            const migration = await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering: {
                    components: clustering.components.map(c => ({
                        name: c.name,
                        description: c.description,
                        goalIds: c.goals.map(g => g.id),
                    })),
                },
                createBackup: true,
                dryRun: false,
            });
            expect(migration.success).toBe(true);
            // Step 4: Validate
            const validation = await validateMigration({
                projectPath: TEST_PROJECT_PATH,
                originalGoalCount: allGoals.length,
            });
            expect(validation.valid).toBe(true);
            expect(validation.checks.goalsAccounted).toBe(true);
        });
    });
    // ==========================================================================
    // PERFORMANCE TESTS
    // ==========================================================================
    describe('Performance', () => {
        test('should analyze project in < 2 seconds', async () => {
            const start = Date.now();
            await analyzeProjectForMigration({
                projectPath: TEST_PROJECT_PATH,
                includeArchived: false,
            });
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2000);
        });
        test('should cluster goals in < 2 seconds', async () => {
            const goals = Array.from({ length: 20 }, (_, i) => ({
                id: String(i + 1).padStart(2, '0'),
                name: `Goal ${i + 1}`,
                description: `Description for goal ${i + 1}`,
                status: 'potential',
            }));
            const start = Date.now();
            await suggestGoalClustering({
                projectPath: TEST_PROJECT_PATH,
                goals,
                targetComponents: 3,
            });
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2000);
        });
        test('should validate migration in < 1 second', async () => {
            // Set up migrated structure first
            const clustering = {
                components: [
                    {
                        name: 'Backend Development',
                        description: 'Backend services',
                        goalIds: ['01'],
                    },
                ],
            };
            await migrateToHierarchical({
                projectPath: TEST_PROJECT_PATH,
                clustering,
                createBackup: false,
                dryRun: false,
            });
            const start = Date.now();
            await validateMigration({
                projectPath: TEST_PROJECT_PATH,
            });
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1000);
        });
    });
});
//# sourceMappingURL=migration-tools.test%202.js.map