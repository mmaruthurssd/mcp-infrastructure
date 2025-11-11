/**
 * Project Setup Template Renderer
 * Enhanced template renderer supporting nested structures and property paths
 */
export declare class ProjectSetupRenderer {
    /**
     * Render a template file with the given data
     */
    static render(templatePath: string, data: any): string;
    /**
     * Render template content with data (recursive for nested structures)
     */
    private static renderContent;
    /**
     * Process {{#each array}}...{{/each}} blocks
     */
    private static processEach;
    /**
     * Process {{#if condition}}...{{else}}...{{/if}} blocks
     */
    private static processIfElse;
    /**
     * Process {{#if condition}}...{{/if}} blocks (no else)
     */
    private static processIf;
    /**
     * Replace simple variables {{variableName}} or {{object.property}}
     */
    private static replaceVariables;
    /**
     * Get property value by path (supports dot notation: "user.name", "array.length")
     */
    private static getPropertyByPath;
    /**
     * Check if value is truthy for template conditionals
     */
    private static isTruthy;
}
//# sourceMappingURL=project-setup-renderer.d.ts.map