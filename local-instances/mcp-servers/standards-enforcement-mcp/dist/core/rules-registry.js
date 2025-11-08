/**
 * Rules Registry
 * Central registry for all standard rules
 */
export class RulesRegistryManager {
    rules = new Map();
    categories = new Map();
    constructor() {
        this.initializeCategories();
    }
    /**
     * Initialize category map
     */
    initializeCategories() {
        const categories = [
            'dual-environment',
            'template-first',
            'project-structure',
            'configuration',
            'documentation',
            'security',
        ];
        categories.forEach((category) => {
            this.categories.set(category, []);
        });
    }
    /**
     * Register a new rule
     */
    registerRule(rule) {
        if (this.rules.has(rule.id)) {
            throw new Error(`Rule with id "${rule.id}" is already registered`);
        }
        this.rules.set(rule.id, rule);
        // Add to category index
        const categoryRules = this.categories.get(rule.category) || [];
        categoryRules.push(rule.id);
        this.categories.set(rule.category, categoryRules);
    }
    /**
     * Get rule by ID
     */
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    /**
     * Get all rules
     */
    getAllRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Get enabled rules
     */
    getEnabledRules() {
        return this.getAllRules().filter((rule) => rule.enabled);
    }
    /**
     * Get rules by category
     */
    getRulesByCategory(category) {
        const ruleIds = this.categories.get(category) || [];
        return ruleIds
            .map((id) => this.rules.get(id))
            .filter((rule) => rule !== undefined);
    }
    /**
     * Get rules by categories (multiple)
     */
    getRulesByCategories(categories) {
        const rules = new Set();
        categories.forEach((category) => {
            this.getRulesByCategory(category).forEach((rule) => {
                if (rule.enabled) {
                    rules.add(rule);
                }
            });
        });
        return Array.from(rules);
    }
    /**
     * Update rule enabled status
     */
    setRuleEnabled(ruleId, enabled) {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            throw new Error(`Rule with id "${ruleId}" not found`);
        }
        rule.enabled = enabled;
        this.rules.set(ruleId, rule);
    }
    /**
     * Get total rule count
     */
    getRuleCount() {
        return this.rules.size;
    }
    /**
     * Get enabled rule count
     */
    getEnabledRuleCount() {
        return this.getEnabledRules().length;
    }
    /**
     * Check if a path is excluded by rule exceptions
     */
    isPathExcluded(rule, path) {
        if (!rule.exceptions || rule.exceptions.length === 0) {
            return false;
        }
        return rule.exceptions.some((pattern) => {
            // Simple glob pattern matching
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(path);
        });
    }
}
/**
 * Global registry instance
 */
export const globalRulesRegistry = new RulesRegistryManager();
//# sourceMappingURL=rules-registry.js.map