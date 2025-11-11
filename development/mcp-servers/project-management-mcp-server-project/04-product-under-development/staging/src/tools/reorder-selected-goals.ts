/**
 * Reorder Selected Goals Tool
 *
 * Changes the priority order of selected goals in SELECTED-GOALS.md
 * and optionally updates priority levels based on position.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ReorderSelectedGoalsInput {
  projectPath: string;

  // Array of goal IDs in desired order
  goalOrder: string[];      // e.g., ["03", "01", "02"]

  // Optional: also update priorities based on position
  updatePriorities?: boolean;  // Default: false
}

export interface ReorderSelectedGoalsOutput {
  success: boolean;
  reordered?: number;        // Count of goals reordered
  beforeOrder?: string[];    // Original order
  afterOrder?: string[];     // New order
  prioritiesUpdated?: boolean;
  message: string;
  formatted?: string;
  error?: string;
}

interface GoalEntry {
  id: string;
  fullText: string;
  originalIndex: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse SELECTED-GOALS.md to extract all goal entries
 */
function parseSelectedGoals(content: string): Map<string, GoalEntry> {
  const goalMap = new Map<string, GoalEntry>();

  // Find all goal entries in Active Goals section
  // Match: ### Goal 01: Name [Tier]
  // Lookahead ensures we stop at next ## section (not ###)
  const activeSection = content.match(/##\s+Active Goals[\s\S]+?(?=\n##\s+[^#]|$)/);

  if (!activeSection) {
    return goalMap;
  }

  const activeSectionText = activeSection[0];

  // Find all goal entries (### Goal XX: ... up to next ---)
  const goalRegex = /###\s+(?:✅\s+)?(?:❌\s+)?Goal\s+(\d+):[^\n]+[\s\S]+?(?=\n---\n|$)/g;

  let match;
  let index = 0;

  while ((match = goalRegex.exec(activeSectionText)) !== null) {
    const goalId = match[1];
    const fullText = match[0].trim();

    goalMap.set(goalId, {
      id: goalId,
      fullText,
      originalIndex: index++,
    });
  }

  return goalMap;
}

/**
 * Validate that all goal IDs in goalOrder exist
 */
function validateGoalOrder(goalOrder: string[], existingIds: string[]): { valid: boolean; error?: string } {
  if (goalOrder.length === 0) {
    return { valid: false, error: 'goalOrder cannot be empty' };
  }

  // Check for duplicates
  const seen = new Set<string>();
  for (const id of goalOrder) {
    if (seen.has(id)) {
      return { valid: false, error: `Duplicate goal ID in goalOrder: ${id}` };
    }
    seen.add(id);
  }

  // Check that all IDs exist
  for (const id of goalOrder) {
    if (!existingIds.includes(id)) {
      return { valid: false, error: `Goal ID ${id} not found in SELECTED-GOALS.md. Available IDs: ${existingIds.join(', ')}` };
    }
  }

  // Check that all existing goals are included
  if (goalOrder.length !== existingIds.length) {
    const missing = existingIds.filter(id => !goalOrder.includes(id));
    return { valid: false, error: `Not all goals included in goalOrder. Missing: ${missing.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Update priority in goal entry text based on position
 */
function updatePriorityInEntry(entryText: string, newPriority: string): string {
  return entryText.replace(
    /\*\*Priority:\*\*\s+\w+/,
    `**Priority:** ${newPriority}`
  );
}

/**
 * Determine priority based on position in list
 */
function calculatePriorityFromPosition(index: number, total: number): 'High' | 'Medium' | 'Low' {
  const position = index / total;

  if (position < 0.33) {
    return 'High';
  } else if (position < 0.67) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Rewrite Active Goals section with new order
 */
function rewriteActiveGoalsSection(
  content: string,
  goalMap: Map<string, GoalEntry>,
  newOrder: string[],
  updatePriorities: boolean
): string {
  // Find Active Goals section
  const activeSectionMatch = content.match(/(##\s+Active Goals[\s\S]+?)(?=\n##|$)/);

  if (!activeSectionMatch) {
    throw new Error('Could not find Active Goals section in SELECTED-GOALS.md');
  }

  const beforeActiveSection = content.substring(0, activeSectionMatch.index!);
  const afterActiveSection = content.substring(activeSectionMatch.index! + activeSectionMatch[0].length);

  // Build new Active Goals section
  let newActiveSection = '## Active Goals\n\n';

  newOrder.forEach((goalId, index) => {
    const entry = goalMap.get(goalId);
    if (!entry) {
      throw new Error(`Goal ${goalId} not found in parsed goals`);
    }

    let entryText = entry.fullText;

    // Update priority if requested
    if (updatePriorities) {
      const newPriority = calculatePriorityFromPosition(index, newOrder.length);
      entryText = updatePriorityInEntry(entryText, newPriority);
    }

    newActiveSection += entryText + '\n\n---\n\n';
  });

  return beforeActiveSection + newActiveSection + afterActiveSection;
}

/**
 * Update "Last Updated" timestamp at top of file
 */
function updateLastUpdatedTimestamp(content: string): string {
  const today = new Date().toISOString().split('T')[0];
  return content.replace(
    /\*\*Last Updated:\*\*\s+.+/,
    `**Last Updated:** ${today}`
  );
}

/**
 * Update statistics section to reflect new priority counts
 */
function updateStatistics(content: string): string {
  // Count by priority
  const highCount = (content.match(/\*\*Priority:\*\* High/g) || []).length;
  const mediumCount = (content.match(/\*\*Priority:\*\* Medium/g) || []).length;
  const lowCount = (content.match(/\*\*Priority:\*\* Low/g) || []).length;

  content = content.replace(
    /\*\*By Priority:\*\*[\s\S]+?- Low: \d+/,
    `**By Priority:**\n- High: ${highCount}\n- Medium: ${mediumCount}\n- Low: ${lowCount}`
  );

  return content;
}

/**
 * Format output message
 */
function formatOutput(
  beforeOrder: string[],
  afterOrder: string[],
  prioritiesUpdated: boolean
): string {
  let output = '═══════════════════════════════════════════════════════\n';
  output += '  GOALS REORDERED\n';
  output += '═══════════════════════════════════════════════════════\n\n';

  output += '📋 ORDER CHANGES\n\n';
  output += 'Before:\n';
  beforeOrder.forEach((id, idx) => {
    output += `  ${idx + 1}. Goal ${id}\n`;
  });

  output += '\nAfter:\n';
  afterOrder.forEach((id, idx) => {
    output += `  ${idx + 1}. Goal ${id}\n`;
  });

  if (prioritiesUpdated) {
    output += '\n✨ PRIORITIES UPDATED\n';
    output += 'Priorities automatically updated based on position:\n';
    output += '  • Top 33% → High priority\n';
    output += '  • Middle 33% → Medium priority\n';
    output += '  • Bottom 33% → Low priority\n';
  }

  output += '\n✅ Changes saved to SELECTED-GOALS.md\n';
  output += '═══════════════════════════════════════════════════════\n';

  return output;
}

// ============================================================================
// Main Tool Logic
// ============================================================================

export class ReorderSelectedGoalsTool {
  /**
   * Execute the reorder_selected_goals tool
   */
  static execute(input: ReorderSelectedGoalsInput): ReorderSelectedGoalsOutput {
    try {
      // Step 1: Validate input
      if (!fs.existsSync(input.projectPath)) {
        return {
          success: false,
          message: 'Error',
          error: `Project path does not exist: ${input.projectPath}`,
        };
      }

      const selectedGoalsPath = path.join(
        input.projectPath,
        'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md'
      );

      if (!fs.existsSync(selectedGoalsPath)) {
        return {
          success: false,
          message: 'Error',
          error: 'SELECTED-GOALS.md not found. No selected goals to reorder.',
        };
      }

      // Step 2: Read and parse file
      const content = fs.readFileSync(selectedGoalsPath, 'utf-8');
      const goalMap = parseSelectedGoals(content);

      if (goalMap.size === 0) {
        return {
          success: false,
          message: 'Error',
          error: 'No active goals found in SELECTED-GOALS.md',
        };
      }

      // Step 3: Validate goal order
      const existingIds = Array.from(goalMap.keys());
      const validation = validateGoalOrder(input.goalOrder, existingIds);

      if (!validation.valid) {
        return {
          success: false,
          message: 'Error',
          error: validation.error,
        };
      }

      // Step 4: Get original order
      const beforeOrder = Array.from(goalMap.entries())
        .sort((a, b) => a[1].originalIndex - b[1].originalIndex)
        .map(([id]) => id);

      // Step 5: Rewrite Active Goals section
      let updatedContent = rewriteActiveGoalsSection(
        content,
        goalMap,
        input.goalOrder,
        input.updatePriorities || false
      );

      // Step 6: Update timestamp
      updatedContent = updateLastUpdatedTimestamp(updatedContent);

      // Step 7: Update statistics if priorities changed
      if (input.updatePriorities) {
        updatedContent = updateStatistics(updatedContent);
      }

      // Step 8: Write back to file
      fs.writeFileSync(selectedGoalsPath, updatedContent, 'utf-8');

      // Step 9: Return result
      return {
        success: true,
        reordered: goalMap.size,
        beforeOrder,
        afterOrder: input.goalOrder,
        prioritiesUpdated: input.updatePriorities || false,
        message: input.updatePriorities
          ? `Successfully reordered ${goalMap.size} goals and updated priorities`
          : `Successfully reordered ${goalMap.size} goals`,
        formatted: formatOutput(beforeOrder, input.goalOrder, input.updatePriorities || false),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error',
        error: String(error),
      };
    }
  }

  /**
   * Format the result for display
   */
  static formatResult(result: ReorderSelectedGoalsOutput): string {
    if (!result.success) {
      return `❌ Error: ${result.error}`;
    }

    return result.formatted || result.message;
  }

  /**
   * Get MCP tool definition
   */
  static getToolDefinition() {
    return {
      name: 'reorder_selected_goals',
      description: 'Change the priority order of selected goals in SELECTED-GOALS.md. Optionally update priority levels (High/Medium/Low) based on position in the new order.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          goalOrder: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of goal IDs in desired order (e.g., ["03", "01", "02"]). Must include all active goals.',
          },
          updatePriorities: {
            type: 'boolean',
            description: 'Optional: If true, automatically update priority levels based on position (top 33% = High, middle = Medium, bottom = Low). Default: false',
          },
        },
        required: ['projectPath', 'goalOrder'],
      },
    };
  }
}
