/**
 * Workflow Orchestrator Library
 *
 * Shared orchestration components for workflow MCPs
 */

// Core modules
export { StateManager } from './core/state-manager.js';
export { StateDetector } from './core/state-detector.js';
export { RuleEngine } from './core/rule-engine.js';
export { ParallelizationAnalyzer } from './core/parallelization-analyzer.js';

// Types
export type { WorkflowState } from './types/workflow-state.js';
export type { ProjectState, PhaseInfo, PhaseStatus, GoalTracking, IntegrationTracking } from './types/project-state.js';
export type { WorkflowRule, RuleCondition } from './types/rule-schema.js';

// Parallelization types
export type {
  Task,
  ParallelizationConfig,
  ParallelizationAnalysis,
  MCPToolCaller,
  ParallelizationMCPResponse
} from './core/parallelization-analyzer.js';
