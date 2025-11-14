/**
 * Tool: get_checklist_status
 * Get current completion status of checklist(s)
 */

import { RegistryManager } from '../core/registry.js';
import { ChecklistParser } from '../core/parser.js';
import type {
  GetChecklistStatusParams,
  GetChecklistStatusResponse,
} from '../types/index.js';

export async function getChecklistStatus(
  params: GetChecklistStatusParams
): Promise<GetChecklistStatusResponse> {
  try {
    const registry = new RegistryManager();
    const parser = new ChecklistParser();
    let checklists;

    // Query registry based on parameters
    if (params.checklist_id) {
      const checklist = registry.getById(params.checklist_id);
      checklists = checklist ? [checklist] : [];
    } else if (params.checklist_path) {
      const checklist = registry.getByPath(params.checklist_path);
      checklists = checklist ? [checklist] : [];
    } else {
      // Get all checklists (with optional filters)
      checklists = registry.getAll({
        type: params.checklist_type,
        status: params.status_filter,
      });
    }

    // Get real-time status from files
    const checklistsWithStatus = checklists.map((checklist) => {
      try {
        const { items } = parser.parse(checklist.path);
        const completedCount = items.filter((item) => item.completed).length;
        const pending = parser.getPendingItems(items);

        return {
          id: checklist.id,
          path: checklist.path,
          type: checklist.type,
          status: checklist.status,
          metadata: checklist.metadata,
          items: {
            total: items.length,
            completed: completedCount,
            percentage: Math.round((completedCount / items.length) * 100),
            pending,
          },
          created: checklist.created,
          lastUpdated: checklist.lastUpdated,
        };
      } catch (error) {
        // If file is missing or invalid, return registry data
        return {
          id: checklist.id,
          path: checklist.path,
          type: checklist.type,
          status: checklist.status,
          metadata: checklist.metadata,
          items: {
            total: checklist.items.total,
            completed: checklist.items.completed,
            percentage: checklist.items.percentage,
            pending: [],
          },
          created: checklist.created,
          lastUpdated: checklist.lastUpdated,
        };
      }
    });

    return {
      success: true,
      checklists: checklistsWithStatus,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      checklists: [],
    };
  }
}
