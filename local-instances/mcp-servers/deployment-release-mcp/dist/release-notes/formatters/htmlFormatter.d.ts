import type { BreakingChange } from "../../types.js";
import type { CommitCategory } from "../commitParser.js";
export interface HtmlFormatterOptions {
    version: string;
    releaseDate: string;
    includeBreakingChanges: boolean;
    includeAuthors: boolean;
    sections?: string[];
}
/**
 * Format release notes as HTML
 */
export declare function formatHtml(categories: CommitCategory, breakingChanges: BreakingChange[], contributors: string[], options: HtmlFormatterOptions): string;
//# sourceMappingURL=htmlFormatter.d.ts.map