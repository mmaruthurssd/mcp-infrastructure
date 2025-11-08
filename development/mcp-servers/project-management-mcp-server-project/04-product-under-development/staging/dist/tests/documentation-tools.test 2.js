/**
 * Integration Tests for Documentation Tools (Goal 012)
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateQuickStartGuide, generateUserGuide, generateAPIReference, generateMigrationGuide, exportProjectSummary, } from '../tools/documentation-tools.js';
const TEST_PROJECT_PATH = path.join(process.cwd(), 'temp', 'documentation-test');
describe('Documentation Tools - Goal 012', () => {
    beforeEach(async () => {
        // Create test project structure
        await fs.mkdir(TEST_PROJECT_PATH, { recursive: true });
        await fs.mkdir(path.join(TEST_PROJECT_PATH, 'docs'), { recursive: true });
    });
    afterEach(async () => {
        // Cleanup
        await fs.rm(TEST_PROJECT_PATH, { recursive: true, force: true });
    });
    describe('generate_quick_start_guide', () => {
        test('should generate quick start guide with examples', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('QUICK-START.md');
                expect(result.wordCount).toBeGreaterThan(500);
                expect(result.estimatedReadingTime).toContain('minutes');
                expect(result.performance.generationTimeMs).toBeLessThan(2000);
                // Verify file created
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Quick Start Guide');
                expect(content).toContain('Step 1');
                expect(content).toContain('```javascript'); // Should have code examples
            }
        });
        test('should generate quick start guide without examples', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: false,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Quick Start Guide');
                expect(content.split('```').length - 1).toBe(0); // No code blocks
            }
        });
        test('should include YAML frontmatter', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: false,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toMatch(/^---\n/);
                expect(content).toContain('type: guide');
                expect(content).toContain('tags:');
            }
        });
        test('should support custom output path', async () => {
            const customPath = path.join(TEST_PROJECT_PATH, 'custom-quick-start.md');
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: false,
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
        test('should estimate reading time accurately', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const minutes = parseInt(result.estimatedReadingTime);
                expect(minutes).toBeGreaterThan(0);
                expect(minutes).toBeLessThan(30); // Should be quick!
            }
        });
    });
    describe('generate_user_guide', () => {
        test('should generate complete user guide with all sections', async () => {
            const result = await generateUserGuide({
                projectPath: TEST_PROJECT_PATH,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('USER-GUIDE.md');
                expect(result.sectionsGenerated).toBe(8); // All default sections
                expect(result.wordCount).toBeGreaterThan(1000);
                expect(result.performance.generationTimeMs).toBeLessThan(2000);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Project Management MCP v1.0.0 - User Guide');
                expect(content).toContain('## Table of Contents');
                expect(content).toContain('## Overview');
                expect(content).toContain('## Troubleshooting');
            }
        });
        test('should generate user guide with specific sections', async () => {
            const sections = ['overview', 'project-setup', 'components'];
            const result = await generateUserGuide({
                projectPath: TEST_PROJECT_PATH,
                sections,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.sectionsGenerated).toBe(3);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('## Overview');
                expect(content).toContain('## Project Setup');
                expect(content).toContain('## Components');
                expect(content).not.toContain('## Troubleshooting'); // Not included
            }
        });
        test('should include all required sections', async () => {
            const result = await generateUserGuide({
                projectPath: TEST_PROJECT_PATH,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                const requiredSections = [
                    'Overview',
                    'Project Setup',
                    'Components',
                    'Goals',
                    'Workflows',
                    'Progress Tracking',
                    'MCP Integration',
                    'Troubleshooting',
                ];
                requiredSections.forEach(section => {
                    expect(content).toContain(`## ${section}`);
                });
            }
        });
        test('should format section names properly', async () => {
            const sections = ['mcp-integration', 'progress-tracking'];
            const result = await generateUserGuide({
                projectPath: TEST_PROJECT_PATH,
                sections,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('## Mcp Integration');
                expect(content).toContain('## Progress Tracking');
            }
        });
    });
    describe('generate_api_reference', () => {
        test('should generate Markdown API reference', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('API-REFERENCE.md');
                expect(result.format).toBe('markdown');
                expect(result.toolsDocumented).toBeGreaterThan(0);
                expect(result.performance.generationTimeMs).toBeLessThan(2000);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Project Management MCP API Reference');
                expect(content).toContain('## suggest_next_steps');
                expect(content).toContain('### Parameters');
                expect(content).toContain('### Returns');
            }
        });
        test('should generate JSON API reference', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'json',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.json');
                const content = await fs.readFile(result.outputPath, 'utf-8');
                const data = JSON.parse(content);
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBeGreaterThan(0);
                expect(data[0]).toHaveProperty('name');
                expect(data[0]).toHaveProperty('description');
                expect(data[0]).toHaveProperty('parameters');
            }
        });
        test('should generate HTML API reference', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'html',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.html');
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('<!DOCTYPE html>');
                expect(content).toContain('<title>Project Management MCP API Reference</title>');
                expect(content).toContain('<table>');
            }
        });
        test('should include examples when requested', async () => {
            const withExamples = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: true,
            });
            const withoutExamples = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: false,
            });
            expect(withExamples.success).toBe(true);
            expect(withoutExamples.success).toBe(true);
            if (withExamples.success && withoutExamples.success) {
                const withContent = await fs.readFile(withExamples.outputPath, 'utf-8');
                const withoutContent = await fs.readFile(withoutExamples.outputPath, 'utf-8');
                expect(withContent).toContain('### Examples');
                expect(withoutContent).not.toContain('### Examples');
            }
        });
        test('should document all tool parameters', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('| Parameter | Type | Required | Description |');
            }
        });
    });
    describe('generate_migration_guide', () => {
        test('should generate migration guide for v0.8.0 to v1.0.0', async () => {
            const result = await generateMigrationGuide({
                projectPath: TEST_PROJECT_PATH,
                fromVersion: '0.8.0',
                toVersion: '1.0.0',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('MIGRATION-GUIDE.md');
                expect(result.fromVersion).toBe('0.8.0');
                expect(result.toVersion).toBe('1.0.0');
                expect(result.wordCount).toBeGreaterThan(500);
                expect(result.performance.generationTimeMs).toBeLessThan(2000);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Migration Guide: v0.8.0 → v1.0.0');
                expect(content).toContain('## What\'s New');
                expect(content).toContain('## Migration Steps');
                expect(content).toContain('## Rollback Procedure');
            }
        });
        test('should include breaking changes section', async () => {
            const result = await generateMigrationGuide({
                projectPath: TEST_PROJECT_PATH,
                fromVersion: '0.8.0',
                toVersion: '1.0.0',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('### Breaking Changes');
            }
        });
        test('should include step-by-step migration instructions', async () => {
            const result = await generateMigrationGuide({
                projectPath: TEST_PROJECT_PATH,
                fromVersion: '0.8.0',
                toVersion: '1.0.0',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('### Step 1:');
                expect(content).toContain('### Step 2:');
                expect(content).toContain('### Step 3:');
            }
        });
        test('should include rollback instructions', async () => {
            const result = await generateMigrationGuide({
                projectPath: TEST_PROJECT_PATH,
                fromVersion: '0.8.0',
                toVersion: '1.0.0',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('## Rollback Procedure');
                expect(content).toContain('Restore from backup');
            }
        });
        test('should include post-migration checklist', async () => {
            const result = await generateMigrationGuide({
                projectPath: TEST_PROJECT_PATH,
                fromVersion: '0.8.0',
                toVersion: '1.0.0',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('## Post-Migration Checklist');
                expect(content).toMatch(/- \[ \]/); // Has checklist items
            }
        });
    });
    describe('export_project_summary', () => {
        test('should export Markdown project summary', async () => {
            const result = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                audience: 'stakeholder',
                includeDiagrams: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('PROJECT-SUMMARY.md');
                expect(result.format).toBe('markdown');
                expect(result.audience).toBe('stakeholder');
                expect(result.performance.generationTimeMs).toBeLessThan(2000);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('# Project Summary:');
                expect(content).toContain('## Executive Summary');
                expect(content).toContain('## Key Metrics');
            }
        });
        test('should export JSON project summary', async () => {
            const result = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'json',
                audience: 'technical',
                includeDiagrams: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.json');
                const content = await fs.readFile(result.outputPath, 'utf-8');
                const summary = JSON.parse(content);
                expect(summary).toHaveProperty('projectName');
                expect(summary).toHaveProperty('overallProgress');
                expect(summary).toHaveProperty('components');
                expect(summary).toHaveProperty('totalGoals');
            }
        });
        test('should export HTML project summary', async () => {
            const result = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'html',
                audience: 'executive',
                includeDiagrams: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.outputPath).toContain('.html');
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('<!DOCTYPE html>');
                expect(content).toContain('<title>Project Summary:');
                expect(content).toContain('class="progress-bar"');
            }
        });
        test('should tailor content to audience', async () => {
            const audiences = ['executive', 'technical', 'stakeholder'];
            for (const audience of audiences) {
                const result = await exportProjectSummary({
                    projectPath: TEST_PROJECT_PATH,
                    format: 'markdown',
                    audience,
                    includeDiagrams: true,
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.audience).toBe(audience);
                }
            }
        });
        test('should include component and goal counts in summary', async () => {
            const result = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'json',
                audience: 'stakeholder',
                includeDiagrams: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.summary.componentsCount).toBeDefined();
                expect(result.summary.goalsCount).toBeDefined();
                expect(result.summary.overallProgress).toBeDefined();
            }
        });
        test('should optionally include diagrams', async () => {
            const withDiagrams = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                audience: 'technical',
                includeDiagrams: true,
            });
            const withoutDiagrams = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                audience: 'technical',
                includeDiagrams: false,
            });
            expect(withDiagrams.success).toBe(true);
            expect(withoutDiagrams.success).toBe(true);
        });
    });
    describe('Performance Benchmarks', () => {
        test('all documentation tools should generate in < 2 seconds', async () => {
            const results = await Promise.all([
                generateQuickStartGuide({ projectPath: TEST_PROJECT_PATH, includeExamples: true }),
                generateUserGuide({ projectPath: TEST_PROJECT_PATH }),
                generateAPIReference({ projectPath: TEST_PROJECT_PATH, format: 'markdown', includeExamples: true }),
                generateMigrationGuide({ projectPath: TEST_PROJECT_PATH, fromVersion: '0.8.0', toVersion: '1.0.0' }),
                exportProjectSummary({ projectPath: TEST_PROJECT_PATH, format: 'markdown', audience: 'stakeholder', includeDiagrams: true }),
            ]);
            results.forEach(result => {
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.performance.generationTimeMs).toBeLessThan(2000);
                }
            });
        });
    });
    describe('Content Quality', () => {
        test('generated documentation should be readable', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                const wordCount = content.split(/\s+/).length;
                // Should be substantial but not overwhelming
                expect(wordCount).toBeGreaterThan(500);
                expect(wordCount).toBeLessThan(10000);
                // Should have proper structure
                expect(content.split('## ').length).toBeGreaterThan(3); // Multiple sections
                expect(content.split('\n').length).toBeGreaterThan(50); // Multiple lines
            }
        });
        test('API reference should be comprehensive', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.toolsDocumented).toBeGreaterThan(0);
                const content = await fs.readFile(result.outputPath, 'utf-8');
                // Should have complete documentation for each tool
                const toolSections = content.split('## ').length - 1;
                expect(toolSections).toBeGreaterThan(0);
                // Each tool should have parameters, returns, and examples
                expect((content.match(/### Parameters/g) || []).length).toBe(toolSections);
                expect((content.match(/### Returns/g) || []).length).toBe(toolSections);
                expect((content.match(/### Examples/g) || []).length).toBe(toolSections);
            }
        });
    });
    describe('Edge Cases', () => {
        test('should create docs directory if missing', async () => {
            await fs.rm(path.join(TEST_PROJECT_PATH, 'docs'), { recursive: true, force: true });
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const dirExists = await fs
                    .access(path.join(TEST_PROJECT_PATH, 'docs'))
                    .then(() => true)
                    .catch(() => false);
                expect(dirExists).toBe(true);
            }
        });
        test('should handle custom output paths with nested directories', async () => {
            const customPath = path.join(TEST_PROJECT_PATH, 'custom', 'nested', 'path', 'guide.md');
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
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
        test('should handle empty project gracefully', async () => {
            const result = await exportProjectSummary({
                projectPath: TEST_PROJECT_PATH,
                format: 'json',
                audience: 'stakeholder',
                includeDiagrams: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.summary.componentsCount).toBe(0);
                expect(result.summary.goalsCount).toBe(0);
            }
        });
    });
    describe('Integration with Other Tools', () => {
        test('documentation should reference actual tool names', async () => {
            const result = await generateQuickStartGuide({
                projectPath: TEST_PROJECT_PATH,
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('startProjectOverviewConversation');
                expect(content).toContain('identifyComponents');
                expect(content).toContain('createMajorGoal');
            }
        });
        test('API reference should match actual tool signatures', async () => {
            const result = await generateAPIReference({
                projectPath: TEST_PROJECT_PATH,
                format: 'markdown',
                includeExamples: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                const content = await fs.readFile(result.outputPath, 'utf-8');
                expect(content).toContain('projectPath');
                expect(content).toContain('string');
                expect(content).toContain('required');
            }
        });
    });
});
console.log('✅ Documentation Tools (Goal 012) - Test Suite Ready');
//# sourceMappingURL=documentation-tools.test%202.js.map