/**
 * MCP Handoff Protocol v1.0 - Type Definitions
 *
 * Defines JSON schemas for all inter-MCP communication between:
 * - Project Management MCP
 * - Spec-Driven MCP
 * - Task Executor MCP
 *
 * Protocol Version: 1.0.0
 * Created: 2025-10-27
 */

import {
  Priority,
  GoalTier,
  ImpactLevel,
  EffortLevel,
  GoalStatus,
  ProgressInfo,
  Risk,
  GoalDependency
} from './hierarchical-entities';

// ============================================================================
// BASE HANDOFF PROTOCOL
// ============================================================================

/**
 * Base handoff structure - all handoffs extend this
 */
export interface BaseHandoff<TPayload = unknown> {
  // Protocol metadata
  version: string; // e.g., "1.0.0"
  handoffId: string; // Unique UUID
  timestamp: string; // ISO 8601

  // Routing
  sourceMCP: MCPIdentifier;
  targetMCP: MCPIdentifier;
  handoffType: HandoffType;

  // Context (where in the hierarchy this handoff occurs)
  context: HandoffContext;

  // Type-specific payload
  payload: TPayload;

  // Error handling
  retryAttempt?: number;
  maxRetries?: number;
  previousHandoffId?: string; // For retry chains
}

export type MCPIdentifier = 'ai-planning' | 'spec-driven' | 'task-executor';

export type HandoffType =
  | 'goal-to-spec'         // AI Planning → Spec-Driven: Create sub-goals from major goal
  | 'spec-to-tasks'        // Spec-Driven → Task Executor: Create task workflow from sub-goal
  | 'task-completion'      // Task Executor → Spec-Driven: Task completed, update sub-goal progress
  | 'subgoal-completion'   // Spec-Driven → AI Planning: Sub-goal completed, update major goal progress
  | 'progress-update';     // Any → Parent: General progress update

/**
 * Hierarchical context for handoffs
 */
export interface HandoffContext {
  projectPath: string; // Absolute path to project
  projectId: string;
  componentId: string;
  componentName: string;
  majorGoalId?: string; // Optional for some handoff types
  majorGoalName?: string;
  subGoalId?: string;
  workflowId?: string;
}

// ============================================================================
// HANDOFF TYPE 1: GOAL-TO-SPEC (AI Planning → Spec-Driven)
// ============================================================================

/**
 * Handoff from Project Management MCP to Spec-Driven MCP
 *
 * Triggered when: User promotes a major goal and wants to decompose it into sub-goals
 * Purpose: Provide Spec-Driven MCP with all context needed to create specifications
 */
export interface GoalToSpecHandoff extends BaseHandoff<GoalToSpecPayload> {
  handoffType: 'goal-to-spec';
  sourceMCP: 'ai-planning';
  targetMCP: 'spec-driven';
}

export interface GoalToSpecPayload {
  // Major goal identification
  majorGoal: {
    id: string;
    name: string;
    description: string;
    priority: Priority;
    tier: GoalTier;
    impact: ImpactLevel;
    effort: EffortLevel;
  };

  // Goal details for specification
  details: {
    problem: string; // What problem does this solve?
    expectedValue: string; // What value will this create?
    successCriteria: string[];
    acceptanceCriteria?: string[];
    technicalConstraints?: string[];
  };

  // Dependencies and risks
  dependencies: GoalDependency[];
  risks: Risk[];

  // Context for specification
  componentContext: {
    componentId: string;
    componentName: string;
    componentPurpose: string;
    subAreaId?: string;
    subAreaName?: string;
  };

  // Time estimates
  timeframe: {
    estimate: string; // e.g., "2-3 weeks"
    targetDate?: string; // ISO 8601
  };

  // File paths (where Spec-Driven should create files)
  targetPaths: {
    subGoalsFolder: string; // Absolute path
    specsFolder?: string; // Optional separate specs folder
  };

  // User preferences
  preferences?: {
    numberOfSubGoals?: number; // Suggested decomposition (e.g., 3-5)
    decompositionStrategy?: 'sequential' | 'parallel' | 'mixed';
    specificationDepth?: 'light' | 'medium' | 'comprehensive';
  };
}

