/**
 * Generate Review Report Tool
 *
 * Generate comprehensive goal health reports for periodic reviews.
 */
import { ReviewReport } from '../utils/report-generator.js';
export interface GenerateReviewReportInput {
    projectPath: string;
    reportType: 'weekly' | 'monthly' | 'quarterly';
    startDate?: string;
    endDate?: string;
    includeSummary?: boolean;
    includeVelocity?: boolean;
    includeAlerts?: boolean;
    includeRecommendations?: boolean;
}
export interface GenerateReviewReportOutput {
    success: boolean;
    report?: ReviewReport;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class GenerateReviewReportTool {
    /**
     * Execute the generate_review_report tool
     */
    static execute(input: GenerateReviewReportInput): GenerateReviewReportOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: GenerateReviewReportOutput): string;
    /**
     * Get MCP tool definition
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                reportType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                startDate: {
                    type: string;
                    description: string;
                };
                endDate: {
                    type: string;
                    description: string;
                };
                includeSummary: {
                    type: string;
                    description: string;
                };
                includeVelocity: {
                    type: string;
                    description: string;
                };
                includeAlerts: {
                    type: string;
                    description: string;
                };
                includeRecommendations: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=generate-review-report%202.d.ts.map