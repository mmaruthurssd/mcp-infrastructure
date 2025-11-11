/**
 * Performance Monitor MCP Server - Type Definitions
 *
 * Core types for performance monitoring, metrics collection, and alerting
 */
export interface ResourceUsage {
    cpu: number;
    memory: number;
    diskIO: number;
}
export interface PerformanceMetric {
    timestamp: string;
    mcpServer: string;
    toolName: string;
    duration: number;
    success: boolean;
    errorMessage?: string;
    resourceUsage?: ResourceUsage;
}
export type AggregationType = 'avg' | 'p50' | 'p95' | 'p99' | 'max' | 'count';
export type GroupByPeriod = 'hour' | 'day';
export interface MetricsQuery {
    mcpServer?: string;
    toolName?: string;
    startTime: string;
    endTime: string;
    aggregation: AggregationType;
    groupBy?: GroupByPeriod;
}
export interface AggregatedMetric {
    timestamp: string;
    mcpServer?: string;
    toolName?: string;
    value: number;
    count: number;
    aggregationType: AggregationType;
}
export type AnomalyDetectionMethod = 'z-score' | 'moving-avg' | 'percentile';
export type SensitivityLevel = 'low' | 'medium' | 'high';
export type LookbackWindow = '1h' | '6h' | '24h';
export interface AnomalyDetectionConfig {
    mcpServer?: string;
    toolName?: string;
    lookbackWindow?: LookbackWindow;
    sensitivity?: SensitivityLevel;
    method?: AnomalyDetectionMethod;
}
export interface Anomaly {
    id: string;
    timestamp: string;
    mcpServer: string;
    toolName: string;
    metric: 'response_time' | 'error_rate' | 'cpu' | 'memory';
    observedValue: number;
    expectedValue: number;
    deviation: number;
    severity: 'warning' | 'critical';
    detectionMethod: AnomalyDetectionMethod;
}
export type MetricType = 'response_time' | 'error_rate' | 'cpu' | 'memory';
export type AlertSeverity = 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'escalated';
export interface AlertThreshold {
    id: string;
    metric: MetricType;
    threshold: number;
    severity: AlertSeverity;
    mcpServer?: string;
    toolName?: string;
    enabled: boolean;
    createdAt: string;
}
export interface Alert {
    id: string;
    thresholdId: string;
    mcpServer: string;
    toolName: string;
    metric: MetricType;
    value: number;
    threshold: number;
    severity: AlertSeverity;
    status: AlertStatus;
    triggeredAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    notes?: string;
}
export type ReportFormat = 'markdown' | 'json' | 'html';
export interface PerformanceReport {
    generatedAt: string;
    startTime: string;
    endTime: string;
    mcpServer?: string;
    summary: {
        totalRequests: number;
        successRate: number;
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        errorCount: number;
    };
    topSlowTools: Array<{
        toolName: string;
        avgDuration: number;
        count: number;
    }>;
    topErrorTools: Array<{
        toolName: string;
        errorCount: number;
        errorRate: number;
    }>;
    anomalies: Anomaly[];
    activeAlerts: Alert[];
    recommendations?: string[];
}
export interface DashboardData {
    timestamp: string;
    activeAlerts: number;
    recentAnomalies: number;
    serverStatus: Array<{
        mcpServer: string;
        avgResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        status: 'healthy' | 'degraded' | 'critical';
    }>;
    topMetrics: {
        slowestTool: {
            name: string;
            duration: number;
        };
        mostErrors: {
            name: string;
            count: number;
        };
        highestCPU: {
            server: string;
            usage: number;
        };
        highestMemory: {
            server: string;
            usage: number;
        };
    };
}
export interface StorageConfig {
    dataDir: string;
    retentionPolicy: {
        raw: number;
        hourly: number;
        daily: number;
    };
}
export interface ToolResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=index.d.ts.map