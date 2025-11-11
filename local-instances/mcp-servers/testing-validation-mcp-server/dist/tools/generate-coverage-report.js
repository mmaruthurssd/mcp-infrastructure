/**
 * Generate Coverage Report Tool
 *
 * Generate detailed test coverage reports in multiple formats (text, HTML, JSON).
 */
import { CoverageReporter } from '../utils/coverage-reporter.js';
export class GenerateCoverageReportTool {
    /**
     * Get tool definition for MCP server
     */
    static getToolDefinition() {
        return {
            name: 'generate_coverage_report',
            description: 'Generate detailed test coverage report',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpPath: {
                        type: 'string',
                        description: 'Path to MCP dev-instance',
                    },
                    format: {
                        type: 'string',
                        enum: ['text', 'html', 'json'],
                        description: 'Report format (default: text)',
                    },
                    outputPath: {
                        type: 'string',
                        description: 'Where to save report (optional)',
                    },
                },
                required: ['mcpPath'],
            },
        };
    }
    /**
     * Execute the tool
     */
    static async execute(input) {
        try {
            // Validate input
            if (!input.mcpPath) {
                return {
                    success: false,
                    format: 'text',
                    error: 'mcpPath is required',
                };
            }
            const format = input.format || 'text';
            // Create reporter and generate report
            const reporter = new CoverageReporter(input.mcpPath, format);
            const result = await reporter.generate(input.outputPath);
            return result;
        }
        catch (error) {
            return {
                success: false,
                format: input.format || 'text',
                error: `Tool execution failed: ${error}`,
            };
        }
    }
}
//# sourceMappingURL=generate-coverage-report.js.map