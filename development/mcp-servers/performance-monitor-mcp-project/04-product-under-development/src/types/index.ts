/**
 * Type definitions for Performance Monitor MCP
 */

export interface PerformanceMetric {
  timestamp: string; // ISO 8601
  mcpServer: string;
  toolName: string;
  duration: number; // milliseconds
  success: boolean;
  error: string | null;
  resource: ResourceUsage | null;
}

export interface ResourceUsage {
  cpu: number; // percentage
  memory: number; // MB
  diskIO: number; // KB
}

export interface MetricFilter {
  mcpServer?: string;
  toolName?: string;
  startTime: string;
  endTime: string;
}

export interface MetricResult {
  success: boolean;
  metricId: string;
  timestamp: string;
  stored: boolean;
}

export interface MetricSummary {
  totalCalls: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  errorRate: number;
}

export interface AggregatedMetric {
  timestamp: string;
  mcpServer: string;
  toolName: string;
  value: number;
  count: number;
}

export interface MetricsQueryResult {
  metrics: AggregatedMetric[];
  summary: MetricSummary;
}

export type AggregationType = "avg" | "p50" | "p95" | "p99" | "max" | "count";
export type GroupByType = "hour" | "day";

export interface Anomaly {
  timestamp: string;
  mcpServer: string;
  toolName: string;
  anomalyType: "response_time_spike" | "error_rate_spike" | "resource_spike";
  severity: "info" | "warning" | "critical";
  details: {
    currentValue: number;
    expectedRange: string;
    deviation: string;
    confidence: number;
    method: "z-score" | "moving-avg" | "percentile";
  };
  recommendations: string[];
}

export interface AnomalyFilter {
  mcpServer?: string;
  toolName?: string;
  startTime?: string;
  endTime?: string;
}

export interface AnomalySummary {
  totalAnomalies: number;
  bySeverity: { info: number; warning: number; critical: number };
  byType: Record<string, number>;
}

export interface AnomaliesResult {
  anomalies: Anomaly[];
  summary: AnomalySummary;
}

export type Sensitivity = "low" | "medium" | "high";
export type LookbackWindow = "1h" | "6h" | "24h";
export type DetectionMethod = "z-score" | "moving-avg" | "percentile";

export interface DetectionParams {
  mcpServer?: string;
  toolName?: string;
  lookbackWindow?: LookbackWindow;
  sensitivity?: Sensitivity;
  method?: DetectionMethod;
}

export interface Alert {
  alertId: string;
  timestamp: string;
  mcpServer: string;
  toolName: string;
  severity: "warning" | "critical";
  condition: string;
  currentValue: number;
  threshold: number;
  status: "active" | "acknowledged" | "escalated" | "resolved";
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  notes: string | null;
  resolvedAt: string | null;
}

export interface AlertFilter {
  severity?: "warning" | "critical";
  mcpServer?: string;
  status?: "active" | "acknowledged" | "escalated";
}

export interface AlertSummary {
  totalActive: number;
  bySeverity: { warning: number; critical: number };
  byMcp: Record<string, number>;
}

export interface AlertsResult {
  alerts: Alert[];
  summary: AlertSummary;
}

export type MetricType = "response_time" | "error_rate" | "cpu" | "memory";

export interface AlertThreshold {
  thresholdId: string;
  mcpServer: string;
  toolName: string;
  metric: MetricType;
  threshold: number;
  severity: "warning" | "critical";
  enabled: boolean;
}

export interface ThresholdConfig {
  mcpServer?: string;
  toolName?: string;
  metric: MetricType;
  threshold: number;
  severity: "warning" | "critical";
  enabled?: boolean;
}

export type ReportFormat = "markdown" | "json" | "html";

export interface ReportParams {
  startTime: string;
  endTime: string;
  format?: ReportFormat;
  includeRecommendations?: boolean;
  mcpServer?: string;
}

export interface PerformanceReport {
  report: string;
  summary: {
    period: string;
    totalCalls: number;
    avgResponseTime: number;
    errorRate: number;
    anomaliesDetected: number;
    alertsTriggered: number;
  };
  recommendations: string[];
}

export interface McpHealthStatus {
  name: string;
  healthScore: number; // 0-100
  avgResponseTime: number;
  errorRate: number;
  activeAlerts: number;
  status: "healthy" | "degraded" | "critical";
}

export interface Dashboard {
  timestamp: string;
  mcpServers: McpHealthStatus[];
  activeAlerts: number;
  recentAnomalies: number;
  systemHealth: "healthy" | "degraded" | "critical";
}

export interface HourlyAggregate {
  timestamp: string;
  mcpServer: string;
  toolName: string;
  metrics: {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    errorRate: number;
  };
  resource: {
    avgCpu: number;
    avgMemory: number;
    avgDiskIO: number;
  };
}

export interface DailyAggregate extends HourlyAggregate {
  // Same structure, different time granularity
}
