/**
 * View Goals Dashboard Tool
 *
 * Provides comprehensive overview of all goals with filtering, sorting, and alerts.
 */
import * as fs from 'fs';
import { scanAllGoals, filterGoals, sortGoals, calculateStatistics, } from '../utils/goal-scanner.js';
import { detectAlerts, } from '../utils/alert-detector.js';
// ============================================================================
// Formatting
// ============================================================================
/**
 * Format dashboard output for display
 */
function formatDashboard(scanned, stats, alerts, input) {
    let output = '═══════════════════════════════════════════════════════\n';
    output += '  GOALS DASHBOARD\n';
    output += '═══════════════════════════════════════════════════════\n\n';
    // Statistics
    if (stats && input.includeStats !== false) {
        output += '📊 STATISTICS\n';
        output += `   Potential: ${stats.totalPotential}    Selected: ${stats.totalSelected}    Completed: ${stats.totalCompleted}    Shelved: ${stats.totalShelved}\n\n`;
        output += `   By Tier:  Now: ${stats.byTier.Now}  Next: ${stats.byTier.Next}  Later: ${stats.byTier.Later}  Someday: ${stats.byTier.Someday}\n`;
        output += `   By Priority:  High: ${stats.byPriority.High}  Medium: ${stats.byPriority.Medium}  Low: ${stats.byPriority.Low}\n`;
        output += `   By Status:  Planning: ${stats.byStatus.Planning}  Not Started: ${stats.byStatus['Not Started']}  In Progress: ${stats.byStatus['In Progress']}  Blocked: ${stats.byStatus.Blocked}  On Hold: ${stats.byStatus['On Hold']}\n\n`;
    }
    // Alerts
    if (alerts && alerts.length > 0 && input.includeAlerts !== false) {
        output += `🔴 ALERTS (${alerts.length})\n`;
        for (const alert of alerts.slice(0, 5)) { // Show top 5 alerts
            const icon = alert.severity === 'urgent' ? '🔴' :
                alert.severity === 'attention' ? '⚠️' : 'ℹ️';
            const severityLabel = alert.severity.toUpperCase();
            output += `   [${severityLabel}] ${alert.message}\n`;
            output += `      ${icon} Action: ${alert.action}\n`;
        }
        if (alerts.length > 5) {
            output += `   ... and ${alerts.length - 5} more alerts\n`;
        }
        output += '\n';
    }
    // Selected Goals
    if (scanned.selectedGoals.length > 0) {
        output += `🎯 SELECTED GOALS (${scanned.selectedGoals.length})\n`;
        scanned.selectedGoals.forEach((goal, index) => {
            const progressBar = goal.progress
                ? `[${'█'.repeat(Math.floor(goal.progress / 10))}${'░'.repeat(10 - Math.floor(goal.progress / 10))}] ${goal.progress}%`
                : '[░░░░░░░░░░] 0%';
            output += `   ${goal.id}. ${goal.name} [${goal.tier}]\n`;
            output += `       ${goal.impactScore} Impact / ${goal.effortScore} Effort - ${goal.status}\n`;
            output += `       Priority: ${goal.priority}  Owner: ${goal.owner}  Target: ${goal.targetDate}\n`;
            output += `       Progress: ${progressBar}  Updated: ${goal.lastUpdated}\n`;
            if (goal.status === 'Blocked') {
                output += `       ⚠️ BLOCKED\n`;
            }
            if (index < scanned.selectedGoals.length - 1) {
                output += '\n';
            }
        });
        output += '\n';
    }
    // Potential Goals
    if (scanned.potentialGoals.length > 0) {
        output += `\n💡 POTENTIAL GOALS (${scanned.potentialGoals.length})\n`;
        scanned.potentialGoals.slice(0, 10).forEach((goal) => {
            output += `   • ${goal.name} [${goal.tier}]\n`;
            output += `     ${goal.impactScore} Impact / ${goal.effortScore} Effort - Updated: ${goal.lastUpdated}\n`;
        });
        if (scanned.potentialGoals.length > 10) {
            output += `   ... and ${scanned.potentialGoals.length - 10} more\n`;
        }
        output += '\n';
    }
    // Completed Goals
    if (scanned.completedGoals.length > 0) {
        output += `\n✅ COMPLETED GOALS (${scanned.completedGoals.length})\n`;
        scanned.completedGoals.slice(0, 5).forEach((goal) => {
            output += `   ✓ ${goal.name} [${goal.tier}]\n`;
            output += `     ${goal.impactScore} Impact / ${goal.effortScore} Effort - Completed: ${goal.lastUpdated}\n`;
        });
        if (scanned.completedGoals.length > 5) {
            output += `   ... and ${scanned.completedGoals.length - 5} more\n`;
        }
        output += '\n';
    }
    // Shelved Goals
    if (scanned.shelvedGoals.length > 0) {
        output += `\n❌ SHELVED GOALS (${scanned.shelvedGoals.length})\n`;
        scanned.shelvedGoals.slice(0, 5).forEach((goal) => {
            output += `   ✗ ${goal.name} [${goal.tier}]\n`;
            output += `     ${goal.impactScore} Impact / ${goal.effortScore} Effort - Shelved: ${goal.lastUpdated}\n`;
        });
        if (scanned.shelvedGoals.length > 5) {
            output += `   ... and ${scanned.shelvedGoals.length - 5} more\n`;
        }
        output += '\n';
    }
    // No goals found
    if (scanned.potentialGoals.length === 0 &&
        scanned.selectedGoals.length === 0 &&
        scanned.completedGoals.length === 0 &&
        scanned.shelvedGoals.length === 0) {
        output += 'No goals found.\n';
        output += '\nGet started:\n';
        output += '  1. Use extract_ideas to find ideas in brainstorming\n';
        output += '  2. Use evaluate_goal to assess Impact/Effort\n';
        output += '  3. Use create_potential_goal to formalize ideas\n';
        output += '  4. Use promote_to_selected to select goals to pursue\n';
    }
    output += '═══════════════════════════════════════════════════════\n';
    return output;
}
/**
 * Format goal summary for compact display
 */
