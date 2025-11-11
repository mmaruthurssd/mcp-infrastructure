import { ValidationContext, ValidationIssue } from '../types/rules.js';
/**
 * Validate security practices
 */
export declare function validateSecurity(context: ValidationContext): Promise<ValidationIssue[]>;
/**
 * Validate HIPAA compliance for medical workspace
 */
export declare function validateHIPAACompliance(context: ValidationContext): Promise<ValidationIssue[]>;
//# sourceMappingURL=security.d.ts.map