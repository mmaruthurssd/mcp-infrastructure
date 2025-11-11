import { MetricsCollector } from './metricsCollector.js';
import { AlertManager } from './alertManager.js';
import { DeploymentRegistryManager } from '../utils/registry.js';
export class HealthMonitor {
    metricsCollector;
    alertManager;
    registryManager;
    constructor(projectPath, params) {
        this.metricsCollector = new MetricsCollector();
        this.alertManager = new AlertManager(params.alertThresholds, params.notifyOnIssue ?? false);
        this.registryManager = new DeploymentRegistryManager(projectPath);
    }
    /**
     * Monitor deployment health for the specified duration
     */
    async monitor(params) {
        const { projectPath, environment, deploymentId: requestedDeploymentId, duration = 300, interval = 30, } = params;
        const startTime = new Date();
        const startTimeISO = startTime.toISOString();
        // Get deployment ID - use provided or fetch latest
        let deploymentId = requestedDeploymentId;
        if (!deploymentId) {
            const latestDeployment = await this.registryManager.getLatestDeployment(environment);
            deploymentId = latestDeployment?.id || `${environment}-current`;
        }
        // Get health check URL from deployment config or use default
        const deployment = deploymentId !== `${environment}-current`
            ? await this.registryManager.getDeployment(deploymentId)
            : null;
        const healthCheckUrl = params.metrics?.includes('health-check')
            ? `http://localhost:${this.getPortForEnvironment(environment)}/health`
            : undefined;
        // Monitor for the specified duration
        const endTime = new Date(startTime.getTime() + duration * 1000);
        let currentTime = new Date();
        while (currentTime < endTime) {
            // Collect metrics snapshot
            await this.metricsCollector.collectSnapshot(healthCheckUrl);
            // Wait for interval (unless we're at the end)
            const remainingTime = endTime.getTime() - new Date().getTime();
            if (remainingTime > 0) {
                const waitTime = Math.min(interval * 1000, remainingTime);
                await this.sleep(waitTime);
            }
            currentTime = new Date();
        }
        // Get aggregated metrics
        const metrics = this.metricsCollector.getAggregatedMetrics();
        // Check metrics and generate alerts
        const alerts = this.alertManager.checkMetrics(metrics);
        // Calculate overall health
        const overallHealth = this.calculateOverallHealth(metrics, alerts);
        // Calculate trend
        const trend = this.calculateTrend(this.metricsCollector.getSnapshots());
        // Generate recommendations
        const recommendations = this.generateRecommendations(metrics, alerts, overallHealth, trend);
        const endTimeISO = new Date().toISOString();
        const actualDuration = (new Date().getTime() - startTime.getTime()) / 1000;
        return {
            success: true,
            deploymentId,
            environment,
            monitoringPeriod: {
                start: startTimeISO,
                end: endTimeISO,
                duration: Math.round(actualDuration),
            },
            overallHealth,
            metrics,
            alerts,
            recommendations,
            trend,
        };
    }
    /**
     * Calculate overall health status based on metrics and alerts
     */
    calculateOverallHealth(metrics, alerts) {
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        const warningAlerts = alerts.filter(a => a.severity === 'warning');
        if (criticalAlerts.length > 0) {
            return 'unhealthy';
        }
        else if (warningAlerts.length > 0) {
            return 'degraded';
        }
        else {
            return 'healthy';
        }
    }
    /**
     * Calculate trend based on metrics over time
     */
    calculateTrend(snapshots) {
        if (snapshots.length < 2) {
            return 'stable';
        }
        // Compare first half vs second half of monitoring period
        const midpoint = Math.floor(snapshots.length / 2);
        const firstHalf = snapshots.slice(0, midpoint);
        const secondHalf = snapshots.slice(midpoint);
        const firstAvg = this.calculateAverageMetrics(firstHalf);
        const secondAvg = this.calculateAverageMetrics(secondHalf);
        // Calculate percentage changes for key metrics
        const errorRateChange = this.calculatePercentChange(firstAvg.errorRate, secondAvg.errorRate);
        const responseTimeChange = this.calculatePercentChange(firstAvg.avgResponseTime, secondAvg.avgResponseTime);
        const cpuChange = this.calculatePercentChange(firstAvg.cpuUsage, secondAvg.cpuUsage);
        const memoryChange = this.calculatePercentChange(firstAvg.memoryUsage, secondAvg.memoryUsage);
        // Average change (negative is better for these metrics)
        const avgChange = (errorRateChange + responseTimeChange + cpuChange + memoryChange) / 4;
        // Determine trend based on average change
        if (avgChange < -10) {
            return 'improving';
        }
        else if (avgChange > 10) {
            return 'degrading';
        }
        else {
            return 'stable';
        }
    }
    /**
     * Calculate average metrics from snapshots
     */
    calculateAverageMetrics(snapshots) {
        if (snapshots.length === 0) {
            return {
                errorRate: 0,
                avgResponseTime: 0,
                cpuUsage: 0,
                memoryUsage: 0,
            };
        }
        const sum = snapshots.reduce((acc, s) => ({
            errorRate: acc.errorRate + s.errorRate,
            avgResponseTime: acc.avgResponseTime + s.avgResponseTime,
            cpuUsage: acc.cpuUsage + s.cpuUsage,
            memoryUsage: acc.memoryUsage + s.memoryUsage,
        }), { errorRate: 0, avgResponseTime: 0, cpuUsage: 0, memoryUsage: 0 });
        const count = snapshots.length;
        return {
            errorRate: sum.errorRate / count,
            avgResponseTime: sum.avgResponseTime / count,
            cpuUsage: sum.cpuUsage / count,
            memoryUsage: sum.memoryUsage / count,
        };
    }
    /**
     * Calculate percentage change between two values
     */
    calculatePercentChange(oldValue, newValue) {
        if (oldValue === 0) {
            return newValue > 0 ? 100 : 0;
        }
        return ((newValue - oldValue) / oldValue) * 100;
    }
    /**
     * Generate recommendations based on health status and alerts
     */
    generateRecommendations(metrics, alerts, health, trend) {
        const recommendations = [];
        // Based on overall health
        if (health === 'unhealthy') {
            recommendations.push('Consider immediate rollback - deployment is unhealthy');
            recommendations.push('Investigate critical alerts immediately');
        }
        else if (health === 'degraded') {
            recommendations.push('Monitor closely - deployment showing degraded performance');
        }
        else {
            recommendations.push('Deployment is healthy - continue monitoring');
        }
        // Based on trend
        if (trend === 'degrading') {
            recommendations.push('Metrics are degrading over time - investigate root cause');
        }
        else if (trend === 'improving') {
            recommendations.push('Metrics are improving - deployment stabilizing');
        }
        // Based on specific metrics
        if (metrics.errorRate > 10) {
            recommendations.push('High error rate detected - check application logs');
        }
        if (metrics.avgResponseTime > 2000) {
            recommendations.push('High response times - check for performance bottlenecks');
        }
        if (metrics.cpuUsage > 90) {
            recommendations.push('Very high CPU usage - consider scaling up resources');
        }
        if (metrics.memoryUsage > 90) {
            recommendations.push('Very high memory usage - check for memory leaks or scale up');
        }
        // Based on alerts
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 3) {
            recommendations.push('Multiple critical alerts - immediate action required');
        }
        return recommendations;
    }
    /**
     * Get port for environment (simplified)
     */
    getPortForEnvironment(environment) {
        const ports = {
            dev: 3000,
            staging: 8080,
            production: 80,
        };
        return ports[environment] || 3000;
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=healthMonitor.js.map