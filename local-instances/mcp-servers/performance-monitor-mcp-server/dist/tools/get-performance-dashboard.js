/**
 * Get Performance Dashboard Tool
 *
 * Get real-time performance dashboard data
 */
import { Reporter } from '../lib/reporter.js';
const reporter = new Reporter();
export async function getPerformanceDashboard(_args) {
    try {
        const dashboardData = await reporter.getDashboardData();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: dashboardData,
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
//# sourceMappingURL=get-performance-dashboard.js.map