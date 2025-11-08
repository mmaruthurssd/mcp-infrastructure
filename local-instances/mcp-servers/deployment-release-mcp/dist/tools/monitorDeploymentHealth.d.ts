import type { MonitorDeploymentHealthParams, MonitorDeploymentHealthResult } from "../types.js";
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
export declare function monitorDeploymentHealth(params: MonitorDeploymentHealthParams): Promise<MonitorDeploymentHealthResult>;
//# sourceMappingURL=monitorDeploymentHealth.d.ts.map