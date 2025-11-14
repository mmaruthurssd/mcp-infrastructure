/**
 * Phase 5: Component Documentation Validator
 */
import type { ComponentType, ValidationResult } from './types.js';
export declare class ComponentValidator {
    private projectRoot;
    constructor(projectRoot: string);
    validateComponentDocumentation(componentName: string, location: string, type: ComponentType, isCritical?: boolean, isPermanent?: boolean): Promise<ValidationResult>;
    private requirementApplies;
    private checkRequirement;
    validateMultipleComponents(components: Array<{
        name: string;
        location: string;
        type: ComponentType;
        isCritical?: boolean;
        isPermanent?: boolean;
    }>): Promise<ValidationResult[]>;
    getDocumentationGaps(): Promise<{
        missingFromSystemComponents: number;
        missingFromWorkspaceArchitecture: number;
        missingFromStartHere: number;
        totalGaps: number;
    }>;
}