function formatGoalSummary(goal, includeProgress = false) {
    let summary = `${goal.name} [${goal.tier}]`;
    summary += ` - ${goal.impactScore} Impact / ${goal.effortScore} Effort`;
    if (goal.status) {
        summary += ` - ${goal.status}`;
    }
    if (includeProgress && goal.progress !== undefined) {
        summary += ` (${goal.progress}%)`;
    }
    return summary;
}
// ============================================================================
// Main Tool Logic
// ============================================================================
export class ViewGoalsDashboardTool {
    /**
     * Execute the view_goals_dashboard tool
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
            // Step 2: Scan all goals
            const scanned = scanAllGoals(input.projectPath);
            // Step 3: Apply filters if specified
            const filters = {
                tier: input.tier,
                priority: input.priority,
                status: input.status,
                owner: input.owner,
            };
            const hasFilters = Object.values(filters).some(f => f !== undefined);
            if (hasFilters) {
                scanned.potentialGoals = filterGoals(scanned.potentialGoals, filters);
                scanned.selectedGoals = filterGoals(scanned.selectedGoals, filters);
                scanned.completedGoals = filterGoals(scanned.completedGoals, filters);
                scanned.shelvedGoals = filterGoals(scanned.shelvedGoals, filters);
            }
            // Step 4: Apply sorting if specified
            if (input.sortBy) {
                scanned.potentialGoals = sortGoals(scanned.potentialGoals, input.sortBy);
                scanned.selectedGoals = sortGoals(scanned.selectedGoals, input.sortBy);
                scanned.completedGoals = sortGoals(scanned.completedGoals, input.sortBy);
                scanned.shelvedGoals = sortGoals(scanned.shelvedGoals, input.sortBy);
            }
            // Step 5: Calculate statistics (if not filtered)
            const stats = (input.includeStats !== false && !hasFilters)
                ? calculateStatistics(scanned)
                : undefined;
            // Step 6: Detect alerts (if enabled)
            const alerts = (input.includeAlerts !== false)
                ? detectAlerts(scanned.potentialGoals, scanned.selectedGoals)
                : undefined;
            // Step 7: Format output
            const formatted = formatDashboard(scanned, stats, alerts, input);
            // Step 8: Build message
            let message = 'Dashboard generated successfully';
            if (hasFilters) {
                const filterDesc = Object.entries(filters)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ');
                message += ` (filtered by: ${filterDesc})`;
            }
            if (input.sortBy) {
                message += ` (sorted by: ${input.sortBy})`;
            }
            // Step 9: Return result
            return {
                success: true,
                potentialGoals: scanned.potentialGoals,
                selectedGoals: scanned.selectedGoals,
                completedGoals: scanned.completedGoals,
                shelvedGoals: scanned.shelvedGoals,
                stats,
                alerts,
                formatted,
                message,
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
            name: 'view_goals_dashboard',
            description: 'Provide comprehensive overview of all goals (potential, selected, completed, shelved) with filtering, sorting, statistics, and alerts for stale/blocked/duplicate goals.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    tier: {
                        type: 'string',
                        enum: ['Now', 'Next', 'Later', 'Someday'],
                        description: 'Optional: Filter by tier',
                    },
                    priority: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Optional: Filter by priority (selected goals only)',
                    },
                    status: {
                        type: 'string',
                        enum: ['Planning', 'Not Started', 'In Progress', 'Blocked', 'On Hold'],
                        description: 'Optional: Filter by status (selected goals only)',
                    },
                    owner: {
                        type: 'string',
                        description: 'Optional: Filter by owner name',
                    },
                    sortBy: {
                        type: 'string',
                        enum: ['impact', 'effort', 'priority', 'date', 'progress'],
                        description: 'Optional: Sort goals by specified criteria',
                    },
                    includeAlerts: {
                        type: 'boolean',
                        description: 'Optional: Include alerts for stale/blocked/duplicate goals (default: true)',
                    },
                    includeStats: {
                        type: 'boolean',
                        description: 'Optional: Include statistics summary (default: true)',
                    },
                },
                required: ['projectPath'],
            },
        };
    }
}
//# sourceMappingURL=view-goals-dashboard.js.map