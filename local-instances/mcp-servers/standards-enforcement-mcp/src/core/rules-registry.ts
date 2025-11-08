import { StandardRule, RuleCategory, RulesRegistry } from '../types/rules.js';

/**
 * Rules Registry
 * Central registry for all standard rules
 */
export class RulesRegistryManager implements RulesRegistry {
  rules: Map<string, StandardRule> = new Map();
  categories: Map<RuleCategory, string[]> = new Map();

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize category map
   */
  private initializeCategories(): void {
    const categories: RuleCategory[] = [
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
  registerRule(rule: StandardRule): void {
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
  getRule(ruleId: string): StandardRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all rules
   */
  getAllRules(): StandardRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): StandardRule[] {
    return this.getAllRules().filter((rule) => rule.enabled);
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): StandardRule[] {
    const ruleIds = this.categories.get(category) || [];
    return ruleIds
      .map((id) => this.rules.get(id))
      .filter((rule): rule is StandardRule => rule !== undefined);
  }

  /**
   * Get rules by categories (multiple)
   */
  getRulesByCategories(categories: RuleCategory[]): StandardRule[] {
    const rules = new Set<StandardRule>();

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
  setRuleEnabled(ruleId: string, enabled: boolean): void {
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
  getRuleCount(): number {
    return this.rules.size;
  }

  /**
   * Get enabled rule count
   */
  getEnabledRuleCount(): number {
    return this.getEnabledRules().length;
  }

  /**
   * Check if a path is excluded by rule exceptions
   */
  isPathExcluded(rule: StandardRule, path: string): boolean {
    if (!rule.exceptions || rule.exceptions.length === 0) {
      return false;
    }

    return rule.exceptions.some((pattern) => {
      // Simple glob pattern matching
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      );
      return regex.test(path);
    });
  }
}

/**
 * Global registry instance
 */
export const globalRulesRegistry = new RulesRegistryManager();
