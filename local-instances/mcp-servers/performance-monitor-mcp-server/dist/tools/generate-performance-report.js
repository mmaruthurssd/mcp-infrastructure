/**
 * Generate Performance Report Tool
 *
 * Generate comprehensive performance report
 */
import { Reporter } from '../lib/reporter.js';
const reporter = new Reporter();
export async function generatePerformanceReport(args) {
    try {
        const startTime = args.startTime;
        const endTime = args.endTime;
        if (!startTime || !endTime) {
            throw new Error('Missing required parameters: startTime, endTime');
        }
        const mcpServer = args.mcpServer;
        const format = args.format || 'markdown';
        const includeRecommendations = args.includeRecommendations !== false;
        const report = await reporter.generateReport(startTime, endTime, mcpServer, format, includeRecommendations);
        return {
            content: [
                {
                    type: 'text',
                    text: format === 'json' ? report : JSON.stringify({
                        success: true,
                        data: {
                            report,
                            format,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=generate-performance-report.js.map