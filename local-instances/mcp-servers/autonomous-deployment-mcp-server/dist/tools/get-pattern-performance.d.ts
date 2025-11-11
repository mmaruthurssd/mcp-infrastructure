/**
 * Pattern Performance Analysis Tool
 * Analyzes pattern performance metrics and provides insights
 */
interface GetPatternPerformanceParams {
    patternId?: string;
    minUsage?: number;
    sortBy?: 'success-rate' | 'usage-count' | 'confidence';
    includeNew?: boolean;
}
/**
 * Main tool handler
 */
export declare function getPatternPerformance(params: GetPatternPerformanceParams): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export {};
//# sourceMappingURL=get-pattern-performance.d.ts.map