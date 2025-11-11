/**
 * Analyze Task Parallelizability Tool
 *
 * Analyzes if a task can benefit from parallel sub-agent execution
 */

import {
  AnalyzeTaskParallelizabilityInput,
  AnalyzeTaskParallelizabilityOutput,
} from '../types.js';
import { TaskAnalysisEngine } from '../engines/task-analysis-engine.js';

export class AnalyzeTaskParallelizabilityTool {
  /**
   * Get tool definition for MCP
   */
  static getToolDefinition() {
    return {
      name: 'analyze_task_parallelizability',
      description:
        'Analyze if a task can benefit from parallel sub-agent execution. Returns parallelization feasibility, dependency graph, suggested batches, and estimated speedup.',
      inputSchema: {
        type: 'object',
        properties: {
          taskDescription: {
            type: 'string',
            description: 'Description of the overall task to analyze',
          },
          subtasks: {
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
                  description: 'Estimated time in minutes (optional)',
                },
                dependsOn: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of task IDs this task depends on',
                },
              },
              required: ['id', 'description'],
            },
            description:
              'Array of subtasks to analyze for parallelization opportunities',
          },
          context: {
            type: 'object',
            description:
              'Optional context (flexible for different systems - Project Management MCP goals, Task Executor workflows, etc.)',
          },
        },
        required: ['taskDescription'],
      },
    };
  }

  /**
   * Execute task parallelizability analysis
   */
  static execute(
    input: AnalyzeTaskParallelizabilityInput
  ): AnalyzeTaskParallelizabilityOutput {
    // Validation
    this.validateInput(input);

    try {
      return TaskAnalysisEngine.analyze(input);
    } catch (error) {
      throw new Error(
        `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate input parameters
   */
  private static validateInput(input: AnalyzeTaskParallelizabilityInput): void {
    if (!input.taskDescription || input.taskDescription.trim().length === 0) {
      throw new Error('taskDescription is required and cannot be empty');
    }

    if (input.taskDescription.length > 5000) {
      throw new Error(
        'taskDescription exceeds maximum length of 5000 characters'
      );
    }

    if (input.subtasks && input.subtasks.length > 0) {
      // Validate subtasks
      const ids = new Set<string>();

      for (let i = 0; i < input.subtasks.length; i++) {
        const task = input.subtasks[i];

        // Check required fields
        if (!task.id || task.id.trim().length === 0) {
          throw new Error(`Subtask at index ${i} is missing required field: id`);
        }

        if (!task.description || task.description.trim().length === 0) {
          throw new Error(
            `Subtask at index ${i} is missing required field: description`
          );
        }

        // Check for duplicate IDs
        if (ids.has(task.id)) {
          throw new Error(`Duplicate task ID found: ${task.id}`);
        }
        ids.add(task.id);

        // Validate estimatedMinutes
        if (
          task.estimatedMinutes !== undefined &&
          (task.estimatedMinutes <= 0 || task.estimatedMinutes > 1440)
        ) {
          throw new Error(
            `Task ${task.id}: estimatedMinutes must be between 1 and 1440 (24 hours)`
          );
        }

        // Validate dependencies
        if (task.dependsOn) {
          for (const depId of task.dependsOn) {
            if (depId === task.id) {
              throw new Error(`Task ${task.id} cannot depend on itself`);
            }
          }
        }
      }

      // Validate that all dependency IDs exist
      for (const task of input.subtasks) {
        if (task.dependsOn) {
          for (const depId of task.dependsOn) {
            if (!ids.has(depId)) {
              throw new Error(
                `Task ${task.id} depends on non-existent task: ${depId}`
              );
            }
          }
        }
      }

      // Limit total subtask count
      if (input.subtasks.length > 100) {
        throw new Error(
          'Maximum 100 subtasks allowed (current: ' +
            input.subtasks.length +
            ')'
        );
      }
    }
  }
}
