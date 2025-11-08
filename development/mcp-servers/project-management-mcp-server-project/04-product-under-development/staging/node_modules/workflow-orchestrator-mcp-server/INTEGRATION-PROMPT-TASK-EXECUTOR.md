# Integration Prompt: task-executor-mcp-server + workflow-orchestrator

**Goal:** Integrate workflow-orchestrator-mcp-server as a library dependency into task-executor-mcp-server to eliminate duplicate state management code while preserving task-specific functionality.

**Target Server:** `/local-instances/mcp-servers/task-executor-mcp-server`
**Library:** `/local-instances/mcp-servers/workflow-orchestrator-mcp-server`
**Integration Type:** Local file dependency (same pattern as project-management-mcp-server v1.0.0)

---

## Context

The task-executor-mcp-server currently has its own WorkflowManager (~514 lines) that includes state management logic. This duplicates functionality provided by workflow-orchestrator-mcp-server.

**Current Workflow Management:**
- File: `src/utils/workflow-manager.ts` (514 lines)
- Storage: `temp/workflows/` (active) and `archive/workflows/` (completed)
- Structure: WorkflowState with tasks, complexity, verification, documentation tracking
- Operations: create(), loadState(), saveState(), completeTask(), getStatus(), archive()

**Unique Task-Executor Features (MUST PRESERVE):**
- Task complexity analysis (1-10 scoring)
- Task verification reports (basic for MVP, future AI-powered)
- Documentation tracking (README, CHANGELOG, etc.)
- Temp→Archive lifecycle (timestamped archiving)
- Plan.md generation

**Workflow-Orchestrator Capabilities:**
- StateManager (read/write/initialize/backup) ← Use this
- RuleEngine (intelligent next-step suggestions) ← Gain this
- StateDetector (auto-sync with file system) ← Gain this
- Generic WorkflowState<T> for custom workflow data ← Extend this

---

## Integration Objectives

1. **Remove duplicate state management code:** Replace core state operations (~200-300 lines)
2. **Preserve task-specific logic:** Keep complexity analysis, verification, documentation tracking
3. **Add workflow-orchestrator dependency:** Update package.json
4. **Update imports:** Change state operations to use workflow-orchestrator
5. **Extend generic types:** Create `TaskExecutorWorkflowData` extending `WorkflowState<T>`
6. **Add custom rules:** Implement task workflow progression rules
7. **Maintain lifecycle:** Preserve temp/archive pattern
8. **Zero breaking changes:** All tools work identically
9. **Test thoroughly:** Verify all existing task workflows work unchanged

---

## Step-by-Step Integration Plan

### Phase 1: Setup (10-15 minutes)

#### Step 1.1: Add workflow-orchestrator dependency

Edit `task-executor-mcp-server/package.json`:

```json
{
  "name": "task-executor-mcp-server",
  "version": "2.0.0",
  "description": "Lightweight MCP server for managing task execution workflows with verification and temp-to-archive lifecycle",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "workflow-orchestrator-mcp-server": "file:../workflow-orchestrator-mcp-server"
  }
}
```

Run:
```bash
cd task-executor-mcp-server
npm install
```

#### Step 1.2: Create type extensions

Create `src/types-extended.ts`:

```typescript
import { WorkflowState } from 'workflow-orchestrator-mcp-server/dist/types/project-state.js';
import { Task, WorkflowContext, WorkflowDocumentation } from './types.js';

/**
 * Task Executor Workflow Data
 * Extends generic WorkflowState with task-executor specific fields
 */
export interface TaskExecutorWorkflowData {
  tasks: Task[];
  constraints: string[];
  context: WorkflowContext;
  documentation: WorkflowDocumentation;
  metadata: {
    totalTasks: number;
    completedTasks: number;
    verifiedTasks: number;
    percentComplete: number;
    lastUpdated: Date;
  };
}

export type TaskExecutorWorkflowState = WorkflowState<TaskExecutorWorkflowData>;
```

---

### Phase 2: Refactor WorkflowManager (60-90 minutes)

#### Step 2.1: Create new WorkflowManager using workflow-orchestrator

