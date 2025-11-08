/**
 * Split Component Tool
 *
 * Splits one component into multiple smaller components
 */

import {
  getComponent,
  createComponent,
  moveComponent,
  logComponentChange,
} from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
import {
  SplitComponentParams,
  SplitComponentResult,
} from '../lib/component-types.js';

export class SplitComponentTool {
  static getToolDefinition() {
    return {
      name: 'split_component',
      description: 'Split one component into multiple smaller components with automatic propagation',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          componentName: {
            type: 'string',
            description: 'Component name to split',
          },
          newComponents: {
            type: 'array',
            description: 'New components to create from the split',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'New component name',
                },
                description: {
                  type: 'string',
                  description: 'New component description',
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
              },
              required: ['name', 'description'],
            },
            minItems: 2,
          },
          keepOriginal: {
            type: 'boolean',
            description: 'Keep original component (default: false, archives it)',
          },
          targetStage: {
            type: 'string',
            enum: ['EXPLORING', 'FRAMEWORK', 'FINALIZED'],
            description: 'Stage for new components (default: EXPLORING)',
          },
        },
        required: ['projectPath', 'componentName', 'newComponents'],
      },
    };
  }

  static execute(params: SplitComponentParams): SplitComponentResult {
    try {
      // Get original component
      const originalComponent = getComponent(params.projectPath, params.componentName);
      if (!originalComponent) {
        throw new Error(`Component "${params.componentName}" not found`);
      }

      const originalStage = originalComponent.stage;
      const targetStage = params.targetStage || 'EXPLORING';
      const newComponents: any[] = [];

      // Create new components
      for (const newComp of params.newComponents) {
        const created = createComponent(params.projectPath, {
          name: newComp.name,
          stage: targetStage,
          description: newComp.description,
          subComponents: newComp.subComponents || [],
          priority: originalComponent.priority,
          notes: `Split from component: ${params.componentName}`,
        });

        newComponents.push(created);
      }

      // Archive original component unless keepOriginal is true
      let archivedOriginal: any = undefined;
      if (!params.keepOriginal) {
        const moveResult = moveComponent(
          params.projectPath,
          params.componentName,
          'ARCHIVED'
        );
        archivedOriginal = moveResult.component;
      }

      // Log change
      logComponentChange(params.projectPath, {
        componentName: params.componentName,
        action: 'split',
        fromStage: originalStage,
        toStage: params.keepOriginal ? originalStage : 'ARCHIVED',
        description: `Split into ${newComponents.length} components: ${newComponents.map(c => c.name).join(', ')}`,
      });

      // Propagate changes
      propagateComponentChange(
        params.projectPath,
        params.componentName,
        'split',
        originalStage,
        params.keepOriginal ? originalStage : 'ARCHIVED'
      );

      return {
        success: true,
        originalComponent: params.keepOriginal ? originalComponent : archivedOriginal,
        newComponents,
        message: `Component "${params.componentName}" split into ${newComponents.length} components`,
        propagated: true,
      };
    } catch (error: any) {
      throw error;
    }
  }
}
