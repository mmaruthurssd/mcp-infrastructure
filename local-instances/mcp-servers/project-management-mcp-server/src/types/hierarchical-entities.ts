/**
 * Hierarchical Planning Entities for Project Management MCP Server v1.0.0
 *
 * Defines the 7-level hierarchy:
 * 1. Initial Inputs (conversation data)
 * 2. PROJECT OVERVIEW (vision, components, constraints)
 * 3. Components (domain areas)
 * 4. Sub-Areas (focus areas within components)
 * 5. Major Goals (strategic objectives - Project Management MCP)
 * 6. Sub-Goals (tactical plans - Spec-Driven MCP)
 * 7. Tasks (execution - Task Executor MCP)
 */

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Version information for version-aware documents
 */
export interface VersionInfo {
  version: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  updatedBy?: string;
  changeDescription?: string;
}

/**
 * Version history entry
 */
export interface VersionHistoryEntry {
  version: number;
  date: string; // ISO 8601
  changes: string[];
  impactedComponents?: string[]; // Component IDs affected by changes
  cascadeRequired?: boolean; // Whether cascade updates needed
}

/**
 * Progress tracking for any hierarchical entity
 */
export interface ProgressInfo {
  percentage: number; // 0-100
  status: ProgressStatus;
  lastUpdated: string; // ISO 8601
  completedItems: number;
  totalItems: number;
  breakdown?: ProgressBreakdown; // Optional detailed breakdown
}

export type ProgressStatus =
  | 'not-started'
  | 'planning'
  | 'in-progress'
  | 'blocked'
  | 'on-hold'
  | 'completed'
  | 'cancelled';

/**
 * Detailed progress breakdown by sub-entities
 */
export interface ProgressBreakdown {
  [entityId: string]: {
    name: string;
    progress: number;
    status: ProgressStatus;
  };
}

/**
 * Priority levels across all hierarchical levels
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Goal tiers for strategic planning
 */
export type GoalTier = 'now' | 'next' | 'later' | 'someday';

/**
 * Effort estimates
 */
export type EffortLevel = 'high' | 'medium' | 'low';

/**
 * Impact levels
 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/**
 * MCP handoff protocol data structure
 */
export interface MCPHandoff {
  sourceContext: MCPHandoffContext;
  targetMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
  handoffType: HandoffType;
  payload: any; // Type-specific payload
  metadata: HandoffMetadata;
}

export type HandoffType =
  | 'goal-to-spec' // AI Planning → Spec-Driven (Major Goal → Sub-Goals)
  | 'spec-to-tasks' // Spec-Driven → Task Executor (Sub-Goal → Task Workflow)
  | 'task-completion' // Task Executor → Spec-Driven (Task complete → update sub-goal)
  | 'subgoal-completion' // Spec-Driven → AI Planning (Sub-goal complete → update major goal)
  | 'progress-update'; // Any → Parent (Progress bubble-up)

export interface MCPHandoffContext {
  projectPath: string;
  componentId?: string;
  majorGoalId?: string;
  subGoalId?: string;
  workflowId?: string;
}

export interface HandoffMetadata {
  timestamp: string; // ISO 8601
  handoffId: string; // Unique identifier
  version: string; // Handoff protocol version
  retryCount?: number;
  errorMessage?: string;
}

// ============================================================================
// LEVEL 2: PROJECT OVERVIEW
// ============================================================================

/**
 * PROJECT OVERVIEW - The single source of truth for project vision
 *
 * This is the top-level entity that defines the entire project.
 * Contains vision, constraints, stakeholders, and components.
 */
export interface ProjectOverview {
  // Identity
  id: string; // Unique project identifier (slug from project name)
  name: string;
  description: string;

  // Version control
  versionInfo: VersionInfo;
  versionHistory: VersionHistoryEntry[];

  // Core project definition
  vision: ProjectVision;
  constraints: ProjectConstraints;
  stakeholders: Stakeholder[];
  resources: ProjectResources;

  // Components (domain areas)
  components: ComponentReference[]; // References to components

  // Metadata
  createdAt: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  status: ProjectStatus;

  // File paths
  filePath: string; // Path to PROJECT-OVERVIEW.md
}

export interface ProjectVision {
  missionStatement: string;
  successCriteria: string[];
  scope: {
    inScope: string[];
    outOfScope: string[];
  };
  risks: Risk[];
}

export interface ProjectConstraints {
  timeline: {
    startDate?: string; // ISO 8601
    targetEndDate?: string; // ISO 8601
    milestones: Milestone[];
  };
  budget?: {
    available: string;
    allocated: string;
  };
  resources: {
    team: string[];
    tools: string[];
    technologies: string[];
  };
}

