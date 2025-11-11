export interface ValidationIssue {
    severity: 'critical' | 'warning' | 'info';
    category: string;
    file: string;
    line?: number;
    expected: string;
    actual: string;
    suggestion: string;
}
export interface ValidationResult {
    valid: boolean;
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
    };
    issues: ValidationIssue[];
    lastValidated: string;
}
export interface ValidationOptions {
    checks?: Array<'mcp_counts' | 'template_inventory' | 'status_accuracy' | 'cross_references' | 'all'>;
    targets?: string[];
    reportFormat?: 'summary' | 'detailed' | 'actionable';
    autoFix?: boolean;
}
export declare class DocumentationValidator {
    private projectRoot;
    constructor(projectRoot: string);
    validate(options?: ValidationOptions): Promise<ValidationResult>;
    /**
     * Validation Rule 1: MCP Counts
     * Scans local-instances/mcp-servers/, compares against documentation
     */
    private validateMCPCounts;
    /**
     * Validation Rule 2: Template Inventory
     * Scans templates-and-patterns/mcp-server-templates/templates/, compares against TEMPLATES_INDEX.md
     */
    private validateTemplateInventory;
    /**
     * Validation Rule 3: Status Accuracy
     * Checks archive/ vs active directories, validates documentation status references
     */
    private validateStatusAccuracy;
    /**
     * Validation Rule 4: Cross-References
     * Checks file paths, MCP names, links are accurate
     */
    private validateCrossReferences;
    /**
     * Validation Rule 5: Architecture Documentation
     * Validates STANDARDS_ENFORCEMENT_SYSTEM.md and MCP_ECOSYSTEM.md against filesystem reality
     */
    private validateArchitectureDocs;
}
