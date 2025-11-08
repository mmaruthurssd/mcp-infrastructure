/**
 * Type definitions for Workspace Health Dashboard
 */

export interface HealthScore {
  score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  topIssues: string[];
  breakdown: {
    mcpHealth: number;
    autonomousResolution: number;
    workflowCompletion: number;
    systemResources: number;
  };
  timestamp: string;
}

export interface McpStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'inactive';
  errorRate: number; // percentage
  avgResponseTime: number; // milliseconds
  lastUsed: string | null; // ISO timestamp
  requestCount24h: number;
  totalRequests: number;
  availability: number; // percentage
}

export interface AutonomousMetrics {
  totalResolutions: number;
  successRate7d: number; // percentage
  successRate30d: number; // percentage
  avgResolutionTime: number; // minutes
  roiMetrics?: {
    totalValue: number;
    totalCost: number;
    netValue: number;
    roi: number; // percentage
  };
  confidenceCalibration?: {
    status: 'good' | 'drift' | 'uncalibrated';
    accuracy: number; // percentage
    lastCalibrated: string;
  };
  trend: 'improving' | 'stable' | 'declining';
  recentResolutions: Array<{
    timestamp: string;
    type: string;
    success: boolean;
    duration: number;
  }>;
}

export interface Bottleneck {
  type: 'mcp' | 'workflow' | 'pattern';
  name: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  metric: string;
  value: number;
  baseline: number;
  recommendation: string;
}

export interface AutomationOpportunity {
  pattern: string;
  frequency: number; // times per week
  avgDuration: number; // minutes
  potentialRoi: number; // dollars per month
  effortEstimate: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  description: string;
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  details: string;
  action: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export interface PerformanceMetric {
  mcpServer: string;
  toolName: string;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorRate: number;
  requestCount: number;
  lastError?: string;
  lastErrorTime?: string;
}

export interface WorkflowStatus {
  workflowName: string;
  status: 'running' | 'stuck' | 'completed' | 'failed';
  progress: number; // percentage
  startedAt: string;
  stuckDuration?: number; // hours
  currentTask?: string;
}
