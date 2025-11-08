/**
 * Move Component Tool
 *
 * Moves component between stages (EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED)
 */

import {
  moveComponent,
  getComponent,
  logComponentChange,
} from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
import {
  MoveComponentParams,
  MoveComponentResult,
  ComponentStage,
} from '../lib/component-types.js';

export class MoveComponentTool {
  static getToolDefinition() {
    return {
      name: 'move_component',
      description: 'Move component to a different stage with automatic propagation and validation',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          componentName: {
            type: 'string',
            description: 'Component name to move',
          },
          toStage: {
            type: 'string',
            enum: ['EXPLORING', 'FRAMEWORK', 'FINALIZED', 'ARCHIVED'],
            description: 'Target stage to move to',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the stage transition',
          },
        },
        required: ['projectPath', 'componentName', 'toStage'],
      },
    };
  }

  static execute(params: MoveComponentParams): MoveComponentResult {
    try {
      // Get current component state
      const currentComponent = getComponent(params.projectPath, params.componentName);
      if (!currentComponent) {
        throw new Error(`Component "${params.componentName}" not found`);
      }

      const fromStage = currentComponent.stage;

      // Validate stage transition
      validateStageTransition(fromStage, params.toStage);

      // Move component
      const moveResult = moveComponent(
        params.projectPath,
        params.componentName,
        params.toStage
      );

      // Log change
      const notes = params.notes || `Moved from ${fromStage} to ${params.toStage}`;
      logComponentChange(params.projectPath, {
        componentName: moveResult.component.name,
        action: 'moved',
        fromStage,
        toStage: params.toStage,
        description: notes,
      });

      // Propagate changes
      propagateComponentChange(
        params.projectPath,
        moveResult.component.name,
        'moved',
        fromStage,
        params.toStage
      );

      // Generate next actions based on new stage
      const nextActions = getNextActionsForStage(params.toStage, moveResult.component.name);

      return {
        success: true,
        component: moveResult.component,
        fromStage,
        toStage: params.toStage,
        propagated: true,
        message: `Component "${moveResult.component.name}" moved from ${fromStage} to ${params.toStage}`,
        nextActions,
      };
    } catch (error: any) {
      throw error;
    }
  }
}

function validateStageTransition(from: ComponentStage, to: ComponentStage): void {
  // Valid transitions:
  // EXPLORING → FRAMEWORK, FINALIZED, ARCHIVED
  // FRAMEWORK → FINALIZED, EXPLORING (demotion), ARCHIVED
  // FINALIZED → FRAMEWORK (demotion), ARCHIVED
  // ARCHIVED → any (resurrection)

  const validTransitions: Record<ComponentStage, ComponentStage[]> = {
    EXPLORING: ['FRAMEWORK', 'FINALIZED', 'ARCHIVED'],
    FRAMEWORK: ['FINALIZED', 'EXPLORING', 'ARCHIVED'],
    FINALIZED: ['FRAMEWORK', 'ARCHIVED'],
    ARCHIVED: ['EXPLORING', 'FRAMEWORK', 'FINALIZED'],
  };

  if (!validTransitions[from].includes(to)) {
    throw new Error(
      `Invalid stage transition: ${from} → ${to}. Valid transitions from ${from}: ${validTransitions[from].join(', ')}`
    );
  }
}

function getNextActionsForStage(stage: ComponentStage, componentName: string): string[] {
  switch (stage) {
    case 'EXPLORING':
      return [
        'Ask clarifying questions to better understand the component',
        'Identify potential sub-components',
        'Move to FRAMEWORK stage when structure becomes clear',
      ];
    case 'FRAMEWORK':
      return [
        'Define sub-components with detailed descriptions',
        'Map dependencies with other components',
        'Establish success criteria',
        'Move to FINALIZED when all details are clear',
      ];
    case 'FINALIZED':
      return [
        'README.md has been updated with this component',
        'EVENT_LOG.md has been updated',
        'Convert to goal for implementation tracking',
        'Create implementation plan',
      ];
    case 'ARCHIVED':
      return [
        'README.md has been updated (component removed)',
        'EVENT_LOG.md has been updated',
        'Component is archived and no longer active',
        'Related goals have been moved to archive',
      ];
    default:
      return [];
  }
}
