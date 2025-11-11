/**
 * Track Performance Tool
 *
 * Records MCP tool execution performance metrics
 */
export declare function trackPerformance(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=track-performance.d.ts.map