/**
 * Create Workflow Tool - MCP tool for creating new task workflows
 */

import { CreateWorkflowInput, CreateWorkflowOutput } from '../types.js';
import { WorkflowManager } from '../utils/workflow-manager-v2.js';

export class CreateWorkflowTool {
  /**
   * Get tool definition for MCP
   */
  static getToolDefinition() {
    return {
      name: 'create_workflow',
      description: 'Create a new task execution workflow with automatic complexity analysis. Perfect for bug fixes, small features, and daily tasks (3-10 tasks).',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Workflow name (e.g., "bug-fix-123", "refactor-auth-module")'
          },
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory'
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Task description'
                },
                estimatedHours: {
                  type: 'number',
                  description: 'Optional estimated hours for this task'
                }
              },
              required: ['description']
            },
            description: 'List of tasks to complete (3-20 tasks recommended)'
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional constraints or requirements to maintain throughout workflow'
          },
          context: {
            type: 'object',
            properties: {
              phiHandling: {
                type: 'boolean',
                description: 'Does this workflow involve PHI/patient data?'
              },
              category: {
                type: 'string',
                description: 'Category (e.g., "bug-fix", "feature", "refactor")'
              }
            }
          }
        },
        required: ['name', 'projectPath', 'tasks']
      }
    };
  }

  /**
   * Execute workflow creation
   */
  static execute(input: CreateWorkflowInput): CreateWorkflowOutput {
    return WorkflowManager.create(input);
  }
}
