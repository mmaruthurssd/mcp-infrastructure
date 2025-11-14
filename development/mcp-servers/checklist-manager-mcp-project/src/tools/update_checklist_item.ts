/**
 * Tool: update_checklist_item
 * KILLER FEATURE: Auto-complete checklist items via fuzzy matching
 * Enables MCP integrations to automatically check off items as tasks complete
 */

import { ChecklistParser } from '../core/parser.js';
import { RegistryManager } from '../core/registry.js';
import type {
  UpdateChecklistItemParams,
  UpdateChecklistItemResponse,
} from '../types/index.js';

export async function updateChecklistItem(
  params: UpdateChecklistItemParams
): Promise<UpdateChecklistItemResponse> {
  try {
    const registry = new RegistryManager();
    const parser = new ChecklistParser();

    // Resolve checklist path from ID or path parameter
    let checklistPath: string;
    let checklistId: string;

    if (params.checklist_id) {
      const checklist = registry.getById(params.checklist_id);
      if (!checklist) {
        return {
          success: false,
          message: `Checklist not found: ${params.checklist_id}`,
          updated: false,
        };
      }
      checklistPath = checklist.path;
      checklistId = checklist.id;
    } else if (params.checklist_path) {
      const checklist = registry.getByPath(params.checklist_path);
      if (!checklist) {
        return {
          success: false,
          message: `Checklist not registered: ${params.checklist_path}`,
          updated: false,
        };
      }
      checklistPath = params.checklist_path;
      checklistId = checklist.id;
    } else {
      return {
        success: false,
        message: 'Either checklist_id or checklist_path is required',
        updated: false,
      };
    }

    // Update the checkbox using fuzzy matching
    const result = parser.updateCheckbox(
      checklistPath,
      params.item_text,
      params.completed
    );

    if (!result.updated) {
      return {
        success: false,
        message: `Item not found: "${params.item_text}"`,
        updated: false,
        fuzzy_match_attempted: true,
      };
    }

    // Update registry with new stats
    const checklist = registry.getById(checklistId);
    if (checklist) {
      const updatedChecklist = {
        ...checklist,
        items: result.newStats,
        status:
          result.newStats.completed === 0
            ? ('not-started' as const)
            : result.newStats.percentage === 100
              ? ('completed' as const)
              : ('in-progress' as const),
        lastUpdated: new Date().toISOString(),
      };

      registry.update(checklistId, updatedChecklist);
    }

    return {
      success: true,
      message: `Item ${params.completed ? 'completed' : 'unchecked'}: "${result.matchedText}"`,
      updated: true,
      matched_text: result.matchedText,
      new_completion: {
        total: result.newStats.total,
        completed: result.newStats.completed,
        percentage: result.newStats.percentage,
      },
      checklist_status:
        result.newStats.percentage === 100 ? 'completed' : 'in-progress',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to update checklist item: ${errorMessage}`,
      updated: false,
    };
  }
}
