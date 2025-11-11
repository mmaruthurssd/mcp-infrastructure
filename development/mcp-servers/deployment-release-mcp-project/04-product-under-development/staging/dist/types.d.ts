export type Environment = "dev" | "staging" | "production";
export type DeploymentStrategy = "rolling" | "blue-green" | "canary" | "recreate";
export type DeploymentStatus = "success" | "failed" | "rolled-back" | "in-progress";
export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type AlertSeverity = "critical" | "warning" | "info";
export type ReleaseNotesFormat = "markdown" | "html" | "json";
export type Recommendation = "proceed" | "monitor" | "rollback";
export interface DeploymentConfig {
    timeout?: number;
    parallelism?: number;
    healthCheckUrl?: string;
}
export interface DeployApplicationParams {
    projectPath: string;
    environment: Environment;
    target?: string;
    strategy?: DeploymentStrategy;
    preChecks?: boolean;
    dryRun?: boolean;
    config?: DeploymentConfig;
}
export interface PreCheckResult {
    name: string;
    passed: boolean;
    message: string;
}
export interface DeploymentSummary {
    servicesDeployed: number;
    duration: number;
    strategy: string;
    previousVersion: string;
    newVersion: string;
}
export interface DeployApplicationResult {
    success: boolean;
    deploymentId: string;
    environment: string;
    timestamp: string;
    summary: DeploymentSummary;
    preChecks: {
        passed: number;
        failed: number;
        warnings: string[];
    };
    deploymentLog: string;
    rollbackAvailable: boolean;
}
export interface RollbackDeploymentParams {
    projectPath: string;
    environment: Environment;
    deploymentId?: string;
    target?: string;
    preserveData?: boolean;
    reason: string;
    force?: boolean;
}
export interface RollbackDeploymentResult {
    success: boolean;
    rollbackId: string;
    timestamp: string;
    rolledBackTo: {
        deploymentId: string;
        version: string;
        timestamp: string;
    };
    summary: {
        servicesRolledBack: number;
        duration: number;
        dataPreserved: boolean;
    };
    validation: {
        healthChecks: boolean;
        configValid: boolean;
        servicesRunning: number;
    };
    warnings: string[];
}
export interface ValidateDeploymentParams {
    projectPath: string;
    environment: Environment;
    deploymentId?: string;
    checks?: string[];
    timeout?: number;
}
export interface ValidationCheck {
    name: string;
    category: string;
    status: "passed" | "failed" | "warning";
    message: string;
    duration: number;
}
export interface ValidateDeploymentResult {
    success: boolean;
    overallHealth: HealthStatus;
    timestamp: string;
    checks: ValidationCheck[];
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        warnings: number;
    };
    recommendation: Recommendation;
    details: string;
}
export interface ServiceConfig {
    name: string;
    version: string;
    dependencies?: string[];
    config?: Record<string, any>;
}
export interface CoordinateReleaseParams {
    projectPath: string;
    releaseName: string;
    environment: "staging" | "production";
    services: ServiceConfig[];
    strategy?: "sequential" | "parallel" | "dependency-order";
    rollbackOnFailure?: boolean;
    notifyChannels?: string[];
}
export interface ServiceResult {
    service: string;
    status: "success" | "failed" | "rolled-back";
    deploymentId: string;
    version: string;
    duration: number;
    healthStatus: string;
}
export interface CoordinateReleaseResult {
    success: boolean;
    releaseId: string;
    environment: string;
    timestamp: string;
    summary: {
        totalServices: number;
        deployed: number;
        failed: number;
        rolledBack: number;
        duration: number;
    };
    deploymentOrder: string[];
    serviceResults: ServiceResult[];
    overallHealth: HealthStatus;
    releaseNotes: string;
}
export interface GenerateReleaseNotesParams {
    projectPath: string;
    fromVersion?: string;
    toVersion?: string;
    format?: ReleaseNotesFormat;
    includeBreakingChanges?: boolean;
    includeAuthors?: boolean;
    outputPath?: string;
    sections?: string[];
}
export interface BreakingChange {
    commit: string;
    description: string;
    migration: string;
}
export interface GenerateReleaseNotesResult {
    success: boolean;
    releaseNotesPath: string;
    version: string;
    releaseDate: string;
    summary: {
        commits: number;
        features: number;
        fixes: number;
        breakingChanges: number;
        contributors: number;
    };
    sections: Record<string, string[]>;
    breakingChanges: BreakingChange[];
    contributors: string[];
}
export interface AlertThresholds {
    errorRate?: number;
    responseTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
}
export interface MonitorDeploymentHealthParams {
    projectPath: string;
    environment: Environment;
    deploymentId?: string;
    duration?: number;
    interval?: number;
    metrics?: string[];
    alertThresholds?: AlertThresholds;
    notifyOnIssue?: boolean;
}
export interface MetricsData {
    errorRate: number;
    avgResponseTime: number;
    requestRate: number;
    cpuUsage: number;
    memoryUsage: number;
}
export interface Alert {
    timestamp: string;
    severity: AlertSeverity;
    metric: string;
    value: number;
    threshold: number;
    message: string;
}
export interface MonitorDeploymentHealthResult {
    success: boolean;
    deploymentId: string;
    environment: string;
    monitoringPeriod: {
        start: string;
        end: string;
        duration: number;
    };
    overallHealth: HealthStatus;
    metrics: MetricsData;
    alerts: Alert[];
    recommendations: string[];
    trend: "improving" | "stable" | "degrading";
}
export interface DeploymentRecord {
    id: string;
    environment: string;
    strategy: string;
    version: string;
    timestamp: string;
    status: DeploymentStatus;
    duration: number;
    servicesDeployed: string[];
    healthStatus: string;
    rollbackAvailable: boolean;
}
export interface DeploymentRegistry {
    version: string;
    projectPath: string;
    lastUpdated: string;
    deployments: DeploymentRecord[];
}
//# sourceMappingURL=types.d.ts.map