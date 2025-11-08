/**
 * Component-Driven Framework v3.0 - Type Definitions
 *
 * Complete TypeScript type definitions for the Component-Driven Iterative Project Framework
 * Used by project-management MCP server for managing component-based project workflows
 */

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * Component lifecycle stages
 * EXPLORING - Initial exploration and brainstorming
 * FRAMEWORK - Framework/structure definition phase
 * FINALIZED - Component is complete and ready for implementation
 * ARCHIVED - Component is completed or deprecated
 */
export type ComponentStage = "EXPLORING" | "FRAMEWORK" | "FINALIZED" | "ARCHIVED";

/**
 * Project types for different use cases
 */
export type ProjectType = "product" | "software" | "business" | "event" | "research" | "custom";

/**
 * Conversation workflow phases
 */
export type WorkflowPhase =
  | "initialization"      // Project setup and component identification
  | "component-building"  // Building and refining components
  | "finalization"        // Finalizing components and creating goals
  | "execution"           // Implementation and tracking
  | "completed";          // Project completed

/**
 * Component change action types
 */
export type ComponentAction =
  | "created"
  | "updated"
  | "moved"
  | "split"
  | "merged"
  | "converted_to_goal"
  | "archived";

// ============================================================================
// COMPONENT STRUCTURES
// ============================================================================

/**
 * Sub-component within a component
 */
export interface SubComponent {
  name: string;
  description: string;
  status?: "pending" | "in-progress" | "complete";
  notes?: string;
}

/**
 * Component dependencies
 */
export interface ComponentDependencies {
  requires?: string[];      // Components this depends on
  requiredBy?: string[];    // Components that depend on this
  relatedTo?: string[];     // Related components
}

/**
 * Main component entity
 */
