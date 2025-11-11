/**
 * Get Performance Dashboard Tool
 *
 * Get real-time performance dashboard data
 */
export declare function getPerformanceDashboard(_args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=get-performance-dashboard.d.ts.map