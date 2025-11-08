export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export declare function validateComponent(data: any): ValidationResult;
export declare function validateProjectOverview(data: any): ValidationResult;
export declare function validateMajorGoal(data: any): ValidationResult;
//# sourceMappingURL=validators.d.ts.map