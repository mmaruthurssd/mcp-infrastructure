import type { ValidationCheck } from "../types.js";
export interface SmokeTestConfig {
    apiEndpoints?: string[];
    criticalWorkflows?: string[];
    timeout?: number;
}
/**
 * Run smoke tests on API endpoints
 */
export declare function runApiSmokeTests(endpoints: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Test critical workflows
 */
export declare function testCriticalWorkflows(workflows: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Run all functional validation checks
 */
export declare function runFunctionalValidation(config?: SmokeTestConfig): Promise<ValidationCheck[]>;
//# sourceMappingURL=smokeTests.d.ts.map