---
type: reference
tags: [api, mcp-tools, parallelization, documentation]
---

# Parallelization MCP - API Reference

Complete API documentation for all 6 MCP tools provided by the Parallelization MCP Server.

## Table of Contents

1. [analyze_task_parallelizability](#analyze_task_parallelizability)
2. [create_dependency_graph](#create_dependency_graph)
3. [optimize_batch_distribution](#optimize_batch_distribution)
4. [execute_parallel_workflow](#execute_parallel_workflow)
5. [aggregate_progress](#aggregate_progress)
6. [detect_conflicts](#detect_conflicts)

---

## analyze_task_parallelizability

Analyzes if a task can benefit from parallel sub-agent execution.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskDescription` | string | Yes | Description of the overall task (max 5000 chars) |
| `subtasks` | Task[] | No | Array of subtasks to analyze (max 100) |
| `context` | object | No | Optional context for different systems |

#### Task Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique task identifier |
| `description` | string | Yes | Task description |
| `estimatedMinutes` | number | No | Estimated time (1-1440 minutes) |
| `dependsOn` | string[] | No | Array of task IDs this task depends on |

### Output

```typescript
{
  parallelizable: boolean,           // Whether parallelization is recommended
  confidence: number,                // Confidence level (0-100)
  reasoning: string,                 // Human-readable explanation
  dependencyGraph: DependencyGraph,  // Computed dependency graph
  suggestedBatches: Batch[],        // Recommended task batches
  estimatedSpeedup: number,          // Expected speedup (e.g., 2.5x)
  risks: Risk[]                      // Identified risks
}
```

### Example

```javascript
const result = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build user management system',
  subtasks: [
    { id: '1', description: 'Create user model', estimatedMinutes: 20 },
    { id: '2', description: 'Create user API', estimatedMinutes: 30 },
    { id: '3', description: 'Create user UI', estimatedMinutes: 40 }
  ]
});

console.log(`Parallelizable: ${result.parallelizable}`);
console.log(`Expected speedup: ${result.estimatedSpeedup}x`);
console.log(`Suggested batches: ${result.suggestedBatches.length}`);
```

### Validation Rules

- `taskDescription` cannot be empty or exceed 5000 characters
- Maximum 100 subtasks allowed
- Each subtask must have unique `id` and non-empty `description`
- No self-referencing dependencies (task cannot depend on itself)
- All dependency IDs must reference existing tasks
- `estimatedMinutes` must be between 1 and 1440 (24 hours)

### Use Cases

- Determining if a workflow should use parallel execution
- Getting optimal task batching recommendations
- Estimating time savings from parallelization
- Identifying potential execution risks

---

## create_dependency_graph

Builds a directed acyclic graph (DAG) from task dependencies.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tasks` | Task[] | Yes | Array of tasks (1-100 tasks) |
| `detectImplicit` | boolean | No | Enable implicit dependency detection (default: true) |

### Output

```typescript
{
  graph: DependencyGraph,              // Complete dependency graph
  implicitDependencies: ImplicitDependency[], // Detected implicit deps
  hasCycles: boolean,                  // Whether cycles were detected
  cycles?: string[][]                  // Cycle paths if hasCycles is true
}
```

### Example

```javascript
const result = await callTool('create_dependency_graph', {
  tasks: [
    { id: '1', description: 'Read config file' },
    { id: '2', description: 'Update config file', dependsOn: ['1'] },
    { id: '3', description: 'Validate config', dependsOn: ['2'] }
  ],
  detectImplicit: true
});

if (result.hasCycles) {
  console.log('Cycles detected:', result.cycles);
} else {
  console.log('Graph is valid DAG');
  console.log('Implicit dependencies:', result.implicitDependencies.length);
}
```

### Implicit Dependency Detection

When enabled, the system detects implicit dependencies based on:

- **File references**: Tasks operating on the same files
- **Action patterns**: Create/read/update/delete operations
- **Shared resources**: Database, API, configuration references
- **Keyword overlap**: Similar terms in task descriptions

Each implicit dependency includes:
- `from` and `to` task IDs
- `confidence` score (0-100)
- `reasoning` explaining why it was detected

### Validation Rules

- At least 1 task required, maximum 100 tasks
- Each task must have unique ID and description
- No self-referencing dependencies
- All dependency IDs must reference existing tasks

### Use Cases

- Visualizing task dependencies before execution
- Detecting circular dependencies early
- Finding hidden dependencies through AI analysis
- Computing topological ordering for sequential execution

---

## optimize_batch_distribution

Optimizes how tasks are distributed into parallel batches.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tasks` | Task[] | Yes | Tasks to distribute (1-100) |
| `dependencyGraph` | DependencyGraph | Yes | Dependency graph from create_dependency_graph |
| `maxParallelAgents` | number | Yes | Maximum parallel agents (1-20) |
| `optimizationGoal` | string | Yes | Optimization strategy |

#### Optimization Goals

- **minimize-time**: Minimize total execution time (critical path method)
- **balance-load**: Balance workload evenly across agents
- **minimize-conflicts**: Reduce potential file/resource conflicts

### Output

```typescript
{
  batches: Batch[],           // Optimized task batches
  estimatedTotalTime: number, // Estimated total time in minutes
  loadBalance: number,        // Load balance score (0-100, higher = better)
  reasoning: string           // Explanation of optimization choices
}
```

### Example

```javascript
// First create dependency graph
const graph = await callTool('create_dependency_graph', { tasks });

// Then optimize batches
const result = await callTool('optimize_batch_distribution', {
  tasks,
  dependencyGraph: graph.graph,
  maxParallelAgents: 3,
  optimizationGoal: 'minimize-time'
});

console.log(`Total batches: ${result.batches.length}`);
console.log(`Estimated time: ${result.estimatedTotalTime} minutes`);
console.log(`Load balance: ${result.loadBalance}/100`);
```

### Batch Structure

Each batch contains:
```typescript
{
  id: string,                    // Batch identifier (e.g., "batch-1")
  tasks: Task[],                 // Tasks in this batch (run in parallel)
  estimatedMinutes: number,      // Max duration of tasks in batch
  dependsOnBatches: string[]     // Batches that must complete first
}
```

### Validation Rules

- At least 1 task required
- `maxParallelAgents` must be between 1 and 20
- Valid optimization goals: minimize-time, balance-load, minimize-conflicts
- Dependency graph must be provided

### Use Cases

- Optimizing task distribution before execution
- Balancing workload across multiple agents
- Reducing execution conflicts
- Estimating parallel execution time

---

## execute_parallel_workflow

Executes a parallel workflow across multiple sub-agents.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `analysisResult` | AnalyzeTaskParallelizabilityOutput | Yes | Result from analyze_task_parallelizability |
| `executionStrategy` | string | Yes | "conservative" or "aggressive" |
| `maxParallelAgents` | number | Yes | Maximum parallel agents (1-20) |
| `constraints` | object | No | Resource and rate limit constraints |

#### Execution Strategies

- **conservative**: Stop on first batch failure, more validation
- **aggressive**: Continue despite failures, faster execution

#### Constraints Object

```typescript
{
  apiRateLimit?: {
    provider: string,
    maxRequestsPerMinute: number
  },
  resourceLimits?: {
    maxMemoryMB: number,
    maxCPUPercent: number
  }
}
```

### Output

```typescript
{
  success: boolean,              // Overall execution success
  executionId: string,           // Unique execution identifier
  results: AgentResult[],        // Results from each agent
  conflicts: Conflict[],         // Detected conflicts
  metrics: ExecutionMetrics      // Performance metrics
}
```

#### ExecutionMetrics

```typescript
{
  totalTasks: number,
  parallelTasks: number,
  sequentialTasks: number,
  totalDuration: number,         // milliseconds
  sequentialDuration: number,    // estimated ms for sequential
  actualSpeedup: number,         // e.g., 2.5x
  agentCount: number,
  conflictCount: number,
  failureCount: number,
  retryCount: number
}
```

### Example

```javascript
// First analyze task
const analysis = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build feature',
  subtasks: tasks
});

// Then execute if parallelizable
if (analysis.parallelizable) {
  const result = await callTool('execute_parallel_workflow', {
    analysisResult: analysis,
    executionStrategy: 'conservative',
    maxParallelAgents: 3,
    constraints: {
      apiRateLimit: {
        provider: 'openai',
        maxRequestsPerMinute: 60
      }
    }
  });

  console.log(`Success: ${result.success}`);
  console.log(`Speedup: ${result.metrics.actualSpeedup}x`);
  console.log(`Failures: ${result.metrics.failureCount}`);
}
```

### Validation Rules

- `maxParallelAgents` must be between 1 and 20
- Valid strategies: "conservative" or "aggressive"
- Analysis result must contain suggested batches

### Use Cases

- Executing parallelized workflows
- Coordinating multiple sub-agents
- Tracking execution progress and metrics
- Handling failures gracefully

**Note**: Current implementation simulates sub-agent execution. Production integration requires Claude Code orchestration layer.

---

## aggregate_progress

Aggregates progress from multiple parallel agents.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentProgresses` | AgentProgress[] | Yes | Progress from each agent (1-20) |
| `aggregationStrategy` | string | Yes | Strategy for aggregation |

#### AgentProgress Object

```typescript
{
  agentId: string,              // Agent identifier
  currentTask: string,          // Current task ID
  percentComplete: number,      // Progress (0-100)
  status: string,              // "idle" | "working" | "blocked" | "complete" | "failed"
  taskWeight?: number,         // Weight for weighted average
  estimatedTimeRemaining?: number  // Minutes remaining
}
```

#### Aggregation Strategies

- **simple-average**: Equal weight for all agents
- **weighted**: Use taskWeight for weighted average
- **critical-path**: Focus on critical path tasks

### Output

```typescript
{
  overallProgress: number,           // Overall progress (0-100)
  method: AggregationStrategy,      // Strategy used
  agentStatuses: Map<string, AgentProgress>,
  bottlenecks: Bottleneck[],        // Detected bottlenecks
  estimatedCompletion: Date,        // Estimated completion time
  criticalPath?: string[]           // Critical path task IDs
}
```

#### Bottleneck Object

```typescript
{
  agentId: string,
  taskId: string,
  reason: string,              // Why it's a bottleneck
  impact: "low" | "medium" | "high",
  suggestion: string           // Recommended action
}
```

### Example

```javascript
const progresses = [
  { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 75, status: 'working' },
  { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 30, status: 'working' },
  { agentId: 'agent-3', currentTask: 'task-3', percentComplete: 50, status: 'blocked' }
];

const result = await callTool('aggregate_progress', {
  agentProgresses: progresses,
  aggregationStrategy: 'simple-average'
});

console.log(`Overall: ${result.overallProgress}%`);
console.log(`Bottlenecks: ${result.bottlenecks.length}`);
console.log(`ETA: ${result.estimatedCompletion}`);
```

### Bottleneck Detection

The system automatically detects:
- **Blocked agents**: Status is "blocked"
- **Failed agents**: Status is "failed"
- **Slow progress**: Significantly behind other agents (>30% difference)
- **Long-running tasks**: Taking longer than expected

### Validation Rules

- At least 1 agent progress required, maximum 20
- Each agent must have unique `agentId`
- `percentComplete` must be between 0 and 100
- Valid strategies: simple-average, weighted, critical-path
- Required fields: agentId, currentTask, percentComplete, status

### Use Cases

- Real-time progress monitoring
- Identifying execution bottlenecks
- Estimating completion time
- Making dynamic adjustments to workload

---

## detect_conflicts

Detects conflicts between parallel agent executions.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentResults` | AgentResult[] | Yes | Results from agents (1-20) |
| `dependencyGraph` | DependencyGraph | No | Optional dependency graph for enhanced detection |

#### AgentResult Object

```typescript
{
  agentId: string,
  taskId: string,
  success: boolean,
  filesModified: string[],
  changes: Change[],          // Detailed changes made
  duration: number,           // Execution time in ms
  error?: Error
}
```

#### Change Object

```typescript
{
  file: string,
  type: "create" | "modify" | "delete",
  content?: string,
  lineNumbers?: { start: number, end: number }
}
```

### Output

```typescript
{
  hasConflicts: boolean,
  conflicts: Conflict[],
  resolutionStrategy: "auto" | "manual" | "rollback",
  mergedResult?: any          // If auto-merge possible
}
```

#### Conflict Object

```typescript
{
  type: ConflictType,           // Type of conflict
  severity: "low" | "medium" | "high" | "critical",
  agents: string[],             // Involved agent IDs
  description: string,
  affectedResources: string[],  // Files/resources affected
  detectionMethod: string,
  resolutionOptions: ResolutionOption[]
}
```

#### Conflict Types

- **file-level**: Multiple agents modified same file
- **semantic**: Logical conflicts (e.g., create + delete)
- **dependency**: Dependency violations
- **resource**: Shared resource contention
- **ordering**: Execution order issues

### Example

```javascript
// After execution, check for conflicts
const results = executionResult.results;

const conflictAnalysis = await callTool('detect_conflicts', {
  agentResults: results,
  dependencyGraph: analysisResult.dependencyGraph
});

if (conflictAnalysis.hasConflicts) {
  console.log(`Found ${conflictAnalysis.conflicts.length} conflicts`);

  conflictAnalysis.conflicts.forEach(conflict => {
    console.log(`${conflict.severity}: ${conflict.description}`);
    console.log(`Resolution options: ${conflict.resolutionOptions.length}`);
  });

  if (conflictAnalysis.resolutionStrategy === 'auto') {
    console.log('Conflicts can be auto-merged');
  }
}
```

### Resolution Options

Each conflict includes resolution options:
```typescript
{
  strategy: "merge" | "prefer-agent" | "rollback" | "sequential-retry" | "manual",
  description: string,
  automatic: boolean,         // Can be auto-applied
  risk: "low" | "medium" | "high"
}
```

### Detection Methods

1. **File-level**: Exact file path matching
2. **Line-level**: Overlapping line number ranges
3. **Semantic**: Pattern matching for logical conflicts
4. **Dependency**: Graph traversal for violations
5. **Resource**: Shared resource identification

### Validation Rules

- At least 1 agent result required, maximum 20
- Each result must have unique `agentId` and `taskId`
- `duration` must be non-negative
- Required fields: agentId, taskId, success, filesModified, changes, duration

### Use Cases

- Post-execution conflict detection
- Automated conflict resolution
- Manual conflict review and merge
- Learning from conflict patterns

---

## Common Patterns

### Complete Workflow

```javascript
// 1. Analyze task
const analysis = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Implement feature',
  subtasks: tasks
});

