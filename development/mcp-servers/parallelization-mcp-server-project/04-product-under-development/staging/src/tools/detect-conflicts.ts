/**
 * Detect Conflicts Tool
 *
 * Detects conflicts from parallel agent execution (file-level, semantic, dependency)
 */

import {
  DetectConflictsInput,
  DetectConflictsOutput,
} from '../types.js';
import { ConflictDetectionSystem } from '../engines/conflict-detection-system.js';

export class DetectConflictsTool {
  /**
   * Get tool definition for MCP
   */
  static getToolDefinition() {
    return {
      name: 'detect_conflicts',
      description:
        'Detect potential conflicts from parallel agent execution. Identifies file-level conflicts, semantic conflicts, and dependency violations. Returns resolution options for each conflict.',
      inputSchema: {
        type: 'object',
        properties: {
          agentResults: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                agentId: {
                  type: 'string',
                  description: 'Unique agent identifier',
                },
                taskId: {
                  type: 'string',
                  description: 'Task ID that was executed',
                },
                success: {
                  type: 'boolean',
                  description: 'Whether task execution succeeded',
                },
                filesModified: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of file paths modified by this agent',
                },
                changes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      file: {
                        type: 'string',
                        description: 'File path',
                      },
                      type: {
                        type: 'string',
                        enum: ['create', 'modify', 'delete'],
                        description: 'Type of change',
                      },
                      content: {
                        type: 'string',
                        description: 'New file content (optional)',
                      },
                    },
                  },
                  description: 'Detailed changes made by agent',
                },
                duration: {
                  type: 'number',
                  description: 'Execution duration in milliseconds',
                },
                error: {
                  type: 'object',
                  description: 'Error object if execution failed',
                },
              },
              required: [
                'agentId',
                'taskId',
                'success',
                'filesModified',
                'duration',
              ],
            },
            description: 'Array of agent execution results',
          },
          dependencyGraph: {
            type: 'object',
            description:
              'Optional dependency graph for detecting dependency violations',
          },
        },
        required: ['agentResults'],
      },
    };
  }

  /**
   * Execute conflict detection
   */
  static execute(input: DetectConflictsInput): DetectConflictsOutput {
    // Validation
    this.validateInput(input);

    try {
      return ConflictDetectionSystem.detect(input);
    } catch (error) {
      throw new Error(
        `Conflict detection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate input parameters
   */
  private static validateInput(input: DetectConflictsInput): void {
    // Validate agentResults
    if (!input.agentResults || input.agentResults.length === 0) {
      throw new Error('agentResults array is required and cannot be empty');
    }

    if (input.agentResults.length > 100) {
      throw new Error(
        'Maximum 100 agent results allowed (current: ' + input.agentResults.length + ')'
      );
    }

    // Validate individual results
    const agentIds = new Set<string>();
    for (let i = 0; i < input.agentResults.length; i++) {
      const result = input.agentResults[i];

      // Check required fields
      if (!result.agentId || result.agentId.trim().length === 0) {
        throw new Error(`Result at index ${i} is missing required field: agentId`);
      }

      if (!result.taskId || result.taskId.trim().length === 0) {
        throw new Error(`Result at index ${i} is missing required field: taskId`);
      }

      if (result.success === undefined) {
        throw new Error(`Result at index ${i} is missing required field: success`);
      }

      if (!result.filesModified) {
        throw new Error(`Result at index ${i} is missing required field: filesModified`);
      }

      if (result.duration === undefined) {
        throw new Error(`Result at index ${i} is missing required field: duration`);
      }

      // Validate duration
      if (result.duration < 0) {
        throw new Error(`Result ${result.agentId}: duration cannot be negative`);
      }

      // Validate filesModified
      if (!Array.isArray(result.filesModified)) {
        throw new Error(`Result ${result.agentId}: filesModified must be an array`);
      }

      // Validate changes (if provided)
      if (result.changes) {
        if (!Array.isArray(result.changes)) {
          throw new Error(`Result ${result.agentId}: changes must be an array`);
        }

        for (let j = 0; j < result.changes.length; j++) {
          const change = result.changes[j];

          if (!change.file || change.file.trim().length === 0) {
            throw new Error(
              `Result ${result.agentId}, change ${j}: file is required`
            );
          }

          if (!change.type) {
            throw new Error(
              `Result ${result.agentId}, change ${j}: type is required`
            );
          }

          const validTypes = ['create', 'modify', 'delete'];
          if (!validTypes.includes(change.type)) {
            throw new Error(
              `Result ${result.agentId}, change ${j}: type must be one of: ${validTypes.join(', ')}`
            );
          }
        }
      }
    }

    // Note: dependencyGraph validation is optional since it's optional in input
  }
}
