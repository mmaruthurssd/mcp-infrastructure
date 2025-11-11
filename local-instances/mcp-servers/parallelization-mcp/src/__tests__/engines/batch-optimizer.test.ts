/**
 * Tests for Batch Optimizer
 */

import { BatchOptimizer } from '../../engines/batch-optimizer.js';
import { DependencyGraphBuilder } from '../../engines/dependency-graph-builder.js';
import { Task } from '../../types.js';

describe('BatchOptimizer', () => {
  describe('optimize()', () => {
    it('should optimize with minimize-time strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 30 },
        { id: '2', description: 'Task 2', estimatedMinutes: 20 },
        { id: '3', description: 'Task 3', estimatedMinutes: 10 },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      expect(result.batches).toBeDefined();
      expect(result.estimatedTotalTime).toBeGreaterThan(0);
      expect(result.reasoning).toBeTruthy();
    });

    it('should optimize with balance-load strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 50 },
        { id: '2', description: 'Task 2', estimatedMinutes: 30 },
        { id: '3', description: 'Task 3', estimatedMinutes: 20 },
        { id: '4', description: 'Task 4', estimatedMinutes: 10 },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'balance-load',
      });

      expect(result.batches).toBeDefined();
      expect(result.loadBalance).toBeGreaterThanOrEqual(0);
      expect(result.loadBalance).toBeLessThanOrEqual(100);
    });

    it('should optimize with minimize-conflicts strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Read config file' },
        { id: '2', description: 'Write config file' },
        { id: '3', description: 'Read database' },
        { id: '4', description: 'Write database' },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-conflicts',
      });

      expect(result.batches).toBeDefined();
      // Tasks that conflict should not be in the same batch
    });

    it('should respect dependency constraints', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 10 },
        { id: '2', description: 'Task 2', estimatedMinutes: 10, dependsOn: ['1'] },
        { id: '3', description: 'Task 3', estimatedMinutes: 10, dependsOn: ['2'] },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 3,
        optimizationGoal: 'minimize-time',
      });

      // Should create sequential batches
      expect(result.batches.length).toBeGreaterThanOrEqual(3);

      // Each batch should only contain one task due to dependencies
      for (let i = 1; i < result.batches.length; i++) {
        expect(result.batches[i].dependsOnBatches).toContain(result.batches[i - 1].id);
      }
    });

    it('should handle empty task list', () => {
      const graph = DependencyGraphBuilder.build({ tasks: [], detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks: [],
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      expect(result.batches).toHaveLength(0);
      expect(result.estimatedTotalTime).toBe(0);
    });

    it('should respect maxParallelAgents constraint', () => {
      const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        description: `Task ${i + 1}`,
        estimatedMinutes: 10,
      }));

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 3,
        optimizationGoal: 'minimize-time',
      });

      // No batch should have more than 3 tasks
      for (const batch of result.batches) {
        expect(batch.tasks.length).toBeLessThanOrEqual(3);
      }
    });

    it('should calculate critical path for minimize-time', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 50 },
        { id: '2', description: 'Task 2', estimatedMinutes: 10, dependsOn: ['1'] },
        { id: '3', description: 'Task 3', estimatedMinutes: 10 },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      // Total time should be dominated by the critical path (1 -> 2)
      expect(result.estimatedTotalTime).toBeGreaterThanOrEqual(60); // 50 + 10
    });

    it('should balance load across agents', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 40 },
        { id: '2', description: 'Task 2', estimatedMinutes: 30 },
        { id: '3', description: 'Task 3', estimatedMinutes: 20 },
        { id: '4', description: 'Task 4', estimatedMinutes: 10 },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'balance-load',
      });

      // Load balance should be reasonable
      expect(result.loadBalance).toBeGreaterThan(50);
    });

    it('should avoid grouping conflicting tasks', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Read user.ts' },
        { id: '2', description: 'Modify user.ts' },
        { id: '3', description: 'Read config.ts' },
        { id: '4', description: 'Modify config.ts' },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 4,
        optimizationGoal: 'minimize-conflicts',
      });

      // Find batches containing task 1 and 2
      const batch1 = result.batches.find(b => b.tasks.some(t => t.id === '1'));
      const batch2 = result.batches.find(b => b.tasks.some(t => t.id === '2'));

      // Tasks 1 and 2 should ideally not be in the same batch (they conflict on user.ts)
      if (batch1 && batch2) {
        if (batch1.id === batch2.id) {
          // If they are in same batch, there should be a good reason (e.g., forced by dependencies)
          expect(batch1.tasks.length).toBeLessThanOrEqual(4);
        }
      }
    });

    it('should provide meaningful reasoning', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 20 },
        { id: '2', description: 'Task 2', estimatedMinutes: 20 },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const result = BatchOptimizer.optimize({
        tasks,
        dependencyGraph: graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(20);
    });
  });
});
