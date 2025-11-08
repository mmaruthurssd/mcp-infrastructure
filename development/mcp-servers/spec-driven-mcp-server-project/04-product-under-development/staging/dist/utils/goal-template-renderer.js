/**
 * Goal Template Renderer
 * Renders goal workflow templates with camelCase variable support
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class GoalTemplateRenderer {
    templatesDir;
    constructor() {
        // Point to src/templates/goal-workflow/ directory
        this.templatesDir = path.join(__dirname, '..', 'templates', 'goal-workflow');
    }
    /**
     * Render a goal workflow template with the given context
     */
    render(templateName, context) {
        const templatePath = path.join(this.templatesDir, `${templateName}.md`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateName} at ${templatePath}`);
        }
        let template = fs.readFileSync(templatePath, 'utf-8');
        // Process template with camelCase support
        template = this.processConditionals(template, context);
        template = this.processLoops(template, context);
        template = this.replaceVariables(template, context);
        return template;
    }
    /**
     * Replace simple variables {{variableName}} (supports camelCase)
     */
    replaceVariables(template, context) {
        return template.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (match, variable) => {
            const value = context[variable];
            return value !== undefined && value !== null ? String(value) : '';
        });
    }
    /**
     * Process conditional blocks {{#if condition}}...{{/if}} or {{#if condition}}...{{else}}...{{/if}}
     */
    processConditionals(template, context) {
        // Match {{#if VAR}}...{{else}}...{{/if}} blocks (with else)
        const ifElseRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
        template = template.replace(ifElseRegex, (match, variable, ifContent, elseContent) => {
            const value = context[variable];
            // Include ifContent if variable is truthy, else include elseContent
            return this.isTruthy(value) ? ifContent : elseContent;
        });
        // Match {{#if VAR}}...{{/if}} blocks (without else)
        const ifRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        return template.replace(ifRegex, (match, variable, content) => {
            const value = context[variable];
            // Include content if variable is truthy
            return this.isTruthy(value) ? content : '';
        });
    }
    /**
     * Process loop blocks {{#each array}}...{{/each}}
     */
    processLoops(template, context) {
        // Match {{#each VAR}}...{{/each}} blocks
        const eachRegex = /\{\{#each\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{\/each\}\}/g;
        return template.replace(eachRegex, (match, variable, content) => {
            const array = context[variable];
            if (!Array.isArray(array) || array.length === 0) {
                return '';
            }
            // Render content for each item
            return array.map((item, index) => {
                let itemContent = content;
                // Replace {{@index}} with the array index (0-based)
                itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));
                // Replace {{this}} with the item (if it's a string or number)
                if (typeof item === 'string' || typeof item === 'number') {
                    itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
                }
                // Replace {{this.property}} with item properties
                if (typeof item === 'object' && item !== null) {
                    itemContent = itemContent.replace(/\{\{this\.([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_m, prop) => {
                        return item[prop] !== undefined && item[prop] !== null ? String(item[prop]) : '';
                    });
                    // Handle nested {{#if this.property}}
                    itemContent = itemContent.replace(/\{\{#if\s+this\.([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, prop, conditionalContent) => {
                        return this.isTruthy(item[prop]) ? conditionalContent : '';
                    });
                }
                return itemContent;
            }).join('');
        });
    }
    /**
     * Check if a value is truthy (non-empty string, non-zero number, true, non-empty array, non-null object)
     */
    isTruthy(value) {
        if (value === undefined || value === null)
            return false;
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string')
            return value.trim().length > 0;
        if (typeof value === 'number')
            return value !== 0;
        if (Array.isArray(value))
            return value.length > 0;
        if (typeof value === 'object')
            return Object.keys(value).length > 0;
        return false;
    }
    /**
     * Build context for potential goal template
     */
    static buildPotentialGoalContext(params) {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        return {
            goalName: params.goalName,
            createdDate: dateString,
            lastUpdated: dateString,
            goalDescription: params.goalDescription,
            context: params.context,
            impactScore: params.impactScore,
            impactReasoning: params.impactReasoning,
            peopleAffected: params.peopleAffected,
            problemSeverity: params.problemSeverity,
            strategicValue: params.strategicValue,
            impactConfidence: params.impactConfidence,
            effortScore: params.effortScore,
            effortReasoning: params.effortReasoning,
            timeEstimate: params.timeEstimate,
            technicalComplexity: params.technicalComplexity,
            dependenciesCount: params.dependenciesCount,
            scopeClarity: params.scopeClarity,
            effortConfidence: params.effortConfidence,
            suggestedTier: params.suggestedTier,
            suggestions: params.suggestions,
            nextSteps: params.nextSteps,
            userOverride: params.userOverride,
            problem: params.problem,
            expectedValue: params.expectedValue,
            effortDetails: params.effortDetails,
            dependencies: params.dependencies,
            risks: params.risks,
            alternatives: params.alternatives,
            decisionCriteria: params.decisionCriteria,
            notes: params.notes
        };
    }
    /**
     * Build context for selected goal entry template
     */
    static buildSelectedGoalContext(params) {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        return {
            goalId: params.goalId,
            goalName: params.goalName,
            status: params.status,
            priority: params.priority,
            impactScore: params.impactScore,
            effortScore: params.effortScore,
            owner: params.owner,
            targetDate: params.targetDate,
            description: params.description,
            dependencies: params.dependencies,
            blockers: params.blockers,
            progress: params.progress,
            nextAction: params.nextAction,
            potentialGoalFile: params.potentialGoalFile,
            formalPlanFile: params.formalPlanFile,
            lastUpdated: dateString
        };
    }
}
//# sourceMappingURL=goal-template-renderer.js.map