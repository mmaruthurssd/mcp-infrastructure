/**
 * Aggregate Progress Tool
 *
 * Aggregates progress from multiple parallel sub-agents into unified view
 */

import {
  AggregateProgressInput,
  AggregateProgressOutput,
} from '../types.js';
import { ProgressAggregationEngine } from '../engines/progress-aggregation-engine.js';

export class AggregateProgressTool {
  /**
   * Get tool definition for MCP
   */
  static getToolDefinition() {
    return {
      name: 'aggregate_progress',
      description:
        'Aggregate progress from multiple parallel agents into a unified view. Supports simple average, weighted, and critical path strategies. Detects bottlenecks and estimates completion time.',
      inputSchema: {
        type: 'object',
        properties: {
          agentProgresses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                agentId: {
                  type: 'string',
                  description: 'Unique agent identifier',
                },
                currentTask: {
                  type: 'string',
                  description: 'ID of task currently being executed',
                },
                percentComplete: {
                  type: 'number',
                  description: 'Progress percentage (0-100)',
                },
                taskWeight: {
                  type: 'number',
                  description:
                    'Weight/importance of current task (for weighted strategy)',
                },
                status: {
                  type: 'string',
                  enum: ['idle', 'working', 'blocked', 'complete', 'failed'],
                  description: 'Current agent status',
                },
                estimatedTimeRemaining: {
                  type: 'number',
                  description: 'Estimated minutes remaining for current task',
                },
              },
              required: [
                'agentId',
                'currentTask',
                'percentComplete',
                'status',
              ],
            },
            description: 'Array of agent progress reports',
          },
          aggregationStrategy: {
            type: 'string',
            enum: ['simple-average', 'weighted', 'critical-path'],
            description:
              'Strategy for aggregating progress: simple-average (equal weight), weighted (by task importance), critical-path (based on longest dependency chain)',
          },
        },
        required: ['agentProgresses', 'aggregationStrategy'],
      },
    };
  }

  /**
   * Execute progress aggregation
   */
  static execute(input: AggregateProgressInput): AggregateProgressOutput {
    // Validation
    this.validateInput(input);

    try {
      return ProgressAggregationEngine.aggregate(input);
    } catch (error) {
      throw new Error(
        `Progress aggregation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate input parameters
   */
  private static validateInput(input: AggregateProgressInput): void {
    // Validate agentProgresses
    if (!input.agentProgresses || input.agentProgresses.length === 0) {
      throw new Error('agentProgresses array is required and cannot be empty');
    }

    if (input.agentProgresses.length > 50) {
      throw new Error(
        'Maximum 50 agents allowed (current: ' + input.agentProgresses.length + ')'
      );
    }

    // Validate aggregationStrategy
    if (!input.aggregationStrategy) {
      throw new Error('aggregationStrategy is required');
    }

    const validStrategies = ['simple-average', 'weighted', 'critical-path'];
    if (!validStrategies.includes(input.aggregationStrategy)) {
      throw new Error(
        `aggregationStrategy must be one of: ${validStrategies.join(', ')}`
      );
    }

    // Validate individual agent progresses
    const agentIds = new Set<string>();
    for (let i = 0; i < input.agentProgresses.length; i++) {
      const progress = input.agentProgresses[i];

      // Check required fields
      if (!progress.agentId || progress.agentId.trim().length === 0) {
        throw new Error(`Agent at index ${i} is missing required field: agentId`);
      }

      if (!progress.currentTask || progress.currentTask.trim().length === 0) {
        throw new Error(`Agent at index ${i} is missing required field: currentTask`);
      }

      if (progress.percentComplete === undefined) {
        throw new Error(`Agent at index ${i} is missing required field: percentComplete`);
      }

      if (!progress.status) {
        throw new Error(`Agent at index ${i} is missing required field: status`);
      }

      // Check for duplicate agent IDs
      if (agentIds.has(progress.agentId)) {
        throw new Error(`Duplicate agent ID found: ${progress.agentId}`);
      }
      agentIds.add(progress.agentId);

      // Validate percentComplete range
      if (progress.percentComplete < 0 || progress.percentComplete > 100) {
        throw new Error(
          `Agent ${progress.agentId}: percentComplete must be between 0 and 100`
        );
      }

      // Validate status
      const validStatuses = ['idle', 'working', 'blocked', 'complete', 'failed'];
      if (!validStatuses.includes(progress.status)) {
        throw new Error(
          `Agent ${progress.agentId}: status must be one of: ${validStatuses.join(', ')}`
        );
      }

      // Validate taskWeight (if provided and using weighted strategy)
      if (
        progress.taskWeight !== undefined &&
        (progress.taskWeight < 0 || progress.taskWeight > 100)
      ) {
        throw new Error(
          `Agent ${progress.agentId}: taskWeight must be between 0 and 100`
        );
      }

      // Validate estimatedTimeRemaining (if provided)
      if (
        progress.estimatedTimeRemaining !== undefined &&
        progress.estimatedTimeRemaining < 0
      ) {
        throw new Error(
          `Agent ${progress.agentId}: estimatedTimeRemaining cannot be negative`
        );
      }
    }

    // Weighted strategy requires taskWeight
    if (input.aggregationStrategy === 'weighted') {
      const missingWeights = input.agentProgresses.filter(
        p => p.taskWeight === undefined
      );

      if (missingWeights.length > 0) {
        throw new Error(
          'Weighted strategy requires taskWeight for all agents. ' +
          `Missing for: ${missingWeights.map(p => p.agentId).join(', ')}`
        );
      }
    }
  }
}
