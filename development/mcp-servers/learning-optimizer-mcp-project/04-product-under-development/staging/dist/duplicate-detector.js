/**
 * Duplicate Detector
 * Finds duplicate issues based on symptom similarity
 */
export class DuplicateDetector {
    /**
     * Detect duplicate issues
     */
    detectDuplicates(issues) {
        const duplicateGroups = [];
        const processed = new Set();
        for (let i = 0; i < issues.length; i++) {
            if (processed.has(issues[i].issueNumber))
                continue;
            if (issues[i].mergedInto)
                continue; // Skip already merged issues
            const primaryIssue = issues[i];
            const duplicates = [];
            for (let j = i + 1; j < issues.length; j++) {
                if (processed.has(issues[j].issueNumber))
                    continue;
                if (issues[j].mergedInto)
                    continue;
                if (this.areDuplicates(primaryIssue, issues[j])) {
                    duplicates.push(issues[j]);
                    processed.add(issues[j].issueNumber);
                }
            }
            if (duplicates.length > 0) {
                const combinedFrequency = primaryIssue.frequency + duplicates.reduce((sum, d) => sum + d.frequency, 0);
                duplicateGroups.push({
                    primaryIssue,
                    duplicates,
                    combinedFrequency,
                });
                processed.add(primaryIssue.issueNumber);
            }
        }
        return duplicateGroups;
    }
    /**
     * Check if two issues are duplicates
     */
    areDuplicates(issue1, issue2) {
        // Normalize text for comparison
        const symptom1 = this.normalizeText(issue1.symptom);
        const symptom2 = this.normalizeText(issue2.symptom);
        const title1 = this.normalizeText(issue1.title);
        const title2 = this.normalizeText(issue2.title);
        // Check 1: Exact symptom match (normalized)
        if (symptom1 === symptom2 && symptom1.length > 20) {
            return true;
        }
        // Check 2: Symptom containment (one contains the other)
        if (symptom1.length > 30 && symptom2.length > 30) {
            if (symptom1.includes(symptom2) || symptom2.includes(symptom1)) {
                return true;
            }
        }
        // Check 3: Similar titles with overlapping symptoms
        const titleSimilarity = this.calculateSimilarity(title1, title2);
        const symptomOverlap = this.calculateOverlap(symptom1, symptom2);
        if (titleSimilarity > 0.7 && symptomOverlap > 0.5) {
            return true;
        }
        // Check 4: Same error message pattern
        const errorPattern1 = this.extractErrorPattern(symptom1);
        const errorPattern2 = this.extractErrorPattern(symptom2);
        if (errorPattern1 && errorPattern2 && errorPattern1 === errorPattern2) {
            return true;
        }
        return false;
    }
    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }
    /**
     * Calculate text similarity (Jaccard similarity)
     */
    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.split(' '));
        const words2 = new Set(text2.split(' '));
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    /**
     * Calculate text overlap
     */
    calculateOverlap(text1, text2) {
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        let overlap = 0;
        for (const word of words1) {
            if (words2.includes(word) && word.length > 3) {
                overlap++;
            }
        }
        return overlap / Math.max(words1.length, words2.length);
    }
    /**
     * Extract error message pattern
     */
    extractErrorPattern(text) {
        // Match common error patterns
        const patterns = [
            /error:\s*cannot\s+find\s+module\s+['"]([^'"]+)['"]/i,
            /error:\s*enoent[:\s]+no\s+such\s+file\s+or\s+directory/i,
            /error:\s*eacces[:\s]+permission\s+denied/i,
            /error:\s*eaddrinuse[:\s]+address\s+already\s+in\s+use/i,
            /error:\s*enospc[:\s]+no\s+space\s+left/i,
            /npm\s+err!\s+code\s+(\w+)/i,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[0].toLowerCase();
            }
        }
        return null;
    }
    /**
     * Merge duplicate issues
     */
    mergeDuplicates(duplicateGroup) {
        const { primaryIssue, duplicates, combinedFrequency } = duplicateGroup;
        // Update primary issue
        primaryIssue.frequency = combinedFrequency;
        // Track merged issues
        primaryIssue.mergedFrom = duplicates.map(d => d.issueNumber);
        // Update last seen to most recent
        const allDates = [primaryIssue.lastSeen, ...duplicates.map(d => d.lastSeen)];
        primaryIssue.lastSeen = allDates.sort().reverse()[0];
        // Mark duplicates as merged
        for (const duplicate of duplicates) {
            duplicate.mergedInto = primaryIssue.issueNumber;
        }
        return primaryIssue;
    }
}
//# sourceMappingURL=duplicate-detector.js.map