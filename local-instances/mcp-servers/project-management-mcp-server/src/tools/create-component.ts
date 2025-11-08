/**
 * Create Component Tool
 *
 * Creates a new component in the project overview
 */

import {
  createComponent,
  logComponentChange,
} from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
import {
  CreateComponentParams,
  CreateComponentResult,
} from '../lib/component-types.js';

export class CreateComponentTool {
  static getToolDefinition() {
    return {
      name: 'create_component',
      description: 'Create a new component in the project overview with specified stage and details',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          name: {
            type: 'string',
            description: 'Component name (must be unique)',
          },
          stage: {
            type: 'string',
            enum: ['EXPLORING', 'FRAMEWORK', 'FINALIZED', 'ARCHIVED'],
            description: 'Initial component stage',
          },
          description: {
            type: 'string',
            description: 'Component description',
          },
          subComponents: {
            type: 'array',
            description: 'Optional sub-components',
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
            description: 'Optional component dependencies',
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
            description: 'Component priority',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the component',
          },
        },
        required: ['projectPath', 'name', 'stage', 'description'],
      },
    };
  }

  static execute(params: CreateComponentParams): CreateComponentResult {
    try {
      // Create component
      const component = createComponent(params.projectPath, {
        name: params.name,
        stage: params.stage,
        description: params.description,
        subComponents: params.subComponents,
        dependencies: params.dependencies,
        priority: params.priority,
        notes: params.notes,
      });

      // Log change
      logComponentChange(params.projectPath, {
        componentName: component.name,
        action: 'created',
        toStage: component.stage,
        description: `Created component in ${component.stage} stage`,
      });

      // Propagate if needed
      propagateComponentChange(
        params.projectPath,
        component.name,
        'created',
        undefined,
        component.stage
      );

      // Generate next actions
      const nextActions: string[] = [];

      if (component.stage === 'EXPLORING') {
        nextActions.push(
          'Add sub-components to break down this component further',
          'Move to FRAMEWORK stage when structure is clear'
        );
      } else if (component.stage === 'FRAMEWORK') {
        nextActions.push(
          'Define detailed specifications',
          'Move to FINALIZED when ready for implementation'
        );
      } else if (component.stage === 'FINALIZED') {
        nextActions.push(
          'Convert to goal for implementation tracking',
          'Create implementation plan'
        );
      }

      return {
        success: true,
        component,
        message: `Component "${component.name}" created successfully in ${component.stage} stage`,
        nextActions,
      };
    } catch (error: any) {
      return {
        success: false,
        component: {} as any,
        message: `Failed to create component: ${error.message}`,
      };
    }
  }
}