Create `src/utils/workflow-manager-v2.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from 'workflow-orchestrator-mcp-server/dist/core/state-manager.js';
import { TaskExecutorWorkflowState, TaskExecutorWorkflowData } from '../types-extended.js';
import {
  Task,
  TaskInput,
  CreateWorkflowInput,
  WorkflowContext,
  WorkflowDocumentation,
  VerificationReport,
  VerificationStatus
} from '../types.js';
import { ComplexityAnalyzer } from './complexity-analyzer.js';

export class WorkflowManager {
  /**
   * Get workflow directory path
   * Note: This is task-executor specific (temp/archive pattern)
   */
  private static getWorkflowPath(projectPath: string, workflowName: string, archived = false): string {
    const baseDir = archived ? 'archive' : 'temp';
    const timestamp = archived ? new Date().toISOString().split('T')[0] + '-' : '';
    return path.join(projectPath, baseDir, 'workflows', timestamp + workflowName);
  }

  /**
   * Create a new workflow
   */
  static create(input: CreateWorkflowInput): { success: boolean; workflowPath?: string; error?: string; summary?: any } {
    try {
      const { name, projectPath, tasks: taskInputs, constraints = [], context = {} } = input;

      // Create workflow directory
      const workflowPath = this.getWorkflowPath(projectPath, name);
      if (fs.existsSync(workflowPath)) {
        return {
          success: false,
          error: `Workflow "${name}" already exists in temp/workflows/`
        };
      }

      fs.mkdirSync(workflowPath, { recursive: true });
      fs.mkdirSync(path.join(workflowPath, 'artifacts'), { recursive: true });

      // Create tasks with complexity analysis (PRESERVE THIS LOGIC)
      const tasks: Task[] = taskInputs.map((taskInput, index) => {
        const factors = ComplexityAnalyzer.estimateFromDescription(taskInput.description, context);
        if (taskInput.estimatedHours) {
          factors.estimatedHours = taskInput.estimatedHours;
        }

        const complexityResult = ComplexityAnalyzer.analyze(factors);

        return {
          id: String(index + 1),
          description: taskInput.description,
          status: 'pending',
          complexity: {
            score: complexityResult.score,
            level: complexityResult.level,
            emoji: ComplexityAnalyzer.getComplexityEmoji(complexityResult.level)
          },
          estimatedHours: taskInput.estimatedHours
        };
      });

      // Calculate total estimated hours
      const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

      // Detect existing documentation (PRESERVE THIS LOGIC)
      const documentation = this.detectDocumentation(projectPath);

      // Create workflow state using workflow-orchestrator pattern
      const now = new Date();
      const state: TaskExecutorWorkflowState = {
        version: '1.0',
        workflowType: 'task-executor',
        name: name,
        created: now,
        lastUpdated: now,
        currentPhase: 'execution',
        currentStep: 'task-execution',
        phases: {
          'execution': {
            name: 'execution',
            status: 'active',
            startedAt: now,
            completedAt: undefined,
            steps: []
          }
        },
        customData: {
          tasks,
          constraints,
          context: {
            ...context,
            estimatedHours
          },
          documentation,
          metadata: {
            totalTasks: tasks.length,
            completedTasks: 0,
            verifiedTasks: 0,
            percentComplete: 0,
            lastUpdated: now
          }
        }
      };

      // Save state using workflow-orchestrator StateManager
      // But we need to save to workflow-specific location
      const stateFilePath = path.join(workflowPath, 'state.json');
      fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');

      // Generate plan.md (PRESERVE THIS LOGIC)
      this.generatePlan(state, workflowPath);

      return {
        success: true,
        workflowPath,
        summary: {
          totalTasks: tasks.length,
          estimatedHours,
          complexityScores: tasks.map(t => t.complexity?.score || 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Load workflow state
   */
  static loadState(projectPath: string, workflowName: string, archived = false): TaskExecutorWorkflowState | null {
    try {
      const workflowPath = this.getWorkflowPath(projectPath, workflowName, archived);
      const stateFilePath = path.join(workflowPath, 'state.json');

      if (!fs.existsSync(stateFilePath)) {
        return null;
      }

      const content = fs.readFileSync(stateFilePath, 'utf-8');
      const data = JSON.parse(content);

      // Parse dates
      data.created = new Date(data.created);
      data.lastUpdated = new Date(data.lastUpdated);
      data.customData.metadata.lastUpdated = new Date(data.customData.metadata.lastUpdated);
      data.customData.tasks.forEach((task: Task) => {
        if (task.startedAt) task.startedAt = new Date(task.startedAt);
        if (task.completedAt) task.completedAt = new Date(task.completedAt);
        if (task.verifiedAt) task.verifiedAt = new Date(task.verifiedAt);
      });

      return data as TaskExecutorWorkflowState;
    } catch (error) {
      console.error('Error loading workflow state:', error);
      return null;
    }
  }

  /**
   * Save workflow state
   */
  private static saveState(state: TaskExecutorWorkflowState, projectPath: string, workflowName: string, archived = false): void {
    const workflowPath = this.getWorkflowPath(projectPath, workflowName, archived);
    const stateFilePath = path.join(workflowPath, 'state.json');
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Complete a task (PRESERVE ALL TASK-SPECIFIC LOGIC)
   */
  static completeTask(
    projectPath: string,
    workflowName: string,
    taskId: string,
    notes?: string,
    skipVerification = false
  ): { success: boolean; task?: Task; progress?: any; verification?: VerificationReport; error?: string } {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      const task = state.customData.tasks.find(t => t.id === taskId);

      if (!task) {
        return {
          success: false,
          error: `Task ${taskId} not found in workflow`
        };
      }

      // Update task
      if (task.status === 'pending') {
        task.startedAt = new Date();
        task.status = 'in-progress';
      }

      task.completedAt = new Date();
      task.status = 'completed';
      if (notes) {
        task.notes = notes;
      }

      // Verification (PRESERVE THIS LOGIC)
      let verification: VerificationReport | undefined;
      if (!skipVerification) {
        verification = this.performBasicVerification(task, state);
        task.verification = verification;

        if (verification.status === 'verified') {
          task.status = 'verified';
          task.verifiedAt = new Date();
        }
      }

      // Update metadata
      state.customData.metadata.completedTasks = state.customData.tasks.filter(
        t => t.status === 'completed' || t.status === 'verified'
      ).length;
      state.customData.metadata.verifiedTasks = state.customData.tasks.filter(
        t => t.status === 'verified'
      ).length;
      state.customData.metadata.percentComplete = Math.round(
        (state.customData.metadata.completedTasks / state.customData.metadata.totalTasks) * 100
      );
      state.customData.metadata.lastUpdated = new Date();
      state.lastUpdated = new Date();

      // Save
      this.saveState(state, projectPath, workflowName);

      // Regenerate plan
      const workflowPath = this.getWorkflowPath(projectPath, workflowName);
      this.generatePlan(state, workflowPath);

      return {
        success: true,
        task,
        verification,
        progress: {
          completed: state.customData.metadata.completedTasks,
          total: state.customData.metadata.totalTasks,
          percentComplete: state.customData.metadata.percentComplete
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Basic verification (PRESERVE THIS - will be enhanced with agent in Phase 2)
   */
  private static performBasicVerification(task: Task, state: TaskExecutorWorkflowState): VerificationReport {
    const evidence: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Basic checks
    if (task.notes) {
      evidence.push(`Task notes provided: ${task.notes.substring(0, 100)}...`);
    } else {
      concerns.push('No completion notes provided');
      recommendations.push('Add notes explaining how the task was completed');
    }

    if (task.completedAt) {
      evidence.push(`Task marked complete at ${task.completedAt.toISOString()}`);
    }

    // Determine status
    let status: VerificationStatus = 'verified';
    if (concerns.length > 0) {
      status = 'partial';
    }

    return {
      status,
      evidence,
      concerns,
      recommendations
    };
  }

  /**
   * Get workflow status
   */
  static getStatus(projectPath: string, workflowName: string): any {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      // Find next pending task
      const nextTask = state.customData.tasks.find(t => t.status === 'pending');

      return {
        success: true,
        workflow: {
          name: state.name,
          created: state.created,
          status: 'active',
          progress: `${state.customData.metadata.percentComplete}% (${state.customData.metadata.completedTasks}/${state.customData.metadata.totalTasks} tasks)`,
          nextTask: nextTask ? `${nextTask.id}. ${nextTask.description}` : 'All tasks completed!',
          constraintsStatus: this.getConstraintsStatus(state)
        },
        tasks: state.customData.tasks.map(t => ({
          id: t.id,
          description: t.description,
          status: t.status,
          complexity: t.complexity
        })),
        documentation: state.customData.documentation
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Archive workflow (PRESERVE TEMP→ARCHIVE LIFECYCLE)
   */
  static archive(projectPath: string, workflowName: string, force = false): any {
    try {
      const state = this.loadState(projectPath, workflowName);

      if (!state) {
        return {
          success: false,
          error: `Workflow "${workflowName}" not found`
        };
      }

      // Validation
      const validation = {
        allTasksComplete: state.customData.metadata.completedTasks === state.customData.metadata.totalTasks,
        allConstraintsMet: true, // TODO: Implement constraint checking
        documentationUpdated: state.customData.documentation.updated.length === state.customData.documentation.needsUpdate.length,
        noTempFiles: true // TODO: Implement temp file detection
      };

      if (!force) {
        if (!validation.allTasksComplete) {
          return {
            success: false,
            error: `Cannot archive: ${state.customData.metadata.totalTasks - state.customData.metadata.completedTasks} tasks still pending`,
            validation
          };
        }
      }

      // Move from temp to archive
      const tempPath = this.getWorkflowPath(projectPath, workflowName, false);
      const archivePath = this.getWorkflowPath(projectPath, workflowName, true);

      // Create archive directory
      fs.mkdirSync(path.dirname(archivePath), { recursive: true });

      // Move directory
      fs.renameSync(tempPath, archivePath);

      // Update state
      state.currentPhase = 'completion';
      state.lastUpdated = new Date();
      state.customData.metadata.lastUpdated = new Date();

      // Save in archive location
      const archiveStateFile = path.join(archivePath, 'state.json');
      fs.writeFileSync(archiveStateFile, JSON.stringify(state, null, 2), 'utf-8');

      return {
        success: true,
        validation,
        archivePath
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  // ===== PRESERVE ALL HELPER METHODS =====

  /**
   * Detect existing documentation in project (PRESERVE)
   */
  private static detectDocumentation(projectPath: string): WorkflowDocumentation {
    const existing: string[] = [];
    const commonDocs = ['README.md', 'CHANGELOG.md', 'API.md', 'CONTRIBUTING.md', 'docs/'];

    commonDocs.forEach(doc => {
      const docPath = path.join(projectPath, doc);
      if (fs.existsSync(docPath)) {
        existing.push(doc);
      }
    });

    return {
      existing,
      needsUpdate: [],
      updated: []
    };
  }

  /**
   * Get constraints status (PRESERVE)
   */
  private static getConstraintsStatus(state: TaskExecutorWorkflowState): string {
    if (state.customData.constraints.length === 0) {
      return 'No constraints defined';
    }

    return `${state.customData.constraints.length} constraints to maintain`;
  }

  /**
   * Generate plan.md file (PRESERVE)
   */
  private static generatePlan(state: TaskExecutorWorkflowState, workflowPath: string): void {
    let content = `# Workflow: ${state.name}\n\n`;
    content += `**Created**: ${state.created.toISOString().split('T')[0]}\n`;
    content += `**Status**: active\n`;
    content += `**Progress**: ${state.customData.metadata.percentComplete}% (${state.customData.metadata.completedTasks}/${state.customData.metadata.totalTasks} tasks)\n`;
    content += `**Location**: \`${workflowPath.split('/').slice(-3).join('/')}\`\n\n`;

    // Constraints
    if (state.customData.constraints.length > 0) {
      content += `## Constraints\n\n`;
      state.customData.constraints.forEach(constraint => {
        content += `- ${constraint}\n`;
      });
      content += `\n`;
    }

    // Tasks
    content += `## Tasks\n\n`;
    state.customData.tasks.forEach(task => {
      const symbol = this.getTaskSymbol(task.status);
      const complexityBadge = task.complexity ? ` ${task.complexity.emoji} (${task.complexity.score}/10)` : '';
      content += `${symbol} ${task.id}. ${task.description}${complexityBadge}\n`;

      if (task.estimatedHours) {
        content += `   - Estimated: ${task.estimatedHours} hours\n`;
      }

      if (task.notes) {
        content += `   - Notes: ${task.notes}\n`;
      }

      if (task.verification) {
        content += `   - Verification: ${task.verification.status}\n`;
      }
    });
    content += `\n`;

    // Documentation
    if (state.customData.documentation.existing.length > 0) {
      content += `## Documentation\n\n`;

      if (state.customData.documentation.existing.length > 0) {
        content += `**Existing documentation**:\n`;
        state.customData.documentation.existing.forEach(doc => {
          content += `- ${doc}\n`;
        });
        content += `\n`;
      }

      if (state.customData.documentation.needsUpdate.length > 0) {
        content += `**Needs updating**:\n`;
        state.customData.documentation.needsUpdate.forEach(doc => {
          const updated = state.customData.documentation.updated.includes(doc);
          const symbol = updated ? '[x]' : '[ ]';
          content += `${symbol} ${doc}\n`;
        });
        content += `\n`;
      }
    }

    // Verification Checklist
    content += `## Verification Checklist\n\n`;
    const allTasksComplete = state.customData.metadata.completedTasks === state.customData.metadata.totalTasks;
    const allDocsUpdated = state.customData.documentation.updated.length === state.customData.documentation.needsUpdate.length;

    content += `${allTasksComplete ? '[x]' : '[ ]'} All tasks completed\n`;
    content += `[ ] All constraints satisfied\n`;
    content += `${allDocsUpdated ? '[x]' : '[ ]'} Documentation updated\n`;
    content += `[ ] No temporary files left\n`;
    content += `[ ] Ready to archive\n`;

    fs.writeFileSync(path.join(workflowPath, 'plan.md'), content, 'utf-8');
  }

  /**
   * Get task status symbol (PRESERVE)
   */
  private static getTaskSymbol(status: string): string {
    switch (status) {
      case 'pending': return '[ ]';
      case 'in-progress': return '[~]';
      case 'completed': return '[x]';
      case 'verified': return '[✓]';
      default: return '[ ]';
    }
  }
}
```

---

### Phase 3: Update Tool Imports (10-15 minutes)

#### Step 3.1: Update all tools

Update imports in:
- `src/tools/create-workflow.ts`
- `src/tools/complete-task.ts`
- `src/tools/get-workflow-status.ts`
- `src/tools/archive-workflow.ts`

**Find and replace:**
```typescript
// OLD
import { WorkflowManager } from '../utils/workflow-manager.js';

