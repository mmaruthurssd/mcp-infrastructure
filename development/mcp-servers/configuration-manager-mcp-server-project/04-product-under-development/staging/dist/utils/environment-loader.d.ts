/**
 * Environment Loader - Load environment-specific configurations
 * Implements cascading environment file hierarchy
 */
import { Environment, GetEnvironmentVarsResult } from '../types.js';
/**
 * Format variables based on output format
 */
export declare function formatVariables(variables: Record<string, string>, format: 'json' | 'dotenv' | 'shell'): string;
/**
 * Load environment variables
 */
export declare function loadEnvironmentVars(environment: Environment, projectPath?: string, requestedKeys?: string[], includeDefaults?: boolean): Promise<GetEnvironmentVarsResult>;
//# sourceMappingURL=environment-loader.d.ts.map