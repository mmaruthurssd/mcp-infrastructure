/**
 * Update Goal Progress Tool
 *
 * Updates goal progress based on task completion and calculates velocity.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  calculateVelocity,
  parseProgressHistory,
  formatProgressHistory,
  addProgressUpdate,
  VelocityEstimate,
} from '../utils/velocity-calculator.js';
import { parseSpecDirectory, TaskCounts } from '../utils/tasks-parser.js';

// ============================================================================
// Types
// ============================================================================

export interface UpdateGoalProgressInput {
  projectPath: string;
  goalId: string;           // e.g., "01", "02"

  // Progress data (at least one required)
  tasksCompleted?: number;  // Optional: count of completed tasks
  totalTasks?: number;      // Optional: total task count
  progress?: number;        // Optional: direct progress % (0-100)

  // Status updates
  status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold' | 'Completed';
  blockers?: string;        // Optional: description of blockers
  nextAction?: string;      // Optional: override next action

  // Auto-calculate from spec-driven tasks.md
  specPath?: string;        // Optional: path to spec directory for auto-calculation
}

export interface UpdateGoalProgressOutput {
  success: boolean;
  goalId?: string;
  goalName?: string;

  // Updated values
  previousProgress?: number;
  newProgress?: number;
  previousStatus?: string;
  newStatus?: string;

  // Velocity calculation (if enough data)
  velocity?: VelocityEstimate;

  message: string;
  formatted?: string;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate progress from various inputs
 */
function calculateProgress(input: UpdateGoalProgressInput): number {
  // Priority 1: Direct progress value
  if (input.progress !== undefined) {
    return Math.min(100, Math.max(0, input.progress));
  }

  // Priority 2: Tasks completed/total
  if (input.tasksCompleted !== undefined && input.totalTasks !== undefined) {
    if (input.totalTasks === 0) return 0;
    return Math.round((input.tasksCompleted / input.totalTasks) * 100);
  }

  // Priority 3: Spec path (read from tasks.md)
  if (input.specPath) {
    try {
      const tasks = parseSpecDirectory(input.specPath);
      return tasks.percentage;
    } catch (error) {
      throw new Error(`Failed to parse spec tasks: ${String(error)}`);
    }
  }

  throw new Error('Must provide progress, tasksCompleted/totalTasks, or specPath');
}

/**
 * Auto-update status based on progress
 */
function autoUpdateStatus(
  currentStatus: string,
  newProgress: number,
  explicitStatus?: string
): string {
  // If explicit status provided, use it
  if (explicitStatus) {
    return explicitStatus;
  }

  // Auto-update logic
  if (newProgress >= 100) {
    return 'Completed';
  } else if (newProgress > 0 && currentStatus === 'Not Started') {
    return 'In Progress';
  }

  return currentStatus;
}

/**
 * Find and update goal in SELECTED-GOALS.md
 */
function updateGoalInFile(
  filePath: string,
  goalId: string,
  newProgress: number,
  newStatus: string,
  progressHistoryText: string,
  blockers?: string,
  nextAction?: string
): { goalName: string; previousProgress: number; previousStatus: string } {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find goal section
  const goalRegex = new RegExp(
    `(###\\s+Goal\\s+${goalId}:\\s+(.+?)\\s+\\[[^\\]]+\\][\\s\\S]+?)(?=\\n---\\n|$)`,
    ''
  );
  const match = content.match(goalRegex);

  if (!match) {
    throw new Error(`Goal ${goalId} not found in SELECTED-GOALS.md`);
  }

  const goalSection = match[1];
  const goalName = match[2];

  // Extract previous values
  const prevProgressMatch = goalSection.match(/\*\*Progress:\*\*\s*(.+)/);
  const prevStatusMatch = goalSection.match(/\*\*Status:\*\*\s*(.+)/);

  const previousProgress = prevProgressMatch
    ? parseInt(prevProgressMatch[1].match(/(\d+)%/)?.[1] || '0', 10)
    : 0;
  const previousStatus = prevStatusMatch ? prevStatusMatch[1].trim() : 'Not Started';

  // Build updated section
  let updatedSection = goalSection;

  // Update progress
  updatedSection = updatedSection.replace(
    /\*\*Progress:\*\*\s*.+/,
    `**Progress:** ${newProgress}%`
  );

  // Update status
  updatedSection = updatedSection.replace(
    /\*\*Status:\*\*\s*.+/,
    `**Status:** ${newStatus}`
  );

  // Update or add progress history
  if (progressHistoryText) {
    const hasHistory = updatedSection.includes('**Progress History:**');
    if (hasHistory) {
      updatedSection = updatedSection.replace(
        /\*\*Progress History:\*\*\s*.+/,
        `**Progress History:** ${progressHistoryText}`
      );
    } else {
      // Add after Progress line
      updatedSection = updatedSection.replace(
        /(\*\*Progress:\*\*\s*.+)/,
        `$1\n\n**Progress History:** ${progressHistoryText}`
      );
    }
  }

  // Update blockers if provided
  if (blockers !== undefined) {
    updatedSection = updatedSection.replace(
      /\*\*Blockers:\*\*\s*.+/,
      `**Blockers:** ${blockers}`
    );
  }

  // Update next action if provided
  if (nextAction !== undefined) {
    updatedSection = updatedSection.replace(
      /\*\*Next Action:\*\*\s*.+/,
      `**Next Action:** ${nextAction}`
    );
  }

  // Update Last Updated
  const today = new Date().toISOString().split('T')[0];
  updatedSection = updatedSection.replace(
    /\*\*Last Updated:\*\*\s*.+/,
    `**Last Updated:** ${today}`
  );

  // Replace in full content
  const updatedContent = content.replace(goalSection, updatedSection);

  // Write back
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  return { goalName, previousProgress, previousStatus };
}

