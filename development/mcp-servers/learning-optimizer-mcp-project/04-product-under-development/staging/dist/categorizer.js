/**
 * Categorization Engine
 * Auto-categorizes issues based on keyword matching
 */
export class Categorizer {
    /**
     * Categorize a single issue based on symptom keywords
     */
    categorizeIssue(issue, categories) {
        const searchText = `${issue.symptom} ${issue.rootCause || ''} ${issue.title}`.toLowerCase();
        // Find matching categories with scores
        const matches = categories.map(category => ({
            category,
            score: this.calculateCategoryScore(searchText, category),
        }));
        // Sort by score (highest first)
        matches.sort((a, b) => b.score - a.score);
        // Return category with highest score if above threshold
        if (matches[0].score > 0) {
            return matches[0].category.name;
        }
        return undefined;
    }
    /**
     * Calculate category match score
     */
    calculateCategoryScore(text, category) {
        let score = 0;
        for (const keyword of category.keywords) {
            const keywordLower = keyword.toLowerCase();
            // Exact keyword match
            if (text.includes(keywordLower)) {
                score += 10;
            }
            // Partial match (for longer keywords)
            if (keywordLower.length > 5) {
                const words = text.split(/\s+/);
                for (const word of words) {
                    if (word.includes(keywordLower) || keywordLower.includes(word)) {
                        score += 5;
                    }
                }
            }
        }
        // Apply priority bonus if set
        if (category.priority) {
            score += category.priority;
        }
        return score;
    }
    /**
     * Categorize all issues
     */
    categorizeAll(issues, categories) {
        const categorized = new Map();
        // Initialize categories
        for (const category of categories) {
            categorized.set(category.name, []);
        }
        // Add "Uncategorized" for issues that don't match
        categorized.set('Uncategorized', []);
        // Categorize each issue
        for (const issue of issues) {
            const categoryName = this.categorizeIssue(issue, categories) || 'Uncategorized';
            // Update issue category
            issue.category = categoryName;
            // Add to categorized map
            const categoryIssues = categorized.get(categoryName) || [];
            categoryIssues.push(issue);
            categorized.set(categoryName, categoryIssues);
        }
        return categorized;
    }
    /**
     * Get category statistics
     */
    getCategoryStats(issues, categories) {
        const stats = new Map();
        // Initialize all categories with 0
        for (const category of categories) {
            stats.set(category.name, 0);
        }
        stats.set('Uncategorized', 0);
        // Count issues per category
        for (const issue of issues) {
            const category = issue.category || 'Uncategorized';
            stats.set(category, (stats.get(category) || 0) + 1);
        }
        return stats;
    }
}
//# sourceMappingURL=categorizer.js.map