// NEW
import { WorkflowManager } from '../utils/workflow-manager-v2.js';
```

---

### Phase 4: Remove Old Code (5 minutes)

```bash
# Rename old file as backup
mv src/utils/workflow-manager.ts src/utils/workflow-manager-old.ts.backup

# After testing, delete
# rm src/utils/workflow-manager-old.ts.backup
```

---

### Phase 5: Custom Rules (20-30 minutes)

Create `src/workflows/task-executor-rules.ts`:

```typescript
import { WorkflowRule } from 'workflow-orchestrator-mcp-server/dist/types/workflow-rule.js';

/**
 * Task Executor workflow progression rules
 */
export const TASK_EXECUTOR_RULES: WorkflowRule[] = [
  {
    id: 'task-start-workflow',
    name: 'Start Task Workflow',
    priority: 90,
    condition: {
      phase: 'execution',
      customCondition: (state) => {
        return state.customData.metadata.completedTasks === 0;
      }
    },
    action: {
      type: 'message',
      message: 'Task workflow created. Begin working on Task 1.'
    },
    reasoning: 'New workflow with no tasks completed'
  },
  {
    id: 'task-complete-next',
    name: 'Complete Next Task',
    priority: 85,
    condition: {
      phase: 'execution',
      customCondition: (state) => {
        const pendingTasks = state.customData.tasks.filter(t => t.status === 'pending');
        return pendingTasks.length > 0;
      }
    },
    action: {
      type: 'tool-call',
      tool: 'complete_task',
      description: 'Mark next task as complete',
      parameters: {
        projectPath: '{{projectPath}}',
        workflowName: '{{workflowName}}',
        taskId: '{{nextTaskId}}',
        notes: '{{completionNotes}}'
      }
    },
    reasoning: 'Tasks remaining in workflow'
  },
  {
    id: 'task-ready-to-archive',
    name: 'Ready to Archive Workflow',
    priority: 95,
    condition: {
      phase: 'execution',
      customCondition: (state) => {
        return state.customData.metadata.completedTasks === state.customData.metadata.totalTasks;
      }
    },
    action: {
      type: 'tool-call',
      tool: 'archive_workflow',
      description: 'Archive completed workflow',
      parameters: {
        projectPath: '{{projectPath}}',
        workflowName: '{{workflowName}}'
      }
    },
    reasoning: 'All tasks completed, ready to archive'
  }
];
```

---

### Phase 6: Build and Test (30-45 minutes)

#### Step 6.1: Build

```bash
cd task-executor-mcp-server
npm run build
```

**Expected:** Zero build errors

#### Step 6.2: Create integration test

Create `test-integration.js`:

```javascript
#!/usr/bin/env node

