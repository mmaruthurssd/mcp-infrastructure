/**
 * Categorization Engine
 * Auto-categorizes issues based on keyword matching
 */
import { TrackedIssue, Category } from './types.js';
export declare class Categorizer {
    /**
     * Categorize a single issue based on symptom keywords
     */
    categorizeIssue(issue: TrackedIssue, categories: Category[]): string | undefined;
    /**
     * Calculate category match score
     */
    private calculateCategoryScore;
    /**
     * Categorize all issues
     */
    categorizeAll(issues: TrackedIssue[], categories: Category[]): Map<string, TrackedIssue[]>;
    /**
     * Get category statistics
     */
    getCategoryStats(issues: TrackedIssue[], categories: Category[]): Map<string, number>;
}
//# sourceMappingURL=categorizer.d.ts.map