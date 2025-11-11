/**
 * validate_config tool
 * Validate configuration files against JSON schemas
 */
import { ConfigurationError } from '../types.js';
import * as configValidator from '../utils/config-validator.js';
export async function validateConfig(params) {
    try {
        return await configValidator.validateConfig(params);
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            const errors = [
                {
                    path: '/',
                    message: error.message,
                    severity: 'error',
                },
            ];
            return {
                success: false,
                valid: false,
                configPath: params.configPath,
                schemaUsed: params.schemaPath || `built-in:${params.schemaType || 'unknown'}`,
                errors,
                suggestions: error.suggestions,
            };
        }
        const errors = [
            {
                path: '/',
                message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error',
            },
        ];
        return {
            success: false,
            valid: false,
            configPath: params.configPath,
            schemaUsed: 'unknown',
            errors,
        };
    }
}
//# sourceMappingURL=validate-config.js.map