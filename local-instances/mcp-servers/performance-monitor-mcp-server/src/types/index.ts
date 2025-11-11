/**
 * Performance Monitor MCP Server - Type Definitions
 *
 * Core types for performance monitoring, metrics collection, and alerting
 */

// ============================================================================
// Metrics Types
// ============================================================================

export interface ResourceUsage {
  cpu: number;      // CPU usage percentage
  memory: number;   // Memory usage in MB
  diskIO: number;   // Disk I/O in KB
}

export interface PerformanceMetric {
  timestamp: string;           // ISO 8601 timestamp
  mcpServer: string;           // MCP server name
  toolName: string;            // Tool name
  duration: number;            // Execution duration in milliseconds
  success: boolean;            // Whether the operation succeeded
  errorMessage?: string;       // Error message if failed
  resourceUsage?: ResourceUsage; // Resource usage during execution
}

// ============================================================================
// Aggregation Types
// ============================================================================

export type AggregationType = 'avg' | 'p50' | 'p95' | 'p99' | 'max' | 'count';
export type GroupByPeriod = 'hour' | 'day';

export interface MetricsQuery {
  mcpServer?: string;
  toolName?: string;
  startTime: string;         // ISO 8601
  endTime: string;           // ISO 8601
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

// ============================================================================
// Anomaly Detection Types
// ============================================================================

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
  deviation: number;          // How many standard deviations from normal
  severity: 'warning' | 'critical';
  detectionMethod: AnomalyDetectionMethod;
}

// ============================================================================
// Alert Types
// ============================================================================

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

// ============================================================================
// Report Types
// ============================================================================

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
    slowestTool: { name: string; duration: number };
    mostErrors: { name: string; count: number };
    highestCPU: { server: string; usage: number };
    highestMemory: { server: string; usage: number };
  };
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageConfig {
  dataDir: string;              // Base directory for performance data
  retentionPolicy: {
    raw: number;                // Days to retain raw metrics (default: 1)
    hourly: number;             // Days to retain hourly aggregates (default: 30)
    daily: number;              // Days to retain daily aggregates (default: 365)
  };
}

// ============================================================================
// Tool Result Types (for MCP SDK)
// ============================================================================

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}
