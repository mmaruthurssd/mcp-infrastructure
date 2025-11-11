/**
 * Learning Tools
 * Manage learned patterns, solutions, and preventive checks
 */
/**
 * Record Pattern
 * Store a discovered pattern in learning database
 */
export declare function recordPattern(args: any, brainPath: string): Promise<{
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
/**
 * Get Similar Patterns
 * Find patterns matching query using keyword matching
 */
export declare function getSimilarPatterns(args: any, brainPath: string): Promise<{
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
/**
 * Get Preventive Checks
 * Get recommendations for preventive checks based on context
 */
export declare function getPreventiveChecks(args: any, brainPath: string): Promise<{
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
//# sourceMappingURL=learning.d.ts.map