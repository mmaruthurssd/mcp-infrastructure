/**
 * Get Metrics Tool
 *
 * Query performance metrics with filtering and aggregation
 */
export declare function getMetrics(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=get-metrics.d.ts.map