import type { MonitorDeploymentHealthParams, MonitorDeploymentHealthResult } from '../types.js';
export declare class HealthMonitor {
    private metricsCollector;
    private alertManager;
    private registryManager;
    constructor(projectPath: string, params: MonitorDeploymentHealthParams);
    /**
     * Monitor deployment health for the specified duration
     */
    monitor(params: MonitorDeploymentHealthParams): Promise<MonitorDeploymentHealthResult>;
    /**
     * Calculate overall health status based on metrics and alerts
     */
    private calculateOverallHealth;
    /**
     * Calculate trend based on metrics over time
     */
    private calculateTrend;
    /**
     * Calculate average metrics from snapshots
     */
    private calculateAverageMetrics;
    /**
     * Calculate percentage change between two values
     */
    private calculatePercentChange;
    /**
     * Generate recommendations based on health status and alerts
     */
    private generateRecommendations;
    /**
     * Get port for environment (simplified)
     */
    private getPortForEnvironment;
    /**
     * Sleep utility
     */
    private sleep;
}
//# sourceMappingURL=healthMonitor.d.ts.map