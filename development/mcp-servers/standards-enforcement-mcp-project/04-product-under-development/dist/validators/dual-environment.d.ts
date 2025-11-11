import { ValidationContext, ValidationIssue } from '../types/rules.js';
/**
 * Dual-Environment Validator
 * Ensures MCPs exist in both development and production environments
 */
/**
 * Check if MCP has both development and production versions
 */
export declare function validateDualEnvironment(context: ValidationContext): Promise<ValidationIssue[]>;
/**
 * Validate development-to-production sync
 * Checks if production version is in sync with development
 */
export declare function validateDevProdSync(context: ValidationContext): Promise<ValidationIssue[]>;
//# sourceMappingURL=dual-environment.d.ts.map