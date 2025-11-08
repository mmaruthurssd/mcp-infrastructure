/**
 * Template Renderer - Renders templates with context data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TemplateContext } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateRenderer {
  private templatesDir: string;

  constructor() {
    // Point to src/templates/ directory
    this.templatesDir = path.join(__dirname, '..', 'templates');
  }

  /**
   * Render a template with the given context
   */
  render(templateName: string, context: TemplateContext): string {
    const templatePath = path.join(this.templatesDir, 'base', `${templateName}.md`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let template = fs.readFileSync(templatePath, 'utf-8');

    // Simple template rendering (Handlebars-like syntax)
    template = this.replaceVariables(template, context);
    template = this.processConditionals(template, context);
    template = this.processLoops(template, context);

    return template;
  }

  /**
   * Replace simple variables {{VARIABLE_NAME}}
   */
  private replaceVariables(template: string, context: TemplateContext): string {
    return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, variable) => {
      const value = context[variable];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Process conditional blocks {{#if CONDITION}}...{{/if}}
   */
  private processConditionals(template: string, context: TemplateContext): string {
    // Match {{#if VAR}}...{{/if}} blocks
    const ifRegex = /\{\{#if\s+([A-Z_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(ifRegex, (match, variable, content) => {
      const value = context[variable];
      // Include content if variable is truthy
      return value ? content : '';
    });
  }

  /**
   * Process loop blocks {{#each ARRAY}}...{{/each}}
   */
  private processLoops(template: string, context: TemplateContext): string {
    // Match {{#each VAR}}...{{/each}} blocks
    const eachRegex = /\{\{#each\s+([A-Z_]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(eachRegex, (match, variable, content) => {
      const array = context[variable];

      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }

      // Render content for each item
      return array.map((item, index) => {
        let itemContent = content;

        // Replace {{this}} with the item (if it's a string)
        if (typeof item === 'string') {
          itemContent = itemContent.replace(/\{\{this\}\}/g, item);
        }

        // Replace {{this.property}} with item properties
        if (typeof item === 'object') {
          itemContent = itemContent.replace(/\{\{this\.([a-zA-Z_]+)\}\}/g, (_m: string, prop: string) => {
            return item[prop] !== undefined ? String(item[prop]) : _m;
          });

          // Handle nested {{#each this.property}}
          itemContent = itemContent.replace(/\{\{#each\s+this\.([a-zA-Z_]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
            (_m: string, prop: string, nestedContent: string) => {
              const nestedArray = item[prop];
              if (!Array.isArray(nestedArray)) return '';

              return nestedArray.map(nestedItem => {
                let nc = nestedContent;
                if (typeof nestedItem === 'string') {
                  nc = nc.replace(/\{\{this\}\}/g, nestedItem);
                } else if (typeof nestedItem === 'object') {
                  nc = nc.replace(/\{\{this\.([a-zA-Z_]+)\}\}/g, (_mm: string, p: string) => {
                    return nestedItem[p] !== undefined ? String(nestedItem[p]) : _mm;
                  });
                }
                return nc;
              }).join('\n');
            }
          );

          // Handle nested {{#if this.property}}
          itemContent = itemContent.replace(/\{\{#if\s+this\.([a-zA-Z_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
            (_m: string, prop: string, conditionalContent: string) => {
              return item[prop] ? conditionalContent : '';
            }
          );
        }

        return itemContent;
      }).join('\n');
    });
  }

  /**
   * Build template context from answers
   */
  buildContext(answers: Map<string, any>, step: string): TemplateContext {
    const context: TemplateContext = {
      CREATED_DATE: new Date().toISOString().split('T')[0],
      RATIFICATION_DATE: new Date().toISOString().split('T')[0],
      LAST_AMENDED_DATE: new Date().toISOString().split('T')[0],
      LAST_UPDATED: new Date().toISOString().split('T')[0],
      STATUS: 'Draft'
    };

    // Map answers to template variables
    for (const [key, value] of answers.entries()) {
      const upperKey = key.toUpperCase();
      context[upperKey] = value;
    }

    // Step-specific context building
    if (step === 'constitution') {
      context.TESTING_PRINCIPLE_NAME = context.TEST_FIRST_MANDATORY
        ? 'Test-First Development (NON-NEGOTIABLE)'
        : 'Testing Requirements';

      context.TESTING_REQUIREMENTS = this.buildTestingRequirements(answers);
      context.CODE_QUALITY_PRINCIPLE = 'Code Quality Standards';
      context.CODE_QUALITY_DESCRIPTION = this.buildCodeQualityDescription(answers);
      context.SIMPLICITY_PRINCIPLE = 'Simplicity First';
      context.SIMPLICITY_DESCRIPTION = 'Start with the simplest solution that meets requirements. Add complexity only when justified by real needs.';

      // Build approved technologies list
      if (context.TECH_STACK) {
        context.TECH_STACK_DESCRIPTION = `Primary technology stack: ${context.TECH_STACK}`;
        context.APPROVED_TECHNOLOGIES = [context.TECH_STACK];
      }

      // Build architecture description
      context.ARCHITECTURE_DESCRIPTION = 'Architecture must follow constitutional principles and support all functional requirements.';

      // Build testing gates
      context.TESTING_GATES = this.buildTestingGates(answers);

      context.CODE_REVIEW_ADDITIONAL = 'Constitutional compliance must be verified';
      context.DEPLOYMENT_STANDARDS = context.DEPLOYMENT_ENVIRONMENT
        ? `Deployment target: ${context.DEPLOYMENT_ENVIRONMENT}`
        : 'Deployment standards to be defined';
    }

    return context;
  }

  private buildTestingRequirements(answers: Map<string, any>): string {
    const testingReqs = answers.get('testing_requirements') || [];
    const requirements = [];

    if (testingReqs.includes('unit')) {
      requirements.push('Unit tests required for all business logic');
    }
    if (testingReqs.includes('integration')) {
      requirements.push('Integration tests required for external dependencies');
    }
    if (testingReqs.includes('e2e')) {
      requirements.push('End-to-end tests required for critical workflows');
    }
    if (testingReqs.includes('compliance')) {
      requirements.push('Compliance and security tests mandatory');
    }

    return requirements.length > 0 ? requirements.join('\n- ') : 'Testing requirements to be defined';
  }

  private buildCodeQualityDescription(answers: Map<string, any>): string {
    const standards = answers.get('code_quality_standards') || [];
    const descriptions = [];

    if (standards.includes('linting')) {
      descriptions.push('Code must pass linting checks');
    }
    if (standards.includes('formatting')) {
      descriptions.push('Consistent formatting enforced');
    }
    if (standards.includes('type_checking')) {
      descriptions.push('Type safety required');
    }
    if (standards.includes('code_review')) {
      descriptions.push('All code must be reviewed');
    }
    if (standards.includes('documentation')) {
      descriptions.push('Documentation required for public APIs');
    }

    return descriptions.length > 0
      ? `All code must meet the following standards:\n- ${descriptions.join('\n- ')}`
      : 'Standard code quality practices apply';
  }

  private buildTestingGates(answers: Map<string, any>): string {
    const testFirst = answers.get('test_first_mandatory');

    if (testFirst) {
      return '- Tests must be written and approved before implementation\n- All tests must pass before merging\n- Test coverage requirements must be met';
    }

    return '- All tests must pass before merging\n- New features must include appropriate tests';
  }
}
