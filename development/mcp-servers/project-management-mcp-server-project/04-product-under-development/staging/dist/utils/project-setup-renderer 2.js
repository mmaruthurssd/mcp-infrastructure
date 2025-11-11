/**
 * Project Setup Template Renderer
 * Enhanced template renderer supporting nested structures and property paths
 */
import * as fs from 'fs';
export class ProjectSetupRenderer {
    /**
     * Render a template file with the given data
     */
    static render(templatePath, data) {
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        let content = fs.readFileSync(templatePath, 'utf-8');
        return this.renderContent(content, data);
    }
    /**
     * Render template content with data (recursive for nested structures)
     */
    static renderContent(content, data) {
        // Keep processing until no more template syntax remains (handles nested structures)
        let previousContent = '';
        let iterations = 0;
        const maxIterations = 10; // Prevent infinite loops
        while (content !== previousContent && iterations < maxIterations) {
            previousContent = content;
            // 1. Process {{#each}} blocks (will recurse for nested loops)
            content = this.processEach(content, data);
            // 2. Process {{#if}}...{{else}}...{{/if}} blocks
            content = this.processIfElse(content, data);
            // 3. Process simple {{#if}}...{{/if}} blocks (no else)
            content = this.processIf(content, data);
            // 4. Replace simple variables with property path support
            content = this.replaceVariables(content, data);
            iterations++;
        }
        return content;
    }
    /**
     * Process {{#each array}}...{{/each}} blocks
     */
    static processEach(content, data) {
        const eachRegex = /\{\{#each\s+([a-zA-Z_][a-zA-Z0-9_.]*)\}\}([\s\S]*?)\{\{\/each\}\}/g;
        return content.replace(eachRegex, (_match, path, loopContent) => {
            const array = this.getPropertyByPath(data, path);
            if (!Array.isArray(array) || array.length === 0) {
                return '';
            }
            return array.map((item, index) => {
                let itemContent = loopContent;
                // Replace {{@index}} (1-based)
                itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));
                // Replace {{@index0}} (0-based)
                itemContent = itemContent.replace(/\{\{@index0\}\}/g, String(index));
                // Custom helper: {{add @index 1}}
                itemContent = itemContent.replace(/\{\{add @index (\d+)\}\}/g, (_m, num) => {
                    return String(index + parseInt(num));
                });
                // Handle {{#unless @last}}
                itemContent = itemContent.replace(/\{\{#unless @last\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_m, conditionalContent) => {
                    return index < array.length - 1 ? conditionalContent : '';
                });
                // Replace {{this.property}} and {{this}}
                if (typeof item === 'object' && item !== null) {
                    // Handle nested {{#if this.property}}
                    itemContent = itemContent.replace(/\{\{#if\s+this\.([a-zA-Z_][a-zA-Z0-9_.]*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, prop, conditionalContent) => {
                        const value = this.getPropertyByPath(item, prop);
                        return this.isTruthy(value) ? conditionalContent : '';
                    });
                    // Replace {{this.property}}
                    itemContent = itemContent.replace(/\{\{this\.([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (_m, prop) => {
                        const value = this.getPropertyByPath(item, prop);
                        return value !== undefined && value !== null ? String(value) : '';
                    });
                }
                // Handle scalar items
                if (typeof item === 'string' || typeof item === 'number') {
                    itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
                }
                return itemContent;
            }).join('');
        });
    }
    /**
     * Process {{#if condition}}...{{else}}...{{/if}} blocks
     */
    static processIfElse(content, data) {
        const ifElseRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_.]*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
        return content.replace(ifElseRegex, (_match, path, ifContent, elseContent) => {
            const value = this.getPropertyByPath(data, path);
            return this.isTruthy(value) ? ifContent : elseContent;
        });
    }
    /**
     * Process {{#if condition}}...{{/if}} blocks (no else)
     */
    static processIf(content, data) {
        const ifRegex = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_.]*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        return content.replace(ifRegex, (_match, path, ifContent) => {
            const value = this.getPropertyByPath(data, path);
            return this.isTruthy(value) ? ifContent : '';
        });
    }
    /**
     * Replace simple variables {{variableName}} or {{object.property}}
     */
    static replaceVariables(content, data) {
        return content.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (_match, path) => {
            const value = this.getPropertyByPath(data, path);
            return value !== undefined && value !== null ? String(value) : '';
        });
    }
    /**
     * Get property value by path (supports dot notation: "user.name", "array.length")
     */
    static getPropertyByPath(obj, path) {
        if (!path)
            return obj;
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
     * Check if value is truthy for template conditionals
     */
    static isTruthy(value) {
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
}
//# sourceMappingURL=project-setup-renderer%202.js.map