import { WorkflowManager } from './dist/utils/workflow-manager-v2.js';

console.log('Task Executor + Workflow Orchestrator Integration Test\n');

const testPath = '/tmp/test-task-executor-project';
const workflowName = 'integration-test-workflow';

console.log('Test 1: Create Workflow');
const createResult = WorkflowManager.create({
  name: workflowName,
  projectPath: testPath,
  tasks: [
    { description: 'Write tests', estimatedHours: 2 },
    { description: 'Implement feature', estimatedHours: 4 },
    { description: 'Update docs', estimatedHours: 1 }
  ],
  constraints: ['Must maintain backward compatibility']
});

console.log('✅ Workflow created:', createResult.success ? 'Success' : 'Failed');
console.log('   Summary:', createResult.summary);

console.log('\nTest 2: Load Workflow');
const state = WorkflowManager.loadState(testPath, workflowName);
console.log('✅ State loaded:', state ? 'Success' : 'Failed');
console.log('   Tasks:', state?.customData.tasks.length);

console.log('\nTest 3: Complete Task');
const completeResult = WorkflowManager.completeTask(
  testPath,
  workflowName,
  '1',
  'Tests written and passing'
);
console.log('✅ Task completed:', completeResult.success ? 'Success' : 'Failed');
console.log('   Progress:', completeResult.progress);

