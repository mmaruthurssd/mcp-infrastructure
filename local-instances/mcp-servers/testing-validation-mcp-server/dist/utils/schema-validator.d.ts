/**
 * SchemaValidator Utility
 *
 * Validates MCP tool parameter schemas to ensure they follow
 * proper JSON Schema structure and MCP standards.
 */
import type { ValidateToolSchemaOutput } from '../types.js';
export declare class SchemaValidator {
    private mcpPath;
    private toolName?;
    constructor(mcpPath: string, toolName?: string);
    /**
     * Validate tool schemas
     */
    validate(): Promise<ValidateToolSchemaOutput>;
    /**
     * Extract tool definitions from server.ts
     */
    private extractToolDefinitions;
    /**
     * Extract object from string (simple bracket matching)
     */
    private extractObject;
    /**
     * Parse schema string to object (simplified)
     */
    private parseSchemaString;
    /**
     * Validate individual tool schema
     */
    private validateToolSchema;
    /**
     * Validate schema structure
     */
    private validateSchemaStructure;
    /**
     * Extract parameters from schema
     */
    private extractParameters;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=schema-validator.d.ts.map