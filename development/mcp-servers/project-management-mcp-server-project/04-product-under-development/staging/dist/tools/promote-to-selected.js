/**
 * Promote to Selected Tool
 *
 * Promotes a potential goal to selected status, adds it to SELECTED-GOALS.md,
 * and optionally prepares goal context for spec-driven workflow.
 */
import * as fs from 'fs';
import * as path from 'path';
import { GoalTemplateRenderer } from '../utils/goal-template-renderer.js';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Parse potential goal markdown file to extract all fields
 */
function parsePotentialGoal(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Extract goal name from first header (# Goal Name)
    const nameMatch = content.match(/^#\s+(.+)$/m);
    if (!nameMatch) {
        throw new Error('Could not find goal name in potential goal file');
    }
    const goalName = nameMatch[1].trim();
    // Extract description (paragraph after goal name, before sections)
    const descMatch = content.match(/^#\s+.+\n\n(.+?)(?:\n\n##|$)/s);
    const description = descMatch ? descMatch[1].trim() : '';
    // Extract Impact from "## AI Impact/Effort Analysis" section
    // Format: **Impact:** High - reasoning here
    const impactMatch = content.match(/\*\*Impact:\*\*\s+(\w+)\s+-\s+(.+?)(?=\n\n|\*\*Impact Factors)/s);
    if (!impactMatch) {
        throw new Error('Could not find Impact in AI Impact/Effort Analysis section');
    }
    const impactScore = impactMatch[1].trim();
    const impactReasoning = impactMatch[2].trim();
    // Extract Effort from same section
    // Format: **Effort:** High - reasoning here
    const effortMatch = content.match(/\*\*Effort:\*\*\s+(\w+)\s+-\s+(.+?)(?=\n\n|\*\*Effort Factors)/s);
    if (!effortMatch) {
        throw new Error('Could not find Effort in AI Impact/Effort Analysis section');
    }
    const effortScore = effortMatch[1].trim();
    const effortReasoning = effortMatch[2].trim();
    // Extract Suggested Tier from same section
    // Format: **Suggested Tier:** Now
    const tierMatch = content.match(/\*\*Suggested Tier:\*\*\s+(\w+)/);
    if (!tierMatch) {
        throw new Error('Could not find Suggested Tier in potential goal file');
    }
    const tier = tierMatch[1].trim();
    // Extract evaluation questions (optional)
    const extractSection = (heading) => {
        const regex = new RegExp(`###\\s+${heading}\\s*\\n\\n(.+?)(?=\\n\\n###|\\n\\n##|$)`, 's');
        const match = content.match(regex);
        return match ? match[1].trim() : undefined;
    };
    return {
        goalName,
        description,
        impactScore,
        impactReasoning,
        effortScore,
        effortReasoning,
        tier,
        problem: extractSection('1\\. What problem does this solve\\?'),
        expectedValue: extractSection('2\\. What value will this create\\?'),
        effortDetails: extractSection('3\\. What effort is required\\?'),
        dependencies: extractSection('4\\. What dependencies exist\\?'),
        risks: extractSection('5\\. What are the risks\\?'),
        alternatives: extractSection('6\\. What are alternative approaches\\?'),
        decisionCriteria: extractSection('7\\. What would make you change your mind\\?'),
    };
}
/**
 * Assign next sequential goal ID from SELECTED-GOALS.md
 */
function assignGoalId(selectedGoalsPath) {
    // If file doesn't exist, start with "01"
    if (!fs.existsSync(selectedGoalsPath)) {
        return '01';
    }
    const content = fs.readFileSync(selectedGoalsPath, 'utf-8');
    // Find all goal IDs in Active Goals section (###Goal 01:, ### Goal 02:, etc.)
    const goalIdMatches = content.matchAll(/###\s+(?:✅\s+)?(?:❌\s+)?Goal\s+(\d+):/g);
    const goalIds = Array.from(goalIdMatches, m => parseInt(m[1], 10));
    // Find max ID and increment
    const maxId = goalIds.length > 0 ? Math.max(...goalIds) : 0;
    const nextId = maxId + 1;
    // Return zero-padded (01, 02, ... 10, 11, ...)
    return nextId.toString().padStart(2, '0');
}
/**
 * Update SELECTED-GOALS.md with new goal entry
 */
function updateSelectedGoals(selectedGoalsPath, goalId, goalEntry, priority) {
    let content;
    // If file doesn't exist, create from template
    if (!fs.existsSync(selectedGoalsPath)) {
        const templatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../templates/goal-workflow/selected-goals-index.md');
        const template = fs.readFileSync(templatePath, 'utf-8');
        // Simple variable replacement for lastUpdated
        content = template.replace(/\{\{lastUpdated\}\}/g, getToday());
    }
    else {
        content = fs.readFileSync(selectedGoalsPath, 'utf-8');
    }
    // Update "Last Updated" at top
    content = content.replace(/\*\*Last Updated:\*\* .+/, `**Last Updated:** ${getToday()}`);
    // Insert goal entry at end of "Active Goals" section
    const activeGoalsEnd = content.indexOf('\n## Completed Goals');
    if (activeGoalsEnd === -1) {
        throw new Error('Could not find "Completed Goals" section in SELECTED-GOALS.md');
    }
    const before = content.substring(0, activeGoalsEnd);
    const after = content.substring(activeGoalsEnd);
    content = before + '\n' + goalEntry + '\n' + after;
    // Update statistics
    content = updateStatistics(content, priority);
    fs.writeFileSync(selectedGoalsPath, content, 'utf-8');
}
/**
 * Update statistics section
 */
function updateStatistics(content, newGoalPriority) {
    // Count total active goals
    const activeCount = (content.match(/###\s+Goal\s+\d+:/g) || []).length;
    content = content.replace(/\*\*Total Active Goals:\*\* \d+/, `**Total Active Goals:** ${activeCount}`);
    // Count by priority
    const highCount = (content.match(/\*\*Priority:\*\* High/g) || []).length;
    const mediumCount = (content.match(/\*\*Priority:\*\* Medium/g) || []).length;
    const lowCount = (content.match(/\*\*Priority:\*\* Low/g) || []).length;
    content = content.replace(/\*\*By Priority:\*\*[\s\S]+?- Low: \d+/, `**By Priority:**\n- High: ${highCount}\n- Medium: ${mediumCount}\n- Low: ${lowCount}`);
    // Count by status
    const planningCount = (content.match(/\*\*Status:\*\* Planning/g) || []).length;
    const notStartedCount = (content.match(/\*\*Status:\*\* Not Started/g) || []).length;
    const inProgressCount = (content.match(/\*\*Status:\*\* In Progress/g) || []).length;
    const blockedCount = (content.match(/\*\*Status:\*\* Blocked/g) || []).length;
    const onHoldCount = (content.match(/\*\*Status:\*\* On Hold/g) || []).length;
    content = content.replace(/\*\*By Status:\*\*[\s\S]+?- On Hold: \d+/, `**By Status:**\n- Planning: ${planningCount}\n- Not Started: ${notStartedCount}\n- In Progress: ${inProgressCount}\n- Blocked: ${blockedCount}\n- On Hold: ${onHoldCount}`);
    return content;
}
/**
 * Build goal context for cross-server handoff
 */
function buildGoalContext(goalId, parsed, input) {
    return {
        goalId,
        goalName: parsed.goalName,
        goalDescription: parsed.description,
        impactScore: parsed.impactScore,
        impactReasoning: parsed.impactReasoning,
        effortScore: parsed.effortScore,
        effortReasoning: parsed.effortReasoning,
        tier: parsed.tier,
        priority: input.priority,
        owner: input.owner || 'Unassigned',
        targetDate: input.targetDate || 'TBD',
        problem: parsed.problem,
        expectedValue: parsed.expectedValue,
        effortDetails: parsed.effortDetails,
        dependencies: parsed.dependencies,
        risks: parsed.risks,
        alternatives: parsed.alternatives,
        decisionCriteria: parsed.decisionCriteria,
    };
}
/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Format output message
 */
function formatOutput(goalId, goalName, priority, owner, targetDate, status, generateSpec) {
    let msg = `✅ Goal ${goalId}: ${goalName}\n`;
    msg += `   Status: ${status}\n`;
    msg += `   Priority: ${priority}\n`;
    msg += `   Owner: ${owner}\n`;
    msg += `   Target: ${targetDate}\n`;
    if (generateSpec) {
        msg += `\n   📋 Goal context ready for spec-driven workflow\n`;
        msg += `   Next: Call sdd_guide with goalContext to generate specification`;
    }
    else {
        msg += `\n   Added to SELECTED-GOALS.md\n`;
        msg += `   Next: Create formal specification or start implementation`;
    }
    return msg;
}
// ============================================================================
// Main Tool Logic
// ============================================================================
export class PromoteToSelectedTool {
    /**
     * Execute the promote_to_selected tool
     */
    static execute(input) {
        try {
            // Step 1: Validate input
            if (!fs.existsSync(input.projectPath)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Project path does not exist: ${input.projectPath}`,
                };
            }
            const potentialGoalPath = path.join(input.projectPath, input.potentialGoalFile);
            if (!fs.existsSync(potentialGoalPath)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Potential goal file not found: ${input.potentialGoalFile}`,
                };
            }
            if (!['High', 'Medium', 'Low'].includes(input.priority)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Invalid priority: ${input.priority}. Must be High, Medium, or Low`,
                };
            }
            // Step 2: Parse potential goal file
            const parsed = parsePotentialGoal(potentialGoalPath);
            // Step 3: Assign goal ID
            const selectedGoalsDir = path.join(input.projectPath, 'brainstorming/future-goals/selected-goals');
            fs.mkdirSync(selectedGoalsDir, { recursive: true });
            const selectedGoalsPath = path.join(selectedGoalsDir, 'SELECTED-GOALS.md');
            const goalId = assignGoalId(selectedGoalsPath);
            // Step 4: Determine status and next action
            const status = input.status || (input.generateSpec ? 'Planning' : 'Not Started');
            const nextAction = input.nextAction || (input.generateSpec
                ? 'Create formal specification using spec-driven MCP'
                : 'Define next action');
            // Step 5: Generate selected goal entry
            const contextData = GoalTemplateRenderer.buildSelectedGoalContext({
                goalId,
                goalName: parsed.goalName,
                status,
                priority: input.priority,
                impactScore: parsed.impactScore,
                effortScore: parsed.effortScore,
                owner: input.owner || 'Unassigned',
                targetDate: input.targetDate || 'TBD',
                description: parsed.description,
                dependencies: parsed.dependencies,
                blockers: 'None',
                progress: 'Not started',
                nextAction,
                potentialGoalFile: input.potentialGoalFile,
            });
            const goalEntry = GoalTemplateRenderer.render('selected-goal-entry', contextData);
            // Step 6: Update SELECTED-GOALS.md
            updateSelectedGoals(selectedGoalsPath, goalId, goalEntry, input.priority);
            // Step 7: Build goal context if requested
            const goalContext = input.generateSpec
                ? buildGoalContext(goalId, parsed, input)
                : undefined;
            // Step 8: Return result
            return {
                success: true,
                goalId,
                goalName: parsed.goalName,
                addedToFile: selectedGoalsPath,
                goalContext,
                message: input.generateSpec
                    ? 'Successfully promoted goal and prepared for spec generation'
                    : 'Successfully promoted goal to selected status',
                formatted: formatOutput(goalId, parsed.goalName, input.priority, input.owner || 'Unassigned', input.targetDate || 'TBD', status, input.generateSpec || false),
            };
        }
        catch (error) {
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
    static formatResult(result) {
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
            name: 'promote_to_selected',
            description: 'Promote a potential goal to selected status, add it to SELECTED-GOALS.md, and optionally prepare goal context for spec-driven workflow',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    potentialGoalFile: {
                        type: 'string',
                        description: 'Relative path from projectPath to potential goal file (e.g., "brainstorming/future-goals/potential-goals/mobile-app.md")',
                    },
                    priority: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Priority level for the goal',
                    },
                    owner: {
                        type: 'string',
                        description: 'Person or team responsible for this goal (optional, defaults to "Unassigned")',
                    },
                    targetDate: {
                        type: 'string',
                        description: 'Target completion date (YYYY-MM-DD, "Q1 2025", etc.) (optional, defaults to "TBD")',
                    },
                    generateSpec: {
                        type: 'boolean',
                        description: 'If true, return goal context for handoff to spec-driven MCP (default: false)',
                    },
                    status: {
                        type: 'string',
                        enum: ['Planning', 'Not Started'],
                        description: 'Override default status (optional)',
                    },
                    nextAction: {
                        type: 'string',
                        description: 'Override default next action (optional)',
                    },
                },
                required: ['projectPath', 'potentialGoalFile', 'priority'],
            },
        };
    }
}
//# sourceMappingURL=promote-to-selected.js.map