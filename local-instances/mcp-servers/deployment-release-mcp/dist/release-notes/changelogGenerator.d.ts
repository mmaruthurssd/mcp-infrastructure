import type { ReleaseNotesFormat, BreakingChange } from "../types.js";
import type { CommitCategory } from "./commitParser.js";
export interface ChangelogOptions {
    version: string;
    releaseDate: string;
    format: ReleaseNotesFormat;
    outputPath: string;
    includeBreakingChanges: boolean;
    includeAuthors: boolean;
    sections?: string[];
}
/**
 * Generate and write changelog to file
 */
export declare function generateChangelog(categories: CommitCategory, breakingChanges: BreakingChange[], contributors: string[], options: ChangelogOptions): Promise<string>;
/**
 * Build sections summary from categorized commits
 */
export declare function buildSectionsSummary(categories: CommitCategory): Record<string, string[]>;
//# sourceMappingURL=changelogGenerator.d.ts.map