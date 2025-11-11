/**
 * Update Component Tool
 *
 * Updates component details in the project overview
 */

import {
  updateComponent,
  getComponent,
  logComponentChange,
} from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
import {
  UpdateComponentParams,
  UpdateComponentResult,
} from '../lib/component-types.js';

export class UpdateComponentTool {
  static getToolDefinition() {
    return {
      name: 'update_component',
      description: 'Update component details including description, sub-components, dependencies, and success criteria',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          name: {
            type: 'string',
            description: 'Component name to update',
          },
          updates: {
            type: 'object',
            description: 'Fields to update',
            properties: {
              description: {
                type: 'string',
                description: 'New component description',
              },
              subComponents: {
                type: 'array',
                description: 'Updated sub-components list',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: {
                      type: 'string',
                      enum: ['pending', 'in-progress', 'complete'],
                    },
                  },
                  required: ['name', 'description'],
                },
              },
              dependencies: {
                type: 'object',
                description: 'Updated dependencies',
                properties: {
                  requires: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  requiredBy: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  relatedTo: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Updated priority',
              },
              notes: {
                type: 'string',
                description: 'Updated notes',
              },
            },
          },
        },
        required: ['projectPath', 'name', 'updates'],
      },
    };
  }

  static execute(params: UpdateComponentParams): UpdateComponentResult {
    try {
      // Get current component state
      const currentComponent = getComponent(params.projectPath, params.name);
      if (!currentComponent) {
        throw new Error(`Component "${params.name}" not found`);
      }

      // Update component
      const updatedComponent = updateComponent(
        params.projectPath,
        params.name,
        params.updates
      );

      // Get list of updated fields
      const changes = Object.keys(params.updates);

      // Log change
      logComponentChange(params.projectPath, {
        componentName: updatedComponent.name,
        action: 'updated',
        fromStage: currentComponent.stage,
        toStage: updatedComponent.stage,
        description: `Updated fields: ${changes.join(', ')}`,
      });

      // Propagate if component is FINALIZED
      if (updatedComponent.stage === 'FINALIZED') {
        propagateComponentChange(
          params.projectPath,
          updatedComponent.name,
          'updated',
          currentComponent.stage,
          updatedComponent.stage
        );
      }

      return {
        success: true,
        component: updatedComponent,
        changes,
        message: `Component "${updatedComponent.name}" updated successfully. Changes: ${changes.join(', ')}`,
      };
    } catch (error: any) {
      throw error;
    }
  }
}
