/**
 * Extended type definitions for Task Executor MCP Server
 * Integrates with workflow-orchestrator-mcp-server
 */

import { WorkflowState } from 'workflow-orchestrator-mcp-server/dist/types/workflow-state.js';
import type { Task, WorkflowContext, WorkflowDocumentation } from './types.js';

/**
 * Task Executor Workflow Data
 * Custom data structure for task execution workflows
 */
export interface TaskExecutorWorkflowData {
  tasks: Task[];
  constraints: string[];
  context: WorkflowContext;
  documentation: WorkflowDocumentation;
  parallelizationAnalysis?: {
    shouldParallelize: boolean;
    estimatedSpeedup: number;
    mode: 'parallel' | 'sequential';
    reasoning: string;
  };
  metadata: {
    totalTasks: number;
    completedTasks: number;
    verifiedTasks: number;
    percentComplete: number;
    lastUpdated: Date;
  };
}

/**
 * Complete Task Executor Workflow State
 * Extends generic WorkflowState with task-executor specific data
 */
export type TaskExecutorWorkflowState = WorkflowState<TaskExecutorWorkflowData>;

// Re-export common types for convenience
export type {
  Task,
  TaskStatus,
  WorkflowContext,
  WorkflowDocumentation,
  VerificationReport,
  VerificationStatus
} from './types.js';
