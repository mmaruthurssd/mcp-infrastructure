/**
 * template_config tool
 * Generate configuration file templates
 */
import { ConfigurationError } from '../types.js';
import * as templateGenerator from '../utils/template-generator.js';
export async function templateConfig(params) {
    const { templateType, outputPath, options = {}, customFields = {} } = params;
    try {
        // Handle multiple environment templates
        if (templateType === 'environment' && options.environments && options.environments.length > 1) {
            const filesCreated = await templateGenerator.generateEnvironmentTemplates(outputPath, options.environments, options);
            return {
                success: true,
                templateType,
                outputPath,
                filesCreated,
                instructions: [
                    'Environment files created for all specified environments',
                    'Update each file with environment-specific values',
                    'Add *.local files to .gitignore',
                ],
            };
        }
        // Generate single template
        const result = await templateGenerator.generateTemplate(templateType, outputPath, options, customFields);
        return {
            success: true,
            templateType,
            outputPath,
            filesCreated: result.filesCreated,
            content: result.content,
            instructions: result.instructions,
        };
    }
    catch (error) {
        if (error instanceof ConfigurationError) {
            return {
                success: false,
                templateType,
                outputPath,
                filesCreated: [],
                instructions: [error.message],
            };
        }
        return {
            success: false,
            templateType,
            outputPath,
            filesCreated: [],
            instructions: [
                `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ],
        };
    }
}
//# sourceMappingURL=template-config.js.map