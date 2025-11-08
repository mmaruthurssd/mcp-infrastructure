/**
 * Workflow Rule Schema
 *
 * Defines the structure for workflow rules that can be evaluated
 * by the RuleEngine to suggest next actions.
 */
/**
 * Helper function to evaluate a condition
 */
export function evaluateCondition(condition, context) {
    switch (condition.type) {
        case 'phase':
            return evaluatePhaseCondition(condition, context);
        case 'step':
            return evaluateStepCondition(condition, context);
        case 'field':
            return evaluateFieldCondition(condition, context);
        case 'composite':
            return evaluateCompositeCondition(condition, context);
        default:
            return false;
    }
}
function evaluatePhaseCondition(condition, context) {
    const currentPhase = context.state.currentPhase;
    if (Array.isArray(condition.phase)) {
        return condition.phase.includes(currentPhase);
    }
    return currentPhase === condition.phase;
}
function evaluateStepCondition(condition, context) {
    const currentStep = context.state.currentStep;
    if (Array.isArray(condition.step)) {
        return condition.step.includes(currentStep);
    }
    return currentStep === condition.step;
}
function evaluateFieldCondition(condition, context) {
    if (!condition.fieldPath || !condition.operator) {
        return false;
    }
    const fieldValue = getFieldValue(context.state, condition.fieldPath);
    switch (condition.operator) {
        case 'equals':
            return fieldValue === condition.value;
        case 'notEquals':
            return fieldValue !== condition.value;
        case 'greaterThan':
            return fieldValue > condition.value;
        case 'lessThan':
            return fieldValue < condition.value;
        case 'contains':
            return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
        case 'notContains':
            return Array.isArray(fieldValue) && !fieldValue.includes(condition.value);
        case 'exists':
            return fieldValue !== undefined && fieldValue !== null;
        case 'notExists':
            return fieldValue === undefined || fieldValue === null;
        default:
            return false;
    }
}
function evaluateCompositeCondition(condition, context) {
    if (condition.and) {
        return condition.and.every(c => evaluateCondition(c, context));
    }
    if (condition.or) {
        return condition.or.some(c => evaluateCondition(c, context));
    }
    if (condition.not) {
        return !evaluateCondition(condition.not, context);
    }
    return false;
}
function getFieldValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}
/**
 * Example rule definition
 */
export const EXAMPLE_RULE = {
    id: 'init-001',
    name: 'Start Project Setup',
    description: 'Initialize project when no state exists',
    priority: 90,
    condition: {
        type: 'composite',
        and: [
            { type: 'phase', phase: 'initialization' },
            { type: 'step', step: 'create-structure' },
            { type: 'field', fieldPath: 'goals.selected.length', operator: 'equals', value: 0 }
        ]
    },
    action: {
        actionText: 'Start project setup conversation',
        reason: 'No goals exist yet - gather requirements first',
        tool: 'start_project_setup',
        params: {
            projectPath: '{{projectPath}}',
            constitutionMode: 'quick'
        },
        estimatedTime: '10 minutes',
        tags: ['initialization', 'required']
    }
};
//# sourceMappingURL=rule-schema.js.map