export interface Stakeholder {
  name: string;
  role: string;
  influence: 'very-high' | 'high' | 'medium' | 'low';
  interest: 'very-high' | 'high' | 'medium' | 'low';
  concerns: string[];
  communication: string; // How to communicate with this stakeholder
}

export interface ProjectResources {
  existingAssets: string[];
  neededAssets: string[];
  externalDependencies: string[];
}

export interface Risk {
  id: string;
  description: string;
  impact: 'very-high' | 'high' | 'medium' | 'low';
  probability: 'very-high' | 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: string; // ISO 8601
  deliverables: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';

/**
 * Component reference (lightweight, full component data stored separately)
 */
export interface ComponentReference {
  id: string;
  name: string;
  description: string;
  filePath: string; // Path to COMPONENT-OVERVIEW.md
  progress?: ProgressInfo; // Optional cached progress
}

// ============================================================================
// LEVEL 3: COMPONENT
// ============================================================================

/**
 * COMPONENT - A major domain area within the project
 *
 * Examples: "Marketing", "Engineering", "Legal", "Data Model & Architecture"
 * Contains sub-areas and major goals.
 */
export interface Component {
  // Identity
  id: string; // Unique component identifier
  name: string;
  description: string;

  // Hierarchy
  projectId: string; // Reference to parent PROJECT OVERVIEW

  // Version control
  versionInfo: VersionInfo;

  // Structure
  subAreas: SubAreaReference[]; // Optional organizational grouping
  majorGoals: MajorGoalReference[]; // Strategic objectives

  // Component details
  purpose: string;
  successCriteria: string[];
  dependencies: ComponentDependency[];
  risks: Risk[];

  // Progress
  progress: ProgressInfo;

  // Metadata
  createdAt: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  status: ComponentStatus;

  // File paths
  folderPath: string; // Path to component folder
  overviewFilePath: string; // Path to COMPONENT-OVERVIEW.md
}

export interface ComponentDependency {
  componentId: string;
  componentName: string;
  dependencyType: 'blocks' | 'influences' | 'integrates-with';
  description: string;
}

export type ComponentStatus = 'not-started' | 'planning' | 'in-progress' | 'completed';

export interface SubAreaReference {
  id: string;
  name: string;
  description: string;
  folderPath: string;
}

export interface MajorGoalReference {
  id: string;
  name: string;
  priority: Priority;
  tier: GoalTier;
  progress?: ProgressInfo;
  filePath: string;
}

// ============================================================================
// LEVEL 4: SUB-AREA
// ============================================================================

/**
 * SUB-AREA - A focus area within a component (optional organizational level)
 *
 * Examples within "Marketing" component:
 * - "Website Marketing"
 * - "Social Media"
 * - "Email Campaigns"
 *
 * Sub-areas are optional - components can contain major goals directly.
 */
export interface SubArea {
  // Identity
  id: string;
  name: string;
  description: string;

  // Hierarchy
  projectId: string;
  componentId: string;

  // Structure
  majorGoals: MajorGoalReference[]; // Goals within this sub-area

  // Metadata
  folderPath: string;
}

// ============================================================================
// LEVEL 5: MAJOR GOAL
// ============================================================================

/**
 * MAJOR GOAL - A strategic objective (weeks-months timeframe)
 *
 * Owned by Project Management MCP.
 * Decomposed into sub-goals by Spec-Driven MCP.
 */
export interface MajorGoal {
  // Identity
  id: string; // e.g., "001", "002"
  name: string;
  description: string;

  // Hierarchy
  projectId: string;
  componentId: string;
  subAreaId?: string; // Optional

  // Goal classification
  priority: Priority;
  tier: GoalTier;
  impact: ImpactLevel;
  effort: EffortLevel;

  // Goal details
  problem: string; // What problem does this solve?
  expectedValue: string; // What value will this create?
  successCriteria: string[];
  dependencies: GoalDependency[];
  risks: Risk[];
  alternatives: string[]; // What alternatives were considered?

  // Decomposition
  subGoals: SubGoalReference[]; // Tactical plans (Spec-Driven MCP)

  // Progress tracking
  progress: ProgressInfo;
  timeEstimate: string; // e.g., "2-3 weeks"
  targetDate?: string; // ISO 8601

  // Metadata
  createdAt: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  status: GoalStatus;
  owner?: string;

  // File paths
  folderPath: string; // Path to goal folder
  goalFilePath: string; // Path to main goal .md file
  statusFilePath: string; // Path to GOAL-STATUS.md

