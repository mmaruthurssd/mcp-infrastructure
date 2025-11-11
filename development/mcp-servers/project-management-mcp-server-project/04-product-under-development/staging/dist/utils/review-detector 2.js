/**
 * Review Detector Utility
 *
 * Detects goals that need review based on various criteria:
 * - Stale potential goals (>90 days old, never promoted)
 * - Long-running selected goals (>60 days in progress)
 * - No progress updates (>14 days without update)
 * - Blocked too long (>30 days)
 * - Completed but not archived
 */
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Calculate days between two dates
 */
function daysBetween(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = date2Str ? new Date(date2Str) : new Date();
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
/**
 * Parse potential goals from directory
 */
function parsePotentialGoals(projectPath) {
    const potentialGoalsDir = path.join(projectPath, 'brainstorming/future-goals/potential-goals');
    if (!fs.existsSync(potentialGoalsDir)) {
        return [];
    }
    const files = fs.readdirSync(potentialGoalsDir).filter(f => f.endsWith('.md'));
    const goals = [];
    for (const file of files) {
        const filePath = path.join(potentialGoalsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        // Extract goal name
        const nameMatch = content.match(/^#\s+(.+)/m);
        const goalName = nameMatch ? nameMatch[1].trim() : file.replace('.md', '');
        // Extract date created
        const createdMatch = content.match(/\*\*Created:\*\*\s+(\d{4}-\d{2}-\d{2})/);
        const dateCreated = createdMatch ? createdMatch[1] : undefined;
        // Extract status (if it has a status field)
        const statusMatch = content.match(/\*\*Status:\*\*\s+(.+)/);
        const status = statusMatch ? statusMatch[1].trim() : 'Pending';
        goals.push({
            goalName,
            dateCreated,
            status,
            filePath,
        });
    }
    return goals;
}
/**
 * Parse selected goals from SELECTED-GOALS.md
 */
function parseSelectedGoals(projectPath) {
    const selectedGoalsPath = path.join(projectPath, 'brainstorming/future-goals/selected-goals/SELECTED-GOALS.md');
    if (!fs.existsSync(selectedGoalsPath)) {
        return [];
    }
    const content = fs.readFileSync(selectedGoalsPath, 'utf-8');
    const goals = [];
    // Match goal sections
    const goalRegex = /###\s+Goal\s+(\d+):\s+(.+?)\s+\[([^\]]+)\]([\s\S]+?)(?=\n---\n|$)/g;
    let match;
    while ((match = goalRegex.exec(content)) !== null) {
        const goalId = match[1];
        const goalName = match[2].trim();
        const tier = match[3].trim();
        const goalSection = match[4];
        // Extract fields from goal section
        const extractField = (fieldName) => {
            const regex = new RegExp(`\\*\\*${fieldName}:?\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
            const m = goalSection.match(regex);
            return m ? m[1].trim() : undefined;
        };
        const status = extractField('Status') || 'Not Started';
        const progress = extractField('Progress') || '0';
        const lastUpdated = extractField('Last Updated');
        const datePromoted = extractField('Date Promoted');
        goals.push({
            goalId,
            goalName,
            tier,
            status,
            progress,
            lastUpdated,
            datePromoted,
        });
    }
    return goals;
}
// ============================================================================
// Detection Functions
// ============================================================================
/**
 * Detect stale potential goals (created >90 days ago, never promoted)
 */
function detectStalePotentialGoals(potentialGoals, thresholds) {
    const items = [];
    for (const goal of potentialGoals) {
        if (!goal.dateCreated)
            continue;
        const daysSinceCreated = daysBetween(goal.dateCreated);
        if (daysSinceCreated >= thresholds.stalePotentialDays) {
            let urgency = 'low';
            if (daysSinceCreated >= 180)
                urgency = 'high';
            else if (daysSinceCreated >= 120)
                urgency = 'medium';
            items.push({
                goalName: goal.goalName,
                type: 'potential',
                reason: 'stale',
                daysSince: daysSinceCreated,
                lastUpdated: goal.dateCreated,
                recommendedAction: 'Review and either promote to selected or shelve',
                urgency,
            });
        }
    }
    return items;
}
/**
 * Detect long-running selected goals (in progress >60 days)
 */
function detectLongRunningGoals(selectedGoals, thresholds) {
    const items = [];
    for (const goal of selectedGoals) {
        if (!goal.datePromoted)
            continue;
        if (goal.status !== 'In Progress' && goal.status !== 'Active')
            continue;
        const daysSincePromoted = daysBetween(goal.datePromoted);
        if (daysSincePromoted >= thresholds.longRunningDays) {
            let urgency = 'medium';
            if (daysSincePromoted >= 120)
                urgency = 'high';
            items.push({
                goalId: goal.goalId,
                goalName: goal.goalName,
                type: 'selected',
                reason: 'long-running',
                daysSince: daysSincePromoted,
                lastUpdated: goal.lastUpdated || goal.datePromoted,
                recommendedAction: 'Check if scope is too large and needs breaking down',
                urgency,
            });
        }
    }
    return items;
}
/**
 * Detect goals with no progress updates (>14 days)
 */
function detectNoProgressGoals(selectedGoals, thresholds) {
    const items = [];
    for (const goal of selectedGoals) {
        if (goal.status !== 'In Progress' && goal.status !== 'Active')
            continue;
        if (!goal.lastUpdated)
            continue;
        const daysSinceUpdate = daysBetween(goal.lastUpdated);
        if (daysSinceUpdate >= thresholds.noProgressDays) {
            let urgency = 'low';
            if (daysSinceUpdate >= 30)
                urgency = 'high';
            else if (daysSinceUpdate >= 21)
                urgency = 'medium';
            items.push({
                goalId: goal.goalId,
                goalName: goal.goalName,
                type: 'selected',
                reason: 'no-progress',
                daysSince: daysSinceUpdate,
                lastUpdated: goal.lastUpdated,
                recommendedAction: 'Update progress or change status if no longer active',
                urgency,
            });
        }
    }
    return items;
}
/**
 * Detect goals blocked too long (>30 days)
 */
function detectBlockedGoals(selectedGoals, thresholds) {
    const items = [];
    for (const goal of selectedGoals) {
        if (goal.status !== 'Blocked')
            continue;
        if (!goal.lastUpdated)
            continue;
        const daysSinceBlocked = daysBetween(goal.lastUpdated);
        if (daysSinceBlocked >= thresholds.blockedDays) {
            let urgency = 'medium';
            if (daysSinceBlocked >= 60)
                urgency = 'high';
            items.push({
                goalId: goal.goalId,
                goalName: goal.goalName,
                type: 'selected',
                reason: 'blocked',
                daysSince: daysSinceBlocked,
                lastUpdated: goal.lastUpdated,
                recommendedAction: 'Escalate blocker or shelve goal',
                urgency,
            });
        }
    }
    return items;
}
/**
 * Detect completed goals not archived
 */
function detectCompletedNotArchived(selectedGoals) {
    const items = [];
    for (const goal of selectedGoals) {
        const progress = parseInt(goal.progress) || 0;
        const isCompleted = progress === 100 || goal.status === 'Completed' || goal.status === 'Done';
        if (isCompleted) {
            items.push({
                goalId: goal.goalId,
                goalName: goal.goalName,
                type: 'selected',
                reason: 'completed-not-archived',
                daysSince: goal.lastUpdated ? daysBetween(goal.lastUpdated) : 0,
                lastUpdated: goal.lastUpdated || 'Unknown',
                recommendedAction: 'Archive goal with retrospective',
                urgency: 'high',
            });
        }
    }
    return items;
}
// ============================================================================
// Main Detection Function
// ============================================================================
/**
 * Detect all reviews needed
 */
export function detectReviewsNeeded(projectPath, checkType = 'all', customThresholds) {
    const thresholds = {
        stalePotentialDays: 90,
        staleSelectedDays: 30,
        longRunningDays: 60,
        noProgressDays: 14,
        blockedDays: 30,
        ...customThresholds,
    };
    const reviewItems = [];
    // Parse goals
    const potentialGoals = checkType === 'all' || checkType === 'potential'
        ? parsePotentialGoals(projectPath)
        : [];
    const selectedGoals = checkType === 'all' || checkType === 'selected'
        ? parseSelectedGoals(projectPath)
        : [];
    // Run detections
    if (checkType === 'all' || checkType === 'potential') {
        reviewItems.push(...detectStalePotentialGoals(potentialGoals, thresholds));
    }
    if (checkType === 'all' || checkType === 'selected') {
        reviewItems.push(...detectLongRunningGoals(selectedGoals, thresholds));
        reviewItems.push(...detectNoProgressGoals(selectedGoals, thresholds));
        reviewItems.push(...detectBlockedGoals(selectedGoals, thresholds));
        reviewItems.push(...detectCompletedNotArchived(selectedGoals));
    }
    // Sort by urgency (high first)
    reviewItems.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
    return reviewItems;
}
//# sourceMappingURL=review-detector%202.js.map