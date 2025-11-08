import type { GenerateUnitTestsParams, GenerateIntegrationTestsParams, AnalyzeCoverageGapsParams, SuggestTestScenariosParams } from '../types/index.js';
/**
 * Validate generate_unit_tests parameters
 */
export declare function validateUnitTestParams(params: GenerateUnitTestsParams): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Validate generate_integration_tests parameters
 */
export declare function validateIntegrationTestParams(params: GenerateIntegrationTestsParams): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Validate analyze_coverage_gaps parameters
 */
export declare function validateCoverageParams(params: AnalyzeCoverageGapsParams): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Validate suggest_test_scenarios parameters
 */
export declare function validateScenariosParams(params: SuggestTestScenariosParams): Promise<{
    valid: boolean;
    error?: string;
}>;
//# sourceMappingURL=validation-utils.d.ts.map