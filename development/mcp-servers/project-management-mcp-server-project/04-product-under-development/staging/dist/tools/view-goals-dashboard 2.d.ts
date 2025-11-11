/**
 * View Goals Dashboard Tool
 *
 * Provides comprehensive overview of all goals with filtering, sorting, and alerts.
 */
import { GoalSummary, GoalStatistics } from '../utils/goal-scanner.js';
import { Alert } from '../utils/alert-detector.js';
export interface ViewGoalsDashboardInput {
    projectPath: string;
    tier?: 'Now' | 'Next' | 'Later' | 'Someday';
    priority?: 'High' | 'Medium' | 'Low';
    status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold';
    owner?: string;
    sortBy?: 'impact' | 'effort' | 'priority' | 'date' | 'progress';
    includeAlerts?: boolean;
    includeStats?: boolean;
}
export interface ViewGoalsDashboardOutput {
    success: boolean;
    potentialGoals?: GoalSummary[];
    selectedGoals?: GoalSummary[];
    completedGoals?: GoalSummary[];
    shelvedGoals?: GoalSummary[];
    stats?: GoalStatistics;
    alerts?: Alert[];
    formatted?: string;
    message: string;
    error?: string;
}
export declare class ViewGoalsDashboardTool {
    /**
     * Execute the view_goals_dashboard tool
     */
    static execute(input: ViewGoalsDashboardInput): ViewGoalsDashboardOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: ViewGoalsDashboardOutput): string;
    /**
     * Get MCP tool definition
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                tier: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                priority: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                owner: {
                    type: string;
                    description: string;
                };
                sortBy: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                includeAlerts: {
                    type: string;
                    description: string;
                };
                includeStats: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=view-goals-dashboard%202.d.ts.map