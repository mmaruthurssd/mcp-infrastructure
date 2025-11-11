/**
 * Check Review Needed Tool
 *
 * Proactively detect goals that need review based on various criteria.
 */
import * as fs from 'fs';
import { detectReviewsNeeded } from '../utils/review-detector.js';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Format output message
 */
function formatOutput(reviewItems, summary) {
    let output = '═══════════════════════════════════════════════════════\n';
    output += '  GOAL REVIEW CHECK\n';
    output += '═══════════════════════════════════════════════════════\n\n';
    output += `📊 SUMMARY\n`;
    output += `   Total Reviews Needed: ${summary.total}\n\n`;
    output += `   By Urgency:\n`;
    output += `   🔴 High: ${summary.byUrgency.high}\n`;
    output += `   ⚠️  Medium: ${summary.byUrgency.medium}\n`;
    output += `   🟡 Low: ${summary.byUrgency.low}\n\n`;
    output += `   By Reason:\n`;
    output += `   • Stale: ${summary.byReason.stale}\n`;
    output += `   • Long-Running: ${summary.byReason.longRunning}\n`;
    output += `   • No Progress: ${summary.byReason.noProgress}\n`;
    output += `   • Blocked: ${summary.byReason.blocked}\n`;
    output += `   • Completed Not Archived: ${summary.byReason.completedNotArchived}\n\n`;
    if (reviewItems.length === 0) {
        output += '✅ No reviews needed - all goals are in good health!\n';
        output += '\n═══════════════════════════════════════════════════════\n';
        return output;
    }
    // Group by urgency
    const highUrgency = reviewItems.filter(r => r.urgency === 'high');
    const mediumUrgency = reviewItems.filter(r => r.urgency === 'medium');
    const lowUrgency = reviewItems.filter(r => r.urgency === 'low');
    if (highUrgency.length > 0) {
        output += '🔴 HIGH PRIORITY REVIEWS\n';
        output += '───────────────────────────────────────────────────────\n';
        for (const item of highUrgency) {
            output += formatReviewItem(item);
        }
        output += '\n';
    }
    if (mediumUrgency.length > 0) {
        output += '⚠️  MEDIUM PRIORITY REVIEWS\n';
        output += '───────────────────────────────────────────────────────\n';
        for (const item of mediumUrgency) {
            output += formatReviewItem(item);
        }
        output += '\n';
    }
    if (lowUrgency.length > 0) {
        output += '🟡 LOW PRIORITY REVIEWS\n';
        output += '───────────────────────────────────────────────────────\n';
        for (const item of lowUrgency) {
            output += formatReviewItem(item);
        }
        output += '\n';
    }
    output += '═══════════════════════════════════════════════════════\n';
    return output;
}
/**
 * Format a single review item
 */
function formatReviewItem(item) {
    const goalLabel = item.goalId ? `Goal ${item.goalId}` : 'Potential';
    const reasonLabel = formatReason(item.reason);
    let output = `\n${goalLabel}: ${item.goalName}\n`;
    output += `   Reason: ${reasonLabel}\n`;
    output += `   Days Since: ${item.daysSince}\n`;
    output += `   Last Updated: ${item.lastUpdated}\n`;
    output += `   Action: ${item.recommendedAction}\n`;
    return output;
}
/**
 * Format reason for display
 */
function formatReason(reason) {
    switch (reason) {
        case 'stale':
            return 'Stale (not promoted)';
        case 'long-running':
            return 'Long-running (in progress too long)';
        case 'no-progress':
            return 'No progress updates';
        case 'blocked':
            return 'Blocked too long';
        case 'completed-not-archived':
            return 'Completed but not archived';
        default:
            return reason;
    }
}
// ============================================================================
// Main Tool Logic
// ============================================================================
export class CheckReviewNeededTool {
    /**
     * Execute the check_review_needed tool
     */
    static execute(input) {
        try {
            // Step 1: Validate input
            if (!fs.existsSync(input.projectPath)) {
                return {
                    success: false,
                    reviewsNeeded: [],
                    summary: {
                        total: 0,
                        byReason: {
                            stale: 0,
                            longRunning: 0,
                            noProgress: 0,
                            blocked: 0,
                            completedNotArchived: 0,
                        },
                        byUrgency: { high: 0, medium: 0, low: 0 },
                    },
                    message: 'Error',
                    error: `Project path does not exist: ${input.projectPath}`,
                };
            }
            // Step 2: Detect reviews needed
            const customThresholds = {
                stalePotentialDays: input.staleDays,
                longRunningDays: input.longRunningDays,
                noProgressDays: input.noProgressDays,
                blockedDays: input.blockedDays,
            };
            const reviewItems = detectReviewsNeeded(input.projectPath, input.checkType || 'all', customThresholds);
            // Step 3: Build summary
            const summary = {
                total: reviewItems.length,
                byReason: {
                    stale: reviewItems.filter(r => r.reason === 'stale').length,
                    longRunning: reviewItems.filter(r => r.reason === 'long-running').length,
                    noProgress: reviewItems.filter(r => r.reason === 'no-progress').length,
                    blocked: reviewItems.filter(r => r.reason === 'blocked').length,
                    completedNotArchived: reviewItems.filter(r => r.reason === 'completed-not-archived').length,
                },
                byUrgency: {
                    high: reviewItems.filter(r => r.urgency === 'high').length,
                    medium: reviewItems.filter(r => r.urgency === 'medium').length,
                    low: reviewItems.filter(r => r.urgency === 'low').length,
                },
            };
            // Step 4: Return result
            return {
                success: true,
                reviewsNeeded: reviewItems,
                summary,
                message: `Found ${reviewItems.length} goal(s) needing review`,
                formatted: formatOutput(reviewItems, summary),
            };
        }
        catch (error) {
            return {
                success: false,
                reviewsNeeded: [],
                summary: {
                    total: 0,
                    byReason: {
                        stale: 0,
                        longRunning: 0,
                        noProgress: 0,
                        blocked: 0,
                        completedNotArchived: 0,
                    },
                    byUrgency: { high: 0, medium: 0, low: 0 },
                },
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
            name: 'check_review_needed',
            description: 'Proactively detect goals that need review based on various criteria (stale, long-running, no progress, blocked, completed but not archived).',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    checkType: {
                        type: 'string',
                        enum: ['all', 'selected', 'potential'],
                        description: 'What to check: all goals, only selected goals, or only potential goals (default: all)',
                    },
                    staleDays: {
                        type: 'number',
                        description: 'Custom threshold for stale goals (default: 90 for potential, 30 for selected)',
                    },
                    longRunningDays: {
                        type: 'number',
                        description: 'Custom threshold for long-running goals (default: 60)',
                    },
                    noProgressDays: {
                        type: 'number',
                        description: 'Custom threshold for no progress (default: 14)',
                    },
                    blockedDays: {
                        type: 'number',
                        description: 'Custom threshold for blocked goals (default: 30)',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=check-review-needed.js.map