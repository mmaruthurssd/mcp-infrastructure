/**
 * Archive Goal Tool
 *
 * Archive completed or shelved goals with retrospective documentation.
 */
import * as fs from 'fs';
import * as path from 'path';
import { GoalTemplateRenderer } from '../utils/goal-template-renderer.js';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Parse goal from SELECTED-GOALS.md
 */
function parseGoalFromSelected(content, goalId) {
    const goalRegex = new RegExp(`###\\s+Goal\\s+${goalId}:\\s+(.+?)\\s+\\[([^\\]]+)\\][\\s\\S]+?(?=\\n---\\n|$)`, '');
    const match = content.match(goalRegex);
    if (!match) {
        throw new Error(`Goal ${goalId} not found in SELECTED-GOALS.md`);
    }
    const goalSection = match[0];
    const goalName = match[1].trim();
    const tier = match[2].trim();
    // Extract fields
    const extractField = (fieldName) => {
        const regex = new RegExp(`\\*\\*${fieldName}:?\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
        const m = goalSection.match(regex);
        return m ? m[1].trim() : undefined;
    };
    return {
        goalId,
        goalName,
        tier,
        priority: extractField('Priority'),
        status: extractField('Status'),
        impact: extractField('Impact'),
        effort: extractField('Effort'),
        owner: extractField('Owner'),
        targetDate: extractField('Target Date'),
        description: extractField('Description'),
        dependencies: extractField('Dependencies'),
        blockers: extractField('Blockers'),
        progress: extractField('Progress'),
        lastUpdated: extractField('Last Updated'),
        source: extractField('Source'),
        fullSection: goalSection,
    };
}
/**
 * Calculate estimate accuracy
 */
function calculateEstimateAccuracy(estimatedImpact, actualImpact, estimatedEffort, actualEffort) {
    const impactLevels = { High: 3, Medium: 2, Low: 1 };
    const estImpactVal = impactLevels[estimatedImpact] || 2;
    const actImpactVal = actualImpact
        ? impactLevels[actualImpact] || 2
        : estImpactVal;
    let impactAccuracy;
    if (estImpactVal === actImpactVal) {
        impactAccuracy = 'Accurate';
    }
    else if (estImpactVal > actImpactVal) {
        impactAccuracy = 'Overestimated';
    }
    else {
        impactAccuracy = 'Underestimated';
    }
    const estEffortVal = impactLevels[estimatedEffort] || 2;
    const actEffortVal = actualEffort
        ? parseEffortToLevel(actualEffort)
        : estEffortVal;
    let effortAccuracy;
    if (Math.abs(estEffortVal - actEffortVal) <= 0.5) {
        effortAccuracy = 'Accurate';
    }
    else if (estEffortVal > actEffortVal) {
        effortAccuracy = 'Overestimated';
    }
    else {
        effortAccuracy = 'Underestimated';
    }
    return {
        estimatedImpact,
        actualImpact: actualImpact || estimatedImpact,
        estimatedEffort,
        actualEffort: actualEffort || estimatedEffort,
        impactAccuracy,
        effortAccuracy,
    };
}
/**
 * Parse effort string to numeric level for comparison
 */
function parseEffortToLevel(effort) {
    const lower = effort.toLowerCase();
    if (lower.includes('day') || lower.includes('week') || lower.includes('< 1 month')) {
        return 1; // Low
    }
    else if (lower.includes('month') || lower.includes('1-3 month')) {
        return 2; // Medium
    }
    else {
        return 3; // High
    }
}
/**
 * Remove goal from SELECTED-GOALS.md active section
 */
function removeGoalFromSelected(filePath, goalId) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Find and remove the goal section
    const goalRegex = new RegExp(`###\\s+Goal\\s+${goalId}:[\\s\\S]+?\\n---\\n`, '');
    const updatedContent = content.replace(goalRegex, '');
    // Update statistics
    const activeCount = (updatedContent.match(/###\s+Goal\s+\d+:/g) || []).length;
    const finalContent = updatedContent.replace(/\*\*Total Active Goals:\*\* \d+/, `**Total Active Goals:** ${activeCount}`);
    // Update timestamp
    const today = new Date().toISOString().split('T')[0];
    const timestampedContent = finalContent.replace(/\*\*Last Updated:\*\*\s+.+/, `**Last Updated:** ${today}`);
    fs.writeFileSync(filePath, timestampedContent, 'utf-8');
}
/**
 * Create retrospective file
 */
function createRetrospectiveFile(archivePath, goalData, retrospective, archiveType, estimateAccuracy) {
    // Prepare template data
    const today = new Date().toISOString().split('T')[0];
    const templateData = {
        goalId: goalData.goalId,
        goalName: goalData.goalName,
        archivedDate: today,
        tier: goalData.tier,
        estimatedImpact: goalData.impact,
        estimatedEffort: goalData.effort,
        priority: goalData.priority,
        owner: goalData.owner,
        targetDate: goalData.targetDate,
        description: goalData.description || 'No description provided',
        dependencies: goalData.dependencies || 'None',
        risks: 'See original goal file',
        datePromoted: 'Unknown', // Could extract from history
        totalTimeSelected: 'Unknown', // Could calculate from dates
        impactReasoning: 'See original evaluation',
        effortReasoning: 'See original evaluation',
    };
    if (archiveType === 'implemented') {
        templateData.completionDate = retrospective.completionDate || today;
        templateData.actualEffort = retrospective.actualEffort || 'Not specified';
        templateData.actualImpact = retrospective.actualImpact || goalData.impact;
        templateData.whatWentWell = retrospective.whatWentWell || 'Not provided';
        templateData.whatCouldImprove = retrospective.whatCouldImprove || 'Not provided';
        templateData.lessonsLearned = retrospective.lessonsLearned || 'Not provided';
        templateData.wouldDoAgain = retrospective.wouldDoAgain !== false ? 'Yes' : 'No';
        templateData.estimateAccuracy = estimateAccuracy.impactAccuracy;
        templateData.effortEstimateAccuracy = estimateAccuracy.effortAccuracy;
        templateData.effortVariance = `${estimateAccuracy.actualEffort} vs ${estimateAccuracy.estimatedEffort}`;
    }
    else {
        templateData.reasonShelved = retrospective.reasonShelved || 'Not specified';
        templateData.progressWhenShelved = goalData.progress || '0';
        templateData.alternativesTried = retrospective.alternativesTried || 'None';
        templateData.lessonsLearned = retrospective.lessonsLearned || 'Not provided';
        templateData.mightRevisit = retrospective.mightRevisit ? 'Yes - may reconsider in the future' : 'No';
        templateData.blockers = goalData.blockers || 'None';
    }
    // Render template
    const templateName = archiveType === 'implemented'
        ? 'retrospective-implemented'
        : 'retrospective-shelved';
    const retrospectiveContent = GoalTemplateRenderer.render(templateName, templateData);
    // Write file
    const fileName = `${goalData.goalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const filePath = path.join(archivePath, fileName);
    fs.mkdirSync(archivePath, { recursive: true });
    fs.writeFileSync(filePath, retrospectiveContent, 'utf-8');
    return filePath;
}
/**
 * Format output message
 */
function formatOutput(goalId, goalName, archiveType, archivedTo, estimateAccuracy) {
    const icon = archiveType === 'implemented' ? '✅' : '❌';
    let output = '═══════════════════════════════════════════════════════\n';
    output += `  GOAL ARCHIVED ${icon}\n`;
    output += '═══════════════════════════════════════════════════════\n\n';
    output += `📦 Goal ${goalId}: ${goalName}\n`;
    output += `   Type: ${archiveType === 'implemented' ? 'Implemented' : 'Shelved'}\n\n`;
    if (archiveType === 'implemented') {
        output += '📊 ESTIMATE ACCURACY\n';
        output += `   Impact: ${estimateAccuracy.estimatedImpact} → ${estimateAccuracy.actualImpact} (${estimateAccuracy.impactAccuracy})\n`;
        output += `   Effort: ${estimateAccuracy.estimatedEffort} → ${estimateAccuracy.actualEffort} (${estimateAccuracy.effortAccuracy})\n\n`;
    }
    output += `📁 Archived to: ${path.basename(archivedTo)}\n`;
    output += `   Location: archive/${archiveType}/\n\n`;
    output += '✅ Actions completed:\n';
    output += '   • Retrospective file created\n';
    output += '   • Removed from SELECTED-GOALS.md\n';
    output += '   • Statistics updated\n';
    output += '   • Learning data recorded\n';
    output += '\n═══════════════════════════════════════════════════════\n';
    return output;
}
// ============================================================================
// Main Tool Logic
// ============================================================================
export class ArchiveGoalTool {
    /**
     * Execute the archive_goal tool
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
            if (!['implemented', 'shelved'].includes(input.archiveType)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Invalid archiveType: ${input.archiveType}. Must be 'implemented' or 'shelved'`,
                };
            }
            const selectedGoalsPath = path.join(input.projectPath, 'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md');
            if (!fs.existsSync(selectedGoalsPath)) {
                return {
                    success: false,
                    message: 'Error',
                    error: 'SELECTED-GOALS.md not found',
                };
            }
            // Step 2: Parse goal from SELECTED-GOALS.md
            const content = fs.readFileSync(selectedGoalsPath, 'utf-8');
            const goalData = parseGoalFromSelected(content, input.goalId);
            // Step 3: Calculate estimate accuracy
            const estimateAccuracy = calculateEstimateAccuracy(goalData.impact, input.retrospective.actualImpact, goalData.effort, input.retrospective.actualEffort);
            // Step 4: Create retrospective file
            const archivePath = path.join(input.projectPath, `brainstorming/future-goals/archive/${input.archiveType}`);
            const archivedFilePath = createRetrospectiveFile(archivePath, goalData, input.retrospective, input.archiveType, estimateAccuracy);
            // Step 5: Remove from SELECTED-GOALS.md
            removeGoalFromSelected(selectedGoalsPath, input.goalId);
            // Step 6: Return result
            return {
                success: true,
                goalId: input.goalId,
                goalName: goalData.goalName,
                archivedTo: archivedFilePath,
                removedFrom: selectedGoalsPath,
                estimateAccuracy,
                message: `Successfully archived goal as ${input.archiveType}`,
                formatted: formatOutput(input.goalId, goalData.goalName, input.archiveType, archivedFilePath, estimateAccuracy),
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
            name: 'archive_goal',
            description: 'Archive a completed or shelved goal with retrospective documentation. Extracts learning data for estimate improvement.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    goalId: {
                        type: 'string',
                        description: 'Goal ID to archive (e.g., "01", "02")',
                    },
                    archiveType: {
                        type: 'string',
                        enum: ['implemented', 'shelved'],
                        description: 'Whether goal was completed (implemented) or cancelled (shelved)',
                    },
                    retrospective: {
                        type: 'object',
                        description: 'Retrospective data for learning',
                        properties: {
                            completionDate: { type: 'string' },
                            actualEffort: { type: 'string' },
                            actualImpact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                            lessonsLearned: { type: 'string' },
                            whatWentWell: { type: 'string' },
                            whatCouldImprove: { type: 'string' },
                            wouldDoAgain: { type: 'boolean' },
                            reasonShelved: { type: 'string' },
                            mightRevisit: { type: 'boolean' },
                            alternativesTried: { type: 'string' },
                        },
                    },
                },
                required: ['projectPath', 'goalId', 'archiveType', 'retrospective'],
            },
        };
    }
}
//# sourceMappingURL=archive-goal.js.map