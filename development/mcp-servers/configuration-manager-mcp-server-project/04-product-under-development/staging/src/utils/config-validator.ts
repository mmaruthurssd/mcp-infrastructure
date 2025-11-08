/**
 * Config Validator - JSON Schema Validation
 * Validates configuration files against JSON schemas
 */

import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ValidateConfigParams,
  ValidateConfigResult,
  ConfigValidationError,
  ValidationWarning,
  ConfigurationError,
} from '../types.js';

// Initialize AJV with formats
const ajv = new Ajv2020.default({ allErrors: true, verbose: true });
addFormats.default(ajv);

// Built-in schemas directory (relative to compiled dist)
const SCHEMAS_DIR = path.join(process.cwd(), 'src', 'schemas');

/**
 * Get schema path based on schema type
 */
function getSchemaPath(schemaType: string): string {
  const schemaFiles: Record<string, string> = {
    'mcp-config': 'mcp-config.schema.json',
    'project-config': 'project-config.schema.json',
    'environment-config': 'environment-config.schema.json',
  };

  const filename = schemaFiles[schemaType];
  if (!filename) {
    throw new ConfigurationError('UNKNOWN_SCHEMA_TYPE', `Unknown schema type: ${schemaType}`);
  }

  return path.join(SCHEMAS_DIR, filename);
}

/**
 * Load JSON file
 */
async function loadJson(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigurationError('FILE_NOT_FOUND', `File not found: ${filePath}`);
    }
    throw new ConfigurationError(
      'INVALID_JSON',
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert AJV errors to our error format
 */
function convertAjvErrors(errors: ErrorObject[] | null | undefined): ConfigValidationError[] {
  if (!errors || errors.length === 0) return [];

  return errors.map((err) => ({
    path: err.instancePath || '/',
    message: err.message || 'Validation failed',
    severity: 'error' as const,
  }));
}

/**
 * Generate suggestions based on validation errors
 */
function generateSuggestions(errors: ConfigValidationError[]): string[] {
  const suggestions: string[] = [];

  for (const error of errors) {
    if (error.message.includes('required')) {
      suggestions.push(`Add missing required field: ${error.path}`);
    } else if (error.message.includes('type')) {
      suggestions.push(`Check type of field: ${error.path}`);
    } else if (error.message.includes('enum')) {
      suggestions.push(`Use allowed value for field: ${error.path}`);
    }
  }

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Generate text report
 */
function generateTextReport(result: Omit<ValidateConfigResult, 'report'>): string {
  let report = `Configuration Validation Report\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Config File: ${result.configPath}\n`;
  report += `Schema Used: ${result.schemaUsed}\n`;
  report += `Valid: ${result.valid ? '✓ YES' : '✗ NO'}\n\n`;

  if (result.errors && result.errors.length > 0) {
    report += `Errors (${result.errors.length}):\n`;
    report += `${'-'.repeat(50)}\n`;
    for (const error of result.errors) {
      report += `  Path: ${error.path}\n`;
      report += `  Message: ${error.message}\n`;
      report += `  Severity: ${error.severity}\n\n`;
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    report += `Warnings (${result.warnings.length}):\n`;
    report += `${'-'.repeat(50)}\n`;
    for (const warning of result.warnings) {
      report += `  Path: ${warning.path}\n`;
      report += `  Message: ${warning.message}\n\n`;
    }
  }

  if (result.suggestions && result.suggestions.length > 0) {
    report += `Suggestions:\n`;
    report += `${'-'.repeat(50)}\n`;
    for (const suggestion of result.suggestions) {
      report += `  • ${suggestion}\n`;
    }
  }

  return report;
}

/**
 * Validate configuration file
 */
export async function validateConfig(params: ValidateConfigParams): Promise<ValidateConfigResult> {
  const { configPath, schemaPath, schemaType = 'custom', strict = true, reportFormat } = params;

  try {
    // Load config file
    const config = await loadJson(configPath);

    // Determine schema to use
    let schema: any;
    let schemaUsed: string;

    if (schemaPath) {
      // Custom schema provided
      schema = await loadJson(schemaPath);
      schemaUsed = schemaPath;
    } else if (schemaType && schemaType !== 'custom') {
      // Built-in schema
      const builtInSchemaPath = getSchemaPath(schemaType);
      schema = await loadJson(builtInSchemaPath);
      schemaUsed = `built-in:${schemaType}`;
    } else {
      throw new ConfigurationError(
        'NO_SCHEMA',
        'Either schemaPath or schemaType must be provided'
      );
    }

    // Compile and validate
    const validate = ajv.compile(schema);
    const valid = validate(config);

    // Convert errors
    const errors = convertAjvErrors(validate.errors);
    const suggestions = generateSuggestions(errors);

    // Check for warnings (additional properties in strict mode, etc.)
    const warnings: ValidationWarning[] = [];
    if (strict && schema.additionalProperties === false) {
      // Check for additional properties
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      const configProps = Object.keys(config);
      for (const prop of configProps) {
        if (!allowedProps.has(prop)) {
          warnings.push({
            path: `/${prop}`,
            message: `Additional property not allowed in strict mode: ${prop}`,
          });
        }
      }
    }

    const result: Omit<ValidateConfigResult, 'report'> = {
      success: true,
      valid: valid && errors.length === 0,
      configPath,
      schemaUsed,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    // Generate report if requested
    let report: string | undefined;
    if (reportFormat === 'text') {
      report = generateTextReport(result);
    } else if (reportFormat === 'json') {
      report = JSON.stringify(result, null, 2);
    }

    return {
      ...result,
      report,
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      'VALIDATION_FAILED',
      `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if schema file exists
 */
export async function schemaExists(schemaType: string): Promise<boolean> {
  try {
    const schemaPath = getSchemaPath(schemaType);
    await fs.access(schemaPath);
    return true;
  } catch {
    return false;
  }
}
