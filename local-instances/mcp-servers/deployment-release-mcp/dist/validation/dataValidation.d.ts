import type { ValidationCheck } from "../types.js";
export interface DataValidationConfig {
    databaseConnections?: string[];
    migrationPaths?: string[];
    timeout?: number;
}
/**
 * Check database connectivity
 */
export declare function checkDatabaseConnections(connections?: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Verify database migrations are applied
 */
export declare function checkMigrations(projectPath: string, migrationPaths?: string[]): Promise<ValidationCheck>;
/**
 * Check data integrity
 */
export declare function checkDataIntegrity(projectPath: string): Promise<ValidationCheck>;
/**
 * Run all data validation checks
 */
export declare function runDataValidation(projectPath: string, config?: DataValidationConfig): Promise<ValidationCheck[]>;
//# sourceMappingURL=dataValidation.d.ts.map