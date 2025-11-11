/**
 * Resolve with Approval Tool
 *
 * Executes assisted resolution for medium-confidence issues (0.70-0.94).
 * Requires human approval before execution and logs approval in audit trail.
 */
/**
 * Execute assisted resolution with human approval
 */
export declare function resolveWithApproval(args: any): Promise<{
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
//# sourceMappingURL=resolve-with-approval.d.ts.map