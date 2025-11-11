/**
 * Environment Loader - Load environment-specific configurations
 * Implements cascading environment file hierarchy
 */
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurationError } from '../types.js';
/**
 * Environment file hierarchy (highest to lowest priority)
 */
const ENV_FILE_HIERARCHY = [
    (env) => `.env.${env}.local`, // 1. .env.production.local
    () => '.env.local', // 2. .env.local
    (env) => `.env.${env}`, // 3. .env.production
    () => '.env', // 4. .env
];
/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Load environment file
 */
async function loadEnvFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = dotenv.parse(content);
        // Apply variable expansion
        const expanded = dotenvExpand.expand({ parsed });
        return expanded.parsed || {};
    }
    catch (error) {
        throw new ConfigurationError('LOAD_FAILED', `Failed to load environment file: ${error instanceof Error ? error.message : 'Unknown error'}`, { filePath });
    }
}
/**
 * Load all environment files in hierarchy
 */
async function loadEnvironmentHierarchy(projectPath, environment) {
    const variables = {};
    const sources = [];
    // Load in reverse order (lowest to highest priority)
    for (let i = ENV_FILE_HIERARCHY.length - 1; i >= 0; i--) {
        const getFileName = ENV_FILE_HIERARCHY[i];
        const fileName = getFileName(environment);
        const filePath = path.join(projectPath, fileName);
        if (await fileExists(filePath)) {
            const fileVars = await loadEnvFile(filePath);
            Object.assign(variables, fileVars);
            sources.push(filePath);
        }
    }
    return { variables, sources };
}
/**
 * Get system environment variables
 */
function getSystemEnvVars() {
    const systemVars = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
            systemVars[key] = value;
        }
    }
    return systemVars;
}
/**
 * Filter variables by requested keys
 */
function filterVariables(variables, requestedKeys) {
    if (!requestedKeys || requestedKeys.length === 0) {
        return variables;
    }
    const filtered = {};
    for (const key of requestedKeys) {
        if (key in variables) {
            filtered[key] = variables[key];
        }
    }
    return filtered;
}
/**
 * Find missing required variables
 */
function findMissingVariables(variables, requestedKeys) {
    if (!requestedKeys || requestedKeys.length === 0) {
        return [];
    }
    const missing = [];
    for (const key of requestedKeys) {
        if (!(key in variables)) {
            missing.push(key);
        }
    }
    return missing;
}
/**
 * Format variables based on output format
 */
export function formatVariables(variables, format) {
    switch (format) {
        case 'json':
            return JSON.stringify(variables, null, 2);
        case 'dotenv':
            return Object.entries(variables)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
        case 'shell':
            return Object.entries(variables)
                .map(([key, value]) => `export ${key}="${value}"`)
                .join('\n');
        default:
            return JSON.stringify(variables, null, 2);
    }
}
/**
 * Load environment variables
 */
export async function loadEnvironmentVars(environment, projectPath = process.cwd(), requestedKeys, includeDefaults = true) {
    try {
        // Load hierarchy of env files
        const { variables: fileVars, sources } = await loadEnvironmentHierarchy(projectPath, environment);
        // Get system environment variables
        const systemVars = getSystemEnvVars();
        // Merge (file variables override system variables)
        let allVariables = { ...systemVars, ...fileVars };
        // Apply defaults if needed
        const defaults = {};
        if (includeDefaults) {
            // Add common defaults
            if (!allVariables.NODE_ENV) {
                defaults.NODE_ENV = environment;
                allVariables.NODE_ENV = environment;
            }
        }
        // Filter to requested keys
        const filteredVariables = filterVariables(allVariables, requestedKeys);
        // Find missing variables
        const missing = findMissingVariables(allVariables, requestedKeys);
        // Generate warnings
        const warnings = [];
        if (sources.length === 0) {
            warnings.push(`No environment files found for environment: ${environment}`);
        }
        if (missing.length > 0) {
            warnings.push(`Missing requested variables: ${missing.join(', ')}`);
        }
        return {
            success: true,
            environment,
            variables: filteredVariables,
            defaults: Object.keys(defaults).length > 0 ? defaults : undefined,
            missing: missing.length > 0 ? missing : undefined,
            source: sources.join(', ') || 'system environment only',
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            throw error;
        }
        throw new ConfigurationError('LOAD_ENV_FAILED', `Failed to load environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
//# sourceMappingURL=environment-loader.js.map