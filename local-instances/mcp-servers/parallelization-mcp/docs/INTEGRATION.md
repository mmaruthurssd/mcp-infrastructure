---
type: guide
tags: [integration, architecture, mcp-orchestration, task-executor, project-management]
---

# Parallelization MCP - Integration Guide

Complete guide for integrating the Parallelization MCP with Task Executor, Project Management, and other MCP servers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration with Task Executor MCP](#integration-with-task-executor-mcp)
3. [Integration with Project Management MCP](#integration-with-project-management-mcp)
4. [Production Sub-Agent Integration](#production-sub-agent-integration)
5. [Usage Patterns](#usage-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code / User                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Parallelization MCP Server                      │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Task Analysis    │  │ Dependency Graph │               │
│  │ Engine           │  │ Builder          │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Batch Optimizer  │  │ Conflict         │               │
│  │                  │  │ Detection System │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Sub-Agent        │  │ Progress         │               │
│  │ Coordinator      │  │ Aggregation      │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Learning         │  │ Performance      │               │
│  │ Optimizer        │  │ Tracker          │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Integration Points                              │
│                                                              │
│  Task Executor MCP  │  Project Management  │  Other MCPs   │
└─────────────────────────────────────────────────────────────┘
```

### Core Engines

1. **Task Analysis Engine**: Analyzes parallelization potential with 5-factor scoring
2. **Dependency Graph Builder**: Builds DAG, detects cycles and implicit dependencies
3. **Batch Optimizer**: Distributes tasks using 3 optimization strategies
4. **Conflict Detection System**: Detects 4 types of conflicts with resolution options
5. **Sub-Agent Coordinator**: Coordinates parallel execution (simulated, production integration needed)
6. **Progress Aggregation Engine**: Aggregates progress with 3 strategies and bottleneck detection

### Utility Layers

- **Learning Optimizer**: Learns from execution patterns, provides suggestions
- **Performance Tracker**: Tracks metrics, compares strategies, detects regressions

---

## Integration with Task Executor MCP

The Parallelization MCP works seamlessly with Task Executor MCP to enable parallel execution of workflow tasks.

### Workflow

```
1. Task Executor: User creates workflow with tasks
2. Parallelization: Analyze task parallelizability
3. Parallelization: Execute parallel workflow
4. Task Executor: Update task completion status
5. Parallelization: Detect conflicts
6. Task Executor: Archive workflow
```

### Integration Pattern

```javascript
// Step 1: Create workflow in Task Executor
const workflow = await callTool('mcp__task-executor__create_workflow', {
  name: 'feature-implementation',
  projectPath: '/path/to/project',
  tasks: [
    { description: 'Implement model layer' },
    { description: 'Implement API layer' },
    { description: 'Implement UI layer' }
  ]
});

// Step 2: Extract tasks for parallelization analysis
const workflowTasks = workflow.workflow.tasks.map(t => ({
  id: t.id,
  description: t.description,
  dependsOn: [] // Extract from task descriptions or context
}));

// Step 3: Analyze parallelizability
const analysis = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Feature implementation workflow',
  subtasks: workflowTasks
});

// Step 4: Execute if parallelizable
if (analysis.parallelizable) {
  console.log(`Parallel execution recommended: ${analysis.estimatedSpeedup}x speedup`);

  const execution = await callTool('execute_parallel_workflow', {
    analysisResult: analysis,
    executionStrategy: 'conservative',
    maxParallelAgents: 3
  });

  // Step 5: Update Task Executor with results
  for (const result of execution.results) {
    await callTool('mcp__task-executor__complete_task', {
      projectPath: '/path/to/project',
      workflowName: 'feature-implementation',
      taskId: result.taskId,
      notes: result.success
        ? `Completed via parallel execution (${result.duration}ms)`
        : `Failed: ${result.error?.message}`
    });
  }

  // Step 6: Check conflicts
  const conflicts = await callTool('detect_conflicts', {
    agentResults: execution.results
  });

  if (conflicts.hasConflicts) {
    console.log('Conflicts detected - manual review needed');
  }
}
```

### Best Practices

1. **Task Granularity**: Break workflows into 5-15 parallelizable tasks
2. **Dependency Detection**: Explicitly specify dependencies when creating workflows
3. **Error Handling**: Always check for conflicts after parallel execution
4. **Verification**: Use Task Executor's verification system for completed tasks
5. **Documentation**: Update workflow documentation with parallelization results

---

## Integration with Project Management MCP

The Parallelization MCP integrates with Project Management MCP for goal-level parallel execution.

### Workflow

```
1. Project Management: User creates potential goal
2. Project Management: Goal promoted to selected
3. Parallelization: Analyze goal tasks for parallelization
4. Project Management: Prepare task executor handoff
5. Parallelization: Execute parallel workflow
6. Project Management: Update goal progress
```

### Integration Pattern

```javascript
// Step 1: Get goal from Project Management
const goal = await callTool('mcp__project-management__prepare_task_executor_handoff', {
  projectPath: '/path/to/project',
  goalId: '01'
});

// Step 2: Analyze tasks for parallelization
const tasks = goal.tasks.map(t => ({
  id: t.id,
  description: t.description,
  estimatedMinutes: t.estimatedHours * 60,
  dependsOn: t.dependencies || []
}));

const analysis = await callTool('analyze_task_parallelizability', {
  taskDescription: goal.goalName,
  subtasks: tasks,
  context: {
    goalId: goal.goalId,
    priority: goal.priority,
    projectType: 'medical'
  }
});

// Step 3: Execute if beneficial
if (analysis.parallelizable && analysis.estimatedSpeedup > 1.5) {
  const execution = await callTool('execute_parallel_workflow', {
    analysisResult: analysis,
    executionStrategy: 'conservative',
    maxParallelAgents: 4
  });

  // Step 4: Calculate progress
  const completedTasks = execution.results.filter(r => r.success).length;
  const totalTasks = execution.results.length;
  const progress = (completedTasks / totalTasks) * 100;

  // Step 5: Update Project Management
  await callTool('mcp__project-management__update_goal_progress', {
    projectPath: '/path/to/project',
    goalId: '01',
    progress,
    tasksCompleted: completedTasks,
    totalTasks
  });
}
```

### Goal Context

When analyzing goals, include context:

```javascript
{
  goalId: '01',
  goalType: 'feature' | 'bug-fix' | 'refactor',
  priority: 'High' | 'Medium' | 'Low',
  projectType: 'medical' | 'ecommerce' | 'saas',
  constraints: {
    phiHandling: boolean,
    complianceRequired: boolean
  }
}
```

This helps the parallelization engine make informed decisions about risk assessment and execution strategy.

---

## Production Sub-Agent Integration

### Current Status

The current implementation **simulates** sub-agent execution for development and testing. Production integration requires:

1. **Claude Code Orchestration Layer**: Actual sub-agent spawning
2. **IPC Communication**: Real-time communication between agents
3. **Resource Management**: Memory, CPU, and API rate limiting
4. **State Synchronization**: Shared state across agents

### Integration Points

#### 1. Sub-Agent Spawning

**Current (Simulated)**:
```typescript
private static executeTask(agent: Agent, task: Task): AgentResult {
  // Simulated execution
  const success = Math.random() > 0.1;
  return {
    agentId: agent.id,
    taskId: task.id,
    success,
    filesModified: [],
    changes: [],
    duration: 1000
  };
}
```

**Production (Needed)**:
```typescript
private static async executeTask(agent: Agent, task: Task): Promise<AgentResult> {
  // Spawn actual Claude sub-agent
  const subAgent = await ClaudeOrchestrator.spawn({
    context: task.context,
    systemPrompt: this.generateSubAgentPrompt(task),
    tools: task.requiredTools || [],
    constraints: {
      maxMemoryMB: agent.memoryLimit,
      maxDurationMs: task.estimatedMinutes * 60000 * 2
    }
  });

  try {
    // Execute task
    const result = await subAgent.execute(task.description);

    return {
      agentId: agent.id,
      taskId: task.id,
      success: result.success,
      filesModified: result.filesModified,
      changes: result.changes,
      duration: result.duration
    };
  } finally {
    await subAgent.terminate();
  }
}
```

#### 2. Progress Monitoring

**Production (Needed)**:
```typescript
private static async monitorAgentProgress(agent: Agent): Promise<AgentProgress> {
  const subAgent = this.activeAgents.get(agent.id);

  const progress = await subAgent.getProgress();

  return {
    agentId: agent.id,
    currentTask: agent.currentTask?.id || '',
    percentComplete: progress.percentComplete,
    status: this.mapStatus(progress.status),
    estimatedTimeRemaining: progress.estimatedTimeRemaining
  };
}
```

#### 3. Communication Protocol

**Production (Needed)**:
```typescript
// Set up event handlers
subAgent.on('progress', (update) => {
  this.updateProgress(agent.id, update);
});

subAgent.on('question', (query) => {
  // Handle questions from sub-agent
  const answer = await this.coordinatorLLM.answer(query);
  subAgent.respond(answer);
});

subAgent.on('complete', (result) => {
  this.handleTaskCompletion(agent.id, result);
});

subAgent.on('error', (error) => {
  this.handleTaskFailure(agent.id, error);
});
```

### Integration Checklist

For production integration, implement:

- [ ] Claude Code orchestration API integration
- [ ] Sub-agent lifecycle management (spawn, monitor, terminate)
- [ ] IPC communication protocol
- [ ] Shared state synchronization
- [ ] Resource limit enforcement
- [ ] Real-time progress monitoring
- [ ] Error handling and recovery
- [ ] Agent pool management
- [ ] Task queue management
- [ ] Conflict detection during execution (not just post)

---

## Usage Patterns

### Pattern 1: Simple Parallel Execution

**Use Case**: Execute independent tasks in parallel

```javascript
const result = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build components',
  subtasks: [
    { id: '1', description: 'Build Header component' },
    { id: '2', description: 'Build Footer component' },
    { id: '3', description: 'Build Sidebar component' }
  ]
});

