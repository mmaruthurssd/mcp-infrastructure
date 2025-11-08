/**
 * Template Renderer - Renders templates with context data
 */
import { TemplateContext } from '../types.js';
export declare class TemplateRenderer {
    private templatesDir;
    constructor();
    /**
     * Render a template with the given context
     */
    render(templateName: string, context: TemplateContext): string;
    /**
     * Replace simple variables {{VARIABLE_NAME}}
     */
    private replaceVariables;
    /**
     * Process conditional blocks {{#if CONDITION}}...{{/if}}
     */
    private processConditionals;
    /**
     * Process loop blocks {{#each ARRAY}}...{{/each}}
     */
    private processLoops;
    /**
     * Build template context from answers
     */
    buildContext(answers: Map<string, any>, step: string): TemplateContext;
    private buildTestingRequirements;
    private buildCodeQualityDescription;
    private buildTestingGates;
}
//# sourceMappingURL=template-renderer.d.ts.map