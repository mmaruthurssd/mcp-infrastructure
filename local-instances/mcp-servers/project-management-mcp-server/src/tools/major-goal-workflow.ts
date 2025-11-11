/**
 * MCP Tool: Major Goal Workflow
 *
 * Tools for creating, managing, and handing off major goals in hierarchical planning v1.0.0
 * Integrates with Spec-Driven MCP for sub-goal decomposition
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import type { MajorGoal, MCPHandoffContext, SubGoal, Priority } from '../types/hierarchical-entities.js';
import { validateMajorGoal } from '../validation/validators.js';
import { calculateMajorGoalProgress } from '../utils/hierarchical-utils.js';

/**
 * MCP Tool: Create Major Goal
 *
 * Create a new major goal in a component or sub-area
 */
export async function createMajorGoal(args: {
  projectPath: string;
  componentId: string;
  subAreaId?: string;
  goalName: string;
  description: string;
  purpose: string;
  successCriteria?: string[];
  estimatedEffort?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  owner?: string;
  targetDate?: string;
}): Promise<{
  success: boolean;
  goalId?: string;
  filePath?: string;
  handoffReady?: boolean;
  handoffContext?: MCPHandoffContext;
  error?: string;
}> {
  const {
    projectPath,
    componentId,
    subAreaId,
    goalName,
    description,
    purpose,
    successCriteria = [],
    estimatedEffort,
    priority = 'Medium',
    owner = 'Unassigned',
    targetDate,
  } = args;

  try {
    // Validate component exists
    const componentPath = path.join(
      projectPath,
      '02-goals-and-roadmap',
      'components',
      componentId
    );

    if (!fs.existsSync(componentPath)) {
      return {
        success: false,
        error: `Component "${componentId}" does not exist`,
      };
    }

    // Determine goal directory (component or sub-area)
    let goalDir: string;
    if (subAreaId) {
      goalDir = path.join(componentPath, 'sub-areas', subAreaId, 'major-goals');
      if (!fs.existsSync(path.join(componentPath, 'sub-areas', subAreaId))) {
        return {
          success: false,
          error: `Sub-area "${subAreaId}" does not exist in component "${componentId}"`,
        };
      }
    } else {
      goalDir = path.join(componentPath, 'major-goals');
    }

    // Generate goal ID
    const existingGoals = fs.readdirSync(goalDir).filter(f => f.match(/^\d{3}-/));
    const nextNumber = existingGoals.length + 1;
    const goalId = String(nextNumber).padStart(3, '0');
    const goalSlug = goalName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const goalFileName = `${goalId}-${goalSlug}.md`;
    const goalFilePath = path.join(goalDir, goalFileName);

    // Create goal folder
    const goalFolderName = `${goalId}-${goalSlug}`;
    const goalFolderPath = path.join(goalDir, goalFolderName);
    fs.mkdirSync(goalFolderPath, { recursive: true });

    // Create GOAL-STATUS.md in goal folder
    const timestamp = new Date().toISOString();
    const statusContent = generateGoalStatusMarkdown({
      goalId,
      goalName,
      description,
      purpose,
      componentId,
      subAreaId,
      successCriteria,
      estimatedEffort,
      priority,
      owner,
      targetDate,
      timestamp,
    });

    const statusFilePath = path.join(goalFolderPath, 'GOAL-STATUS.md');
    fs.writeFileSync(statusFilePath, statusContent, 'utf-8');

    // Create major goal entity
    const projectId = path.basename(projectPath);
    const majorGoal: MajorGoal = {
      id: goalId,
      name: goalName,
      description,
      problem: purpose, // Map purpose to problem field
      expectedValue: purpose, // Map purpose to expectedValue field
      projectId,
      componentId,
      subAreaId,
      priority: priority.toLowerCase() as Priority,
      tier: 'now', // Default tier
      impact: 'medium', // Default impact
      effort: 'medium', // Default effort
      successCriteria,
      dependencies: [],
      risks: [],
      alternatives: [],
      subGoals: [],
      progress: {
        percentage: 0,
        status: 'not-started',
        lastUpdated: timestamp,
        completedItems: 0,
        totalItems: 0,
        breakdown: {},
      },
      timeEstimate: estimatedEffort || 'TBD',
      targetDate,
      createdAt: timestamp,
      lastUpdated: timestamp,
      status: 'planning',
      owner,
      folderPath: goalFolderPath,
      goalFilePath: goalFilePath,
      statusFilePath: statusFilePath,
    };

    // Validate major goal
    const validationResult = validateMajorGoal(majorGoal);
    if (!validationResult.valid) {
      // Rollback
      fs.rmSync(goalFolderPath, { recursive: true, force: true });
      return {
        success: false,
        error: `Validation failed: ${validationResult.errors.join(', ')}`,
      };
    }

    // Prepare handoff context for Spec-Driven MCP
    const handoffContext: MCPHandoffContext = {
      projectPath,
      componentId,
      majorGoalId: goalId,
    };

    return {
      success: true,
      goalId,
      filePath: statusFilePath,
      handoffReady: true,
      handoffContext,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate GOAL-STATUS markdown content
 */
function generateGoalStatusMarkdown(data: {
  goalId: string;
  goalName: string;
  description: string;
  purpose: string;
  componentId: string;
  subAreaId?: string;
  successCriteria: string[];
  estimatedEffort?: string;
  priority: string;
  owner: string;
  targetDate?: string;
  timestamp: string;
}): string {
  const date = data.timestamp.split('T')[0];

  return `---
type: major-goal
tags: [major-goal, hierarchical-planning, v1.0.0]
---

# Major Goal ${data.goalId}: ${data.goalName}

**Goal ID:** ${data.goalId}
**Component:** ${data.componentId}
${data.subAreaId ? `**Sub-Area:** ${data.subAreaId}` : ''}
**Status:** Planning
**Progress:** 0%
**Priority:** ${data.priority}
**Owner:** ${data.owner}
**Created:** ${date}
**Target Date:** ${data.targetDate || 'TBD'}
**Last Updated:** ${date}

---

## Overview

**Purpose:** ${data.purpose}

**Description:** ${data.description}

**Estimated Effort:** ${data.estimatedEffort || 'TBD'}

---

## Success Criteria

${data.successCriteria.length > 0
  ? data.successCriteria.map(c => `- [ ] ${c}`).join('\n')
  : '*Success criteria will be defined during specification phase.*'}

---

## Sub-Goals

*Sub-goals will be created through Spec-Driven MCP decomposition workflow.*

**Next Step:** Use \`handoff_to_spec_driven\` MCP tool to begin decomposition.

---

## Progress Tracking

**Current Progress:** 0%
**Status:** Not Started
**Sub-Goals:** 0 total, 0 complete

---

## Dependencies

*Dependencies will be identified during decomposition.*

---

## Risks

*Risks will be identified and tracked at sub-goal level.*

---

## Notes

This major goal was created on ${date} using the Project Management MCP major goal workflow.

**Workflow Paths:**
1. **Fast-track:** Created directly from clear requirement
2. **Brainstorming:** Promoted from brainstorming discussion

**Next Actions:**
1. Review goal details
2. Hand off to Spec-Driven MCP for decomposition
3. Approve specification and sub-goals
4. Track progress as sub-goals complete

---

**Generated:** ${data.timestamp}
**Tool:** Project Management MCP v1.0.0
**Method:** Major goal workflow
`;
}

/**
 * MCP Tool: Promote to Major Goal
 *
 * Promote a brainstorming idea or potential goal to a major goal
 */
export async function promoteToMajorGoal(args: {
  projectPath: string;
  componentId: string;
  subAreaId?: string;
  sourceType: 'brainstorming' | 'potential-goal' | 'direct';
  sourcePath?: string; // Path to potential goal file or brainstorming file
  goalName: string;
  description: string;
  purpose: string;
  successCriteria?: string[];
  estimatedEffort?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  owner?: string;
  targetDate?: string;
  additionalNotes?: string;
}): Promise<{
  success: boolean;
  goalId?: string;
  filePath?: string;
  handoffReady?: boolean;
  handoffContext?: MCPHandoffContext;
  sourceMarked?: boolean; // Whether source was marked as promoted
  error?: string;
}> {
  const {
    projectPath,
    componentId,
    subAreaId,
    sourceType,
    sourcePath,
    goalName,
    description,
    purpose,
    successCriteria = [],
    estimatedEffort,
    priority = 'Medium',
    owner = 'Unassigned',
    targetDate,
    additionalNotes,
  } = args;

  try {
    // If source is a potential goal file, read it and extract information
    if (sourceType === 'potential-goal' && sourcePath) {
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourcePath}`,
        };
      }

      // Read potential goal file
      const potentialGoalContent = fs.readFileSync(sourcePath, 'utf-8');

      // Extract additional information from potential goal if not provided
      // This is a simplified parser - in production, use proper markdown parser
      const extractedData = extractPotentialGoalData(potentialGoalContent);

      // Use extracted data to supplement provided args
      const effectiveName = goalName || extractedData.name;
      const effectiveDescription = description || extractedData.description;
      const effectivePurpose = purpose || extractedData.purpose;
      const effectiveCriteria = successCriteria.length > 0 ? successCriteria : extractedData.successCriteria;

      // Create major goal with extracted/provided data
      const result = await createMajorGoal({
        projectPath,
        componentId,
        subAreaId,
        goalName: effectiveName,
        description: effectiveDescription,
        purpose: effectivePurpose,
        successCriteria: effectiveCriteria,
        estimatedEffort: estimatedEffort || extractedData.estimatedEffort,
        priority: priority || extractedData.priority,
        owner,
        targetDate,
      });

      if (!result.success) {
        return result;
      }

      // Mark potential goal as promoted
      try {
        const updatedContent = markAsPromoted(potentialGoalContent, result.goalId!, componentId, subAreaId);
        fs.writeFileSync(sourcePath, updatedContent, 'utf-8');

        return {
          ...result,
          sourceMarked: true,
        };
      } catch (markError) {
        // Major goal created successfully but marking failed - still return success
        return {
          ...result,
          sourceMarked: false,
        };
      }
    }

    // For brainstorming or direct promotion, just create the major goal
    const result = await createMajorGoal({
      projectPath,
      componentId,
      subAreaId,
      goalName,
      description,
      purpose,
      successCriteria,
      estimatedEffort,
      priority,
      owner,
      targetDate,
    });

    return {
      ...result,
      sourceMarked: sourceType === 'direct', // Direct promotion doesn't need marking
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract data from potential goal markdown
 */
function extractPotentialGoalData(content: string): {
  name: string;
  description: string;
  purpose: string;
  successCriteria: string[];
  estimatedEffort?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
} {
  // Extract goal name from title
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].replace(/^Goal:\s*/i, '').trim() : 'Untitled Goal';

  // Extract description
  const descMatch = content.match(/\*\*Description[:\s]*\*\*\s*(.+?)(?=\n\n|\*\*|$)/s);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract purpose/expected value
  const purposeMatch = content.match(/\*\*(?:Purpose|Expected Value)[:\s]*\*\*\s*(.+?)(?=\n\n|\*\*|$)/s);
  const purpose = purposeMatch ? purposeMatch[1].trim() : description;

  // Extract success criteria
  const criteriaSection = content.match(/\*\*Success Criteria[:\s]*\*\*\s*([\s\S]*?)(?=\n\n##|\*\*[A-Z]|$)/);
  const successCriteria: string[] = [];

  if (criteriaSection) {
    const criteriaMatches = criteriaSection[1].matchAll(/^[\s-•*]+(.+)$/gm);
    for (const match of criteriaMatches) {
      successCriteria.push(match[1].trim());
    }
  }

  // Extract estimated effort
  const effortMatch = content.match(/\*\*(?:Estimated Effort|Effort)[:\s]*\*\*\s*(.+?)(?=\n|\*\*|$)/);
  const estimatedEffort = effortMatch ? effortMatch[1].trim() : undefined;

  // Extract priority
  const priorityMatch = content.match(/\*\*Priority[:\s]*\*\*\s*(Critical|High|Medium|Low)/i);
  const priority = priorityMatch ? (priorityMatch[1] as 'Critical' | 'High' | 'Medium' | 'Low') : undefined;

  return {
    name,
    description,
    purpose,
    successCriteria,
    estimatedEffort,
    priority,
  };
}

/**
 * Mark potential goal as promoted
 */
function markAsPromoted(content: string, goalId: string, componentId: string, subAreaId?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const location = subAreaId
    ? `components/${componentId}/sub-areas/${subAreaId}/major-goals/${goalId}`
    : `components/${componentId}/major-goals/${goalId}`;

  // Add promotion note at the end
  const promotionNote = `

---

## ✅ Promoted to Major Goal

**Status:** Promoted
**Date:** ${timestamp}
**Major Goal ID:** ${goalId}
**Location:** \`02-goals-and-roadmap/${location}/\`

This potential goal has been promoted to a major goal and is now being tracked in the hierarchical planning system.

**Next Steps:**
1. Review major goal in: \`${location}/GOAL-STATUS.md\`
2. Hand off to Spec-Driven MCP for decomposition
3. Track progress as sub-goals are completed
`;

  // Check if already marked
  if (content.includes('## ✅ Promoted to Major Goal')) {
    // Replace existing promotion note
    return content.replace(/\n---\n\n## ✅ Promoted to Major Goal[\s\S]*$/, promotionNote);
  }

  // Add new promotion note
  return content + promotionNote;
}

/**
 * MCP Tool: Handoff to Spec-Driven MCP
 *
 * Prepare handoff context for Spec-Driven MCP to decompose major goal
 */
export async function handoffToSpecDriven(args: {
  projectPath: string;
  goalId: string;
  componentId: string;
  subAreaId?: string;
  additionalContext?: string;
}): Promise<{
  success: boolean;
  handoffContext?: MCPHandoffContext;
  error?: string;
}> {
  const { projectPath, goalId, componentId, subAreaId, additionalContext } = args;

  try {
    // Read major goal from file
    const goalFolderPath = findGoalFolder(projectPath, componentId, subAreaId, goalId);

    if (!goalFolderPath) {
      return {
        success: false,
        error: `Major goal ${goalId} not found in component ${componentId}`,
      };
    }

    const statusFilePath = path.join(goalFolderPath, 'GOAL-STATUS.md');
    const statusContent = fs.readFileSync(statusFilePath, 'utf-8');

    // Parse goal data (simplified - in production use proper parser)
    const goalData = parseGoalStatus(statusContent);

    // Create handoff context
    const handoffContext: MCPHandoffContext = {
      projectPath,
      componentId,
      majorGoalId: goalId,
    };

    return {
      success: true,
      handoffContext,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find goal folder by ID
 */
function findGoalFolder(
  projectPath: string,
  componentId: string,
  subAreaId: string | undefined,
  goalId: string
): string | null {
  const componentPath = path.join(projectPath, '02-goals-and-roadmap', 'components', componentId);

  let searchDir: string;
  if (subAreaId) {
    searchDir = path.join(componentPath, 'sub-areas', subAreaId, 'major-goals');
  } else {
    searchDir = path.join(componentPath, 'major-goals');
  }

  if (!fs.existsSync(searchDir)) {
    return null;
  }

  const folders = fs.readdirSync(searchDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith(goalId + '-'));

  return folders.length > 0 ? path.join(searchDir, folders[0].name) : null;
}

/**
 * Parse GOAL-STATUS markdown (simplified)
 */
function parseGoalStatus(content: string): any {
  const nameMatch = content.match(/# Major Goal \d+: (.+)/);
  const descMatch = content.match(/\*\*Description:\*\* (.+)/);
  const purposeMatch = content.match(/\*\*Purpose:\*\* (.+)/);

  return {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    description: descMatch ? descMatch[1] : '',
    purpose: purposeMatch ? purposeMatch[1] : '',
  };
}

/**
 * MCP Tool: Update Major Goal Progress
 *
 * Aggregate progress from sub-goals
 */
export async function updateMajorGoalProgress(args: {
  projectPath: string;
  goalId: string;
  componentId: string;
  subAreaId?: string;
}): Promise<{
  success: boolean;
  progress?: {
    percentage: number;
    status: string;
    completedSubGoals: number;
    totalSubGoals: number;
    breakdown: Record<string, any>;
  };
  error?: string;
}> {
  const { projectPath, goalId, componentId, subAreaId } = args;

  try {
    // Find goal folder
    const goalFolderPath = findGoalFolder(projectPath, componentId, subAreaId, goalId);

    if (!goalFolderPath) {
      return {
        success: false,
        error: `Major goal ${goalId} not found`,
      };
    }

    // Read sub-goals (in production, would scan spec-driven output)
    const subGoals: Array<{ id: string; name: string; progress: any }> = [];

    // For now, return placeholder
    const progressResult = calculateMajorGoalProgress(subGoals);

    return {
      success: true,
      progress: {
        percentage: progressResult.percentage,
        status: progressResult.status,
        completedSubGoals: progressResult.completedItems,
        totalSubGoals: progressResult.totalItems,
        breakdown: progressResult.breakdown,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * MCP Tool: Get Major Goal Status
 *
 * Get detailed status view of a major goal
 */
export async function getMajorGoalStatus(args: {
  projectPath: string;
  goalId: string;
  componentId: string;
  subAreaId?: string;
}): Promise<{
  success: boolean;
  status?: {
    goalId: string;
    goalName: string;
    description: string;
    purpose: string;
    progress: {
      percentage: number;
      status: string;
      completedSubGoals: number;
      totalSubGoals: number;
    };
    priority: string;
    owner: string;
    targetDate: string;
    subGoals: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
    }>;
    risks: Array<{
      description: string;
      severity: string;
      mitigation: string;
    }>;
    blockers: string[];
  };
  error?: string;
}> {
  const { projectPath, goalId, componentId, subAreaId } = args;

  try {
    // Find goal folder
    const goalFolderPath = findGoalFolder(projectPath, componentId, subAreaId, goalId);

    if (!goalFolderPath) {
      return {
        success: false,
        error: `Major goal ${goalId} not found`,
      };
    }

    // Read GOAL-STATUS.md
    const statusFilePath = path.join(goalFolderPath, 'GOAL-STATUS.md');
    const statusContent = fs.readFileSync(statusFilePath, 'utf-8');
    const goalData = parseGoalStatus(statusContent);

    // In production, would read sub-goals from spec-driven output
    const subGoals: any[] = [];

    return {
      success: true,
      status: {
        goalId,
        goalName: goalData.name,
        description: goalData.description,
        purpose: goalData.purpose,
        progress: {
          percentage: 0,
          status: 'not-started',
          completedSubGoals: 0,
          totalSubGoals: 0,
        },
        priority: 'Medium',
        owner: 'Unassigned',
        targetDate: 'TBD',
        subGoals: [],
        risks: [],
        blockers: [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * MCP Tool Definitions
 */
export const createMajorGoalTool = {
  name: 'create_major_goal',
  description:
    'Create a new major goal in a component or sub-area with folder structure',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    componentId: z.string().describe('Component ID'),
    subAreaId: z.string().optional().describe('Sub-area ID (optional)'),
    goalName: z.string().min(5).describe('Name of the major goal'),
    description: z.string().min(10).describe('Description of the goal'),
    purpose: z.string().min(10).describe('Purpose and expected value'),
    successCriteria: z.array(z.string()).optional().describe('Success criteria'),
    estimatedEffort: z.string().optional().describe('Estimated effort (e.g., "2 weeks")'),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().describe('Priority level'),
    owner: z.string().optional().describe('Owner of the goal'),
    targetDate: z.string().optional().describe('Target completion date'),
  }),
};

export const promoteToMajorGoalTool = {
  name: 'promote_to_major_goal',
  description:
    'Promote a brainstorming idea or potential goal to a major goal in the hierarchical planning system',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    componentId: z.string().describe('Component ID where major goal will be created'),
    subAreaId: z.string().optional().describe('Sub-area ID (optional)'),
    sourceType: z.enum(['brainstorming', 'potential-goal', 'direct']).describe('Type of source: brainstorming (from discussion), potential-goal (from potential goal file), or direct (manual input)'),
    sourcePath: z.string().optional().describe('Path to source file (required for potential-goal type)'),
    goalName: z.string().min(5).describe('Name of the major goal'),
    description: z.string().min(10).describe('Description of the goal'),
    purpose: z.string().min(10).describe('Purpose and expected value'),
    successCriteria: z.array(z.string()).optional().describe('Success criteria (auto-extracted if source is potential-goal)'),
    estimatedEffort: z.string().optional().describe('Estimated effort (auto-extracted if source is potential-goal)'),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().describe('Priority level (auto-extracted if source is potential-goal)'),
    owner: z.string().optional().describe('Owner of the goal'),
    targetDate: z.string().optional().describe('Target completion date'),
    additionalNotes: z.string().optional().describe('Additional notes about promotion'),
  }),
};

export const handoffToSpecDrivenTool = {
  name: 'handoff_to_spec_driven',
  description:
    'Prepare handoff context for Spec-Driven MCP to decompose major goal into sub-goals',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    goalId: z.string().describe('Major goal ID'),
    componentId: z.string().describe('Component ID'),
    subAreaId: z.string().optional().describe('Sub-area ID (optional)'),
    additionalContext: z.string().optional().describe('Additional context for decomposition'),
  }),
};

export const updateMajorGoalProgressTool = {
  name: 'update_major_goal_progress',
  description:
    'Update major goal progress by aggregating sub-goal completion',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    goalId: z.string().describe('Major goal ID'),
    componentId: z.string().describe('Component ID'),
    subAreaId: z.string().optional().describe('Sub-area ID (optional)'),
  }),
};

export const getMajorGoalStatusTool = {
  name: 'get_major_goal_status',
  description:
    'Get detailed status view of a major goal including sub-goals, risks, and blockers',
  inputSchema: z.object({
    projectPath: z.string().describe('Absolute path to the project directory'),
    goalId: z.string().describe('Major goal ID'),
    componentId: z.string().describe('Component ID'),
    subAreaId: z.string().optional().describe('Sub-area ID (optional)'),
  }),
};
