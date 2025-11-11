/**
 * Optimize Batch Distribution Tool
 *
 * Optimizes task distribution across parallel agents to minimize total time
 */

import {
  OptimizeBatchDistributionInput,
  OptimizeBatchDistributionOutput,
} from '../types.js';
import { BatchOptimizer } from '../engines/batch-optimizer.js';

export class OptimizeBatchDistributionTool {
  /**
   * Get tool definition for MCP
   */
  static getToolDefinition() {
    return {
      name: 'optimize_batch_distribution',
      description:
        'Optimize task distribution across parallel agents. Uses critical path method and load balancing to minimize total execution time. Returns optimized batch assignments.',
      inputSchema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique task identifier',
                },
                description: {
                  type: 'string',
                  description: 'Task description',
                },
                estimatedMinutes: {
                  type: 'number',
                  description: 'Estimated time in minutes',
                },
                dependsOn: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of task IDs this task depends on',
                },
              },
              required: ['id', 'description'],
            },
            description: 'Array of tasks to distribute',
          },
          dependencyGraph: {
            type: 'object',
            description: 'Dependency graph from create_dependency_graph',
          },
          maxParallelAgents: {
            type: 'number',
            description: 'Maximum number of parallel agents available',
          },
          optimizationGoal: {
            type: 'string',
            enum: ['minimize-time', 'balance-load', 'minimize-conflicts'],
            description:
              'Optimization goal: minimize-time (fastest completion), balance-load (even distribution), minimize-conflicts (reduce conflict risk)',
          },
        },
        required: ['tasks', 'dependencyGraph', 'maxParallelAgents', 'optimizationGoal'],
      },
    };
  }

  /**
   * Execute batch distribution optimization
   */
  static execute(
    input: OptimizeBatchDistributionInput
  ): OptimizeBatchDistributionOutput {
    // Validation
    this.validateInput(input);

    try {
      return BatchOptimizer.optimize(input);
    } catch (error) {
      throw new Error(
        `Optimization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate input parameters
   */
  private static validateInput(input: OptimizeBatchDistributionInput): void {
    // Validate tasks
    if (!input.tasks || input.tasks.length === 0) {
      throw new Error('tasks array is required and cannot be empty');
    }

    if (input.tasks.length > 100) {
      throw new Error(
        'Maximum 100 tasks allowed (current: ' + input.tasks.length + ')'
      );
    }

    // Validate dependency graph
    if (!input.dependencyGraph) {
      throw new Error('dependencyGraph is required');
    }

    if (!input.dependencyGraph.nodes) {
      throw new Error('dependencyGraph must contain nodes');
    }

    // Validate maxParallelAgents
    if (!input.maxParallelAgents) {
      throw new Error('maxParallelAgents is required');
    }

    if (input.maxParallelAgents < 1 || input.maxParallelAgents > 20) {
      throw new Error('maxParallelAgents must be between 1 and 20');
    }

    // Validate optimizationGoal
    if (!input.optimizationGoal) {
      throw new Error('optimizationGoal is required');
    }

    const validGoals = ['minimize-time', 'balance-load', 'minimize-conflicts'];
    if (!validGoals.includes(input.optimizationGoal)) {
      throw new Error(
        `optimizationGoal must be one of: ${validGoals.join(', ')}`
      );
    }

    // Validate individual tasks
    const ids = new Set<string>();
    for (let i = 0; i < input.tasks.length; i++) {
      const task = input.tasks[i];

      if (!task.id || task.id.trim().length === 0) {
        throw new Error(`Task at index ${i} is missing required field: id`);
      }

      if (!task.description || task.description.trim().length === 0) {
        throw new Error(`Task at index ${i} is missing required field: description`);
      }

      // Check for duplicate IDs
      if (ids.has(task.id)) {
        throw new Error(`Duplicate task ID found: ${task.id}`);
      }
      ids.add(task.id);

      // Validate estimatedMinutes if provided
      if (
        task.estimatedMinutes !== undefined &&
        (task.estimatedMinutes <= 0 || task.estimatedMinutes > 1440)
      ) {
        throw new Error(
          `Task ${task.id}: estimatedMinutes must be between 1 and 1440`
        );
      }
    }
  }
}
