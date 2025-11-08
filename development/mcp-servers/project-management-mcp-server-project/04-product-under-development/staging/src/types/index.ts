/**
 * Type Exports for Project Management MCP Server
 *
 * Central export point for all type definitions
 */

// Legacy v0.8.0 types (backward compatibility)
export * from './project-state.js';

// v1.0.0 Hierarchical types
export * from './hierarchical-entities.js';

// Re-export commonly used types for convenience
export type {
  // Core entities
  ProjectOverview,
  Component,
  SubArea,
  MajorGoal,
  SubGoal,
  TaskWorkflow,
  Task,

  // Shared types
  VersionInfo,
  VersionHistoryEntry,
  ProgressInfo,
  ProgressStatus,
  ProgressBreakdown,
  MCPHandoff,
  HandoffType,
  MCPHandoffContext,
  HandoffMetadata,

  // Status and level types
  Priority,
  GoalTier,
  EffortLevel,
  ImpactLevel,
  GoalStatus,
  ProjectStatus,
  ComponentStatus,

  // Supporting types
  ProjectVision,
  ProjectConstraints,
  Stakeholder,
  Risk,
  Milestone,
  ComponentDependency,
  GoalDependency,

  // Reference types
  ComponentReference,
  SubAreaReference,
  MajorGoalReference,
  SubGoalReference,
  TaskWorkflowReference,

  // MCP integration
  MCPHandoffInfo,

  // Utility types
  ProgressAggregationResult,
  CascadeUpdateResult,
} from './hierarchical-entities.js';