if (!analysis.parallelizable) {
  console.log('Sequential execution recommended');
  return;
}

// 2. Create dependency graph (optional, for visualization)
const graph = await callTool('create_dependency_graph', {
  tasks: analysis.dependencyGraph.nodes
    ? Array.from(analysis.dependencyGraph.nodes.values()).map(n => n.task)
    : [],
  detectImplicit: true
});

// 3. Optimize batches (optional, for custom distribution)
const optimized = await callTool('optimize_batch_distribution', {
  tasks: analysis.suggestedBatches.flatMap(b => b.tasks),
  dependencyGraph: graph.graph,
  maxParallelAgents: 3,
  optimizationGoal: 'minimize-time'
});

// 4. Execute workflow
const execution = await callTool('execute_parallel_workflow', {
  analysisResult: analysis,
  executionStrategy: 'conservative',
  maxParallelAgents: 3
});

// 5. Check for conflicts
const conflicts = await callTool('detect_conflicts', {
  agentResults: execution.results,
  dependencyGraph: analysis.dependencyGraph
});

// 6. Report results
console.log(`
  Success: ${execution.success}
  Speedup: ${execution.metrics.actualSpeedup}x
  Conflicts: ${conflicts.conflicts.length}
  Total time: ${execution.metrics.totalDuration / 1000}s
`);
```

### Progress Monitoring

```javascript
// During execution, monitor progress
const checkProgress = async () => {
  const progresses = agents.map(agent => ({
    agentId: agent.id,
    currentTask: agent.currentTask,
    percentComplete: agent.progress,
    status: agent.status
  }));

  const aggregated = await callTool('aggregate_progress', {
    agentProgresses: progresses,
    aggregationStrategy: 'weighted'
  });

  console.log(`Progress: ${aggregated.overallProgress}%`);
  console.log(`ETA: ${aggregated.estimatedCompletion}`);

  if (aggregated.bottlenecks.length > 0) {
    console.log('Bottlenecks detected:');
    aggregated.bottlenecks.forEach(b => {
      console.log(`  ${b.agentId}: ${b.reason}`);
      console.log(`    Suggestion: ${b.suggestion}`);
    });
  }
};

// Poll every 10 seconds
setInterval(checkProgress, 10000);
```

---

## Error Handling

All tools follow consistent error handling:

### Validation Errors

```javascript
{
  error: "ValidationError",
  message: "taskDescription is required and cannot be empty",
  field: "taskDescription"
}
```

### Execution Errors

```javascript
{
  error: "ExecutionError",
  message: "Analysis failed: circular dependency detected",
  details: { ... }
}
```

### Best Practices

1. Always validate input before calling tools
2. Handle both validation and execution errors
3. Use try-catch blocks for async tool calls
4. Check success flags in responses
5. Review risks and conflicts arrays

---

## Performance Considerations

- **analyze_task_parallelizability**: O(n²) for n tasks (dependency analysis)
- **create_dependency_graph**: O(n + e) for n nodes, e edges
- **optimize_batch_distribution**: O(n log n) for most strategies
- **execute_parallel_workflow**: Depends on task duration
- **aggregate_progress**: O(n) for n agents
- **detect_conflicts**: O(n²) worst case for n results

Recommended limits:
- Maximum 100 tasks per workflow
- Maximum 20 parallel agents
- Maximum 5000 characters for descriptions
