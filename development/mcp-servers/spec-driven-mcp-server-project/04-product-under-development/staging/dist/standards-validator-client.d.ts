/**
 * Standards Enforcement MCP Client
 *
 * Reusable helper for calling standards-enforcement-mcp from other MCPs
 * Can be copied into any MCP that needs to validate compliance
 */
/**
 * Validation result from standards-enforcement-mcp
 */
export interface StandardsValidationResult {
    success: boolean;
    compliant: boolean;
    violations: Array<{
        ruleId: string;
        ruleName: string;
        category: string;
        severity: 'critical' | 'warning' | 'info';
        message: string;
        location: {
            path: string;
            line?: number;
        };
        suggestion: string;
        autoFixAvailable: boolean;
    }>;
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
        complianceScore: number;
    };
    timestamp: string;
}
/**
 * Standards validation options
 */
export interface StandardsValidationOptions {
    mcpName: string;
    categories?: string[];
    failFast?: boolean;
    includeWarnings?: boolean;
}
/**
 * Standards Validator Client
 * Calls standards-enforcement-mcp to validate compliance
 */
export declare class StandardsValidator {
    private standardsMcpPath;
    constructor();
    /**
     * Validate MCP compliance
     */
    validateMcpCompliance(options: StandardsValidationOptions): Promise<StandardsValidationResult>;
    /**
     * Check if MCP passes compliance
     * Returns true if compliant, throws error with details if not
     */
    requireCompliance(options: StandardsValidationOptions): Promise<void>;
    /**
     * Check compliance and return boolean (non-throwing)
     */
    isCompliant(options: StandardsValidationOptions): Promise<boolean>;
    /**
     * Get compliance score (0-100)
     */
    getComplianceScore(options: StandardsValidationOptions): Promise<number>;
    /**
     * Internal: Call a standards-enforcement-mcp tool
     */
    private callStandardsTool;
    /**
     * Parse markdown result from MCP (temporary implementation)
     * TODO: Return structured JSON from MCP instead of markdown
     */
    private parseMarkdownResult;
}
/**
 * Singleton instance
 */
export declare const standardsValidator: StandardsValidator;
/**
 * Quick validation functions
 */
/**
 * Validate MCP compliance (throws on failure)
 */
export declare function validateOrThrow(mcpName: string, categories?: string[]): Promise<void>;
/**
 * Check if MCP is compliant (boolean)
 */
export declare function isCompliant(mcpName: string, categories?: string[]): Promise<boolean>;
/**
 * Get compliance score (0-100)
 */
export declare function getComplianceScore(mcpName: string): Promise<number>;
//# sourceMappingURL=standards-validator-client.d.ts.map