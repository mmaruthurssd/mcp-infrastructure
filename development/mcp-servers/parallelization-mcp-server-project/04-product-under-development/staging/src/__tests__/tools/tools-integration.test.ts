/**
 * Integration Tests for MCP Tools
 * Tests all 6 tools with focus on input validation and real-world scenarios
 */

import { AnalyzeTaskParallelizabilityTool } from '../../tools/analyze-task-parallelizability.js';
import { CreateDependencyGraphTool } from '../../tools/create-dependency-graph.js';
import { ExecuteParallelWorkflowTool } from '../../tools/execute-parallel-workflow.js';
import { OptimizeBatchDistributionTool } from '../../tools/optimize-batch-distribution.js';
import { AggregateProgressTool } from '../../tools/aggregate-progress.js';
import { DetectConflictsTool } from '../../tools/detect-conflicts.js';
import { Task, AgentProgress, AgentResult } from '../../types.js';

describe('MCP Tools Integration', () => {
  describe('AnalyzeTaskParallelizabilityTool', () => {
    it('should have valid tool definition', () => {
      const def = AnalyzeTaskParallelizabilityTool.getToolDefinition();
      expect(def.name).toBe('analyze_task_parallelizability');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should analyze task with subtasks', () => {
      const result = AnalyzeTaskParallelizabilityTool.execute({
        taskDescription: 'Build user management system',
        subtasks: [
          { id: '1', description: 'Create user model', estimatedMinutes: 20 },
          { id: '2', description: 'Create user API', estimatedMinutes: 30 },
          { id: '3', description: 'Create user UI', estimatedMinutes: 40 },
        ],
      });

      expect(result.parallelizable).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.reasoning).toBeTruthy();
      expect(result.dependencyGraph).toBeDefined();
      expect(result.suggestedBatches).toBeDefined();
      expect(result.estimatedSpeedup).toBeGreaterThan(0);
    });

    it('should reject empty taskDescription', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: '',
          subtasks: [],
        });
      }).toThrow('taskDescription is required');
    });

    it('should reject too long taskDescription', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'a'.repeat(6000),
          subtasks: [],
        });
      }).toThrow('exceeds maximum length');
    });

    it('should reject duplicate task IDs', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'Test',
          subtasks: [
            { id: '1', description: 'Task 1' },
            { id: '1', description: 'Task 2' },
          ],
        });
      }).toThrow('Duplicate task ID');
    });

    it('should reject self-referencing dependencies', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'Test',
          subtasks: [{ id: '1', description: 'Task 1', dependsOn: ['1'] }],
        });
      }).toThrow('cannot depend on itself');
    });

    it('should reject non-existent dependencies', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'Test',
          subtasks: [{ id: '1', description: 'Task 1', dependsOn: ['999'] }],
        });
      }).toThrow('depends on non-existent task');
    });

    it('should reject invalid estimatedMinutes', () => {
      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'Test',
          subtasks: [{ id: '1', description: 'Task 1', estimatedMinutes: -5 }],
        });
      }).toThrow('estimatedMinutes must be between');
    });

    it('should reject too many subtasks', () => {
      const tasks = Array.from({ length: 101 }, (_, i) => ({
        id: `${i}`,
        description: `Task ${i}`,
      }));

      expect(() => {
        AnalyzeTaskParallelizabilityTool.execute({
          taskDescription: 'Test',
          subtasks: tasks,
        });
      }).toThrow('Maximum 100 subtasks');
    });
  });

  describe('CreateDependencyGraphTool', () => {
    it('should have valid tool definition', () => {
      const def = CreateDependencyGraphTool.getToolDefinition();
      expect(def.name).toBe('create_dependency_graph');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should create graph from tasks', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1' },
        { id: '2', description: 'Task 2', dependsOn: ['1'] },
        { id: '3', description: 'Task 3', dependsOn: ['1'] },
      ];

      const result = CreateDependencyGraphTool.execute({ tasks, detectImplicit: true });

      expect(result.graph).toBeDefined();
      expect(result.graph.nodes.size).toBe(3);
      expect(result.hasCycles).toBe(false);
      expect(result.implicitDependencies).toBeDefined();
    });

    it('should detect cycles', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', dependsOn: ['2'] },
        { id: '2', description: 'Task 2', dependsOn: ['1'] },
      ];

      const result = CreateDependencyGraphTool.execute({ tasks, detectImplicit: false });

      expect(result.hasCycles).toBe(true);
      expect(result.cycles).toBeDefined();
      expect(result.cycles!.length).toBeGreaterThan(0);
    });

    it('should reject empty tasks array', () => {
      expect(() => {
        CreateDependencyGraphTool.execute({ tasks: [] });
      }).toThrow('tasks array is required');
    });

    it('should reject missing task ID', () => {
      expect(() => {
        CreateDependencyGraphTool.execute({
          tasks: [{ id: '', description: 'Task' }],
        });
      }).toThrow('missing required field: id');
    });

    it('should reject missing description', () => {
      expect(() => {
        CreateDependencyGraphTool.execute({
          tasks: [{ id: '1', description: '' }],
        });
      }).toThrow('missing required field: description');
    });

    it('should reject too many tasks', () => {
      const tasks = Array.from({ length: 101 }, (_, i) => ({
        id: `${i}`,
        description: `Task ${i}`,
      }));

      expect(() => {
        CreateDependencyGraphTool.execute({ tasks });
      }).toThrow('Maximum 100 tasks');
    });
  });

  describe('OptimizeBatchDistributionTool', () => {
    it('should have valid tool definition', () => {
      const def = OptimizeBatchDistributionTool.getToolDefinition();
      expect(def.name).toBe('optimize_batch_distribution');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should optimize batches with minimize-time strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 30 },
        { id: '2', description: 'Task 2', estimatedMinutes: 20 },
        { id: '3', description: 'Task 3', estimatedMinutes: 10 },
      ];

      const graph = CreateDependencyGraphTool.execute({ tasks, detectImplicit: false });

      const result = OptimizeBatchDistributionTool.execute({
        tasks,
        dependencyGraph: graph.graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      expect(result.batches).toBeDefined();
      expect(result.estimatedTotalTime).toBeGreaterThan(0);
      expect(result.loadBalance).toBeGreaterThanOrEqual(0);
      expect(result.reasoning).toBeTruthy();
    });

    it('should optimize with balance-load strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Task 1', estimatedMinutes: 40 },
        { id: '2', description: 'Task 2', estimatedMinutes: 30 },
      ];

      const graph = CreateDependencyGraphTool.execute({ tasks, detectImplicit: false });

      const result = OptimizeBatchDistributionTool.execute({
        tasks,
        dependencyGraph: graph.graph,
        maxParallelAgents: 2,
        optimizationGoal: 'balance-load',
      });

      expect(result.batches).toBeDefined();
      expect(result.loadBalance).toBeGreaterThan(0);
    });

    it('should optimize with minimize-conflicts strategy', () => {
      const tasks: Task[] = [
        { id: '1', description: 'Read file.ts' },
        { id: '2', description: 'Write file.ts' },
      ];

      const graph = CreateDependencyGraphTool.execute({ tasks, detectImplicit: false });

      const result = OptimizeBatchDistributionTool.execute({
        tasks,
        dependencyGraph: graph.graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-conflicts',
      });

      expect(result.batches).toBeDefined();
    });

    it('should reject empty tasks', () => {
      const graph = CreateDependencyGraphTool.execute({
        tasks: [{ id: '1', description: 'Task' }],
        detectImplicit: false,
      });

      expect(() => {
        OptimizeBatchDistributionTool.execute({
          tasks: [],
          dependencyGraph: graph.graph,
          maxParallelAgents: 2,
          optimizationGoal: 'minimize-time',
        });
      }).toThrow('tasks array is required');
    });

    it('should reject invalid maxParallelAgents', () => {
      const tasks: Task[] = [{ id: '1', description: 'Task 1' }];
      const graph = CreateDependencyGraphTool.execute({ tasks, detectImplicit: false });

      expect(() => {
        OptimizeBatchDistributionTool.execute({
          tasks,
          dependencyGraph: graph.graph,
          maxParallelAgents: 0,
          optimizationGoal: 'minimize-time',
        });
      }).toThrow('maxParallelAgents must be at least 1');
    });
  });

  describe('AggregateProgressTool', () => {
    it('should have valid tool definition', () => {
      const def = AggregateProgressTool.getToolDefinition();
      expect(def.name).toBe('aggregate_progress');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should aggregate with simple-average strategy', () => {
      const progresses: AgentProgress[] = [
        { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 50, status: 'working' },
        { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 75, status: 'working' },
      ];

      const result = AggregateProgressTool.execute({
        agentProgresses: progresses,
        aggregationStrategy: 'simple-average',
      });

      expect(result.overallProgress).toBeCloseTo(62.5, 0);
      expect(result.method).toBe('simple-average');
      expect(result.agentStatuses).toBeDefined();
      expect(result.bottlenecks).toBeDefined();
      expect(result.estimatedCompletion).toBeInstanceOf(Date);
    });

    it('should aggregate with weighted strategy', () => {
      const progresses: AgentProgress[] = [
        {
          agentId: 'agent-1',
          currentTask: 'task-1',
          percentComplete: 50,
          taskWeight: 2,
          status: 'working',
        },
        {
          agentId: 'agent-2',
          currentTask: 'task-2',
          percentComplete: 100,
          taskWeight: 1,
          status: 'complete',
        },
      ];

      const result = AggregateProgressTool.execute({
        agentProgresses: progresses,
        aggregationStrategy: 'weighted',
      });

      expect(result.method).toBe('weighted');
      expect(result.overallProgress).toBeGreaterThan(0);
    });

    it('should reject empty progress array', () => {
      expect(() => {
        AggregateProgressTool.execute({
          agentProgresses: [],
          aggregationStrategy: 'simple-average',
        });
      }).toThrow('agentProgresses array is required');
    });

    it('should reject invalid percentComplete', () => {
      expect(() => {
        AggregateProgressTool.execute({
          agentProgresses: [
            { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 150, status: 'working' },
          ],
          aggregationStrategy: 'simple-average',
        });
      }).toThrow('percentComplete must be between 0 and 100');
    });

    it('should reject missing required fields', () => {
      expect(() => {
        AggregateProgressTool.execute({
          agentProgresses: [
            { agentId: '', currentTask: 'task-1', percentComplete: 50, status: 'working' },
          ],
          aggregationStrategy: 'simple-average',
        });
      }).toThrow('missing required field: agentId');
    });
  });

  describe('DetectConflictsTool', () => {
    it('should have valid tool definition', () => {
      const def = DetectConflictsTool.getToolDefinition();
      expect(def.name).toBe('detect_conflicts');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should detect no conflicts for non-overlapping files', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['file1.ts'],
          changes: [{ file: 'file1.ts', type: 'modify' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['file2.ts'],
          changes: [{ file: 'file2.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = DetectConflictsTool.execute({ agentResults: results });

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.resolutionStrategy).toBeDefined();
    });

    it('should detect file-level conflicts', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['shared.ts'],
          changes: [{ file: 'shared.ts', type: 'modify' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['shared.ts'],
          changes: [{ file: 'shared.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = DetectConflictsTool.execute({ agentResults: results });

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].resolutionOptions).toBeDefined();
    });

    it('should reject empty results', () => {
      expect(() => {
        DetectConflictsTool.execute({ agentResults: [] });
      }).toThrow('agentResults array is required');
    });

    it('should reject missing agentId', () => {
      expect(() => {
        DetectConflictsTool.execute({
          agentResults: [
            {
              agentId: '',
              taskId: 'task-1',
              success: true,
              filesModified: [],
              changes: [],
              duration: 100,
            },
          ],
        });
      }).toThrow('missing required field: agentId');
    });

    it('should reject invalid duration', () => {
      expect(() => {
        DetectConflictsTool.execute({
          agentResults: [
            {
              agentId: 'agent-1',
              taskId: 'task-1',
              success: true,
              filesModified: [],
              changes: [],
              duration: -10,
            },
          ],
        });
      }).toThrow('duration must be non-negative');
    });
  });

  describe('ExecuteParallelWorkflowTool', () => {
    it('should have valid tool definition', () => {
      const def = ExecuteParallelWorkflowTool.getToolDefinition();
      expect(def.name).toBe('execute_parallel_workflow');
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
    });

    it('should execute workflow with conservative strategy', async () => {
      const analysisResult = AnalyzeTaskParallelizabilityTool.execute({
        taskDescription: 'Test workflow',
        subtasks: [
          { id: '1', description: 'Task 1', estimatedMinutes: 10 },
          { id: '2', description: 'Task 2', estimatedMinutes: 10 },
        ],
      });

      const result = await ExecuteParallelWorkflowTool.execute({
        analysisResult,
        executionStrategy: 'conservative',
        maxParallelAgents: 2,
      });

      expect(result.success).toBeDefined();
      expect(result.executionId).toBeTruthy();
      expect(result.results).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should execute with aggressive strategy', async () => {
      const analysisResult = AnalyzeTaskParallelizabilityTool.execute({
        taskDescription: 'Test workflow',
        subtasks: [{ id: '1', description: 'Task 1' }],
      });

      const result = await ExecuteParallelWorkflowTool.execute({
        analysisResult,
        executionStrategy: 'aggressive',
        maxParallelAgents: 1,
      });

      expect(result.success).toBeDefined();
    });

    it('should reject invalid maxParallelAgents', async () => {
      const analysisResult = AnalyzeTaskParallelizabilityTool.execute({
        taskDescription: 'Test',
        subtasks: [{ id: '1', description: 'Task' }],
      });

      await expect(
        ExecuteParallelWorkflowTool.execute({
          analysisResult,
          executionStrategy: 'conservative',
          maxParallelAgents: 0,
        })
      ).rejects.toThrow('maxParallelAgents must be at least 1');
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full parallelization workflow', async () => {
      // Step 1: Analyze task
      const analysis = AnalyzeTaskParallelizabilityTool.execute({
        taskDescription: 'Build complete feature',
        subtasks: [
          { id: '1', description: 'Create models', estimatedMinutes: 20 },
          { id: '2', description: 'Create API', estimatedMinutes: 30, dependsOn: ['1'] },
          { id: '3', description: 'Create UI', estimatedMinutes: 40, dependsOn: ['1'] },
        ],
      });

      expect(analysis.parallelizable).toBeDefined();

      // Step 2: Create dependency graph
      const graph = CreateDependencyGraphTool.execute({
        tasks: analysis.dependencyGraph.nodes
          ? Array.from(analysis.dependencyGraph.nodes.values()).map(n => n.task)
          : [],
        detectImplicit: true,
      });

      expect(graph.hasCycles).toBe(false);

      // Step 3: Optimize batches
      const optimized = OptimizeBatchDistributionTool.execute({
        tasks: analysis.suggestedBatches.flatMap(b => b.tasks),
        dependencyGraph: graph.graph,
        maxParallelAgents: 2,
        optimizationGoal: 'minimize-time',
      });

      expect(optimized.batches.length).toBeGreaterThan(0);

      // Step 4: Execute workflow
      const execution = await ExecuteParallelWorkflowTool.execute({
        analysisResult: analysis,
        executionStrategy: 'conservative',
        maxParallelAgents: 2,
      });

      expect(execution.success).toBeDefined();

      // Step 5: Detect conflicts
      const conflicts = DetectConflictsTool.execute({
        agentResults: execution.results,
      });

      expect(conflicts.hasConflicts).toBeDefined();
    });
  });
});