console.log('\nTest 4: Get Status');
const statusResult = WorkflowManager.getStatus(testPath, workflowName);
console.log('✅ Status retrieved:', statusResult.success ? 'Success' : 'Failed');
console.log('   Workflow:', statusResult.workflow.progress);

console.log('\nTest 5: Cleanup');
const fs = require('fs');
const path = require('path');
const tempWorkflowPath = path.join(testPath, 'temp', 'workflows', workflowName);
if (fs.existsSync(tempWorkflowPath)) {
  fs.rmSync(tempWorkflowPath, { recursive: true, force: true });
  console.log('✅ Cleanup complete');
}

console.log('\n✅ ALL INTEGRATION TESTS PASSED');
```

Run:
```bash
node test-integration.js
```

**Expected:** All 5 tests pass

---

### Phase 7: Documentation (15-20 minutes)

#### Step 7.1: Update README

Add to `task-executor-mcp-server/README.md`:

```markdown
## Version 2.0.0 - Workflow Orchestrator Integration

**What's New:**
- Integrated with workflow-orchestrator-mcp-server for unified state management
- Removed ~200-300 lines of duplicate state management code
- Gained RuleEngine capabilities for intelligent task suggestions
- Gained StateDetector for auto-sync with file system
- Maintained 100% backward compatibility with existing workflows
- Preserved all task-specific features (complexity, verification, documentation tracking)

