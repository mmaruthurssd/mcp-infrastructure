/**
 * Goal Template Renderer
 * Renders goal workflow templates with camelCase variable support
 */
export interface GoalTemplateContext {
    [key: string]: any;
}
export declare class GoalTemplateRenderer {
    private templatesDir;
    constructor();
    /**
     * Render a goal workflow template with the given context
     */
    render(templateName: string, context: GoalTemplateContext): string;
    /**
     * Replace simple variables {{variableName}} (supports camelCase)
     */
    private replaceVariables;
    /**
     * Process conditional blocks {{#if condition}}...{{/if}} or {{#if condition}}...{{else}}...{{/if}}
     */
    private processConditionals;
    /**
     * Process loop blocks {{#each array}}...{{/each}}
     */
    private processLoops;
    /**
     * Check if a value is truthy (non-empty string, non-zero number, true, non-empty array, non-null object)
     */
    private isTruthy;
    /**
     * Build context for potential goal template
     */
    static buildPotentialGoalContext(params: {
        goalName: string;
        goalDescription: string;
        context?: string;
        impactScore: string;
        impactReasoning: string;
        peopleAffected: number;
        problemSeverity: string;
        strategicValue: string;
        impactConfidence: string;
        effortScore: string;
        effortReasoning: string;
        timeEstimate: string;
        technicalComplexity: string;
        dependenciesCount: number;
        scopeClarity: string;
        effortConfidence: string;
        suggestedTier: string;
        suggestions?: string[];
        nextSteps?: string[];
        userOverride?: string;
        problem?: string;
        expectedValue?: string;
        effortDetails?: string;
        dependencies?: string;
        risks?: string;
        alternatives?: string;
        decisionCriteria?: string;
        notes?: string;
    }): GoalTemplateContext;
    /**
     * Build context for selected goal entry template
     */
    static buildSelectedGoalContext(params: {
        goalId: string;
        goalName: string;
        status: string;
        priority: string;
        impactScore: string;
        effortScore: string;
        owner: string;
        targetDate: string;
        description: string;
        dependencies?: string;
        blockers?: string;
        progress?: string;
        nextAction?: string;
        potentialGoalFile?: string;
        formalPlanFile?: string;
    }): GoalTemplateContext;
}
//# sourceMappingURL=goal-template-renderer.d.ts.map