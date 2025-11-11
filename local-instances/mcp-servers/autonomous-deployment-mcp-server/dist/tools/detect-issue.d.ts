/**
 * detect-issue.ts
 *
 * Scans error logs for unresolved errors and matches them against pattern library
 * to calculate confidence scores for autonomous resolution.
 */
interface DetectIssueArgs {
    source?: "error-log" | "mcp-logs" | "performance-metrics";
    limit?: number;
    minConfidence?: number;
}
/**
 * Main detect_issue tool function
 * Scans error logs, matches patterns, and calculates confidence scores
 */
export declare function detectIssue(args: DetectIssueArgs): Promise<{
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
export {};
//# sourceMappingURL=detect-issue.d.ts.map