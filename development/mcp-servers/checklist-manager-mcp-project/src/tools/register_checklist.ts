/**
 * Tool: register_checklist
 * Register a checklist in the central registry
 */

import { RegistryManager } from '../core/registry.js';
import { ChecklistParser } from '../core/parser.js';
import type {
  RegisterChecklistParams,
  RegisterChecklistResponse,
} from '../types/index.js';

export async function registerChecklist(
  params: RegisterChecklistParams
): Promise<RegisterChecklistResponse> {
  try {
    // Validate parameters
    if (!params.checklist_path) {
      throw new Error('checklist_path is required');
    }

    // Parse checklist file
    const parser = new ChecklistParser();
    const { frontmatter, items } = parser.parse(params.checklist_path);

    // Create registry entry
    const registry = new RegistryManager();
    const completedCount = items.filter((item) => item.completed).length;

    const checklist = registry.add({
      path: params.checklist_path,
      type: params.checklist_type || frontmatter['checklist-type'],
      status: frontmatter.status,
      metadata: {
        name: frontmatter['checklist-type'], // Or parse from file
        owner: params.owner || frontmatter.owner || 'unassigned',
        enforcement:
          params.enforcement || frontmatter.enforcement || 'optional',
      },
      items: {
        total: items.length,
        completed: completedCount,
        percentage: Math.round((completedCount / items.length) * 100),
      },
      lastUpdated: new Date().toISOString(),
      autoUpdateEnabled:
        params.auto_update ?? frontmatter['auto-update'] ?? true,
    });

    return {
      success: true,
      checklist_id: checklist.id,
      message: `Checklist registered successfully: ${checklist.id}`,
      registry_entry: checklist,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      checklist_id: '',
      message: `Failed to register checklist: ${errorMessage}`,
      registry_entry: null as never,
    };
  }
}
