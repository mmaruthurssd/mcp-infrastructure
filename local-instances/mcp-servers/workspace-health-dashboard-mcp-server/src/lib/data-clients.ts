/**
 * Data clients for aggregating information from other MCPs
 * Handles graceful degradation when MCPs are unavailable
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { PerformanceMetric, WorkflowStatus } from '../types/index.js';

const WORKSPACE_BRAIN_PATH = process.env.WORKSPACE_BRAIN_PATH || join(homedir(), 'workspace-brain');
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || join(homedir(), 'Desktop/operations-workspace');

/**
 * Get performance metrics from performance-monitor-mcp
 */
export async function getPerformanceMetrics(timeRange: { start: Date; end: Date }): Promise<PerformanceMetric[]> {
  try {
    const metricsPath = join(WORKSPACE_BRAIN_PATH, 'telemetry/performance-metrics.jsonl');
    if (!existsSync(metricsPath)) {
      return [];
    }

    const lines = readFileSync(metricsPath, 'utf-8').trim().split('\n');
    const metrics = new Map<string, PerformanceMetric>();

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = JSON.parse(line);
      const eventTime = new Date(event.timestamp);

      if (eventTime >= timeRange.start && eventTime <= timeRange.end) {
        const key = `${event.mcpServer}:${event.toolName}`;

        if (!metrics.has(key)) {
          metrics.set(key, {
            mcpServer: event.mcpServer,
            toolName: event.toolName,
            avgDuration: 0,
            p95Duration: 0,
            p99Duration: 0,
            errorRate: 0,
            requestCount: 0,
          });
        }

        const metric = metrics.get(key)!;
        metric.requestCount++;

        if (!event.success) {
          metric.errorRate = ((metric.errorRate * (metric.requestCount - 1)) + 1) / metric.requestCount;
          metric.lastError = event.errorMessage;
          metric.lastErrorTime = event.timestamp;
        }

        metric.avgDuration = ((metric.avgDuration * (metric.requestCount - 1)) + event.duration) / metric.requestCount;
      }
    }

    return Array.from(metrics.values());
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    return [];
  }
}

/**
 * Get autonomous resolution metrics from workspace-brain
 */
export async function getAutonomousResolutionMetrics(): Promise<any> {
  try {
    const telemetryPath = join(WORKSPACE_BRAIN_PATH, 'telemetry/events.jsonl');
    if (!existsSync(telemetryPath)) {
      return {
        totalResolutions: 0,
        successRate7d: 0,
        successRate30d: 0,
        avgResolutionTime: 0,
        trend: 'stable',
        recentResolutions: [],
      };
    }

    const lines = readFileSync(telemetryPath, 'utf-8').trim().split('\n');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalResolutions = 0;
    let successful7d = 0;
    let total7d = 0;
    let successful30d = 0;
    let total30d = 0;
    let totalDuration = 0;
    let durationCount = 0;
    const recentResolutions: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = JSON.parse(line);
      const eventTime = new Date(event.event_data?.timestamp || event.timestamp);

      if (event.event_type === 'autonomous-resolution' || event.event_data?.task_type === 'autonomous-resolution') {
        totalResolutions++;

        const success = event.event_data?.outcome === 'completed';
        const duration = event.event_data?.duration_minutes || 0;

        if (duration > 0) {
          totalDuration += duration;
          durationCount++;
        }

        if (eventTime >= sevenDaysAgo) {
          total7d++;
          if (success) successful7d++;
        }

        if (eventTime >= thirtyDaysAgo) {
          total30d++;
          if (success) successful30d++;

          recentResolutions.push({
            timestamp: event.event_data?.timestamp || event.timestamp,
            type: event.event_data?.task_type || 'unknown',
            success,
            duration,
          });
        }
      }
    }

    recentResolutions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const successRate7d = total7d > 0 ? (successful7d / total7d) * 100 : 0;
    const successRate30d = total30d > 0 ? (successful30d / total30d) * 100 : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (successRate7d > successRate30d + 5) trend = 'improving';
    else if (successRate7d < successRate30d - 5) trend = 'declining';

    return {
      totalResolutions,
      successRate7d,
      successRate30d,
      avgResolutionTime: durationCount > 0 ? totalDuration / durationCount : 0,
      trend,
      recentResolutions: recentResolutions.slice(0, 10),
    };
  } catch (error) {
    console.error('Failed to get autonomous metrics:', error);
    return {
      totalResolutions: 0,
      successRate7d: 0,
      successRate30d: 0,
      avgResolutionTime: 0,
      trend: 'stable',
      recentResolutions: [],
    };
  }
}

