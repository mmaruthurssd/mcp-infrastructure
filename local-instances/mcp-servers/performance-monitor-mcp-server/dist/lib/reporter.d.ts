/**
 * Reporter
 *
 * Generate reports and dashboards
 */
import type { DashboardData, ReportFormat } from '../types/index.js';
export declare class Reporter {
    /**
     * Generate performance report
     */
    generateReport(startTime: string, endTime: string, mcpServer?: string, format?: ReportFormat, includeRecommendations?: boolean): Promise<string>;
    /**
     * Get real-time dashboard data
     */
    getDashboardData(): Promise<DashboardData>;
    private calculatePercentile;
    private getTopSlowTools;
    private getTopErrorTools;
    private formatMarkdown;
    private generateRecommendations;
}
//# sourceMappingURL=reporter.d.ts.map