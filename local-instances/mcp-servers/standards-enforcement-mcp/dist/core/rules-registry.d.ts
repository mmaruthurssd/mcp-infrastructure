import { StandardRule, RuleCategory, RulesRegistry } from '../types/rules.js';
/**
 * Rules Registry
 * Central registry for all standard rules
 */
export declare class RulesRegistryManager implements RulesRegistry {
    rules: Map<string, StandardRule>;
    categories: Map<RuleCategory, string[]>;
    constructor();
    /**
     * Initialize category map
     */
    private initializeCategories;
    /**
     * Register a new rule
     */
    registerRule(rule: StandardRule): void;
    /**
     * Get rule by ID
     */
    getRule(ruleId: string): StandardRule | undefined;
    /**
     * Get all rules
     */
    getAllRules(): StandardRule[];
    /**
     * Get enabled rules
     */
    getEnabledRules(): StandardRule[];
    /**
     * Get rules by category
     */
    getRulesByCategory(category: RuleCategory): StandardRule[];
    /**
     * Get rules by categories (multiple)
     */
    getRulesByCategories(categories: RuleCategory[]): StandardRule[];
    /**
     * Update rule enabled status
     */
    setRuleEnabled(ruleId: string, enabled: boolean): void;
    /**
     * Get total rule count
     */
    getRuleCount(): number;
    /**
     * Get enabled rule count
     */
    getEnabledRuleCount(): number;
    /**
     * Check if a path is excluded by rule exceptions
     */
    isPathExcluded(rule: StandardRule, path: string): boolean;
}
/**
 * Global registry instance
 */
export declare const globalRulesRegistry: RulesRegistryManager;
//# sourceMappingURL=rules-registry.d.ts.map