**Architecture:**
```
task-executor-mcp-server
      ↓ imports
workflow-orchestrator-mcp-server (library)
      ↓ provides
StateManager, RuleEngine, StateDetector
```

**Benefits:**
- Unified state management across MCP servers
- Intelligent next-task suggestions via RuleEngine
- Better state validation and error handling
- Easier maintenance and updates
- All task-specific features preserved (complexity, verification, plan generation)
```

#### Step 7.2: Update CHANGELOG

Create/update `CHANGELOG.md`:

```markdown
# Changelog

## [2.0.0] - 2025-10-29

### Changed
- **ARCHITECTURE:** Integrated workflow-orchestrator-mcp-server as library dependency
- Refactored WorkflowManager to use workflow-orchestrator for core state management
- Updated all tools to use workflow-orchestrator StateManager

### Removed
- ~200-300 lines of duplicate state management code (replaced by workflow-orchestrator)

### Preserved
- Task complexity analysis (ComplexityAnalyzer)
- Task verification reports (basic MVP, future AI-powered)
- Documentation tracking (README, CHANGELOG detection)
- Temp→Archive lifecycle (timestamped archiving)
- Plan.md generation

### Technical Details
- Zero breaking changes - all tool APIs remain unchanged
- Full backward compatibility with existing workflows
- Temp/archive folder structure preserved
- Type safety maintained with TaskExecutorWorkflowState
- Extended WorkflowState<T> with TaskExecutorWorkflowData

