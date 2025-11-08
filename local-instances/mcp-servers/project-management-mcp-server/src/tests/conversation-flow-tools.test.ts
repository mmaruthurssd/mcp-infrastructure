/**
 * Integration Tests for Conversation Flow Tools (Goal 010)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  suggestNextSteps,
  getProjectPhase,
  advanceWorkflowPhase,
  getConversationContext,
} from '../tools/conversation-flow-tools.js';

const TEST_PROJECT_PATH = path.join(process.cwd(), 'temp', 'conversation-flow-test');

describe('Conversation Flow Tools - Goal 010', () => {
  beforeEach(async () => {
    // Create test project structure
    await fs.mkdir(TEST_PROJECT_PATH, { recursive: true });
    await fs.mkdir(path.join(TEST_PROJECT_PATH, '01-planning'), { recursive: true });
    await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(TEST_PROJECT_PATH, { recursive: true, force: true });
  });

  describe('suggest_next_steps', () => {
    test('should suggest creating PROJECT OVERVIEW when missing', async () => {
      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: true,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
        expect(result.suggestions![0]!.action).toContain('PROJECT OVERVIEW');
        expect(result.suggestions![0]!.priority).toBe('high');
        expect(result.suggestions![0]!.mcpTool).toBe('start_project_overview_conversation');
        expect(result.performance!.analysisTimeMs).toBeLessThan(2000);
      }
    });

    test('should suggest creating components when PROJECT OVERVIEW exists', async () => {
      // Create PROJECT OVERVIEW
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW\n\nProject vision...',
        'utf-8'
      );

      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.some(s => s.action.toLowerCase().includes('component'))).toBe(true);
      }
    });

    test('should suggest defining goals when components exist', async () => {
      // Create PROJECT OVERVIEW and components
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1'), {
        recursive: true,
      });
      await fs.mkdir(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals'),
        { recursive: true }
      );

      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions!.some(s => s.action.toLowerCase().includes('goal'))).toBe(true);
      }
    });

    test('should suggest execution when goals exist but none in progress', async () => {
      // Setup with goals
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals', '001-test-goal.md'),
        '# Goal 001\n\n**Status:** Planning',
        'utf-8'
      );

      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions!.some(s => s.action.toLowerCase().includes('executing') || s.action.toLowerCase().includes('start'))).toBe(true);
      }
    });

    test('should prioritize blocked goals', async () => {
      // Setup with blocked goal
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals', '001-blocked-goal.md'),
        '# Goal 001\n\n**Status:** Blocked',
        'utf-8'
      );

      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions!.some(s => s.action.toLowerCase().includes('blocked'))).toBe(true);
      }
    });

    test('should respect maxSuggestions parameter', async () => {
      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions!.length).toBeLessThanOrEqual(2);
      }
    });

    test('should include detailed reasoning when requested', async () => {
      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: true,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions![0]!.reasoning).toBeDefined();
        expect(result.suggestions![0]!.reasoning.length).toBeGreaterThan(50);
      }
    });
  });

  describe('get_project_phase', () => {
    test('should return error when PROJECT OVERVIEW missing', async () => {
      const result = await getProjectPhase({
        projectPath: TEST_PROJECT_PATH,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('PROJECT-OVERVIEW.md not found');
      }
    });

    test('should identify planning phase for new project', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getProjectPhase({
        projectPath: TEST_PROJECT_PATH,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.phaseInfo!.currentPhase).toBe('planning');
        expect(result.phaseInfo!.phaseDescription).toContain('structure');
        expect(result.phaseInfo!.nextPhase).toBe('execution');
        expect(result.performance!.analysisTimeMs).toBeLessThan(2000);
      }
    });

    test('should identify execution phase when goals in progress', async () => {
      // Setup execution phase
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'component-1', 'major-goals', '001-goal.md'),
        '# Goal 001\n\n**Status:** In Progress',
        'utf-8'
      );

      const result = await getProjectPhase({
        projectPath: TEST_PROJECT_PATH,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.phaseInfo!.currentPhase).toBe('execution');
        expect(result.phaseInfo!.phaseDescription).toContain('working');
      }
    });

    test('should calculate readiness for next phase', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getProjectPhase({
        projectPath: TEST_PROJECT_PATH,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.phaseInfo!.readinessForNext).toBeDefined();
        expect(result.phaseInfo!.readinessForNext).toBeGreaterThanOrEqual(0);
        expect(result.phaseInfo!.readinessForNext).toBeLessThanOrEqual(100);
      }
    });

    test('should identify blockers and provide recommendations', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getProjectPhase({
        projectPath: TEST_PROJECT_PATH,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.phaseInfo!.blockers).toBeDefined();
        expect(result.phaseInfo!.recommendations).toBeDefined();
        expect(Array.isArray(result.phaseInfo!.blockers)).toBe(true);
        expect(Array.isArray(result.phaseInfo!.recommendations)).toBe(true);
      }
    });
  });

  describe('advance_workflow_phase', () => {
    test('should require minimum readiness to advance', async () => {
      // Empty project (low readiness)
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await advanceWorkflowPhase({
        projectPath: TEST_PROJECT_PATH,
        targetPhase: 'execution',
        force: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Not ready');
        expect(result.blockers).toBeDefined();
        expect(result.recommendations).toBeDefined();
      }
    });

    test('should allow forced advancement', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await advanceWorkflowPhase({
        projectPath: TEST_PROJECT_PATH,
        targetPhase: 'execution',
        force: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.previousPhase).toBe('planning');
        expect(result.newPhase).toBe('execution');
        expect(result.transitionActions).toBeDefined();
        expect(result.performance!.transitionTimeMs).toBeLessThan(2000);
      }
    });

    test('should auto-detect target phase when not provided', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await advanceWorkflowPhase({
        projectPath: TEST_PROJECT_PATH,
        force: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newPhase).toBeDefined();
      }
    });

    test('should provide phase-specific recommendations', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await advanceWorkflowPhase({
        projectPath: TEST_PROJECT_PATH,
        targetPhase: 'execution',
        force: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.recommendations).toBeDefined();
        expect(result.recommendations!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('get_conversation_context', () => {
    test('should build overview context', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getConversationContext({
        projectPath: TEST_PROJECT_PATH,
        contextType: 'overview',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context).toBeDefined();
        expect(result.context!.projectName).toBeDefined();
        expect(result.context!.projectPhase).toBeDefined();
        expect(result.context!.overallProgress).toBeDefined();
        expect(result.context!.suggestedTopics).toBeDefined();
        expect(Array.isArray(result.context!.suggestedTopics)).toBe(true);
        expect(result.performance!.buildTimeMs).toBeLessThan(2000);
      }
    });

    test('should build detailed context', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getConversationContext({
        projectPath: TEST_PROJECT_PATH,
        contextType: 'detailed',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context).toBeDefined();
      }
    });

    test('should build entity-specific context', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      const result = await getConversationContext({
        projectPath: TEST_PROJECT_PATH,
        contextType: 'specific-entity',
        entityId: '001',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context).toBeDefined();
        expect(result.context!.suggestedTopics.some(t => t.includes('001'))).toBe(true);
      }
    });

    test('should include current blockers in context', async () => {
      // Setup with blocked goal
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'comp-1', 'major-goals'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'comp-1', 'major-goals', '001-blocked.md'),
        '# Goal\n\n**Status:** Blocked',
        'utf-8'
      );

      const result = await getConversationContext({
        projectPath: TEST_PROJECT_PATH,
        contextType: 'overview',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context!.currentBlockers.length).toBeGreaterThan(0);
      }
    });

    test('should include component and goal counts', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'comp-1', 'major-goals'), {
        recursive: true,
      });

      const result = await getConversationContext({
        projectPath: TEST_PROJECT_PATH,
        contextType: 'overview',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context!.totalComponents).toBe(1);
        expect(result.context!.activeComponents).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    test('all tools should respond in < 2 seconds', async () => {
      // Setup project
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );

      // Test all tools
      const results = await Promise.all([
        suggestNextSteps({ projectPath: TEST_PROJECT_PATH, includeDetails: false, maxSuggestions: 5 }),
        getProjectPhase({ projectPath: TEST_PROJECT_PATH }),
        getConversationContext({ projectPath: TEST_PROJECT_PATH, contextType: 'overview' }),
      ]);

      results.forEach(result => {
        expect(result.success).toBe(true);
        if (result.success && 'performance' in result && result.performance) {
          const perf: any = result.performance;
          const timeMs = perf.analysisTimeMs || perf.buildTimeMs || perf.transitionTimeMs;
          expect(timeMs).toBeLessThan(2000);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty project gracefully', async () => {
      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions!.length).toBeGreaterThan(0);
      }
    });

    test('should handle non-existent project path', async () => {
      const result = await getProjectPhase({
        projectPath: '/non/existent/path',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    test('should handle malformed goal files', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '01-planning', 'PROJECT-OVERVIEW.md'),
        '# PROJECT OVERVIEW',
        'utf-8'
      );
      await fs.mkdir(path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'comp-1', 'major-goals'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '02-goals-and-roadmap', 'components', 'comp-1', 'major-goals', 'bad-goal.md'),
        'Invalid content',
        'utf-8'
      );

      const result = await suggestNextSteps({
        projectPath: TEST_PROJECT_PATH,
        includeDetails: false,
        maxSuggestions: 5,
      });

      // Should not crash
      expect(result.success).toBe(true);
    });
  });
});

console.log('✅ Conversation Flow Tools (Goal 010) - Test Suite Ready');
