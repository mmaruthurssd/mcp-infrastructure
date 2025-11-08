/**
 * Evaluate Goal Tool
 *
 * Analyzes a goal description to estimate Impact, Effort, and suggest a tier.
 * Uses AI-assisted heuristics to help prioritize goals in the workflow.
 */
import { ImpactEstimator } from '../evaluators/impact-estimator.js';
import { EffortEstimator } from '../evaluators/effort-estimator.js';
import { TierSuggester } from '../evaluators/tier-suggester.js';
export class EvaluateGoalTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'evaluate_goal',
            description: 'Analyze a goal description to estimate Impact (High/Med/Low), Effort (High/Med/Low), and suggest a tier (Now/Next/Later/Someday). Helps prioritize goals in the workflow.',
            inputSchema: {
                type: 'object',
                properties: {
                    goalDescription: {
                        type: 'string',
                        description: 'Description of the goal or idea to evaluate (what you want to accomplish)'
                    },
                    context: {
                        type: 'string',
                        description: 'Optional additional context about the project, users, or constraints'
                    },
                    projectType: {
                        type: 'string',
                        description: 'Optional project type (e.g., "medical", "healthcare", "ecommerce") for domain-specific evaluation'
                    }
                },
                required: ['goalDescription']
            }
        };
    }
    /**
     * Execute goal evaluation
     */
    static execute(args) {
        const { goalDescription, context, projectType } = args;
        // Estimate Impact
        const impactEstimate = ImpactEstimator.estimate(goalDescription, context, projectType);
        // Estimate Effort
        const effortEstimate = EffortEstimator.estimate(goalDescription, context, projectType);
        // Suggest Tier
        const tierSuggestion = TierSuggester.suggest(impactEstimate, effortEstimate);
        // Generate suggestions for improving the evaluation
        const suggestions = this.generateSuggestions(impactEstimate, effortEstimate, tierSuggestion);
        // Generate next steps based on the tier
        const nextSteps = this.generateNextSteps(tierSuggestion.tier);
        return {
            impact: impactEstimate,
            effort: effortEstimate,
            tier: tierSuggestion,
            suggestions,
            nextSteps
        };
    }
    /**
     * Generate suggestions for improving the evaluation
     */
    static generateSuggestions(impactEstimate, effortEstimate, tierSuggestion) {
        const suggestions = [];
        // Low confidence suggestions
        if (impactEstimate.confidence === 'Low') {
            suggestions.push('Impact estimate has low confidence. Consider adding more context about who benefits and how.');
        }
        if (effortEstimate.confidence === 'Low') {
            suggestions.push('Effort estimate has low confidence. Consider breaking down the goal into more specific tasks or providing time estimates.');
        }
        if (tierSuggestion.confidence === 'Low') {
            suggestions.push('Overall tier suggestion has low confidence. Review the 7 evaluation questions for deeper analysis.');
        }
        // Impact-specific suggestions
        if (impactEstimate.factors.people_affected < 5) {
            suggestions.push('Consider: Could this benefit more people if scoped differently?');
        }
        if (impactEstimate.factors.problem_severity === 'Low') {
            suggestions.push('Consider: Is this solving a real pain point or just a nice-to-have?');
        }
        // Effort-specific suggestions
        if (effortEstimate.factors.dependencies_count >= 3) {
            suggestions.push('High dependency count detected. Consider documenting blockers and prerequisites.');
        }
        if (effortEstimate.factors.scope_clarity === 'Low') {
            suggestions.push('Scope is unclear. Consider answering: What exactly needs to be built? What are the acceptance criteria?');
        }
        if (effortEstimate.factors.technical_complexity === 'High') {
            suggestions.push('High technical complexity. Consider breaking into smaller, incremental milestones.');
        }
        // Time-based suggestions
        if (effortEstimate.factors.time_estimate.includes('month')) {
            suggestions.push('Estimated effort is multiple months. Consider using spec-driven MCP to create formal plan (constitution, spec, tasks).');
        }
        return suggestions;
    }
    /**
     * Generate next steps based on tier
     */
    static generateNextSteps(tier) {
        const nextSteps = [];
        switch (tier) {
            case 'Now':
                nextSteps.push('Create a potential goal file: `potential-goals/[goal-name].md`');
                nextSteps.push('Review the AI estimates and add any user overrides if needed');
                nextSteps.push('If you agree with the evaluation, promote to SELECTED-GOALS.md');
                nextSteps.push('For goals <2 weeks, just track in SELECTED-GOALS.md');
                nextSteps.push('For goals >2 weeks, consider using spec-driven MCP for formal planning');
                break;
            case 'Next':
                nextSteps.push('Create a potential goal file: `potential-goals/[goal-name].md`');
                nextSteps.push('Answer the 7 evaluation questions to refine scope and approach');
                nextSteps.push('Document dependencies and identify any blockers');
                nextSteps.push('When ready to commit, promote to SELECTED-GOALS.md with High priority');
                nextSteps.push('Use spec-driven MCP to generate constitution, specification, plan, and tasks');
                break;
            case 'Later':
                nextSteps.push('Create a potential goal file: `potential-goals/[goal-name].md`');
                nextSteps.push('Keep in potential goals until higher-priority items are complete');
                nextSteps.push('Review monthly to see if priority has changed');
                nextSteps.push('Consider: Could this be combined with other "Later" goals for better ROI?');
                break;
            case 'Someday':
                nextSteps.push('Document in brainstorming or create potential goal file for future reference');
                nextSteps.push('Consider: Is there a simpler version that would have better ROI?');
                nextSteps.push('Consider: What would need to change for this to become worth pursuing?');
                nextSteps.push('Archive with "why-not" reasoning if you decide not to pursue');
                break;
        }
        return nextSteps;
    }
    /**
     * Format evaluation result for display
     */
    static formatResult(result) {
        let output = '# Goal Evaluation Result\n\n';
        // Tier summary
        output += `## Suggested Tier: **${result.tier.tier}**\n\n`;
        output += `${result.tier.reasoning}\n\n`;
        // Show alternative tiers if any
        if (result.tier.alternativeTiers && result.tier.alternativeTiers.length > 0) {
            output += `### Alternative Considerations:\n\n`;
            result.tier.alternativeTiers.forEach(alt => {
                output += `- **${alt.tier}**: ${alt.reason}\n`;
            });
            output += '\n';
        }
        // Impact details
        output += `## Impact Analysis\n\n`;
        output += `**Score:** ${result.impact.score}\n\n`;
        output += `**Reasoning:** ${result.impact.reasoning}\n\n`;
        output += `**Factors:**\n`;
        output += `- People Affected: ~${result.impact.factors.people_affected}\n`;
        output += `- Problem Severity: ${result.impact.factors.problem_severity}\n`;
        output += `- Strategic Value: ${result.impact.factors.strategic_value}\n`;
        output += `- Confidence: ${result.impact.confidence}\n\n`;
        // Effort details
        output += `## Effort Analysis\n\n`;
        output += `**Score:** ${result.effort.score}\n\n`;
        output += `**Reasoning:** ${result.effort.reasoning}\n\n`;
        output += `**Factors:**\n`;
        output += `- Time Estimate: ${result.effort.factors.time_estimate}\n`;
        output += `- Technical Complexity: ${result.effort.factors.technical_complexity}\n`;
        output += `- Dependencies: ${result.effort.factors.dependencies_count}\n`;
        output += `- Scope Clarity: ${result.effort.factors.scope_clarity}\n`;
        output += `- Confidence: ${result.effort.confidence}\n\n`;
        // Suggestions
        if (result.suggestions.length > 0) {
            output += `## Suggestions for Refinement\n\n`;
            result.suggestions.forEach(suggestion => {
                output += `- ${suggestion}\n`;
            });
            output += '\n';
        }
        // Next steps
        output += `## Recommended Next Steps\n\n`;
        result.nextSteps.forEach((step, i) => {
            output += `${i + 1}. ${step}\n`;
        });
        return output;
    }
}
//# sourceMappingURL=evaluate-goal.js.map