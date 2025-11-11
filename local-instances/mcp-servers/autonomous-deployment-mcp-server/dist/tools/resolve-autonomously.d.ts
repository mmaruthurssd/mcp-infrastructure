/**
 * resolve-autonomously.ts
 *
 * Orchestrates autonomous resolution for high-confidence issues (≥0.95).
 * Executes full workflow: goal creation → specification → task execution → validation → deployment
 */
interface ResolveAutonomouslyArgs {
    issueId: string;
    approachId?: string;
    dryRun?: boolean;
}
/**
 * Main resolve_autonomously tool function
 * Orchestrates full autonomous resolution workflow
 */
export declare function resolveAutonomously(args: ResolveAutonomouslyArgs): Promise<{
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
//# sourceMappingURL=resolve-autonomously.d.ts.map