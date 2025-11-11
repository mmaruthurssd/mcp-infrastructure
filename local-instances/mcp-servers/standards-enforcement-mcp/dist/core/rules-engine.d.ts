import { StandardRule, ValidationContext, RuleCategory, ValidatorFunction } from '../types/rules.js';
import { ValidationResult } from '../types/validation.js';
import { RulesRegistryManager } from './rules-registry.js';
import { ComplianceCalculator } from './compliance-calculator.js';
/**
 * Validator function registry
 * Maps validator function names to actual implementations
 */
export declare class ValidatorRegistry {
    private validators;
    /**
     * Register a validator function
     */
    register(name: string, fn: ValidatorFunction): void;
    /**
     * Get validator function by name
     */
    get(name: string): ValidatorFunction | undefined;
    /**
     * Check if validator exists
     */
    has(name: string): boolean;
}
/**
 * Rules Engine
 * Orchestrates validation execution
 */
export declare class RulesEngine {
    private registry;
    private validators;
    private calculator;
    constructor(registry: RulesRegistryManager, validators: ValidatorRegistry, calculator: ComplianceCalculator);
    /**
     * Validate using all enabled rules
     */
    validate(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Validate using rules from specific categories
     */
    validateCategories(context: ValidationContext, categories: RuleCategory[]): Promise<ValidationResult>;
    /**
     * Validate using specific rules
     */
    validateWithRules(context: ValidationContext, rules: StandardRule[]): Promise<ValidationResult>;
    /**
     * Validate with fail-fast mode
     * Stops on first critical violation
     */
    validateFailFast(context: ValidationContext, categories?: RuleCategory[]): Promise<ValidationResult>;
    /**
     * Convert ValidationIssue to Violation
     */
    private issueToViolation;
    /**
     * Get rules that would be executed for a context
     */
    getApplicableRules(context: ValidationContext, categories?: RuleCategory[]): StandardRule[];
}
/**
 * Create a configured rules engine instance
 */
export declare function createRulesEngine(registry: RulesRegistryManager, validators: ValidatorRegistry, calculator: ComplianceCalculator): RulesEngine;
//# sourceMappingURL=rules-engine.d.ts.map