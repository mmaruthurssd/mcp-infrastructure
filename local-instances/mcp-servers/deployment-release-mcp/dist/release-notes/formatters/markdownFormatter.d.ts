import type { BreakingChange } from "../../types.js";
import type { CommitCategory } from "../commitParser.js";
export interface MarkdownFormatterOptions {
    version: string;
    releaseDate: string;
    includeBreakingChanges: boolean;
    includeAuthors: boolean;
    sections?: string[];
}
/**
 * Format release notes as Markdown
 */
export declare function formatMarkdown(categories: CommitCategory, breakingChanges: BreakingChange[], contributors: string[], options: MarkdownFormatterOptions): string;
//# sourceMappingURL=markdownFormatter.d.ts.map