export interface Component {
  name: string;
  stage: ComponentStage;
  description: string;
  subComponents?: SubComponent[];
  dependencies?: ComponentDependencies;
  priority?: "high" | "medium" | "low";
  status?: "active" | "blocked" | "on-hold";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Component change log entry
 */
export interface ComponentChangeLogEntry {
  timestamp: string;
  componentName: string;
  action: ComponentAction;
  fromStage?: ComponentStage;
  toStage?: ComponentStage;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Project overview document structure
 */
export interface ProjectOverviewDocument {
  projectName: string;
  projectType: ProjectType;
  description: string;
  currentPhase: WorkflowPhase;
  components: {
    exploring: Component[];
    framework: Component[];
    finalized: Component[];
    archived: Component[];
  };
  changeLog: ComponentChangeLogEntry[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version?: string;
    [key: string]: any;
  };
}

// ============================================================================
// TOOL PARAMETER TYPES
// ============================================================================

/**
 * Parameters for create_component tool
 */
export interface CreateComponentParams {
  projectPath: string;
  name: string;
  stage: ComponentStage;
  description: string;
  subComponents?: SubComponent[];
  dependencies?: ComponentDependencies;
  priority?: "high" | "medium" | "low";
  notes?: string;
}

/**
 * Parameters for update_component tool
 */
export interface UpdateComponentParams {
  projectPath: string;
  name: string;
  updates: {
    description?: string;
    subComponents?: SubComponent[];
    dependencies?: ComponentDependencies;
    priority?: "high" | "medium" | "low";
    status?: "active" | "blocked" | "on-hold";
    notes?: string;
  };
}

/**
 * Parameters for move_component tool
 */
export interface MoveComponentParams {
  projectPath: string;
  componentName: string;
  toStage: ComponentStage;
  notes?: string;
}

/**
 * Parameters for split_component tool
 */
export interface SplitComponentParams {
  projectPath: string;
  componentName: string;
  newComponents: Array<{
    name: string;
    description: string;
    subComponents?: SubComponent[];
  }>;
  keepOriginal?: boolean;
  targetStage?: ComponentStage;
}

/**
 * Parameters for merge_components tool
 */
export interface MergeComponentsParams {
  projectPath: string;
  componentNames: string[];
  mergedName: string;
  mergedDescription: string;
  targetStage?: ComponentStage;
  keepOriginals?: boolean;
}

/**
 * Parameters for component_to_goal tool
 */
export interface ComponentToGoalParams {
  projectPath: string;
  componentName: string;
  goalType?: "feature" | "improvement" | "research" | "custom";
  priority?: "high" | "medium" | "low";
  archiveComponent?: boolean;
}

/**
 * Parameters for start_new_project tool
 */
export interface StartNewProjectParams {
  projectPath: string;
  projectName: string;
  projectType: ProjectType;
  description?: string;
  initialComponents?: Array<{
    name: string;
    description: string;
    stage?: ComponentStage;
  }>;
}

/**
 * Parameters for advance_workflow tool
 */
export interface AdvanceWorkflowParams {
  projectPath: string;
  targetPhase?: WorkflowPhase;
  skipValidation?: boolean;
}

/**
 * Parameters for identify_components tool
 */
export interface IdentifyComponentsParams {
  projectPath: string;
  conversationContext?: string;
  autoCreate?: boolean;
  suggestedStage?: ComponentStage;
}

/**
 * Parameters for propagate_component_change tool
 */
export interface PropagateComponentChangeParams {
  projectPath: string;
  componentName: string;
  action: ComponentAction;
  fromStage?: ComponentStage;
  toStage?: ComponentStage;
}

/**
 * Parameters for log_component_change tool
 */
export interface LogComponentChangeParams {
  projectPath: string;
  entry: Omit<ComponentChangeLogEntry, "timestamp">;
}

/**
 * Parameters for get_component_history tool
 */
export interface GetComponentHistoryParams {
  projectPath: string;
  componentName?: string;
  limit?: number;
  action?: ComponentAction;
}

/**
 * Parameters for check_project_consistency tool
 */
export interface CheckProjectConsistencyParams {
  projectPath: string;
  autoFix?: boolean;
  checks?: Array<"structure" | "dependencies" | "duplicates" | "orphans">;
}

// ============================================================================
// TOOL RESULT TYPES
// ============================================================================

/**
 * Generic component result
 */
export interface ComponentResult {
  success: boolean;
  component?: Component;
  error?: string;
  warnings?: string[];
}

/**
 * Result from create_component
 */
export interface CreateComponentResult {
  success: boolean;
  component: Component;
  message: string;
  nextActions?: string[];
}

/**
 * Result from update_component
 */
export interface UpdateComponentResult {
  success: boolean;
  component: Component;
  changes: string[];
  message: string;
}

/**
 * Result from move_component
 */
export interface MoveComponentResult {
  success: boolean;
  component: Component;
  fromStage: ComponentStage;
  toStage: ComponentStage;
  propagated: boolean;
  message: string;
  nextActions?: string[];
}

/**
 * Result from split_component
 */
export interface SplitComponentResult {
  success: boolean;
  originalComponent?: Component;
  newComponents: Component[];
  message: string;
  propagated: boolean;
}

/**
 * Result from merge_components
 */
export interface MergeComponentsResult {
  success: boolean;
  mergedComponent: Component;
  originalComponents: Component[];
  message: string;
  propagated: boolean;
}

/**
 * Result from component_to_goal
 */
export interface ComponentToGoalResult {
  success: boolean;
  goalPath: string;
  component: Component;
  archived: boolean;
  message: string;
  nextActions?: string[];
}

/**
 * Result from start_new_project
 */
export interface StartNewProjectResult {
  success: boolean;
  projectPath: string;
  projectName: string;
  filesCreated: string[];
  componentsCreated?: number;
  message: string;
  nextActions: string[];
}

/**
 * Result from advance_workflow
 */
export interface AdvanceWorkflowResult {
  success: boolean;
  fromPhase: WorkflowPhase;
  toPhase: WorkflowPhase;
  validationPassed: boolean;
  message: string;
  blockers?: string[];
  nextActions?: string[];
}

/**
 * Result from identify_components
 */
export interface IdentifyComponentsResult {
  success: boolean;
  identifiedComponents: Array<{
    name: string;
    description: string;
    suggestedStage: ComponentStage;
    confidence: "high" | "medium" | "low";
  }>;
  created?: Component[];
  message: string;
}

/**
 * Result from propagate_component_change
 */
export interface PropagationResult {
  success: boolean;
  filesUpdated: string[];
  changes: Array<{
    file: string;
    action: string;
    description: string;
  }>;
  message: string;
}

/**
 * Result from log_component_change
 */
export interface ComponentChangeLogResult {
  success: boolean;
  entry: ComponentChangeLogEntry;
  message: string;
}

/**
 * Result from get_component_history
 */
export interface ComponentHistoryResult {
  success: boolean;
  entries: ComponentChangeLogEntry[];
  totalCount: number;
  message: string;
}

/**
 * Result from check_project_consistency
 */
export interface ConsistencyCheckResult {
  success: boolean;
  issues: Array<{
    type: "error" | "warning" | "info";
    category: string;
    description: string;
    component?: string;
    autoFixed?: boolean;
  }>;
  summary: {
    errors: number;
    warnings: number;
    fixed: number;
  };
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Component filter options
 */
export interface ComponentFilter {
  stage?: ComponentStage;
  priority?: "high" | "medium" | "low";
  status?: "active" | "blocked" | "on-hold";
  hasSubComponents?: boolean;
  hasDependencies?: boolean;
}

/**
 * Component sort options
 */
export interface ComponentSortOptions {
  field: "name" | "priority" | "createdAt" | "updatedAt";
  order: "asc" | "desc";
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
