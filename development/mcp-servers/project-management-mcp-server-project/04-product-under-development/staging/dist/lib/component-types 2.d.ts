/**
 * Component-Driven Framework v3.0 - Type Definitions
 *
 * Type definitions for the component-driven iterative project framework.
 * These types support the workflow: EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED
 *
 * Created: 2025-11-04
 * Phase: 2A - Core Infrastructure
 */
/**
 * Component stage in the iterative discovery process
 */
export type ComponentStage = "EXPLORING" | "FRAMEWORK" | "FINALIZED" | "ARCHIVED";
/**
 * Project type for component suggestions
 */
export type ProjectType = "product" | "software" | "business" | "event" | "research" | "custom";
/**
 * Workflow conversation phase
 */
export type WorkflowPhase = "unstructured-discussion" | "guided-discussion" | "component-refinement" | "goal-creation" | "execution";
/**
 * Change action type for version history
 */
export type ChangeAction = "created" | "updated" | "moved" | "split" | "merged" | "archived" | "restored";
/**
 * A sub-component within a main component
 */
export interface SubComponent {
    name: string;
    description: string;
    details?: string;
    deliverables?: string[];
    estimatedEffort?: "small" | "medium" | "large";
    assignedTo?: string;
    status?: "not-started" | "in-progress" | "completed";
}
/**
 * Dependencies between components
 */
export interface ComponentDependencies {
    dependsOn?: string[];
    blocks?: string[];
    relatedTo?: string[];
}
/**
 * Main component entity
 */
export interface Component {
    name: string;
    stage: ComponentStage;
    description: string;
    whyItMatters?: string;
    openQuestions?: string[];
    subComponents?: SubComponent[];
    dependencies?: ComponentDependencies;
    successCriteria?: string[];
    finalizedDate?: string;
    goalCreated?: boolean;
    goalPath?: string;
    createdAt: string;
    lastUpdated: string;
}
/**
 * Entry in the Component Change Log
 */
export interface ComponentChangeLogEntry {
    timestamp: string;
    componentName: string;
    action: ChangeAction;
    fromStage?: ComponentStage;
    toStage?: ComponentStage;
    reason?: string;
    impact?: string;
    details?: string;
}
/**
 * Parsed project-overview-working.md structure
 */
export interface ProjectOverviewDocument {
    projectName: string;
    lastUpdated: string;
    exploring: Component[];
    framework: Component[];
    finalized: Component[];
    archived: Component[];
    changeLog: ComponentChangeLogEntry[];
}
/**
 * Parsed project-discussion.md structure
 */
export interface ProjectDiscussionDocument {
    projectName: string;
    lastUpdated: string;
    unstructuredDiscussion: string;
    guidedDiscussion: DiscussionQA[];
    ongoingDiscussions: OngoingDiscussion[];
}
/**
 * Q&A pair from guided discussion
 */
export interface DiscussionQA {
    question: string;
    answer: string;
    timestamp?: string;
}
/**
 * Ongoing discussion entry
 */
export interface OngoingDiscussion {
    date: string;
    topic: string;
    notes: string;
    decisions?: string[];
    actionItems?: string[];
}
/**
 * AI-suggested component from discussion analysis
 */
export interface ComponentSuggestion {
    name: string;
    description: string;
    reasoning: string;
    suggestedSubComponents?: string[];
    confidence: "high" | "medium" | "low";
}
/**
 * Result of component identification
 */
export interface ComponentIdentificationResult {
    suggestions: ComponentSuggestion[];
    projectType: ProjectType;
    reasoning: string;
}
/**
 * Parameters for create_component tool
 */
export interface CreateComponentParams {
    projectPath: string;
    componentName: string;
    description: string;
    stage?: ComponentStage;
    whyItMatters?: string;
    openQuestions?: string[];
    subComponents?: SubComponent[];
}
/**
 * Parameters for update_component tool
 */
export interface UpdateComponentParams {
    projectPath: string;
    componentName: string;
    updates: {
        description?: string;
        whyItMatters?: string;
        openQuestions?: string[];
        subComponents?: SubComponent[];
        successCriteria?: string[];
        dependencies?: ComponentDependencies;
    };
}
/**
 * Parameters for move_component tool
 */
export interface MoveComponentParams {
    projectPath: string;
    componentName: string;
    toStage: ComponentStage;
    reason?: string;
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
        whyItMatters?: string;
    }>;
    reason?: string;
}
/**
 * Parameters for merge_components tool
 */
export interface MergeComponentsParams {
    projectPath: string;
    componentNames: string[];
    mergedName: string;
    mergedDescription: string;
    reason?: string;
}
/**
 * Parameters for component_to_goal tool
 */
export interface ComponentToGoalParams {
    projectPath: string;
    componentName: string;
    goalType?: "major" | "sub";
}
/**
 * Parameters for start_new_project tool
 */
export interface StartNewProjectParams {
    projectPath: string;
    projectName: string;
    projectType?: ProjectType;
}
/**
 * Parameters for advance_workflow tool
 */
