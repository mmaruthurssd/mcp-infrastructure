import type { ValidationCheck } from "../types.js";
export interface HealthCheckConfig {
    processNames?: string[];
    healthEndpoints?: string[];
    timeout?: number;
}
/**
 * Check if specified processes are running
 */
export declare function checkProcessesRunning(processNames?: string[], timeout?: number): Promise<ValidationCheck>;
/**
 * Check health endpoints using HTTP/HTTPS requests
 */
export declare function checkHealthEndpoints(endpoints: string[], timeout?: number): Promise<ValidationCheck[]>;
/**
 * Check for recent crashes in logs
 */
export declare function checkForCrashes(projectPath: string, logPaths?: string[]): Promise<ValidationCheck>;
/**
 * Run all service health checks
 */
export declare function runServiceHealthChecks(projectPath: string, config?: HealthCheckConfig): Promise<ValidationCheck[]>;
//# sourceMappingURL=healthChecks.d.ts.map