/**
 * Workflow Rule Schema
 *
 * Defines the structure for workflow rules that can be evaluated
 * by the RuleEngine to suggest next actions.
 */
export interface WorkflowRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    condition: RuleCondition;
    action: RuleAction;
}
/**
 * Rule Condition - determines when a rule matches
 */
export interface RuleCondition {
    type: 'phase' | 'step' | 'field' | 'composite';
    phase?: string | string[];
    step?: string | string[];
    fieldPath?: string;
    operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'notContains' | 'exists' | 'notExists';
    value?: any;
    and?: RuleCondition[];
    or?: RuleCondition[];
    not?: RuleCondition;
}
/**
 * Rule Action - what to suggest when rule matches
 */
export interface RuleAction {
    actionText: string;
    reason: string;
    tool: string;
    params: Record<string, any>;
    estimatedTime?: string;
    dependencies?: string[];
    tags?: string[];
}
/**
 * Rule Set - collection of rules for a workflow type
 */
export interface WorkflowRuleSet {
    workflowType: string;
    version: string;
    description: string;
    rules: WorkflowRule[];
}
/**
 * Rule Match Result - returned by RuleEngine
 */
export interface RuleMatch {
    ruleId: string;
    priority: number;
    action: string;
    reason: string;
    tool: string;
    params: Record<string, any>;
    estimatedTime?: string;
}
/**
 * Rule Evaluation Context - passed to RuleEngine
 */
export interface RuleEvaluationContext {
    projectPath: string;
    state: any;
    currentTime?: Date;
    customData?: Record<string, any>;
}
/**
 * Helper function to evaluate a condition
 */
export declare function evaluateCondition(condition: RuleCondition, context: RuleEvaluationContext): boolean;
/**
 * Example rule definition
 */
export declare const EXAMPLE_RULE: WorkflowRule;
//# sourceMappingURL=rule-schema.d.ts.map