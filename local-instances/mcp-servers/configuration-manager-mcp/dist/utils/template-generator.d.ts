/**
 * Template Generator - Generate configuration file templates
 * Provides predefined templates with placeholder replacement
 */
import { TemplateType, TemplateOptions } from '../types.js';
/**
 * Generate configuration template
 */
export declare function generateTemplate(templateType: TemplateType, outputPath: string, options?: TemplateOptions, customFields?: Record<string, any>): Promise<{
    filesCreated: string[];
    content: string;
    instructions: string[];
}>;
/**
 * Generate multiple environment templates
 */
export declare function generateEnvironmentTemplates(outputDir: string, environments: string[], options?: TemplateOptions): Promise<string[]>;
//# sourceMappingURL=template-generator.d.ts.map