if (result.parallelizable) {
  await callTool('execute_parallel_workflow', {
    analysisResult: result,
    executionStrategy: 'aggressive',
    maxParallelAgents: 3
  });
}
```

**When to use**:
- Tasks are fully independent
- No shared resources
- Fast execution desired

### Pattern 2: Dependency-Aware Parallel Execution

**Use Case**: Execute tasks with dependencies in optimal batches

```javascript
const tasks = [
  { id: '1', description: 'Create database schema' },
  { id: '2', description: 'Create models', dependsOn: ['1'] },
  { id: '3', description: 'Create API endpoints', dependsOn: ['2'] },
  { id: '4', description: 'Create tests', dependsOn: ['2'] }
];

const analysis = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build backend',
  subtasks: tasks
});

// Tasks 3 and 4 can run in parallel after task 2 completes
console.log(`Batches: ${analysis.suggestedBatches.length}`);
// Expected: 3 batches - [1], [2], [3,4]
```

**When to use**:
- Tasks have explicit dependencies
- Some parallelism possible between dependency layers
- Want to minimize total execution time

### Pattern 3: Conflict-Minimizing Execution

**Use Case**: Reduce file/resource conflicts

```javascript
const tasks = [
  { id: '1', description: 'Update user.ts model' },
  { id: '2', description: 'Update user.ts validation' },
  { id: '3', description: 'Update config.ts' }
];