// ============================================================================
// HANDOFF TYPE 2: SPEC-TO-TASKS (Spec-Driven → Task Executor)
// ============================================================================

/**
 * Handoff from Spec-Driven MCP to Task Executor MCP
 *
 * Triggered when: Spec-Driven has created sub-goal specs and wants executable workflows
 * Purpose: Provide Task Executor with all context needed to create task workflows
 */
export interface SpecToTasksHandoff extends BaseHandoff<SpecToTasksPayload> {
  handoffType: 'spec-to-tasks';
  sourceMCP: 'spec-driven';
  targetMCP: 'task-executor';
}

export interface SpecToTasksPayload {
  // Sub-goal identification
  subGoal: {
    id: string; // e.g., "1.1", "1.2"
    name: string;
    description: string;
    parentGoalId: string;
    parentGoalName: string;
  };

  // Specification details
  specification: {
    acceptanceCriteria: string[];
    technicalRequirements?: string[];
    constraints?: string[];
    deliverables: string[];
  };

  // Task breakdown guidance
  taskGuidance: {
    estimatedTaskCount?: number; // Suggested number of tasks (e.g., 5-8)
    complexity: 'simple' | 'moderate' | 'complex';
    workflowType?: 'bug-fix' | 'feature' | 'refactor' | 'deployment' | 'research';
  };

  // Time estimates
  timeframe: {
    estimate: string; // e.g., "3-5 days"
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };

  // File paths
  targetPaths: {
    workflowFolder: string; // Where Task Executor should create workflow
    relatedFiles?: string[]; // Files relevant to this work
  };

  // Dependencies
  dependencies: {
    blockedBy?: string[]; // Other sub-goal IDs that must complete first
    relatedWorkflows?: string[]; // Other workflow IDs to reference
  };
}

// ============================================================================
// HANDOFF TYPE 3: TASK-COMPLETION (Task Executor → Spec-Driven)
// ============================================================================

/**
 * Handoff from Task Executor MCP to Spec-Driven MCP
 *
 * Triggered when: A task (or entire workflow) is completed
 * Purpose: Update sub-goal progress and check if sub-goal is complete
 */
export interface TaskCompletionHandoff extends BaseHandoff<TaskCompletionPayload> {
  handoffType: 'task-completion';
  sourceMCP: 'task-executor';
  targetMCP: 'spec-driven';
}

export interface TaskCompletionPayload {
  // Workflow identification
  workflow: {
    workflowId: string;
    workflowName: string;
    subGoalId: string;
    majorGoalId: string;
  };

  // Completion details
  completion: {
    completedTaskId?: string; // If single task
    allTasksComplete: boolean; // If entire workflow complete
    completedAt: string; // ISO 8601
    completedBy?: string;
  };

  // Progress update
  progress: {
    tasksCompleted: number;
    totalTasks: number;
    percentage: number; // 0-100
    currentStatus: 'in-progress' | 'completed' | 'blocked';
  };

  // Verification
  verification?: {
    verified: boolean;
    verificationMethod?: string;
    verificationNotes?: string;
  };

  // Deliverables
  deliverables?: {
    filesCreated?: string[];
    filesModified?: string[];
    testsAdded?: number;
    documentation?: string[];
  };

  // Issues encountered
  issues?: {
    blockers?: string[];
    warnings?: string[];
    technicalDebt?: string[];
  };
}

// ============================================================================
// HANDOFF TYPE 4: SUBGOAL-COMPLETION (Spec-Driven → AI Planning)
// ============================================================================

/**
 * Handoff from Spec-Driven MCP to Project Management MCP
 *
 * Triggered when: A sub-goal (and all its task workflows) is completed
 * Purpose: Update major goal progress and check if major goal is complete
 */
export interface SubgoalCompletionHandoff extends BaseHandoff<SubgoalCompletionPayload> {
  handoffType: 'subgoal-completion';
  sourceMCP: 'spec-driven';
  targetMCP: 'ai-planning';
}

export interface SubgoalCompletionPayload {
  // Sub-goal identification
  subGoal: {
    id: string;
    name: string;
    majorGoalId: string;
    majorGoalName: string;
  };

