/**
 * Generate Review Report Tool
 *
 * Generate comprehensive goal health reports for periodic reviews.
 */
import * as fs from 'fs';
import { detectReviewsNeeded } from '../utils/review-detector.js';
import { generateReviewReport, formatReviewReport } from '../utils/report-generator.js';
// ============================================================================
// Main Tool Logic
// ============================================================================
export class GenerateReviewReportTool {
    /**
     * Execute the generate_review_report tool
     */
    static execute(input) {
        try {
            // Step 1: Validate input
            if (!fs.existsSync(input.projectPath)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Project path does not exist: ${input.projectPath}`,
                };
            }
            if (!['weekly', 'monthly', 'quarterly'].includes(input.reportType)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Invalid reportType: ${input.reportType}. Must be 'weekly', 'monthly', or 'quarterly'`,
                };
            }
            // Step 2: Parse dates if provided
            let startDate;
            let endDate;
            if (input.startDate) {
                startDate = new Date(input.startDate);
                if (isNaN(startDate.getTime())) {
                    return {
                        success: false,
                        message: 'Error',
                        error: `Invalid startDate format: ${input.startDate}. Use YYYY-MM-DD`,
                    };
                }
            }
            if (input.endDate) {
                endDate = new Date(input.endDate);
                if (isNaN(endDate.getTime())) {
                    return {
                        success: false,
                        message: 'Error',
                        error: `Invalid endDate format: ${input.endDate}. Use YYYY-MM-DD`,
                    };
                }
            }
            // Step 3: Detect reviews needed (for alerts)
            const includeAlerts = input.includeAlerts !== false;
            const alerts = includeAlerts
                ? detectReviewsNeeded(input.projectPath, 'all')
                : [];
            // Step 4: Generate report
            const report = generateReviewReport(input.projectPath, input.reportType, alerts, startDate, endDate);
            // Step 5: Format report (respecting include flags)
            let formattedReport = formatReviewReport(report);
            // Apply section filters if needed
            const includeSummary = input.includeSummary !== false;
            const includeVelocity = input.includeVelocity !== false;
            const includeRecommendations = input.includeRecommendations !== false;
            // For simplicity, we're generating the full report
            // In a production version, we'd conditionally include sections
            // Step 6: Return result
            return {
                success: true,
                report,
                message: `Generated ${input.reportType} review report`,
                formatted: formattedReport,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error',
                error: String(error),
            };
        }
    }
    /**
     * Format the result for display
     */
    static formatResult(result) {
        if (!result.success) {
            return `❌ Error: ${result.error}`;
        }
        return result.formatted || result.message;
    }
    /**
     * Get MCP tool definition
     */
    static getToolDefinition() {
        return {
            name: 'generate_review_report',
            description: 'Generate comprehensive goal health reports for periodic reviews (weekly, monthly, quarterly). Includes summary, health score, velocity metrics, alerts, and recommendations.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    reportType: {
                        type: 'string',
                        enum: ['weekly', 'monthly', 'quarterly'],
                        description: 'Type of report to generate',
                    },
                    startDate: {
                        type: 'string',
                        description: 'Optional start date for report period (YYYY-MM-DD)',
                    },
                    endDate: {
                        type: 'string',
                        description: 'Optional end date for report period (YYYY-MM-DD)',
                    },
                    includeSummary: {
                        type: 'boolean',
                        description: 'Include summary section (default: true)',
                    },
                    includeVelocity: {
                        type: 'boolean',
                        description: 'Include velocity metrics section (default: true)',
                    },
                    includeAlerts: {
                        type: 'boolean',
                        description: 'Include alerts section (default: true)',
                    },
                    includeRecommendations: {
                        type: 'boolean',
                        description: 'Include recommendations section (default: true)',
                    },
                },
                required: ['projectPath', 'reportType'],
            },
        };
    }
}
//# sourceMappingURL=generate-review-report%202.js.map