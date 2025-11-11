/**
 * Cost Tracking and ROI Tools
 * Track API costs, time saved, and ROI for autonomous workflows
 */
interface TrackWorkflowCostArgs {
    workflow_name: string;
    api_tokens_used: {
        input: number;
        output: number;
    };
    time_saved_hours: number;
    outcome: "completed" | "failed" | "blocked";
    metadata?: Record<string, any>;
}
interface GetROIReportArgs {
    time_range: "week" | "month" | "quarter" | "all";
    workflow_filter?: string;
}
interface GetCostBreakdownArgs {
    time_range: "week" | "month" | "quarter" | "all";
}
interface CreateROIDashboardArgs {
    compare_to_previous?: boolean;
}
/**
 * Track workflow cost
 */
export declare function trackWorkflowCost(args: TrackWorkflowCostArgs, workspacePath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
/**
 * Get ROI report
 */
export declare function getROIReport(args: GetROIReportArgs, workspacePath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
/**
 * Get cost breakdown
 */
export declare function getCostBreakdown(args: GetCostBreakdownArgs, workspacePath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
/**
 * Create ROI dashboard
 */
export declare function createROIDashboard(args: CreateROIDashboardArgs, workspacePath: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
export {};
//# sourceMappingURL=cost-tracking.d.ts.map