/**
 * MCP Handoff Protocol Types
 * Version 1.0
 *
 * Defines the structure for inter-MCP communication
 */

export type HandoffType =
  | 'goal_to_spec'           // project-management → spec-driven
  | 'spec_to_tasks'          // spec-driven → task-executor
  | 'task_completion'        // task-executor → spec-driven
  | 'progress_update'        // spec-driven → project-management
  | 'subgoal_completion';    // Any → project-management

export type HandoffStatus = 'pending' | 'sent' | 'received' | 'completed' | 'failed' | 'rolled_back';

export interface HandoffMetadata {
  version: string;              // Protocol version (e.g., "1.0")
  handoffId: string;            // Unique identifier
  handoffType: HandoffType;
  timestamp: string;            // ISO 8601 timestamp
  sourceMcp: string;            // Source MCP name
  targetMcp: string;            // Target MCP name
  sourceProjectPath: string;    // Where the handoff originated
  targetProjectPath?: string;   // Where to deliver (may differ from source)
  retryCount: number;           // Number of retry attempts
  status: HandoffStatus;
}

export interface GoalToSpecHandoff {
  goalId: string;
  goalName: string;
  goalDescription: string;
  goalContext: {
    impact: string;
    effort: string;
    tier: string;
    reasoning?: string;
  };
  autonomous?: {
    confidence: number;
    autonomyLevel: string;
    baseType: string;
  };
}

export interface SpecToTasksHandoff {
  specificationPath: string;
  goalId: string;
  goalName: string;
  tasks: Array<{
    description: string;
    estimatedHours?: number;
    dependencies?: string[];
  }>;
  parallelizationAnalysis?: {
    shouldParallelize: boolean;
    estimatedSpeedup: number;
    mode: 'parallel' | 'sequential';
    reasoning: string;
  };
}

export interface TaskCompletionHandoff {
  workflowName: string;
  goalId: string;
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
  remainingWork?: string[];
  blockers?: string[];
}

export interface ProgressUpdateHandoff {
  goalId: string;
  phase: string;
  progressPercentage: number;
  milestones: Array<{
    name: string;
    status: 'completed' | 'in-progress' | 'pending';
    completedDate?: string;
  }>;
}

export interface Handoff<T = any> {
  metadata: HandoffMetadata;
  data: T;
  validation?: {
    schema: string;
    validated: boolean;
    validatedAt?: string;
  };
}

export interface HandoffResponse {
  handoffId: string;
  success: boolean;
  receivedAt: string;
  processedAt?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  result?: any;
}

export interface HandoffAuditEntry {
  handoffId: string;
  timestamp: string;
  action: 'created' | 'sent' | 'received' | 'completed' | 'failed' | 'retried' | 'rolled_back';
  metadata: HandoffMetadata;
  details?: string;
  error?: any;
}
