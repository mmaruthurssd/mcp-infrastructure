/**
 * Rule Engine
 *
 * Intelligent rule matching system for workflow guidance
 * Analyzes project state and file system to suggest next actions
 */
import { ProjectState, WorkflowPhase } from '../types/project-state.js';
/**
 * Rule context - all information available for rule evaluation
 */
export interface RuleContext {
    projectPath: string;
    state: ProjectState;
}
/**
 * Rule condition - a single check that must pass
 */
export interface RuleCondition {
    description: string;
    check: (context: RuleContext) => boolean;
}
/**
 * Rule action - what to suggest when rule matches
 */
export interface RuleAction {
    message: string;
    reason: string | ((context: RuleContext) => string);
    tool: string;
    paramBuilder: (context: RuleContext) => any;
}
/**
 * Rule definition
 */
export interface Rule {
    id: string;
    priority: number;
    phase?: WorkflowPhase;
    conditions: RuleCondition[];
    action: RuleAction;
}
/**
 * Rule match result
 */
export interface RuleMatch {
    ruleId: string;
    priority: number;
    action: string;
    reason: string;
    tool: string;
    params: any;
}
/**
 * Rule Engine - evaluates rules and generates suggestions
 */
export declare class RuleEngine {
    private rules;
    constructor(rules?: Rule[], useDefaults?: boolean);
    /**
     * Load rules from configuration
     */
    loadRules(rules: Rule[]): void;
    /**
     * Add rules to existing set
     */
    addRules(rules: Rule[]): void;
    /**
     * Get all loaded rules
     */
    getRules(): Rule[];
    /**
     * Clear all rules
     */
    clearRules(): void;
    /**
     * Evaluate all rules and return matches sorted by priority
     */
    evaluate(context: RuleContext): RuleMatch[];
    /**
     * Add a custom rule
     */
    addRule(rule: Rule): void;
    /**
     * Initialize default workflow rules
     */
    private initializeDefaultRules;
    /**
     * Helper: Check if file exists relative to project path
     */
    private fileExists;
}
//# sourceMappingURL=rule-engine.d.ts.map