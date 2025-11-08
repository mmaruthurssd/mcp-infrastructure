import type {
  GenerateUnitTestsParams,
  GenerateIntegrationTestsParams,
  AnalyzeCoverageGapsParams,
  SuggestTestScenariosParams
} from '../types/index.js';
import { validateFilePath, validateFileExtension } from './file-utils.js';

/**
 * Validate generate_unit_tests parameters
 */
export async function validateUnitTestParams(params: GenerateUnitTestsParams): Promise<{ valid: boolean; error?: string }> {
  // Validate sourceFile
  const pathValidation = await validateFilePath(params.sourceFile);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  // Validate file extension
  const extValidation = validateFileExtension(params.sourceFile, ['.ts', '.js', '.tsx', '.jsx']);
  if (!extValidation.valid) {
    return extValidation;
  }

  // Validate framework
  if (params.framework && !['jest', 'mocha', 'vitest'].includes(params.framework)) {
    return { valid: false, error: 'Invalid framework. Must be: jest, mocha, or vitest' };
  }

  // Validate coverage
  if (params.coverage && !['basic', 'comprehensive', 'edge-cases'].includes(params.coverage)) {
    return { valid: false, error: 'Invalid coverage. Must be: basic, comprehensive, or edge-cases' };
  }

  return { valid: true };
}

/**
 * Validate generate_integration_tests parameters
 */
export async function validateIntegrationTestParams(params: GenerateIntegrationTestsParams): Promise<{ valid: boolean; error?: string }> {
  // Validate targetModule
  const pathValidation = await validateFilePath(params.targetModule);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  // Validate file extension
  const extValidation = validateFileExtension(params.targetModule, ['.ts', '.js', '.tsx', '.jsx']);
  if (!extValidation.valid) {
    return extValidation;
  }

  // Validate framework
  if (params.framework && !['jest', 'supertest'].includes(params.framework)) {
    return { valid: false, error: 'Invalid framework. Must be: jest or supertest' };
  }

  // Validate scenarios
  if (params.scenarios) {
    for (const scenario of params.scenarios) {
      if (!scenario.name || !scenario.endpoint || !scenario.method) {
        return { valid: false, error: 'Each scenario must have name, endpoint, and method' };
      }

      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(scenario.method)) {
        return { valid: false, error: `Invalid HTTP method: ${scenario.method}` };
      }

      if (typeof scenario.expectedStatus !== 'number' || scenario.expectedStatus < 100 || scenario.expectedStatus > 599) {
        return { valid: false, error: `Invalid HTTP status code: ${scenario.expectedStatus}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate analyze_coverage_gaps parameters
 */
export async function validateCoverageParams(params: AnalyzeCoverageGapsParams): Promise<{ valid: boolean; error?: string }> {
  // Validate projectPath
  const pathValidation = await validateFilePath(params.projectPath);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  // Validate threshold
  if (params.threshold !== undefined) {
    if (typeof params.threshold !== 'number' || params.threshold < 0 || params.threshold > 100) {
      return { valid: false, error: 'Threshold must be a number between 0 and 100' };
    }
  }

  // Validate reportFormat
  if (params.reportFormat && !['summary', 'detailed', 'file-by-file'].includes(params.reportFormat)) {
    return { valid: false, error: 'Invalid reportFormat. Must be: summary, detailed, or file-by-file' };
  }

  return { valid: true };
}

/**
 * Validate suggest_test_scenarios parameters
 */
export async function validateScenariosParams(params: SuggestTestScenariosParams): Promise<{ valid: boolean; error?: string }> {
  // Validate sourceFile
  const pathValidation = await validateFilePath(params.sourceFile);
  if (!pathValidation.valid) {
    return pathValidation;
  }

  // Validate file extension
  const extValidation = validateFileExtension(params.sourceFile, ['.ts', '.js', '.tsx', '.jsx']);
  if (!extValidation.valid) {
    return extValidation;
  }

  // Validate scenarioTypes
  if (params.scenarioTypes) {
    const validTypes = ['happy-path', 'edge-cases', 'error-handling', 'boundary-conditions', 'security'];
    for (const type of params.scenarioTypes) {
      if (!validTypes.includes(type)) {
        return { valid: false, error: `Invalid scenario type: ${type}. Must be one of: ${validTypes.join(', ')}` };
      }
    }
  }

  // Validate maxSuggestions
  if (params.maxSuggestions !== undefined) {
    if (typeof params.maxSuggestions !== 'number' || params.maxSuggestions < 1 || params.maxSuggestions > 50) {
      return { valid: false, error: 'maxSuggestions must be a number between 1 and 50' };
    }
  }

  return { valid: true };
}
