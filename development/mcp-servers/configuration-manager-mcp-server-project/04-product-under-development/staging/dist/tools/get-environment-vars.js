/**
 * get_environment_vars tool
 * Retrieve environment-specific configuration variables
 */
import { ConfigurationError } from '../types.js';
import * as environmentLoader from '../utils/environment-loader.js';
export async function getEnvironmentVars(params) {
    const { environment, projectPath = process.cwd(), variables, includeDefaults = true, format, } = params;
    try {
        const result = await environmentLoader.loadEnvironmentVars(environment, projectPath, variables, includeDefaults);
        // If format is specified, add formatted output to result
        if (format && format !== 'json') {
            const formatted = environmentLoader.formatVariables(result.variables, format);
            // Return formatted version as a string in the variables field
            return {
                ...result,
                variables: { _formatted: formatted },
            };
        }
        return result;
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            return {
                success: false,
                environment,
                variables: {},
                source: 'none',
                warnings: [error.message],
            };
        }
        return {
            success: false,
            environment,
            variables: {},
            source: 'none',
            warnings: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        };
    }
}
//# sourceMappingURL=get-environment-vars.js.map