  // Completion details
  completion: {
    completedAt: string; // ISO 8601
    allCriteriaMetStatus: boolean; // All acceptance criteria met?
    totalWorkflows: number;
    completedWorkflows: number;
  };

  // Progress update for major goal
  majorGoalProgress: {
    subGoalsCompleted: number;
    totalSubGoals: number;
    percentage: number; // 0-100
    suggestedStatus: GoalStatus;
  };

  // Outcomes
  outcomes: {
    deliverables: string[]; // What was delivered
    successCriteriaMet: string[]; // Which success criteria were achieved
    learnings?: string[]; // Key learnings or insights
  };

  // Quality metrics
  quality?: {
    testsAdded?: number;
    testsPassing?: number;
    codeReviewStatus?: 'pending' | 'approved' | 'changes-requested';
    documentationComplete?: boolean;
  };
}

// ============================================================================
// HANDOFF TYPE 5: PROGRESS-UPDATE (Any → Parent)
// ============================================================================

/**
 * General progress update handoff (can go in any direction)
 *
 * Triggered when: Progress changes at any level and needs to bubble up
 * Purpose: Keep all hierarchy levels in sync with latest progress
 */
export interface ProgressUpdateHandoff extends BaseHandoff<ProgressUpdatePayload> {
  handoffType: 'progress-update';
}

export interface ProgressUpdatePayload {
  // Entity being updated
  entity: {
    type: 'task-workflow' | 'sub-goal' | 'major-goal' | 'component' | 'project';
    id: string;
    name: string;
  };

  // Progress snapshot
  progress: ProgressInfo;

  // What triggered this update
  trigger: {
    event: 'task-completed' | 'workflow-completed' | 'status-changed' | 'manual-update';
    triggeredBy?: string; // User or system
    relatedEntityId?: string; // Child entity that caused update
  };

  // Propagation
  propagation: {
    shouldBubbleUp: boolean; // Should this update propagate to parent?
    parentEntityType?: 'sub-goal' | 'major-goal' | 'component';
    parentEntityId?: string;
  };
}

// ============================================================================
// HANDOFF RESPONSE TYPES
// ============================================================================

/**
 * Standard response structure for all handoffs
 */
export interface HandoffResponse {
  // Original handoff reference
  handoffId: string;
  receivedAt: string; // ISO 8601

  // Processing result
  success: boolean;
  status: 'accepted' | 'processing' | 'completed' | 'failed' | 'rejected';

  // Response data
  result?: HandoffResult;
  error?: HandoffError;

  // Metadata
  processedBy: MCPIdentifier;
  processingTime?: number; // Milliseconds
}

export interface HandoffResult {
  // What was created/updated
  created?: {
    entityType: string;
    entityId: string;
    filePath?: string;
  }[];

  updated?: {
    entityType: string;
    entityId: string;
    changes: string[];
  }[];

  // Next steps
  nextSteps?: {
    description: string;
    suggestedAction?: string;
    nextHandoffType?: HandoffType;
  }[];

  // Additional data
  metadata?: Record<string, unknown>;
}

export interface HandoffError {
  code: string; // Error code (e.g., "VALIDATION_FAILED", "FILE_NOT_FOUND")
  message: string;
  details?: string;
  recoverable: boolean; // Can this be retried?
  suggestedFix?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result for handoff payloads
 */
export interface HandoffValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGoalToSpecHandoff(handoff: BaseHandoff): handoff is GoalToSpecHandoff {
  return handoff.handoffType === 'goal-to-spec';
}

export function isSpecToTasksHandoff(handoff: BaseHandoff): handoff is SpecToTasksHandoff {
  return handoff.handoffType === 'spec-to-tasks';
}

export function isTaskCompletionHandoff(handoff: BaseHandoff): handoff is TaskCompletionHandoff {
  return handoff.handoffType === 'task-completion';
}

export function isSubgoalCompletionHandoff(handoff: BaseHandoff): handoff is SubgoalCompletionHandoff {
  return handoff.handoffType === 'subgoal-completion';
}

export function isProgressUpdateHandoff(handoff: BaseHandoff): handoff is ProgressUpdateHandoff {
  return handoff.handoffType === 'progress-update';
}
