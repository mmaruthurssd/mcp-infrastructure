/**
 * Validator function registry
 * Maps validator function names to actual implementations
 */
export class ValidatorRegistry {
    validators = new Map();
    /**
     * Register a validator function
     */
    register(name, fn) {
        this.validators.set(name, fn);
    }
    /**
     * Get validator function by name
     */
    get(name) {
        return this.validators.get(name);
    }
    /**
     * Check if validator exists
     */
    has(name) {
        return this.validators.has(name);
    }
}
/**
 * Rules Engine
 * Orchestrates validation execution
 */
export class RulesEngine {
    registry;
    validators;
    calculator;
    constructor(registry, validators, calculator) {
        this.registry = registry;
        this.validators = validators;
        this.calculator = calculator;
    }
    /**
     * Validate using all enabled rules
     */
    async validate(context) {
        const rules = this.registry.getEnabledRules();
        return this.validateWithRules(context, rules);
    }
    /**
     * Validate using rules from specific categories
     */
    async validateCategories(context, categories) {
        const rules = this.registry.getRulesByCategories(categories);
        return this.validateWithRules(context, rules);
    }
    /**
     * Validate using specific rules
     */
    async validateWithRules(context, rules) {
        const allIssues = [];
        const violations = [];
        // Execute validators for each rule
        for (const rule of rules) {
            // Skip if path is excluded by rule exceptions
            if (this.registry.isPathExcluded(rule, context.targetPath)) {
                continue;
            }
            const validator = this.validators.get(rule.validator);
            if (!validator) {
                console.warn(`Validator function "${rule.validator}" not found for rule "${rule.id}"`);
                continue;
            }
            try {
                const issues = await validator(context);
                allIssues.push(...issues);
                // Convert issues to violations
                for (const issue of issues) {
                    violations.push(this.issueToViolation(issue, rule));
                }
            }
            catch (error) {
                console.error(`Error executing validator for rule "${rule.id}":`, error);
                // Add error as critical violation
                allIssues.push({
                    ruleId: rule.id,
                    severity: 'critical',
                    message: `Validator execution failed: ${error instanceof Error ? error.message : String(error)}`,
                    location: {
                        path: context.targetPath,
                    },
                });
            }
        }
        // Calculate summary
        const summary = this.calculator.calculateSummary(rules.length, allIssues);
        // Determine compliance
        const compliant = this.calculator.isCompliant(summary);
        return {
            success: true,
            compliant,
            violations,
            summary,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Validate with fail-fast mode
     * Stops on first critical violation
     */
    async validateFailFast(context, categories) {
        const rules = categories
            ? this.registry.getRulesByCategories(categories)
            : this.registry.getEnabledRules();
        const allIssues = [];
        const violations = [];
        // Execute validators until critical violation found
        for (const rule of rules) {
            // Skip if path is excluded
            if (this.registry.isPathExcluded(rule, context.targetPath)) {
                continue;
            }
            const validator = this.validators.get(rule.validator);
            if (!validator) {
                continue;
            }
            try {
                const issues = await validator(context);
                // Check for critical violations
                const criticalIssues = issues.filter((issue) => issue.severity === 'critical');
                if (criticalIssues.length > 0) {
                    // Add only critical issues and stop
                    allIssues.push(...criticalIssues);
                    for (const issue of criticalIssues) {
                        violations.push(this.issueToViolation(issue, rule));
                    }
                    break;
                }
                // No critical issues, add all and continue
                allIssues.push(...issues);
                for (const issue of issues) {
                    violations.push(this.issueToViolation(issue, rule));
                }
            }
            catch (error) {
                console.error(`Error in rule "${rule.id}":`, error);
                // Critical error stops execution
                allIssues.push({
                    ruleId: rule.id,
                    severity: 'critical',
                    message: `Validator failed: ${error instanceof Error ? error.message : String(error)}`,
                    location: { path: context.targetPath },
                });
                break;
            }
        }
        const summary = this.calculator.calculateSummary(rules.length, allIssues);
        const compliant = this.calculator.isCompliant(summary);
        return {
            success: true,
            compliant,
            violations,
            summary,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Convert ValidationIssue to Violation
     */
    issueToViolation(issue, rule) {
        return {
            ruleId: issue.ruleId,
            ruleName: rule.name,
            category: rule.category,
            severity: issue.severity,
            message: issue.message,
            location: issue.location || { path: '' },
            suggestion: issue.suggestion || rule.documentation.fixes[0] || '',
            autoFixAvailable: issue.autoFixAvailable || !!rule.autoFix,
        };
    }
    /**
     * Get rules that would be executed for a context
     */
    getApplicableRules(context, categories) {
        const rules = categories
            ? this.registry.getRulesByCategories(categories)
            : this.registry.getEnabledRules();
        return rules.filter((rule) => !this.registry.isPathExcluded(rule, context.targetPath));
    }
}
/**
 * Create a configured rules engine instance
 */
export function createRulesEngine(registry, validators, calculator) {
    return new RulesEngine(registry, validators, calculator);
}
//# sourceMappingURL=rules-engine.js.map