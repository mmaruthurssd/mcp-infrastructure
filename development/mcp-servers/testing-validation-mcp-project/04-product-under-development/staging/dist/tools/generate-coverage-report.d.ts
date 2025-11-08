/**
 * Generate Coverage Report Tool
 *
 * Generate detailed test coverage reports in multiple formats (text, HTML, JSON).
 */
import type { GenerateCoverageReportInput, GenerateCoverageReportOutput } from '../types.js';
export declare class GenerateCoverageReportTool {
    /**
     * Get tool definition for MCP server
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                mcpPath: {
                    type: string;
                    description: string;
                };
                format: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                outputPath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute the tool
     */
    static execute(input: GenerateCoverageReportInput): Promise<GenerateCoverageReportOutput>;
}
//# sourceMappingURL=generate-coverage-report.d.ts.map