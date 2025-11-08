/**
 * Generate Performance Report Tool
 *
 * Generate comprehensive performance report
 */
export declare function generatePerformanceReport(args: Record<string, unknown>): Promise<{
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
//# sourceMappingURL=generate-performance-report.d.ts.map