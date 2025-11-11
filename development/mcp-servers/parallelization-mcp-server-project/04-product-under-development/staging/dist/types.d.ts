/**
 * Core type definitions for Parallelization MCP Server
 * Based on TOOL-ARCHITECTURE.md specifications
 */
export interface Task {
    id: string;
    description: string;
    estimatedMinutes?: number;
    dependsOn?: string[];
    context?: any;
}
export interface Subtask extends Task {
}
export interface GraphNode {
    id: string;
    task: Task;
    level?: number;
}
export interface GraphEdge {
    from: string;
    to: string;
    type: 'explicit' | 'implicit';
    confidence?: number;
}
export interface DependencyGraph {
    nodes: Map<string, GraphNode>;
    edges: GraphEdge[];
}
export interface ImplicitDependency {
    from: string;
    to: string;
    confidence: number;
    reasoning: string;
}
export interface TaskAnalysisRequest {
    taskDescription: string;
    subtasks?: Task[];
    context?: any;
}
export interface ParallelizationScore {
    score: number;
    confidence: number;
    factors: {
        independenceFactor: number;
        durationFactor: number;
        conflictRiskFactor: number;
        dependencyComplexityFactor: number;
        resourceContentionFactor: number;
    };
    recommendation: string;
}
export interface Risk {
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation?: string;
}
export interface Batch {
    id: string;
    tasks: Task[];
    estimatedMinutes: number;
    dependsOnBatches: string[];
}
export interface TaskAnalysisResponse {
    parallelizable: boolean;
    confidence: number;
    reasoning: string;
    dependencyGraph: DependencyGraph;
    suggestedBatches: Batch[];
    estimatedSpeedup: number;
    risks: Risk[];
}
export interface ExecutionPlan {
    taskId: string;
    analysisScore: number;
    confidence: number;
    batches: Batch[];
    requiredAgents: number;
    estimatedSpeedup: number;
    risks: Risk[];
}
export interface AgentProgress {
    agentId: string;
    currentTask: string;
    percentComplete: number;
    taskWeight?: number;
    status: 'idle' | 'working' | 'blocked' | 'complete' | 'failed';
    estimatedTimeRemaining?: number;
}
export interface AgentResult {
    agentId: string;
    taskId: string;
    success: boolean;
    filesModified: string[];
    changes: Change[];
    duration: number;
    error?: Error;
}
export interface Change {
    file: string;
    type: 'create' | 'modify' | 'delete';
    content?: string;
    lineNumbers?: {
        start: number;
        end: number;
    };
}
export declare enum ConflictType {
    FILE_LEVEL = "file-level",
    SEMANTIC = "semantic",
    DEPENDENCY = "dependency",
    RESOURCE = "resource",
    ORDERING = "ordering"
}
export interface Conflict {
    type: ConflictType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    agents: string[];
    description: string;
    affectedResources: string[];
    detectionMethod: string;
    resolutionOptions: ResolutionOption[];
}
export interface ResolutionOption {
    strategy: 'merge' | 'prefer-agent' | 'rollback' | 'sequential-retry' | 'manual';
    description: string;
    automatic: boolean;
    risk: 'low' | 'medium' | 'high';
}
export type AggregationStrategy = 'simple-average' | 'weighted' | 'critical-path';
export interface AggregatedProgress {
    percentComplete: number;
    method: AggregationStrategy;
    criticalPath?: string[];
    bottlenecks?: Bottleneck[];
    estimatedCompletion?: Date;
}
export interface Bottleneck {
    agentId: string;
    taskId: string;
    reason: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
}
export interface ExecutionResult {
    success: boolean;
    results: AgentResult[];
    conflicts: Conflict[];
    aggregatedProgress: AggregatedProgress;
    metrics: ExecutionMetrics;
}
export interface ExecutionMetrics {
    totalTasks: number;
    parallelTasks: number;
    sequentialTasks: number;
    totalDuration: number;
    sequentialDuration: number;
    actualSpeedup: number;
    agentCount: number;
    conflictCount: number;
    failureCount: number;
    retryCount: number;
}
export interface ExecutionRecord {
    executionId: string;
    timestamp: Date;
    taskDescription: string;
    analysis: TaskAnalysisResponse;
    outcome: ExecutionResult;
    actualSpeedup: number;
    metrics: ExecutionMetrics;
    conflicts: Conflict[];
    batches: Batch[];
}
export interface ExecutionFailure {
    executionId: string;
    timestamp: Date;
    taskDescription: string;
    rootCause: string;
    category: string;
    context: any;
}
export interface AnalyzeTaskParallelizabilityInput {
    taskDescription: string;
    subtasks?: Task[];
    context?: any;
}
export interface AnalyzeTaskParallelizabilityOutput {
    parallelizable: boolean;
    confidence: number;
    reasoning: string;
    dependencyGraph: DependencyGraph;
    suggestedBatches: Batch[];
    estimatedSpeedup: number;
    risks: Risk[];
}
export interface CreateDependencyGraphInput {
    tasks: Task[];
    detectImplicit?: boolean;
}
export interface CreateDependencyGraphOutput {
    graph: DependencyGraph;
    implicitDependencies: ImplicitDependency[];
    hasCycles: boolean;
    cycles?: string[][];
}
export interface ExecuteParallelWorkflowInput {
    analysisResult: TaskAnalysisResponse;
    executionStrategy: 'conservative' | 'aggressive';
    maxParallelAgents: number;
    constraints?: {
        apiRateLimit?: {
            provider: string;
            maxRequestsPerMinute: number;
        };
        resourceLimits?: {
            maxMemoryMB: number;
            maxCPUPercent: number;
        };
    };
}
export interface ExecuteParallelWorkflowOutput {
    success: boolean;
    executionId: string;
    results: AgentResult[];
    conflicts: Conflict[];
    metrics: ExecutionMetrics;
}
export interface AggregateProgressInput {
    agentProgresses: AgentProgress[];
    aggregationStrategy: AggregationStrategy;
}
export interface AggregateProgressOutput {
    overallProgress: number;
    method: AggregationStrategy;
    agentStatuses: Map<string, AgentProgress>;
    bottlenecks: Bottleneck[];
    estimatedCompletion: Date;
    criticalPath?: string[];
}
export interface DetectConflictsInput {
    agentResults: AgentResult[];
    dependencyGraph?: DependencyGraph;
}
export interface DetectConflictsOutput {
    hasConflicts: boolean;
    conflicts: Conflict[];
    resolutionStrategy: 'auto' | 'manual' | 'rollback';
    mergedResult?: any;
}
export interface OptimizeBatchDistributionInput {
    tasks: Task[];
    dependencyGraph: DependencyGraph;
    maxParallelAgents: number;
    optimizationGoal: 'minimize-time' | 'balance-load' | 'minimize-conflicts';
}
export interface OptimizeBatchDistributionOutput {
    batches: Batch[];
    estimatedTotalTime: number;
    loadBalance: number;
    reasoning: string;
}
export interface ParallelizationConfig {
    maxParallelAgents: number;
    defaultStrategy: 'conservative' | 'aggressive';
    conflictDetectionLevel: 'file-only' | 'semantic' | 'full';
    learningEnabled: boolean;
    performanceTargets: {
        analysisTimeMs: number;
        coordinationOverheadPercent: number;
        conflictDetectionTimeMs: number;
    };
}
//# sourceMappingURL=types.d.ts.map