import { ValidationContext, ValidationIssue } from '../types/rules.js';
/**
 * Validate project structure
 */
export declare function validateProjectStructure(context: ValidationContext): Promise<ValidationIssue[]>;
/**
 * Validate 8-folder structure (strict mode)
 */
export declare function validateEightFolderStructureStrict(context: ValidationContext): Promise<ValidationIssue[]>;
/**
 * Validate 4-folder structure (simplified mode)
 */
export declare function validateFourFolderStructure(context: ValidationContext): Promise<ValidationIssue[]>;
//# sourceMappingURL=project-structure.d.ts.map