/**
 * Get workflow status from task-executor and project-management
 */
export async function getWorkflowStatuses(): Promise<WorkflowStatus[]> {
  try {
    const workflows: WorkflowStatus[] = [];
    const taskExecutorPath = join(WORKSPACE_ROOT, 'local-instances/mcp-servers/task-executor-mcp-server/data');

    if (existsSync(taskExecutorPath)) {
      // Read workflow states
      const { readdirSync } = await import('fs');
      const files = readdirSync(taskExecutorPath);

      for (const file of files) {
        if (file.endsWith('-state.json')) {
          try {
            const statePath = join(taskExecutorPath, file);
            const state = JSON.parse(readFileSync(statePath, 'utf-8'));

            const startTime = new Date(state.startedAt);
            const now = new Date();
            const duration = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

            const completedTasks = state.tasks?.filter((t: any) => t.status === 'completed').length || 0;
            const totalTasks = state.tasks?.length || 1;
            const progress = (completedTasks / totalTasks) * 100;

            let status: WorkflowStatus['status'] = 'running';
            if (progress === 100) status = 'completed';
            else if (duration > 24 && progress < 50) status = 'stuck';

            workflows.push({
              workflowName: state.name || file.replace('-state.json', ''),
              status,
              progress,
              startedAt: state.startedAt,
              stuckDuration: status === 'stuck' ? duration : undefined,
              currentTask: state.tasks?.find((t: any) => t.status === 'in-progress')?.description,
            });
          } catch (err) {
            // Skip invalid files
          }
        }
      }
    }

    return workflows;
  } catch (error) {
    console.error('Failed to get workflow statuses:', error);
    return [];
  }
}

/**
 * Get all registered MCPs from config
 */
export function getRegisteredMcps(): string[] {
  try {
    const configPath = join(homedir(), '.claude.json');
    if (!existsSync(configPath)) {
      return [];
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const mcps: string[] = [];

    if (config.mcpServers) {
      mcps.push(...Object.keys(config.mcpServers));
    }

    return mcps;
  } catch (error) {
    console.error('Failed to get registered MCPs:', error);
    return [];
  }
}

/**
 * Get automation opportunities from workspace-brain
 */
export async function getAutomationOpportunities(): Promise<any[]> {
  try {
    const telemetryPath = join(WORKSPACE_BRAIN_PATH, 'telemetry/events.jsonl');
    if (!existsSync(telemetryPath)) {
      return [];
    }

    const lines = readFileSync(telemetryPath, 'utf-8').trim().split('\n');
    const patterns = new Map<string, { count: number; totalDuration: number }>();

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = JSON.parse(line);
      if (event.event_data?.task_type) {
        const key = event.event_data.task_type;
        const duration = event.event_data.duration_minutes || 0;

        if (!patterns.has(key)) {
          patterns.set(key, { count: 0, totalDuration: 0 });
        }

        const pattern = patterns.get(key)!;
        pattern.count++;
        pattern.totalDuration += duration;
      }
    }

    const opportunities: any[] = [];
    for (const [pattern, data] of patterns.entries()) {
      if (data.count >= 5 && data.totalDuration / data.count >= 15) {
        const avgDuration = data.totalDuration / data.count;
        const frequencyPerWeek = data.count; // Simplified
        const potentialRoi = (frequencyPerWeek * avgDuration * 4 * 50) / 60; // $50/hour rate

        opportunities.push({
          pattern,
          frequency: frequencyPerWeek,
          avgDuration,
          potentialRoi,
          effortEstimate: avgDuration > 30 ? 'high' : avgDuration > 15 ? 'medium' : 'low',
          priority: Math.min(10, Math.floor(potentialRoi / 100)),
          description: `Automate ${pattern} task`,
        });
      }
    }

    opportunities.sort((a, b) => b.potentialRoi - a.potentialRoi);
    return opportunities;
  } catch (error) {
    console.error('Failed to get automation opportunities:', error);
    return [];
  }
}
