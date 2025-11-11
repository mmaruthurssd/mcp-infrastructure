import type { BreakingChange } from "../../types.js";
import type { CommitCategory } from "../commitParser.js";
export interface JsonFormatterOptions {
    version: string;
    releaseDate: string;
    includeBreakingChanges: boolean;
    includeAuthors: boolean;
    sections?: string[];
}
export interface ReleaseNotesJson {
    version: string;
    releaseDate: string;
    summary: {
        totalCommits: number;
        features: number;
        fixes: number;
        enhancements: number;
        performance: number;
        security: number;
        dependencies: number;
        breakingChanges: number;
    };
    breakingChanges?: BreakingChange[];
    features?: CommitData[];
    enhancements?: CommitData[];
    fixes?: CommitData[];
    performance?: CommitData[];
    security?: CommitData[];
    dependencies?: CommitData[];
    contributors?: string[];
}
interface CommitData {
    hash: string;
    type: string;
    scope?: string;
    subject: string;
    author: string;
    date: string;
    references: string[];
}
/**
 * Format release notes as JSON
 */
export declare function formatJson(categories: CommitCategory, breakingChanges: BreakingChange[], contributors: string[], options: JsonFormatterOptions): string;
export {};
//# sourceMappingURL=jsonFormatter.d.ts.map