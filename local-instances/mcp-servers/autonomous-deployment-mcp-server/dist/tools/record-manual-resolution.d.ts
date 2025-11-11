/**
 * Record Manual Resolution Tool
 *
 * Learn from human-resolved issues to improve pattern matching and confidence scoring.
 * Extracts patterns, updates success rates, and provides learning insights.
 */
/**
 * Record manual resolution and learn from it
 */
export declare function recordManualResolution(args: any): Promise<{
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
//# sourceMappingURL=record-manual-resolution.d.ts.map