const graph = await callTool('create_dependency_graph', {
  tasks,
  detectImplicit: true
});

const optimized = await callTool('optimize_batch_distribution', {
  tasks,
  dependencyGraph: graph.graph,
  maxParallelAgents: 3,
  optimizationGoal: 'minimize-conflicts'
});

// Tasks 1 and 2 will be in separate batches (same file)
// Task 3 can run in parallel with either
```

**When to use**:
- Tasks operate on shared files
- High risk of merge conflicts
- Prefer sequential for conflicting tasks

### Pattern 4: Load-Balanced Execution

**Use Case**: Distribute work evenly across agents

```javascript
const tasks = [
  { id: '1', description: 'Long task', estimatedMinutes: 60 },
  { id: '2', description: 'Medium task', estimatedMinutes: 30 },
  { id: '3', description: 'Short task 1', estimatedMinutes: 10 },
  { id: '4', description: 'Short task 2', estimatedMinutes: 10 }
];

const optimized = await callTool('optimize_batch_distribution', {
  tasks,
  dependencyGraph: { nodes: new Map(), edges: [] },
  maxParallelAgents: 2,
  optimizationGoal: 'balance-load'
});

// Agent 1: Tasks 1 + 3 (70 min)
// Agent 2: Tasks 2 + 4 (40 min)
// Better balance than: Agent 1: Task 1 (60), Agent 2: Tasks 2+3+4 (50)
```

**When to use**:
- Tasks have varying durations
- Want to minimize idle agent time
- Maximize resource utilization

### Pattern 5: Progress Monitoring

**Use Case**: Monitor and adjust during execution

```javascript
// Start execution
const execution = callTool('execute_parallel_workflow', {
  analysisResult,
  executionStrategy: 'conservative',
  maxParallelAgents: 4
});

// Monitor progress (in separate loop)
const monitorInterval = setInterval(async () => {
  const progress = await callTool('aggregate_progress', {
    agentProgresses: getCurrentAgentProgresses(),
    aggregationStrategy: 'critical-path'
  });

  console.log(`Progress: ${progress.overallProgress}%`);

  if (progress.bottlenecks.length > 0) {
    console.log('Bottleneck detected:', progress.bottlenecks[0].agentId);
    // Could reassign tasks, add agents, etc.
  }

  if (progress.overallProgress >= 100) {
    clearInterval(monitorInterval);
  }
}, 5000);