/**
 * Format output message
 */
function formatOutput(
  goalId: string,
  goalName: string,
  previousProgress: number,
  newProgress: number,
  previousStatus: string,
  newStatus: string,
  velocity?: VelocityEstimate
): string {
  let output = '═══════════════════════════════════════════════════════\n';
  output += '  GOAL PROGRESS UPDATED\n';
  output += '═══════════════════════════════════════════════════════\n\n';

  output += `📊 Goal ${goalId}: ${goalName}\n\n`;

  // Progress change
  const progressChange = newProgress - previousProgress;
  const progressChangeSign = progressChange > 0 ? '+' : '';
  output += `Progress: ${previousProgress}% → ${newProgress}% (${progressChangeSign}${progressChange}%)\n`;

  // Progress bar
  const filled = Math.floor(newProgress / 10);
  const empty = 10 - filled;
  output += `[${' █'.repeat(filled)}${'░'.repeat(empty)}] ${newProgress}%\n\n`;

  // Status change
  if (previousStatus !== newStatus) {
    output += `Status: ${previousStatus} → ${newStatus}\n\n`;
  } else {
    output += `Status: ${newStatus}\n\n`;
  }

  // Velocity estimate
  if (velocity) {
    output += `📈 VELOCITY ESTIMATE (${velocity.confidence} confidence)\n`;
    output += `   ${velocity.reasoning}\n`;
    output += `   Estimated completion: ${velocity.estimatedCompletion}\n\n`;
  }

  output += '✅ Changes saved to SELECTED-GOALS.md\n';
  output += '═══════════════════════════════════════════════════════\n';

  return output;
}

// ============================================================================
// Main Tool Logic
// ============================================================================

export class UpdateGoalProgressTool {
  /**
   * Execute the update_goal_progress tool
   */
  static execute(input: UpdateGoalProgressInput): UpdateGoalProgressOutput {
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
          error: 'SELECTED-GOALS.md not found. No selected goals to update.',
        };
      }

      // Step 2: Calculate new progress
      const newProgress = calculateProgress(input);

      // Step 3: Read current goal to get progress history
      const content = fs.readFileSync(selectedGoalsPath, 'utf-8');
      const goalRegex = new RegExp(
        `###\\s+Goal\\s+${input.goalId}:[\\s\\S]+?(?=\\n---\\n|$)`,
        ''
      );
      const goalMatch = content.match(goalRegex);

      if (!goalMatch) {
        return {
          success: false,
          message: 'Error',
          error: `Goal ${input.goalId} not found in SELECTED-GOALS.md`,
        };
      }

      const goalSection = goalMatch[0];
      const progressHistory = parseProgressHistory(goalSection);

      // Step 4: Add new progress update to history
      const today = new Date().toISOString().split('T')[0];
      const updatedHistory = addProgressUpdate(progressHistory, today, newProgress);
      const progressHistoryText = formatProgressHistory(updatedHistory);

      // Step 5: Calculate velocity
      const velocity = calculateVelocity(updatedHistory, newProgress);

      // Step 6: Determine new status
      const currentStatusMatch = goalSection.match(/\*\*Status:\*\*\s*(.+)/);
      const currentStatus = currentStatusMatch ? currentStatusMatch[1].trim() : 'Not Started';
      const newStatus = autoUpdateStatus(currentStatus, newProgress, input.status);

      // Step 7: Update goal in file
      const { goalName, previousProgress, previousStatus } = updateGoalInFile(
        selectedGoalsPath,
        input.goalId,
        newProgress,
        newStatus,
        progressHistoryText,
        input.blockers,
        input.nextAction
      );

      // Step 8: Return result
      return {
        success: true,
        goalId: input.goalId,
        goalName,
        previousProgress,
        newProgress,
        previousStatus,
        newStatus,
        velocity,
        message: `Successfully updated progress: ${previousProgress}% → ${newProgress}%`,
        formatted: formatOutput(
          input.goalId,
          goalName,
          previousProgress,
          newProgress,
          previousStatus,
          newStatus,
          velocity
        ),
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
  static formatResult(result: UpdateGoalProgressOutput): string {
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
      name: 'update_goal_progress',
      description: 'Update goal progress based on task completion and calculate velocity estimates for completion date. Tracks progress history and auto-updates status.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Absolute path to the project directory',
          },
          goalId: {
            type: 'string',
            description: 'Goal ID to update (e.g., "01", "02")',
          },
          tasksCompleted: {
            type: 'number',
            description: 'Optional: Number of completed tasks',
          },
          totalTasks: {
            type: 'number',
            description: 'Optional: Total number of tasks',
          },
          progress: {
            type: 'number',
            description: 'Optional: Direct progress percentage (0-100)',
            minimum: 0,
            maximum: 100,
          },
          status: {
            type: 'string',
            enum: ['Planning', 'Not Started', 'In Progress', 'Blocked', 'On Hold', 'Completed'],
            description: 'Optional: Explicitly set status (otherwise auto-updates based on progress)',
          },
          blockers: {
            type: 'string',
            description: 'Optional: Description of blockers',
          },
          nextAction: {
            type: 'string',
            description: 'Optional: Override next action text',
          },
          specPath: {
            type: 'string',
            description: 'Optional: Path to spec directory containing tasks.md for auto-calculation',
          },
        },
        required: ['projectPath', 'goalId'],
      },
    };
  }
}
