/**
 * suggest-approaches.ts
 *
 * Analyzes an issue/error message and returns ranked resolution approaches
 * based on pattern matching and historical success rates.
 */
interface SuggestApproachesArgs {
    issueId?: string;
    errorMessage: string;
    context?: {
        component?: string;
        severity?: string;
        stackTrace?: string;
    };
}
/**
 * Main suggest_approaches tool function
 * Takes an error message and returns ranked resolution approaches
 */
export declare function suggestApproaches(args: SuggestApproachesArgs): Promise<{
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
//# sourceMappingURL=suggest-approaches.d.ts.map