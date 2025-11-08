/**
 * Tasks Parser Utility
 *
 * Parses tasks.md files from spec-driven MCP to count completed/total tasks.
 */

import * as fs from 'fs';

// ============================================================================
// Types
// ============================================================================

export interface TaskCounts {
  completed: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse tasks.md file and count checkboxes
 */
export function parseTasksFile(tasksFilePath: string): TaskCounts {
  if (!fs.existsSync(tasksFilePath)) {
    throw new Error(`Tasks file not found: ${tasksFilePath}`);
  }

  const content = fs.readFileSync(tasksFilePath, 'utf-8');
  return parseTasksContent(content);
}

/**
 * Parse tasks content and count checkboxes
 */
export function parseTasksContent(content: string): TaskCounts {
  // Match checkbox patterns:
  // - [x] Completed task
  // - [ ] Incomplete task
  // - [X] Also completed (uppercase)

  const completedMatches = content.match(/- \[x\]/gi) || [];
  const incompleteMatches = content.match(/- \[ \]/g) || [];

  const completed = completedMatches.length;
  const total = completed + incompleteMatches.length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percentage,
  };
}

/**
 * Parse spec directory to find tasks.md and calculate progress
 */
export function parseSpecDirectory(specPath: string): TaskCounts {
  const tasksPath = specPath.endsWith('tasks.md')
    ? specPath
    : `${specPath}/tasks.md`;

  return parseTasksFile(tasksPath);
}
