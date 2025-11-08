/**
 * Validator - Validate configurations and knowledge base format
 *
 * Prevents config corruption and parsing failures
 */
export class Validator {
    /**
     * Validate domain configuration
     */
    validateDomainConfig(config) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!config.domain) {
            errors.push('Missing required field: domain');
        }
        else if (typeof config.domain !== 'string' || config.domain.trim().length === 0) {
            errors.push('Field "domain" must be a non-empty string');
        }
        if (!config.displayName) {
            errors.push('Missing required field: displayName');
        }
        if (!config.description) {
            warnings.push('Missing recommended field: description');
        }
        if (!config.knowledgeBaseFile) {
            errors.push('Missing required field: knowledgeBaseFile');
        }
        // Validate optimization triggers
        if (!config.optimizationTriggers) {
            errors.push('Missing required field: optimizationTriggers');
        }
        else {
            const triggers = config.optimizationTriggers;
            if (typeof triggers.highImpactThreshold !== 'number' || triggers.highImpactThreshold < 1) {
                errors.push('optimizationTriggers.highImpactThreshold must be a number >= 1');
            }
            if (typeof triggers.technicalDebtThreshold !== 'number' || triggers.technicalDebtThreshold < 1) {
                errors.push('optimizationTriggers.technicalDebtThreshold must be a number >= 1');
            }
            if (typeof triggers.enableDuplicateDetection !== 'boolean') {
                errors.push('optimizationTriggers.enableDuplicateDetection must be a boolean');
            }
            // Validate new fields
            if (triggers.optimizationCooldown !== undefined) {
                if (typeof triggers.optimizationCooldown !== 'number' || triggers.optimizationCooldown < 0) {
                    errors.push('optimizationTriggers.optimizationCooldown must be a number >= 0');
                }
            }
        }
        // Validate categories
        if (!config.categories || !Array.isArray(config.categories)) {
            errors.push('Field "categories" must be an array');
        }
        else {
            for (let i = 0; i < config.categories.length; i++) {
                const category = config.categories[i];
                if (!category.name) {
                    errors.push(`Category ${i}: missing required field "name"`);
                }
                if (!category.keywords || !Array.isArray(category.keywords)) {
                    errors.push(`Category ${i} (${category.name}): "keywords" must be an array`);
                }
            }
        }
        // Validate quality standards if present
        if (config.qualityStandards) {
            const standards = config.qualityStandards;
            if (standards.minimumContextFields !== undefined) {
                if (typeof standards.minimumContextFields !== 'number' || standards.minimumContextFields < 0) {
                    errors.push('qualityStandards.minimumContextFields must be a number >= 0');
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate knowledge base structure
     */
    validateKnowledgeBase(kb) {
        const errors = [];
        const warnings = [];
        if (!kb.domain) {
            errors.push('Knowledge base missing domain field');
        }
        if (!kb.issues || !Array.isArray(kb.issues)) {
            errors.push('Knowledge base missing or invalid issues array');
        }
        else {
            // Check for duplicate issue numbers
            const issueNumbers = new Set();
            for (const issue of kb.issues) {
                if (issueNumbers.has(issue.issueNumber)) {
                    errors.push(`Duplicate issue number: ${issue.issueNumber}`);
                }
                issueNumbers.add(issue.issueNumber);
                // Validate issue structure
                if (!issue.title) {
                    errors.push(`Issue #${issue.issueNumber}: missing title`);
                }
                if (!issue.symptom) {
                    errors.push(`Issue #${issue.issueNumber}: missing symptom`);
                }
                if (!issue.solution) {
                    errors.push(`Issue #${issue.issueNumber}: missing solution`);
                }
                if (typeof issue.frequency !== 'number' || issue.frequency < 1) {
                    errors.push(`Issue #${issue.issueNumber}: invalid frequency`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Check for optimization cooldown
     */
    checkOptimizationCooldown(kb, config) {
        const cooldownMinutes = config.optimizationTriggers.optimizationCooldown || 1440; // Default 24 hours
        if (!kb.lastOptimization) {
            return { canOptimize: true };
        }
        const lastOptimization = new Date(kb.lastOptimization);
        const now = new Date();
        const minutesSince = (now.getTime() - lastOptimization.getTime()) / 1000 / 60;
        if (minutesSince < cooldownMinutes) {
            const minutesRemaining = Math.ceil(cooldownMinutes - minutesSince);
            return {
                canOptimize: false,
                reason: `Optimization cooldown active (${minutesRemaining} minutes remaining)`,
                minutesRemaining,
            };
        }
        return { canOptimize: true };
    }
    /**
     * Detect circular dependencies in merged issues
     */
    detectCircularMerges(issues) {
        const errors = [];
        const visited = new Set();
        const path = new Set();
        const hasCycle = (issueNumber) => {
            if (path.has(issueNumber)) {
                return true; // Cycle detected
            }
            if (visited.has(issueNumber)) {
                return false; // Already checked, no cycle
            }
            visited.add(issueNumber);
            path.add(issueNumber);
            const issue = issues.find(i => i.issueNumber === issueNumber);
            if (issue && issue.mergedInto) {
                if (hasCycle(issue.mergedInto)) {
                    errors.push(`Circular merge detected: Issue #${issueNumber} → #${issue.mergedInto}`);
                    path.delete(issueNumber);
                    return true;
                }
            }
            path.delete(issueNumber);
            return false;
        };
        for (const issue of issues) {
            if (issue.mergedInto && !visited.has(issue.issueNumber)) {
                hasCycle(issue.issueNumber);
            }
        }
        return errors;
    }
    /**
     * Validate markdown format of knowledge base file
     */
    validateMarkdownFormat(content) {
        const errors = [];
        const warnings = [];
        // Check for required sections
        if (!content.includes('# Troubleshooting Knowledge Base')) {
            warnings.push('Missing main heading: "# Troubleshooting Knowledge Base"');
        }
        if (!content.includes('## Auto-Learned Issues')) {
            warnings.push('Missing section: "## Auto-Learned Issues"');
        }
        // Check for issue heading format
        const issuePattern = /#### Auto-Learned Issue #\d+:/g;
        const issueMatches = content.match(issuePattern);
        if (!issueMatches && content.includes('Auto-Learned Issue')) {
            warnings.push('Issue headings may be incorrectly formatted (should be "#### Auto-Learned Issue #N:")');
        }
        // Check for broken metadata sections
        const metadataPattern = /\*\*([^*]+)\*\*:/g;
        const requiredMetadata = ['Symptom', 'Solution', 'Frequency'];
        const foundMetadata = new Set();
        let match;
        while ((match = metadataPattern.exec(content)) !== null) {
            foundMetadata.add(match[1]);
        }
        for (const required of requiredMetadata) {
            if (!foundMetadata.has(required)) {
                warnings.push(`Missing metadata field: ${required}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
//# sourceMappingURL=validator.js.map