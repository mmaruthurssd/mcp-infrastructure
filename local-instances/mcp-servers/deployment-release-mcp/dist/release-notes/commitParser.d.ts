import type { BreakingChange } from "../types.js";
export interface ParsedCommit {
    hash: string;
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    footer?: string;
    author: string;
    date: string;
    breakingChanges: BreakingChange[];
    references: string[];
}
export interface CommitCategory {
    features: ParsedCommit[];
    fixes: ParsedCommit[];
    enhancements: ParsedCommit[];
    performance: ParsedCommit[];
    security: ParsedCommit[];
    dependencies: ParsedCommit[];
    docs: ParsedCommit[];
    other: ParsedCommit[];
}
/**
 * Parse a git commit message using conventional commits format
 */
export declare function parseCommit(commitMessage: string, hash: string, author: string, date: string): ParsedCommit;
/**
 * Categorize parsed commits into sections
 */
export declare function categorizeCommits(commits: ParsedCommit[]): CommitCategory;
/**
 * Extract unique contributors from commits
 */
export declare function extractContributors(commits: ParsedCommit[]): string[];
/**
 * Collect all breaking changes from commits
 */
export declare function collectBreakingChanges(commits: ParsedCommit[]): BreakingChange[];
//# sourceMappingURL=commitParser.d.ts.map