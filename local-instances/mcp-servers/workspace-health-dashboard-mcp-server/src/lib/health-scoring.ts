/**
 * Health scoring algorithm for workspace
 */

import { HealthScore, McpStatus, WorkflowStatus } from '../types/index.js';
import { getPerformanceMetrics, getAutonomousResolutionMetrics, getWorkflowStatuses, getRegisteredMcps } from './data-clients.js';

export async function calculateHealthScore(): Promise<HealthScore> {
  let score = 100;
  const topIssues: string[] = [];
  const breakdown = {
    mcpHealth: 100,
    autonomousResolution: 100,
    workflowCompletion: 100,
    systemResources: 100,
  };

  // Get data from various sources
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const metrics = await getPerformanceMetrics({ start: yesterday, end: now });
  const autoMetrics = await getAutonomousResolutionMetrics();
  const workflows = await getWorkflowStatuses();

  // 1. MCP Health (40 points max impact)
  const criticalErrors = metrics.filter(m => m.errorRate > 0.15); // >15% error rate
  const highErrors = metrics.filter(m => m.errorRate > 0.05 && m.errorRate <= 0.15); // 5-15%

  criticalErrors.forEach(m => {
    const penalty = 10;
    score -= penalty;
    breakdown.mcpHealth -= penalty;
    topIssues.push(`${m.mcpServer}: ${(m.errorRate * 100).toFixed(1)}% error rate (critical)`);
  });

  highErrors.forEach(m => {
    const penalty = 5;
    score -= penalty;
    breakdown.mcpHealth -= penalty;
    topIssues.push(`${m.mcpServer}: ${(m.errorRate * 100).toFixed(1)}% error rate (warning)`);
  });

  // Check for slow MCPs (>2x baseline)
  const slowMcps = metrics.filter(m => m.avgDuration > 2000); // >2 seconds
  slowMcps.forEach(m => {
    const penalty = 3;
    score -= penalty;
    breakdown.mcpHealth -= penalty;
    topIssues.push(`${m.mcpServer}: ${(m.avgDuration / 1000).toFixed(1)}s avg response (slow)`);
  });

  // 2. Autonomous Resolution Health (30 points max impact)
  if (autoMetrics.successRate7d < 70) {
    const penalty = 20;
    score -= penalty;
    breakdown.autonomousResolution -= penalty;
    topIssues.push(`Autonomous success rate critically low: ${autoMetrics.successRate7d.toFixed(1)}%`);
  } else if (autoMetrics.successRate7d < 80) {
    const penalty = 10;
    score -= penalty;
    breakdown.autonomousResolution -= penalty;
    topIssues.push(`Autonomous success rate below target: ${autoMetrics.successRate7d.toFixed(1)}%`);
  }

  if (autoMetrics.trend === 'declining') {
    const penalty = 5;
    score -= penalty;
    breakdown.autonomousResolution -= penalty;
    topIssues.push('Autonomous resolution trend declining');
  }

  // 3. Workflow Completion (20 points max impact)
  const stuckWorkflows = workflows.filter(w => w.status === 'stuck');
  stuckWorkflows.forEach(w => {
    const penalty = 5;
    score -= penalty;
    breakdown.workflowCompletion -= penalty;
    topIssues.push(`Workflow stuck: ${w.workflowName} (${w.stuckDuration?.toFixed(1)}h)`);
  });

  const failedWorkflows = workflows.filter(w => w.status === 'failed');
  failedWorkflows.forEach(w => {
    const penalty = 3;
    score -= penalty;
    breakdown.workflowCompletion -= penalty;
    topIssues.push(`Workflow failed: ${w.workflowName}`);
  });

  // 4. Positive signals (bonuses)
  if (autoMetrics.successRate7d > 95) {
    score += 5;
    breakdown.autonomousResolution += 5;
  }

  if (criticalErrors.length === 0 && highErrors.length === 0) {
    score += 5;
    breakdown.mcpHealth += 5;
  }

  if (stuckWorkflows.length === 0 && failedWorkflows.length === 0) {
    score += 5;
    breakdown.workflowCompletion += 5;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));
  breakdown.mcpHealth = Math.max(0, Math.min(100, breakdown.mcpHealth));
  breakdown.autonomousResolution = Math.max(0, Math.min(100, breakdown.autonomousResolution));
  breakdown.workflowCompletion = Math.max(0, Math.min(100, breakdown.workflowCompletion));

  // Determine status
  let status: HealthScore['status'] = 'healthy';
  if (score < 70) {
    status = 'critical';
  } else if (score < 85) {
    status = 'warning';
  }

  return {
    score,
    status,
    topIssues: topIssues.slice(0, 5), // Top 5 issues
    breakdown,
    timestamp: new Date().toISOString(),
  };
}

export async function getMcpStatuses(): Promise<McpStatus[]> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const metrics = await getPerformanceMetrics({ start: yesterday, end: now });
  const registeredMcps = getRegisteredMcps();

  const statusMap = new Map<string, McpStatus>();

  // Initialize all registered MCPs
  registeredMcps.forEach(name => {
    statusMap.set(name, {
      name,
      status: 'inactive',
      errorRate: 0,
      avgResponseTime: 0,
      lastUsed: null,
      requestCount24h: 0,
      totalRequests: 0,
      availability: 100,
    });
  });

  // Update with actual metrics
  metrics.forEach(m => {
    const name = m.mcpServer;
    const existing = statusMap.get(name) || {
      name,
      status: 'healthy' as const,
      errorRate: 0,
      avgResponseTime: 0,
      lastUsed: null,
      requestCount24h: 0,
      totalRequests: 0,
      availability: 100,
    };

    existing.errorRate = m.errorRate * 100; // Convert to percentage
    existing.avgResponseTime = m.avgDuration;
    existing.requestCount24h = m.requestCount;
    existing.totalRequests += m.requestCount;
    existing.availability = 100 - (m.errorRate * 100);

    // Determine status
    if (m.errorRate > 0.10) {
      existing.status = 'critical';
    } else if (m.errorRate > 0.05 || m.avgDuration > 2000) {
      existing.status = 'warning';
    } else if (m.requestCount > 0) {
      existing.status = 'healthy';
    }

    statusMap.set(name, existing);
  });

  return Array.from(statusMap.values()).sort((a, b) => b.errorRate - a.errorRate);
}
