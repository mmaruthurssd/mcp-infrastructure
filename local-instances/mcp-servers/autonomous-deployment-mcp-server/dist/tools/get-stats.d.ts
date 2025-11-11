/**
 * Get Statistics Tool
 *
 * Aggregate statistics from pattern performance data including resolution counts,
 * success rates, confidence metrics, and pattern performance analysis.
 */
/**
 * Get comprehensive statistics
 */
export declare function getStats(args: any): Promise<{
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
//# sourceMappingURL=get-stats.d.ts.map