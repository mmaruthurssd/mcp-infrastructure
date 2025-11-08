/**
 * StandardsValidator Utility
 *
 * Validates MCP implementations against workspace standards:
 * - File structure (8-folder system)
 * - Naming conventions (kebab-case)
 * - Documentation standards (YAML frontmatter, required sections)
 * - Code standards (TypeScript, proper exports)
 * - MCP standards (tool schemas, SDK usage)
 */
import type { ValidateMcpImplementationOutput } from '../types.js';
export declare class StandardsValidator {
    private mcpPath;
    private standards;
    constructor(mcpPath: string, standards?: string[]);
    /**
     * Validate MCP implementation
     */
    validate(): Promise<ValidateMcpImplementationOutput>;
    /**
     * Validate file structure (8-folder system)
     */
    private validateFileStructure;
    /**
     * Validate naming conventions
     */
    private validateNaming;
    /**
     * Validate documentation standards
     */
    private validateDocumentation;
    /**
     * Validate code standards
     */
    private validateCode;
    /**
     * Validate MCP standards
     */
    private validateMcpStandards;
    /**
     * Generate recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Create empty compliance structure
     */
    private createEmptyCompliance;
}
//# sourceMappingURL=standards-validator.d.ts.map