  // MCP Integration
  handoffInfo?: MCPHandoffInfo; // Tracks handoff to/from Project Management MCP
}

export interface GoalDependency {
  goalId: string;
  goalName: string;
  dependencyType: 'blocks' | 'influences';
  description: string;
}

export type GoalStatus =
  | 'planning'
  | 'not-started'
  | 'in-progress'
  | 'blocked'
  | 'on-hold'
  | 'completed'
  | 'cancelled';

export interface SubGoalReference {
  id: string; // e.g., "1.1", "1.2"
  name: string;
  progress?: ProgressInfo;
  folderPath: string;
  specFilePath?: string; // Path to SPECIFICATION.md
}

// ============================================================================
// LEVEL 6: SUB-GOAL
// ============================================================================

/**
 * SUB-GOAL - A tactical plan (days-weeks timeframe)
 *
 * Owned by Spec-Driven MCP.
 * Decomposed into task workflows by Task Executor MCP.
 */
export interface SubGoal {
  // Identity
  id: string; // e.g., "1.1", "2.3"
  name: string;
  description: string;

  // Hierarchy
  projectId: string;
  componentId: string;
  majorGoalId: string;

  // Sub-goal details
  specification?: string; // Detailed specification (optional)
  acceptanceCriteria: string[];
  technicalNotes?: string;

  // Task workflows
  taskWorkflows: TaskWorkflowReference[]; // Execution workflows (Task Executor MCP)

  // Progress tracking
  progress: ProgressInfo;
  timeEstimate: string; // e.g., "3-5 days"

  // Metadata
  createdAt: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  status: GoalStatus;

  // File paths
  folderPath: string;
  specFilePath?: string; // Path to SPECIFICATION.md

  // MCP Integration
  handoffInfo?: MCPHandoffInfo; // Tracks handoff to/from Spec-Driven MCP
}

/**
 * Handoff tracking information for MCP communication
 *
 * Enhanced in v1.0.0 to support comprehensive handoff protocol
 */
export interface MCPHandoffInfo {
  handoffId: string;
  timestamp: string; // ISO 8601
  sourceMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
  targetMCP: 'ai-planning' | 'spec-driven' | 'task-executor';
  handoffType: HandoffType;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  errorMessage?: string;
  errorCode?: string;

  // Performance metrics
  sentAt?: string; // ISO 8601
  receivedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  processingTimeMs?: number;

  // Retry tracking
  retryCount?: number;
  lastRetryAt?: string; // ISO 8601

  // Result tracking
  resultSummary?: string;
  entitiesCreated?: number;
  entitiesUpdated?: number;
}

export interface TaskWorkflowReference {
  workflowId: string;
  workflowName: string;
  progress?: ProgressInfo;
  workflowPath: string; // Path to task-executor workflow
}

// ============================================================================
// LEVEL 7: TASK WORKFLOW & TASKS
// ============================================================================

/**
 * TASK WORKFLOW - A workflow containing multiple tasks
 *
 * Owned by Task Executor MCP.
 * Represents the actual execution work.
 */
export interface TaskWorkflow {
  // Identity
  workflowId: string;
  workflowName: string;

  // Hierarchy
  projectId: string;
  componentId: string;
  majorGoalId: string;
  subGoalId: string;

  // Tasks
  tasks: Task[];

  // Progress tracking
  progress: ProgressInfo;

  // Metadata
  createdAt: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  status: 'pending' | 'in-progress' | 'completed';

  // File paths
  workflowPath: string; // Path to task-executor workflow folder

  // MCP Integration
  handoffInfo?: MCPHandoffInfo; // Tracks handoff from Spec-Driven MCP
}

/**
 * TASK - An individual execution task (hours-days timeframe)
 *
 * Owned by Task Executor MCP.
 * Smallest unit of work.
 */
export interface Task {
  // Identity
  taskId: string; // e.g., "1", "2", "3"
  description: string;

  // Task details
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;

  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  completedAt?: string; // ISO 8601
  blockedReason?: string;

  // Verification
  verified: boolean;
  verificationNotes?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if an entity has progress tracking
 */
export function hasProgress(entity: any): entity is { progress: ProgressInfo } {
  return entity && typeof entity === 'object' && 'progress' in entity;
}

/**
 * Calculate aggregate progress from child entities
 */
export interface ProgressAggregationResult {
  percentage: number;
  completedItems: number;
  totalItems: number;
  status: ProgressStatus;
  breakdown: ProgressBreakdown;
}

/**
 * Version cascade update result
 */
export interface CascadeUpdateResult {
  updated: string[]; // IDs of updated entities
  failed: string[]; // IDs of failed updates
  warnings: string[];
}
