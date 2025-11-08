/**
 * Integration Tests: Version Control Tools
 *
 * Tests the complete version-aware document system:
 * - Impact analysis before changes
 * - Version history tracking
 * - Rollback capabilities
 * - Component version updates with cascade
 *
 * Goal: 002 - Implement Version-Aware Document System
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { analyzeVersionImpact, getVersionHistory, rollbackVersion, updateComponentVersion, } from '../tools/version-control-tools';
describe('Version Control Tools - Integration Tests', () => {
    let testDir;
    let projectPath;
    beforeEach(async () => {
        // Create temporary test directory
        testDir = await mkdtemp(join(tmpdir(), 'version-control-test-'));
        projectPath = testDir;
        // Create basic directory structure
        await mkdir(join(projectPath, '02-goals-and-roadmap'), { recursive: true });
        await mkdir(join(projectPath, '02-goals-and-roadmap/components/test-component'), {
            recursive: true,
        });
        await mkdir(join(projectPath, '02-goals-and-roadmap/components/test-component/sub-area-1/major-goals/001-test-goal'), { recursive: true });
    });
    afterEach(async () => {
        // Clean up test directory
        await rm(testDir, { recursive: true, force: true });
    });
    // ==========================================================================
    // TOOL 1: ANALYZE VERSION IMPACT
    // ==========================================================================
    describe('analyzeVersionImpact', () => {
        it('should analyze impact of PROJECT OVERVIEW changes', async () => {
            // Create PROJECT OVERVIEW
            const overviewPath = join(projectPath, 'PROJECT-OVERVIEW.md');
            await writeFile(overviewPath, `---
version: 1.0
---

# Test Project

**Status:** Active

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-28 | Initial version | Project Management MCP |
`, 'utf-8');
            // Create component
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component

**Component:** test-component
**Purpose:** Testing version control
**Status:** Active

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-28 | Initial version | Project Management MCP |
`, 'utf-8');
            // Create ROADMAP
            const roadmapPath = join(projectPath, '02-goals-and-roadmap/ROADMAP.md');
            await writeFile(roadmapPath, `---
version: 1.0
---

# Roadmap

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-28 | Initial version | Project Management MCP |
`, 'utf-8');
            // Analyze impact of scope change
            const result = await analyzeVersionImpact({
                projectPath,
                documentType: 'project-overview',
                documentPath: 'PROJECT-OVERVIEW.md',
                proposedChanges: {
                    'vision.scope.inScope': ['new feature'],
                },
                changeType: 'major',
            });
            expect(result.success).toBe(true);
            expect(result.currentVersion).toBe(1.0);
            expect(result.proposedVersion).toBe(2.0);
            expect(result.impactSummary.totalDocumentsAffected).toBeGreaterThan(0);
            expect(result.impactSummary.highImpactCount).toBeGreaterThan(0);
            expect(result.impactedDocuments).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    documentType: 'component',
                    impactLevel: 'high',
                }),
            ]));
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
        it('should analyze impact of component changes on goals', async () => {
            // Create component
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component
`, 'utf-8');
            // Create major goal
            const goalPath = join(projectPath, '02-goals-and-roadmap/components/test-component/sub-area-1/major-goals/001-test-goal/GOAL-STATUS.md');
            await writeFile(goalPath, `---
version: 1.0
---

# Goal 001
`, 'utf-8');
            // Analyze component impact
            const result = await analyzeVersionImpact({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                proposedChanges: {
                    purpose: 'Updated purpose',
                },
                changeType: 'minor',
            });
            expect(result.success).toBe(true);
            expect(result.impactedDocuments).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    documentType: 'major-goal',
                    impactLevel: 'medium',
                }),
            ]));
        });
        it('should handle non-existent document', async () => {
            const result = await analyzeVersionImpact({
                projectPath,
                documentType: 'component',
                documentPath: 'does-not-exist.md',
                proposedChanges: {},
                changeType: 'patch',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should provide recommendations for high-impact changes', async () => {
            // Create PROJECT OVERVIEW
            const overviewPath = join(projectPath, 'PROJECT-OVERVIEW.md');
            await writeFile(overviewPath, `---
version: 1.0
---

# Test Project
`, 'utf-8');
            // Create multiple components
            for (let i = 1; i <= 6; i++) {
                const compPath = join(projectPath, `02-goals-and-roadmap/components/component-${i}/OVERVIEW.md`);
                await mkdir(join(projectPath, `02-goals-and-roadmap/components/component-${i}`), {
                    recursive: true,
                });
                await writeFile(compPath, `---\nversion: 1.0\n---\n\n# Component ${i}`, 'utf-8');
            }
            const result = await analyzeVersionImpact({
                projectPath,
                documentType: 'project-overview',
                documentPath: 'PROJECT-OVERVIEW.md',
                proposedChanges: {
                    'vision.scope': { inScope: ['new scope'] },
                },
                changeType: 'major',
            });
            expect(result.success).toBe(true);
            expect(result.recommendations).toEqual(expect.arrayContaining([
                expect.stringContaining('backup'),
                expect.stringContaining('smaller updates'),
            ]));
        });
    });
    // ==========================================================================
    // TOOL 2: GET VERSION HISTORY
    // ==========================================================================
    describe('getVersionHistory', () => {
        it('should retrieve version history from document', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 2.1
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.1 | 2025-10-28 | Added new feature | Developer |
| 2.0 | 2025-10-27 | Major refactor | Developer |
| 1.0 | 2025-10-26 | Initial version | Project Management MCP |
`, 'utf-8');
            const result = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
            });
            expect(result.success).toBe(true);
            expect(result.currentVersion).toBe(2.1);
            expect(result.totalVersions).toBe(3);
            expect(result.history).toHaveLength(3);
            expect(result.history[0]).toEqual({
                version: 2.1,
                date: '2025-10-28',
                changes: 'Added new feature',
                author: 'Developer',
            });
        });
        it('should limit history entries when requested', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 3.0
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 3.0 | 2025-10-28 | Version 3 | Dev |
| 2.0 | 2025-10-27 | Version 2 | Dev |
| 1.0 | 2025-10-26 | Version 1 | Dev |
`, 'utf-8');
            const result = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                limit: 2,
            });
            expect(result.success).toBe(true);
            expect(result.totalVersions).toBe(3);
            expect(result.history).toHaveLength(2);
        });
        it('should handle document without version history', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component

No version history section.
`, 'utf-8');
            const result = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
            });
            expect(result.success).toBe(true);
            expect(result.currentVersion).toBe(1.0);
            expect(result.totalVersions).toBe(0);
            expect(result.history).toHaveLength(0);
        });
        it('should handle non-existent document', async () => {
            const result = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: 'does-not-exist.md',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });
    // ==========================================================================
    // TOOL 3: ROLLBACK VERSION
    // ==========================================================================
    describe('rollbackVersion', () => {
        it('should rollback to previous version', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            const originalContent = `---
version: 2.0
---

# Test Component

**Purpose:** Updated purpose

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-10-28 | Updated purpose | Developer |
| 1.0 | 2025-10-27 | Initial version | Project Management MCP |
`;
            await writeFile(componentPath, originalContent, 'utf-8');
            const result = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 1.0,
                reason: 'Testing rollback',
            });
            expect(result.success).toBe(true);
            expect(result.previousVersion).toBe(2.0);
            expect(result.restoredVersion).toBe(1.0);
            expect(result.backupPath).toBeDefined();
            expect(result.backupPath).toContain('.backup-');
            // Verify version updated in content
            const updatedContent = await readFile(componentPath, 'utf-8');
            expect(updatedContent).toContain('version: 1.0');
            expect(updatedContent).toContain('Rollback to v1.0: Testing rollback');
        });
        it('should create backup by default', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 2.0
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-10-28 | Update | Dev |
| 1.0 | 2025-10-27 | Initial | Dev |
`, 'utf-8');
            const result = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 1.0,
                reason: 'Testing backup',
            });
            expect(result.success).toBe(true);
            expect(result.backupPath).toBeDefined();
            expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Backup created')]));
        });
        it('should skip backup when requested', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 2.0
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-10-28 | Update | Dev |
| 1.0 | 2025-10-27 | Initial | Dev |
`, 'utf-8');
            const result = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 1.0,
                createBackup: false,
                reason: 'No backup needed',
            });
            expect(result.success).toBe(true);
            expect(result.backupPath).toBeUndefined();
        });
        it('should fail when target version not found', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 2.0
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-10-28 | Update | Dev |
`, 'utf-8');
            const result = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 5.0,
                reason: 'Invalid version',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found in history');
        });
        it('should handle cascade rollback flag', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 2.0
---

# Test Component

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-10-28 | Update | Dev |
| 1.0 | 2025-10-27 | Initial | Dev |
`, 'utf-8');
            const result = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 1.0,
                cascadeRollback: true,
                reason: 'Cascade test',
            });
            expect(result.success).toBe(true);
            expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Cascade rollback')]));
        });
    });
    // ==========================================================================
    // TOOL 4: UPDATE COMPONENT VERSION
    // ==========================================================================
    describe('updateComponentVersion', () => {
        it('should update component with version tracking', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component

**Component:** test-component
**Purpose:** Original purpose
**Status:** Active

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-27 | Initial version | Project Management MCP |
`, 'utf-8');
            const result = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    Purpose: 'Updated purpose',
                },
                versionChangeType: 'minor',
            });
            expect(result.success).toBe(true);
            expect(result.previousVersion).toBe(1.0);
            expect(result.newVersion).toBe(1.1);
            expect(result.changes).toHaveLength(1);
            expect(result.changes[0].field).toBe('Purpose');
            // Verify file was updated
            const updatedContent = await readFile(componentPath, 'utf-8');
            expect(updatedContent).toContain('version: 1.1');
            expect(updatedContent).toContain('**Purpose:** Updated purpose');
        });
        it('should detect cascade updates to goals', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component
`, 'utf-8');
            // Create major goal
            const goalPath = join(projectPath, '02-goals-and-roadmap/components/test-component/sub-area-1/major-goals/001-test-goal/GOAL-STATUS.md');
            await writeFile(goalPath, `---
version: 1.0
---

# Goal 001
`, 'utf-8');
            const result = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    Status: 'Completed',
                },
                versionChangeType: 'patch',
            });
            expect(result.success).toBe(true);
            expect(result.cascadedUpdates.length).toBeGreaterThan(0);
            expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('goals depend')]));
        });
        it('should support dry-run mode', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            const originalContent = `---
version: 1.0
---

# Test Component

**Purpose:** Original purpose
`;
            await writeFile(componentPath, originalContent, 'utf-8');
            const result = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    Purpose: 'New purpose',
                },
                versionChangeType: 'minor',
                dryRun: true,
            });
            expect(result.success).toBe(true);
            expect(result.previousVersion).toBe(1.0);
            expect(result.newVersion).toBe(1.1);
            expect(result.changes).toHaveLength(1);
            expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Dry run')]));
            // Verify file was NOT updated
            const unchangedContent = await readFile(componentPath, 'utf-8');
            expect(unchangedContent).toBe(originalContent);
        });
        it('should auto-detect version change type', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component

**name:** test-component
**Purpose:** Original purpose
`, 'utf-8');
            // Major change (name field)
            const result1 = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    name: 'renamed-component',
                },
            });
            expect(result1.success).toBe(true);
            expect(result1.newVersion).toBe(2.0); // Major change
        });
        it('should handle non-existent component', async () => {
            const result = await updateComponentVersion({
                projectPath,
                componentId: 'non-existent-component',
                updates: {
                    Purpose: 'Updated',
                },
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should skip cascade when requested', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component
`, 'utf-8');
            const result = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    Status: 'Active',
                },
                cascadeToGoals: false,
            });
            expect(result.success).toBe(true);
            expect(result.cascadedUpdates).toHaveLength(0);
        });
    });
    // ==========================================================================
    // INTEGRATION: FULL VERSION WORKFLOW
    // ==========================================================================
    describe('Full Version Control Workflow', () => {
        it('should support complete version lifecycle', async () => {
            // Setup: Create component
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---
version: 1.0
---

# Test Component

**Purpose:** Initial purpose
**Status:** Active

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-27 | Initial version | Project Management MCP |
`, 'utf-8');
            // Step 1: Analyze impact before update
            const impactResult = await analyzeVersionImpact({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                proposedChanges: {
                    Purpose: 'Updated purpose',
                },
                changeType: 'minor',
            });
            expect(impactResult.success).toBe(true);
            expect(impactResult.proposedVersion).toBe(1.1);
            // Step 2: Update component
            const updateResult = await updateComponentVersion({
                projectPath,
                componentId: 'test-component',
                updates: {
                    Purpose: 'Updated purpose',
                },
                versionChangeType: 'minor',
            });
            expect(updateResult.success).toBe(true);
            expect(updateResult.newVersion).toBe(1.1);
            // Step 3: Get version history
            const historyResult = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
            });
            expect(historyResult.success).toBe(true);
            expect(historyResult.currentVersion).toBe(1.1);
            expect(historyResult.totalVersions).toBeGreaterThan(1);
            // Step 4: Rollback
            const rollbackResult = await rollbackVersion({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                targetVersion: 1.0,
                reason: 'Testing complete workflow',
            });
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.restoredVersion).toBe(1.0);
            // Verify final state
            const finalHistory = await getVersionHistory({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
            });
            expect(finalHistory.currentVersion).toBe(1.0);
        });
    });
    // ==========================================================================
    // PERFORMANCE & CONCURRENCY
    // ==========================================================================
    describe('Performance & Concurrency', () => {
        it('should handle multiple concurrent impact analyses', async () => {
            // Create multiple components
            const components = ['comp1', 'comp2', 'comp3'];
            for (const comp of components) {
                const compPath = join(projectPath, `02-goals-and-roadmap/components/${comp}/OVERVIEW.md`);
                await mkdir(join(projectPath, `02-goals-and-roadmap/components/${comp}`), {
                    recursive: true,
                });
                await writeFile(compPath, `---\nversion: 1.0\n---\n\n# Component ${comp}`, 'utf-8');
            }
            // Run concurrent analyses
            const analyses = components.map(comp => analyzeVersionImpact({
                projectPath,
                documentType: 'component',
                documentPath: `02-goals-and-roadmap/components/${comp}/OVERVIEW.md`,
                proposedChanges: { Status: 'Updated' },
                changeType: 'patch',
            }));
            const results = await Promise.all(analyses);
            expect(results).toHaveLength(3);
            expect(results.every(r => r.success)).toBe(true);
        });
        it('should complete impact analysis in under 2 seconds', async () => {
            const componentPath = join(projectPath, '02-goals-and-roadmap/components/test-component/OVERVIEW.md');
            await writeFile(componentPath, `---\nversion: 1.0\n---\n\n# Test Component`, 'utf-8');
            const startTime = Date.now();
            await analyzeVersionImpact({
                projectPath,
                documentType: 'component',
                documentPath: '02-goals-and-roadmap/components/test-component/OVERVIEW.md',
                proposedChanges: { Status: 'Updated' },
                changeType: 'minor',
            });
            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeLessThan(2000);
        });
    });
});
//# sourceMappingURL=version-control-tools.test%202.js.map