export interface AdvanceWorkflowParams {
    projectPath: string;
    currentPhase: WorkflowPhase;
    input?: string;
}
/**
 * Parameters for identify_components tool
 */
export interface IdentifyComponentsParams {
    discussionText: string;
    projectType?: ProjectType;
}
/**
 * Parameters for propagate_component_change tool
 */
export interface PropagateComponentChangeParams {
    projectPath: string;
    componentName: string;
    changeAction: ChangeAction;
    fromStage?: ComponentStage;
    toStage?: ComponentStage;
}
/**
 * Parameters for log_component_change tool
 */
export interface LogComponentChangeParams {
    projectPath: string;
    componentName: string;
    action: ChangeAction;
    fromStage?: ComponentStage;
    toStage?: ComponentStage;
    reason?: string;
    impact?: string;
}
/**
 * Parameters for get_component_history tool
 */
export interface GetComponentHistoryParams {
    projectPath: string;
    componentName?: string;
    limit?: number;
}
/**
 * Parameters for check_project_consistency tool
 */
export interface CheckProjectConsistencyParams {
    projectPath: string;
    fix?: boolean;
}
/**
 * Base result interface
 */
export interface BaseResult {
    success: boolean;
    message: string;
    error?: string;
}
/**
 * Result with next action suggestion
 */
export interface ResultWithNextAction extends BaseResult {
    nextAction?: string;
    suggestions?: string[];
}
/**
 * Component operation result
 */
export interface ComponentResult extends ResultWithNextAction {
    component?: Component;
    componentsAffected?: string[];
}
/**
 * Create component result
 */
export interface CreateComponentResult extends ComponentResult {
    filesUpdated: string[];
}
/**
 * Update component result
 */
export interface UpdateComponentResult extends ComponentResult {
    filesUpdated: string[];
    changesPropagated: boolean;
}
/**
 * Move component result
 */
export interface MoveComponentResult extends ComponentResult {
    filesUpdated: string[];
    propagationResults?: PropagationResult;
}
/**
 * Split component result
 */
export interface SplitComponentResult extends BaseResult {
    originalComponent: string;
    newComponents: Component[];
    filesUpdated: string[];
}
/**
 * Merge components result
 */
export interface MergeComponentsResult extends ComponentResult {
    mergedComponents: string[];
    filesUpdated: string[];
}
/**
 * Component to goal result
 */
export interface ComponentToGoalResult extends BaseResult {
    goalPath: string;
    goalCreated: boolean;
    filesUpdated: string[];
}
/**
 * Start new project result
 */
export interface StartNewProjectResult extends BaseResult {
    projectPath: string;
    filesCreated: string[];
    nextPhase: WorkflowPhase;
}
/**
 * Advance workflow result
 */
export interface AdvanceWorkflowResult extends BaseResult {
    previousPhase: WorkflowPhase;
    currentPhase: WorkflowPhase;
    promptForUser?: string;
    questionsToAsk?: string[];
}
/**
 * Component identification result (already defined above as ComponentIdentificationResult)
 */
/**
 * Propagation result
 */
export interface PropagationResult extends BaseResult {
    readmeUpdated: boolean;
    eventLogUpdated: boolean;
    goalsAffected: string[];
    filesUpdated: string[];
}
/**
 * Component change log result
 */
export interface ComponentChangeLogResult extends BaseResult {
    entryAdded: ComponentChangeLogEntry;
    fileUpdated: string;
}
/**
 * Component history result
 */
export interface ComponentHistoryResult extends BaseResult {
    history: ComponentChangeLogEntry[];
    totalEntries: number;
}
/**
 * Project consistency check result
 */
export interface ConsistencyCheckResult extends BaseResult {
    issues: ConsistencyIssue[];
    issuesFixed?: number;
    filesUpdated?: string[];
}
/**
 * Consistency issue
 */
export interface ConsistencyIssue {
    type: "missing-component" | "desync" | "invalid-stage" | "broken-reference" | "missing-file";
    severity: "error" | "warning" | "info";
    description: string;
    location: string;
    fixable: boolean;
    suggestion?: string;
}
/**
 * Markdown section metadata
 */
export interface MarkdownSection {
    heading: string;
    level: number;
    content: string;
    startLine: number;
    endLine: number;
}
/**
 * Template file metadata
 */
export interface TemplateFile {
    sourcePath: string;
    destinationPath: string;
    templateName: string;
}
/**
 * Project structure
 */
export interface ProjectStructure {
    rootPath: string;
    planningPath: string;
    goalsPath: string;
    resourcesPath: string;
    developmentPath: string;
    brainstormingPath: string;
    documentationPath: string;
    tempPath: string;
    archivePath: string;
}
/**
 * Placeholder replacement map
 */
export interface PlaceholderMap {
    PROJECT_NAME: string;
    DATE_CREATED: string;
    DATE_UPDATED: string;
    DATE: string;
    TIME: string;
    DATETIME: string;
}
export type {};
//# sourceMappingURL=component-types%202.d.ts.map