import type { ValidationCheck } from "../types.js";
export interface PerformanceThresholds {
    maxResponseTime?: number;
    maxCpuUsage?: number;
    maxMemoryUsage?: number;
}
export interface PerformanceCheckConfig {
    endpoints?: string[];
    thresholds?: PerformanceThresholds;
    timeout?: number;
}
/**
 * Check API response times
 */
export declare function checkResponseTimes(endpoints: string[], maxResponseTime?: number, timeout?: number): Promise<ValidationCheck[]>;
/**
 * Check system resource usage
 */
export declare function checkResourceUsage(maxCpuUsage?: number, maxMemoryUsage?: number): Promise<ValidationCheck[]>;
/**
 * Run all performance validation checks
 */
export declare function runPerformanceValidation(config?: PerformanceCheckConfig): Promise<ValidationCheck[]>;
//# sourceMappingURL=performanceChecks.d.ts.map