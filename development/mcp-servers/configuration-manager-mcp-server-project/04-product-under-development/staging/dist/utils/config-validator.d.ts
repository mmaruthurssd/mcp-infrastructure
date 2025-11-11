/**
 * Config Validator - JSON Schema Validation
 * Validates configuration files against JSON schemas
 */
import { ValidateConfigParams, ValidateConfigResult } from '../types.js';
/**
 * Validate configuration file
 */
export declare function validateConfig(params: ValidateConfigParams): Promise<ValidateConfigResult>;
/**
 * Check if schema file exists
 */
export declare function schemaExists(schemaType: string): Promise<boolean>;
//# sourceMappingURL=config-validator.d.ts.map