await execution;
```

**When to use**:
- Long-running workflows
- Need real-time visibility
- Want to make dynamic adjustments

---

## Troubleshooting

### Issue: "No subtasks provided - cannot parallelize"

**Cause**: Called analyze_task_parallelizability without subtasks

**Solution**: Provide at least 2 subtasks for analysis

```javascript
// ❌ Wrong
await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build feature'
});

// ✅ Correct
await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build feature',
  subtasks: [
    { id: '1', description: 'Task 1' },
    { id: '2', description: 'Task 2' }
  ]
});
```

### Issue: "Circular dependencies detected"

**Cause**: Tasks have cyclic dependencies

**Solution**: Review and fix dependency graph

```javascript
const result = await callTool('analyze_task_parallelizability', {
  taskDescription: 'Build feature',
  subtasks: [
    { id: '1', description: 'Task 1', dependsOn: ['2'] }, // ❌ Circular
    { id: '2', description: 'Task 2', dependsOn: ['1'] }
  ]
});

// result.hasCycles === true
// result.cycles === [['1', '2', '1']]
```

Fix by removing circular dependency or reordering tasks.

### Issue: Low parallelization score

**Cause**: Tasks are highly dependent or too granular

**Solution**:
1. Increase task granularity (combine small tasks)
2. Review dependencies (are they all necessary?)
3. Consider sequential execution if score < 40

```javascript
// ❌ Too granular
subtasks: [
  { id: '1', description: 'Import library' },
  { id: '2', description: 'Use library', dependsOn: ['1'] },
  { id: '3', description: 'Export result', dependsOn: ['2'] }
]
// Score: ~30 - many dependencies, small tasks

// ✅ Better granularity
subtasks: [
  { id: '1', description: 'Implement auth module' },
  { id: '2', description: 'Implement user module' },
  { id: '3', description: 'Implement API module' }
]
// Score: ~75 - independent, substantial tasks
```

### Issue: High conflict rate

**Cause**: Tasks operating on same files/resources

**Solution**:
1. Use minimize-conflicts optimization goal
2. Enable implicit dependency detection
3. Review task descriptions for shared resources
4. Consider sequential execution for conflicting tasks

```javascript
// Enable better conflict detection
const graph = await callTool('create_dependency_graph', {
  tasks,
  detectImplicit: true  // ✅ Detects file/resource conflicts
});

const optimized = await callTool('optimize_batch_distribution', {
  tasks,
  dependencyGraph: graph.graph,
  maxParallelAgents: 3,
  optimizationGoal: 'minimize-conflicts'  // ✅ Reduces conflicts
});
```

### Issue: Execution failures

**Cause**: Agent failures during execution

**Solution**:
1. Use conservative strategy
2. Review risks from analysis
3. Check conflict detection results
4. Reduce maxParallelAgents

```javascript
// ❌ Too aggressive
executionStrategy: 'aggressive',
maxParallelAgents: 10

// ✅ More reliable
executionStrategy: 'conservative',
maxParallelAgents: 3
```

### Issue: Poor performance (< 1.5x speedup)

**Cause**: Coordination overhead exceeds parallel benefit

**Solution**:
1. Increase task size/duration
2. Reduce number of agents
3. Use sequential execution
4. Review analysis recommendation

```javascript
if (analysis.estimatedSpeedup < 1.5) {
  console.log('Parallel execution not beneficial');
  console.log('Recommendation:', analysis.reasoning);
  // Fall back to sequential execution
}
```

---

## Performance Tips

1. **Optimal Task Count**: 5-15 tasks per workflow
2. **Optimal Agent Count**: 2-4 agents for most workflows
3. **Task Duration**: Target 10-30 minutes per task
4. **Batch Size**: Keep batches under 10 tasks
5. **Dependency Depth**: Limit to 3-4 levels
6. **Conflict Prevention**: Enable implicit dependency detection
7. **Strategy Selection**: Use conservative for critical workflows
8. **Monitoring**: Poll progress every 5-10 seconds
9. **Learning**: Review execution metrics to improve future workflows
10. **Validation**: Always check conflicts after execution

---

## Next Steps

1. Review [API Documentation](./API.md) for detailed tool reference
2. Check [Architecture Documentation](./ARCHITECTURE.md) for system internals
3. See [Examples](./examples/) for complete workflow examples
4. Implement production sub-agent integration for your use case
