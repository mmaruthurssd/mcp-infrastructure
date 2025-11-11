/**
 * Integration Tests for Visualization Tools (Goal 011)
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateHierarchyTree, generateRoadmapTimeline, generateProgressDashboard, generateDependencyGraph, } from '../tools/visualization-tools.js';
const TEST_PROJECT_PATH = path.join(process.cwd(), 'temp', 'visualization-test');
describe('Visualization Tools - Goal 011', () => {
    beforeEach(async () => {
        // Create test project structure
        await fs.mkdir(TEST_PROJECT_PATH, { recursive: true });
        await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components'), { recursive: true });
    });
    afterEach(async () => {
        // Cleanup
        await fs.rm(TEST_PROJECT_PATH, { recursive: true, force: true });
    });
    describe('generate_hierarchy_tree', () => {
        test('should generate ASCII hierarchy tree', async () => {
            // Setup test data
            await setupTestProject();
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('hierarchy-tree.txt');
                expect(result.outputFormat).toBe('ascii');
                expect(result.nodesGenerated).toBeGreaterThan(0);
                expect(result.preview).toBeDefined();
                expect(result.preview).toContain('├─');
                expect(result.performance.generationTimeMs).toBeLessThan(5000);
                // Verify file created
                const fileExists = await fs
                    .access(result.outputPath)
                    .then(() => true)
                    .catch(() => false);
                expect(fileExists).toBe(true);
            }
        });
        test('should generate Mermaid hierarchy tree', async () => {
            await setupTestProject();
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.md');
                expect(result.preview).toContain('```mermaid');
                expect(result.preview).toContain('graph TD');
            }
        });
        test('should generate Draw.io hierarchy tree', async () => {
            await setupTestProject();
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'drawio',
                maxDepth: 7,
                showProgress: false,
                filterStatus: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.drawio');
                expect(result.preview).toContain('<?xml');
                expect(result.preview).toContain('mxfile');
            }
        });
        test('should filter by status', async () => {
            await setupTestProject();
            const activeResult = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'active',
            });
            const completedResult = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'completed',
            });
            expect(activeResult.success).toBe(true);
            expect(completedResult.success).toBe(true);
            if (activeResult.success && completedResult.success) {
                // Active filter should exclude completed goals
                expect(activeResult.nodesGenerated).not.toBe(completedResult.nodesGenerated);
            }
        });
        test('should respect maxDepth parameter', async () => {
            await setupTestProject();
            const shallowResult = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 2,
                showProgress: true,
                filterStatus: 'all',
            });
            const deepResult = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            expect(shallowResult.success).toBe(true);
            expect(deepResult.success).toBe(true);
            if (shallowResult.success && deepResult.success) {
                expect(deepResult.nodesGenerated).toBeGreaterThan(shallowResult.nodesGenerated);
            }
        });
        test('should show progress when enabled', async () => {
            await setupTestProject();
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.preview).toMatch(/\d+%/); // Should contain percentage
            }
        });
        test('should support custom output path', async () => {
            await setupTestProject();
            const customPath = path.join(TEST_PROJECT_PATH, 'custom-tree.txt');
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
                outputPath: customPath,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toBe(customPath);
                const fileExists = await fs
                    .access(customPath)
                    .then(() => true)
                    .catch(() => false);
                expect(fileExists).toBe(true);
            }
        });
    });
    describe('generate_roadmap_timeline', () => {
        test('should generate Mermaid Gantt timeline', async () => {
            await setupTestProject();
            const result = await generateRoadmapTimeline({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                groupBy: 'component',
                showMilestones: true,
                timeRange: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('roadmap-timeline.md');
                expect(result.preview).toContain('```mermaid');
                expect(result.preview).toContain('gantt');
                expect(result.itemsGenerated).toBeGreaterThan(0);
                expect(result.performance.generationTimeMs).toBeLessThan(5000);
            }
        });
        test('should generate ASCII timeline', async () => {
            await setupTestProject();
            const result = await generateRoadmapTimeline({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                groupBy: 'component',
                showMilestones: true,
                timeRange: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.txt');
                expect(result.preview).toContain('ROADMAP');
            }
        });
        test('should group by component', async () => {
            await setupTestProject();
            const result = await generateRoadmapTimeline({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                groupBy: 'component',
                showMilestones: true,
                timeRange: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.preview).toContain('Component'); // Should have component sections
            }
        });
        test('should show milestones when enabled', async () => {
            await setupTestProject();
            const withMilestones = await generateRoadmapTimeline({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                groupBy: 'component',
                showMilestones: true,
                timeRange: 'all',
            });
            const withoutMilestones = await generateRoadmapTimeline({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                groupBy: 'component',
                showMilestones: false,
                timeRange: 'all',
            });
            expect(withMilestones.success).toBe(true);
            expect(withoutMilestones.success).toBe(true);
        });
        test('should handle different time ranges', async () => {
            await setupTestProject();
            const ranges = ['all', 'current-quarter', 'current-year'];
            for (const timeRange of ranges) {
                const result = await generateRoadmapTimeline({
                    projectPath: TEST_PROJECT_PATH,
                    outputFormat: 'ascii',
                    groupBy: 'component',
                    showMilestones: true,
                    timeRange,
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.timeRange).toBe(timeRange);
                }
            }
        });
    });
    describe('generate_progress_dashboard', () => {
        test('should generate ASCII dashboard', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('progress-dashboard.txt');
                expect(result.metrics).toBeDefined();
                expect(result.metrics.overallProgress).toBeGreaterThanOrEqual(0);
                expect(result.metrics.overallProgress).toBeLessThanOrEqual(100);
                expect(result.metrics.healthScore).toBeGreaterThanOrEqual(0);
                expect(result.metrics.healthScore).toBeLessThanOrEqual(100);
                expect(result.performance.generationTimeMs).toBeLessThan(5000);
            }
        });
        test('should generate JSON dashboard', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.json');
                // Read and parse JSON
                const content = await fs.readFile(result.outputPath, 'utf-8');
                const metrics = JSON.parse(content);
                expect(metrics.overallProgress).toBeDefined();
                expect(metrics.componentsTotal).toBeDefined();
                expect(metrics.goalsTotal).toBeDefined();
            }
        });
        test('should generate Mermaid pie chart', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.md');
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('```mermaid');
                expect(content).toContain('pie');
            }
        });
        test('should calculate component metrics', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.metrics.componentsTotal).toBeGreaterThan(0);
                expect(result.metrics.componentsActive).toBeLessThanOrEqual(result.metrics.componentsTotal);
                expect(result.metrics.componentsCompleted).toBeLessThanOrEqual(result.metrics.componentsTotal);
            }
        });
        test('should calculate goal metrics', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.metrics.goalsTotal).toBeGreaterThan(0);
                const totalAccounted = result.metrics.goalsCompleted + result.metrics.goalsInProgress + result.metrics.goalsBlocked;
                expect(totalAccounted).toBeLessThanOrEqual(result.metrics.goalsTotal);
            }
        });
        test('should include velocity when enabled', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.metrics.velocity).toBeDefined();
            }
        });
        test('should include health score when enabled', async () => {
            await setupTestProject();
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.metrics.healthScore).toBeDefined();
                expect(result.metrics.healthScore).toBeGreaterThanOrEqual(0);
                expect(result.metrics.healthScore).toBeLessThanOrEqual(100);
            }
        });
    });
    describe('generate_dependency_graph', () => {
        test('should generate Mermaid dependency graph', async () => {
            await setupTestProject();
            const result = await generateDependencyGraph({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                scope: 'all',
                showCriticalPath: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('dependency-graph.md');
                expect(result.criticalPathHighlighted).toBe(true);
                expect(result.performance.generationTimeMs).toBeLessThan(5000);
            }
        });
        test('should generate ASCII dependency graph', async () => {
            await setupTestProject();
            const result = await generateDependencyGraph({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                scope: 'all',
                showCriticalPath: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.txt');
            }
        });
        test('should support different scopes', async () => {
            await setupTestProject();
            const scopes = ['all', 'component', 'major-goal'];
            for (const scope of scopes) {
                const result = await generateDependencyGraph({
                    projectPath: TEST_PROJECT_PATH,
                    outputFormat: 'mermaid',
                    scope,
                    showCriticalPath: true,
                    entityId: scope !== 'all' ? 'test-entity' : undefined,
                });
                expect(result.success).toBe(true);
            }
        });
        test('should highlight critical path when enabled', async () => {
            await setupTestProject();
            const withPath = await generateDependencyGraph({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                scope: 'all',
                showCriticalPath: true,
            });
            const withoutPath = await generateDependencyGraph({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'mermaid',
                scope: 'all',
                showCriticalPath: false,
            });
            expect(withPath.success).toBe(true);
            expect(withoutPath.success).toBe(true);
            if (withPath.success && withoutPath.success) {
                expect(withPath.criticalPathHighlighted).toBe(true);
                expect(withoutPath.criticalPathHighlighted).toBe(false);
            }
        });
    });
    describe('Performance Benchmarks', () => {
        test('all visualization tools should generate in < 5 seconds', async () => {
            await setupTestProject();
            const results = await Promise.all([
                generateHierarchyTree({ projectPath: TEST_PROJECT_PATH, outputFormat: 'ascii', maxDepth: 7, showProgress: true, filterStatus: 'all' }),
                generateRoadmapTimeline({ projectPath: TEST_PROJECT_PATH, outputFormat: 'mermaid', groupBy: 'component', showMilestones: true, timeRange: 'all' }),
                generateProgressDashboard({ projectPath: TEST_PROJECT_PATH, outputFormat: 'ascii', includeVelocity: true, includeHealth: true }),
                generateDependencyGraph({ projectPath: TEST_PROJECT_PATH, outputFormat: 'mermaid', scope: 'all', showCriticalPath: true }),
            ]);
            results.forEach(result => {
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.performance.generationTimeMs).toBeLessThan(5000);
                }
            });
        });
        test('should handle 50+ goals without performance degradation', async () => {
            await setupLargeProject(50);
            const start = Date.now();
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            const duration = Date.now() - start;
            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(5000);
        });
    });
    describe('Edge Cases', () => {
        test('should handle empty project', async () => {
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.nodesGenerated).toBeGreaterThan(0); // At least project root
            }
        });
        test('should handle missing components directory', async () => {
            await fs.rm(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap'), { recursive: true, force: true });
            const result = await generateProgressDashboard({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'json',
                includeVelocity: true,
                includeHealth: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.metrics.componentsTotal).toBe(0);
            }
        });
        test('should handle invalid goal files gracefully', async () => {
            await setupTestProject();
            // Add malformed goal file
            await fs.writeFile(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'test-component', 'major-goals', 'bad-goal.md'), 'Invalid content with no structure', 'utf-8');
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
            });
            // Should not crash
            expect(result.success).toBe(true);
        });
        test('should create output directory if missing', async () => {
            await setupTestProject();
            const customPath = path.join(TEST_PROJECT_PATH, 'new-folder', 'hierarchy.txt');
            const result = await generateHierarchyTree({
                projectPath: TEST_PROJECT_PATH,
                outputFormat: 'ascii',
                maxDepth: 7,
                showProgress: true,
                filterStatus: 'all',
                outputPath: customPath,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const fileExists = await fs
                    .access(customPath)
                    .then(() => true)
                    .catch(() => false);
                expect(fileExists).toBe(true);
            }
        });
    });
});
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
async function setupTestProject() {
    // Create test component with goals
    const componentPath = path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'test-component');
    await fs.mkdir(path.join(componentPath, 'major-goals'), { recursive: true });
    // Create test goals
    await fs.writeFile(path.join(componentPath, 'major-goals', '001-test-goal-active.md'), `# Major Goal 001: Test Goal Active

**Status:** In Progress
**Progress:** 50%
**Priority:** High
`, 'utf-8');
    await fs.writeFile(path.join(componentPath, 'major-goals', '002-test-goal-complete.md'), `# Major Goal 002: Test Goal Complete

**Status:** Complete
**Progress:** 100%
**Priority:** Medium
`, 'utf-8');
    await fs.writeFile(path.join(componentPath, 'major-goals', '003-test-goal-blocked.md'), `# Major Goal 003: Test Goal Blocked

**Status:** Blocked
**Progress:** 25%
**Priority:** High
`, 'utf-8');
}
async function setupLargeProject(goalCount) {
    const componentPath = path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'large-component');
    await fs.mkdir(path.join(componentPath, 'major-goals'), { recursive: true });
    for (let i = 1; i <= goalCount; i++) {
        const goalId = String(i).padStart(3, '0');
        await fs.writeFile(path.join(componentPath, 'major-goals', `${goalId}-goal-${i}.md`), `# Goal ${goalId}\n\n**Status:** Planning\n**Progress:** 0%`, 'utf-8');
    }
}
console.log('✅ Visualization Tools (Goal 011) - Test Suite Ready');
//# sourceMappingURL=visualization-tools.test.js.map