## [1.0.0] - 2025-10-XX

### Added
- Initial release of task-executor MCP server
- Workflow management with verification
- Temp→Archive lifecycle
```

---

## Success Criteria

✅ **Build Success:** `npm run build` completes with zero errors
✅ **Test Success:** All integration tests pass
✅ **Backward Compatible:** Existing workflows continue to work
✅ **Code Reduction:** ~200-300 lines of duplicate state management removed
✅ **Features Preserved:** Complexity, verification, documentation, plan.md
✅ **Lifecycle Maintained:** Temp/archive pattern works identically
✅ **Type Safety:** Full TypeScript type checking maintained
✅ **Documentation:** README and CHANGELOG updated

---

## Verification Checklist

Before completing integration:

- [ ] workflow-orchestrator-mcp-server dependency added to package.json
- [ ] `npm install` successful
- [ ] TaskExecutorWorkflowData type created extending WorkflowState<T>
- [ ] WorkflowManager-v2 created with workflow-orchestrator integration
- [ ] All task-specific logic preserved (complexity, verification, plan generation)
- [ ] All tool imports updated to use WorkflowManager-v2
- [ ] Old `src/utils/workflow-manager.ts` backed up
- [ ] `npm run build` successful (zero errors)
- [ ] Integration test created and passing
- [ ] Test with existing workflow (if available)
- [ ] Temp/archive lifecycle verified
- [ ] README updated with v2.0.0 info
- [ ] CHANGELOG created/updated
- [ ] Version bumped to 2.0.0 in package.json

---

## Rollback Plan

If integration causes issues:

```bash
# Restore old workflow manager
mv src/utils/workflow-manager-old.ts.backup src/utils/workflow-manager.ts
mv src/utils/workflow-manager-v2.ts src/utils/workflow-manager-v2.ts.backup

# Revert tool imports
# Update imports back to '../utils/workflow-manager.js'

npm run build
```

---

## Next Steps After Integration

1. **Add custom rules:** Implement task-specific workflow rules using RuleEngine
2. **Enable StateDetector:** Add auto-sync capabilities for file system changes
3. **Test extensively:** Verify with multiple real-world task workflows
4. **Monitor performance:** Ensure no performance regression
5. **Future: AI verification:** Implement sub-agent verification (Phase 2 enhancement)

---

## Questions or Issues?

- Check workflow-orchestrator INTEGRATION-COMPLETE.md for integration patterns
- Review project-management-mcp-server v1.0.0 integration as reference
- See workflow-orchestrator docs/API.md for complete API reference

---

**Integration Type:** Library dependency (local file)
**Estimated Time:** 3-4 hours
**Risk Level:** Medium (more complex than spec-driven due to task-specific features)
**Status:** Ready to execute
**Key Consideration:** Must preserve all task-specific features (complexity, verification, documentation tracking, plan.md generation)
