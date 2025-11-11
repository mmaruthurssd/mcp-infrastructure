import { HealthMonitor } from "../monitoring/healthMonitor.js";
/**
 * Monitor deployment health continuously for specified duration
 *
 * Collects metrics at regular intervals and generates alerts when thresholds are exceeded.
 * Monitors 4 categories of metrics:
 * - Application: error rate, response time, request rate
 * - System: CPU usage, memory usage
 * - Service health: health check endpoints
 * - Errors: collected errors during monitoring
 *
 * @param params - Monitoring parameters including duration, interval, and alert thresholds
 * @returns Complete monitoring results with metrics, alerts, and recommendations
 */
export async function monitorDeploymentHealth(params) {
    const { projectPath, environment, duration = 300, interval = 30, } = params;
    // Validate parameters
    if (!projectPath) {
        throw new Error("projectPath is required");
    }
    if (!environment) {
        throw new Error("environment is required");
    }
    if (duration <= 0) {
        throw new Error("duration must be greater than 0");
    }
    if (interval <= 0) {
        throw new Error("interval must be greater than 0");
    }
    if (interval > duration) {
        throw new Error("interval cannot be greater than duration");
    }
    // Create health monitor instance
    const monitor = new HealthMonitor(projectPath, params);
    // Execute monitoring
    const result = await monitor.monitor(params);
    return result;
}
//# sourceMappingURL=monitorDeploymentHealth.js.map