import type { Environment } from '../types.js';
export interface HealthCheckResult {
    healthy: boolean;
    servicesRunning: number;
    totalServices: number;
    checks: {
        name: string;
        status: 'pass' | 'fail';
        message: string;
    }[];
}
export declare class HealthChecker {
    runHealthChecks(projectPath: string, environment: Environment, services: string[]): Promise<HealthCheckResult>;
    private checkServiceProcesses;
    private checkHealthEndpoints;
    private checkDatabaseConnectivity;
    private checkConfigurationValidity;
}
//# sourceMappingURL=healthChecker.d.ts.map