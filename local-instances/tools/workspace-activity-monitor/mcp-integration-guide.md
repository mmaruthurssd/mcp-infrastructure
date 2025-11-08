---
type: integration-guide
tags: [mcp-integration, proactive-engagement, workflow-orchestration]
created: 2025-10-29
status: active
version: 1.0.0
---

# MCP Integration Guide for Workspace Activity Monitor

**Purpose:** Document how workspace-activity-monitor integrates with existing MCP servers and how MCPs can leverage the proactive engagement system

**Audience:** AI assistants, MCP developers, system architects

**Related Documents:**
- `SYSTEM-ARCHITECTURE.md` - Overall system architecture
- `pattern-registry-spec.md` - Pattern registry technical specification
- `mcp-server-development/PRODUCTION-FEEDBACK-LOOP.md` - Production feedback loop

---

## Table of Contents

1. [Overview](#overview)
2. [Integration Architecture](#integration-architecture)
3. [Core MCP Integrations](#core-mcp-integrations)
4. [Pattern Registration by MCPs](#pattern-registration-by-mcps)
5. [Queue Consumption by MCPs](#queue-consumption-by-mcps)
6. [Workflow Orchestration](#workflow-orchestration)
7. [Examples & Use Cases](#examples--use-cases)
8. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

### What is This Integration?

The workspace-activity-monitor is a **background monitoring system** that detects patterns in AI activity and queues them for proactive processing. This creates a **semi-autonomous workflow** where MCPs can:

1. **Register patterns** - Define what activities should trigger their workflows
2. **Consume queue items** - Process detected patterns at natural checkpoints
3. **Collaborate** - Multiple MCPs work together to resolve queued items

### Integration Benefits

For **AI Assistants:**
- No longer rely on memory to trigger workflows
- Automatic pattern detection across sessions
- Prioritized queue processing at checkpoints
- Continuous improvement without user prompting

For **MCP Servers:**
- Extend pattern registry with domain-specific patterns
- Receive proactive workflow triggers from activity monitor
- Integrate with external brain queue for persistence
- Enable compounding improvements over time

For **Users:**
- More autonomous AI behavior
- Fewer forgotten follow-ups
- Systematic continuous improvement
- Better visibility into AI workflows

---

## Integration Architecture

### High-Level Data Flow

```
1. AI Activity (bash, edit, read, etc.)
   ↓
2. AI logs to .workspace-activity.jsonl
   ↓
3. Background Monitor (workspace-activity-monitor)
   ↓ Detects patterns via PatternRegistry
   ↓
4. External Brain Queue (persistent)
   ├── troubleshooting-queue/
   ├── documentation-queue/
   └── [workflow]-queue/
   ↓
5. Checkpoint Integration (/start, task completion)
   ↓
6. AI processes queue with MCPs
   ├── learning-optimizer ← Processes troubleshooting items
   ├── project-management ← Creates goals from queue
   ├── task-executor ← Executes fixes
   └── [custom-mcp] ← Domain-specific processing
   ↓
7. Mark as processed → Move to archived/
   ↓
8. Update SUMMARY.md with statistics
```

### Integration Points

**Point 1: Pattern Registration**
- MCPs define patterns in `patterns/[mcp-name]-patterns.json`
- Background monitor loads patterns on startup
- Patterns trigger queue writes when detected

**Point 2: Queue Consumption**
- AI reads external brain queue at checkpoints
- AI uses appropriate MCPs to process queue items
- MCPs execute domain-specific workflows

**Point 3: Workflow Orchestration**
- Multiple MCPs collaborate on complex queue items
- project-management orchestrates multi-step resolutions
- learning-optimizer tracks outcomes and prevents recurrence

---

## Core MCP Integrations

### 1. learning-optimizer MCP

**Role:** Primary consumer of troubleshooting queue items, tracks issues and promotes to preventive checks

**Integration Type:** ✅ Bidirectional (Pattern registration + Queue consumption)

#### Pattern Registration

learning-optimizer can register patterns for:
- High-frequency issues (automatically promote to preventive checks)
- Duplicate detection opportunities
- Optimization triggers (3+ occurrences, 5+ total issues)

**Example Pattern:**
```json
{
  "id": "learning-optimizer-high-frequency-issue",
  "name": "High-Frequency Issue Detected",
  "workflow": "troubleshooting",
  "trigger": {
    "type": "custom",
    "conditions": {
      "customScript": "./detectors/high-frequency-detector.js",
      "params": {
        "frequencyThreshold": 3,
        "checkDomains": ["mcp-configuration", "mcp-build", "mcp-testing"]
      }
    }
  },
  "action": "queue_to_external_brain",
  "priority": "high",
  "metadata": {
    "mcp": "learning-optimizer",
    "suggestedActions": [
      "Run optimize_knowledge_base()",
      "Promote to preventive check",
      "Update relevant checklist"
    ]
  }
}
```

#### Queue Consumption

**Workflow:** Troubleshooting queue items

**Processing Logic:**
```javascript
// At checkpoint: /start or task completion
async function processQueueWithLearningOptimizer(queueItem) {
  // 1. Track issue to domain file
  const result = await mcp__learning_optimizer__track_issue({
    domain: queueItem.metadata.domain,
    title: queueItem.title,
    symptom: extractSymptom(queueItem.context),
    solution: extractSolution(queueItem.context),
    root_cause: analyzeRootCause(queueItem.context),
    prevention: suggestPrevention(queueItem.context),
    context: {
      duration: queueItem.context.duration,
      commands: queueItem.context.commands,
      files: queueItem.context.files
    }
  })

  // 2. Check if optimization triggered
  const triggers = await mcp__learning_optimizer__check_optimization_triggers({
    domain: queueItem.metadata.domain
  })

  if (triggers.triggered) {
    // 3. Run optimization
    const optimization = await mcp__learning_optimizer__optimize_knowledge_base({
      domain: queueItem.metadata.domain
    })

    // 4. If promoted, update checklist
    if (optimization.promotedIssues.length > 0) {
      await updateChecklist(queueItem.metadata.checklist, optimization.promotedIssues)
    }
  }

  // 5. Mark queue item as processed
  return { status: 'processed', result }
}
```

**Integration Benefits:**
- Automatic issue logging without AI forgetting
- Pattern-based optimization triggers
- Compounding prevention success rates
- Zero manual tracking required

---

### 2. project-management MCP

**Role:** Creates goals from complex queue items that require planning

**Integration Type:** ✅ Queue consumption + Workflow orchestration

#### Pattern Registration

project-management can register patterns for:
- Complex issues requiring multi-step resolution
- Feature gaps detected during operations
- Enhancement opportunities

**Example Pattern:**
```json
{
  "id": "project-management-capability-gap",
  "name": "Capability Gap Detected",
  "workflow": "troubleshooting",
  "trigger": {
    "type": "composite",
    "conditions": {
      "operator": "AND",
      "triggers": [
        {
          "type": "duration",
          "conditions": { "threshold": 900 }
        },
        {
          "type": "error_pattern",
          "conditions": {
            "errorPattern": "Tool not found|Method not implemented|Feature not available"
          }
        }
      ]
    }
  },
  "action": "queue_to_external_brain",
  "priority": "high",
  "metadata": {
    "mcp": "project-management",
    "suggestedActions": [
      "Create enhancement goal",
      "Evaluate impact and effort",
      "Promote to selected goals if high priority"
    ]
  }
}
```

#### Queue Consumption

**Workflow:** Complex troubleshooting items requiring planning

**Processing Logic:**
```javascript
async function processQueueWithProjectManagement(queueItem) {
  // 1. Determine if issue requires goal creation
  const complexity = evaluateComplexity(queueItem.context)

  if (complexity === 'high' || queueItem.context.duration > 900) {
    // Complex issue → Create goal

    // 2. Create potential goal
    const goal = await mcp__project_management__create_potential_goal({
      projectPath: detectProjectPath(queueItem.context),
      goalName: `fix-${kebabCase(queueItem.title)}`,
      goalDescription: queueItem.description,
      requirements: extractRequirements(queueItem.context),
      tags: [queueItem.workflow, queueItem.metadata.domain]
    })

    // 3. Evaluate goal
    const evaluation = await mcp__project_management__evaluate_goal({
      projectPath: detectProjectPath(queueItem.context),
      goalName: goal.goalName,
      effort: estimateEffort(queueItem.context),
      impact: estimateImpact(queueItem.context),
      priority: queueItem.priority
    })

    // 4. If high priority, promote to selected
    if (evaluation.priority === 'high') {
      await mcp__project_management__promote_to_selected({
        projectPath: detectProjectPath(queueItem.context),
        goalName: goal.goalName
      })

      // 5. Handoff to task-executor or spec-driven
      return await handoffForExecution(goal)
    }

    return { status: 'goal_created', goal }
  } else {
    // Simple issue → Direct to task-executor
    return await processWithTaskExecutor(queueItem)
  }
}
```

**Integration Benefits:**
- Automatic goal creation for complex issues
- Impact/effort evaluation based on context
- Seamless handoff to execution
- Tracking of enhancement requests

---

### 3. task-executor MCP

**Role:** Executes fixes and enhancements from queue items

**Integration Type:** ✅ Queue consumption + Workflow execution

#### Queue Consumption

**Workflow:** Direct execution of simple fixes

**Processing Logic:**
```javascript
async function processQueueWithTaskExecutor(queueItem) {
  // 1. Extract tasks from queue item
  const tasks = extractTasks(queueItem.context, queueItem.metadata.suggestedActions)

  // 2. Create workflow
  const workflow = await mcp__task_executor__create_workflow({
    projectPath: detectProjectPath(queueItem.context),
    workflowName: `fix-${queueItem.id}`,
    description: queueItem.description,
    tasks: tasks.map(task => ({
      id: task.id,
      description: task.description,
      status: 'pending',
      verification: task.verification
    }))
  })

  // 3. Execute tasks sequentially
  for (const task of tasks) {
    // AI performs the task
    await performTask(task)

    // Mark as complete with verification
    await mcp__task_executor__complete_task({
      projectPath: detectProjectPath(queueItem.context),
      workflowName: workflow.workflowName,
      taskId: task.id,
      notes: `Resolved from queue item ${queueItem.id}`,
      verification: {
        method: 'automated',
        passed: await verifyTaskCompletion(task)
      }
    })
  }

  // 4. Archive workflow
  await mcp__task_executor__archive_workflow({
    projectPath: detectProjectPath(queueItem.context),
    workflowName: workflow.workflowName
  })

  return { status: 'executed', workflow }
}
```

**Integration Benefits:**
- Structured execution of fixes
- Automatic verification of completion
- Progress tracking across sessions
- Workflow history for analytics

---

### 4. testing-validation MCP

**Role:** Registers patterns for missing tests, validates fixes from queue

**Integration Type:** ✅ Pattern registration + Queue consumption

#### Pattern Registration

**Example Pattern:**
```json
{
  "id": "testing-validation-missing-tests",
  "name": "Missing Test Coverage",
  "workflow": "testing",
  "trigger": {
    "type": "composite",
    "conditions": {
      "operator": "AND",
      "triggers": [
        {
          "type": "file_change",
          "conditions": {
            "filePattern": "**/src/**/*.{ts,js}",
            "changeType": "create",
            "window": 3600
          }
        },
        {
          "type": "file_change",
          "conditions": {
            "filePattern": "**/__tests__/**/*.{ts,js}",
            "changeType": "create",
            "window": 3600,
            "negate": true
          }
        }
      ]
    }
  },
  "action": "queue_to_external_brain",
  "priority": "medium",
  "metadata": {
    "mcp": "testing-validation",
    "suggestedActions": [
      "Review new feature code",
      "Write unit tests",
      "Run test suite with run_mcp_tests()"
    ]
  }
}
```

#### Queue Consumption

**Workflow:** Validate fixes from troubleshooting queue before marking as resolved

**Processing Logic:**
```javascript
async function validateQueueItemResolution(queueItem) {
  // After AI fixes issue from queue, validate with testing-validation

  const projectPath = detectProjectPath(queueItem.context)

  // 1. Run tests
  const tests = await mcp__testing_validation__run_mcp_tests({
    mcpServerPath: projectPath
  })

  if (!tests.passed) {
    // Reopen queue item - fix didn't work
    return { status: 'validation_failed', tests }
  }

  // 2. Validate implementation standards
  const validation = await mcp__testing_validation__validate_mcp_implementation({
    mcpServerPath: projectPath
  })

  if (validation.criticalViolations > 0) {
    return { status: 'standards_violated', validation }
  }

  // 3. Check quality gates
  const gates = await mcp__testing_validation__check_quality_gates({
    mcpServerPath: projectPath
  })

  if (!gates.readyForRollout) {
    return { status: 'gates_failed', gates }
  }

  // All validations passed - resolution confirmed
  return { status: 'validated', tests, validation, gates }
}
```

**Integration Benefits:**
- Proactive test coverage monitoring
- Automatic validation before marking issues resolved
- Quality gate enforcement
- Prevent incomplete fixes

---

### 5. security-compliance MCP

**Role:** Registers security patterns, validates fixes don't introduce vulnerabilities

**Integration Type:** ✅ Pattern registration + Queue consumption

#### Pattern Registration

**Example Pattern:**
```json
{
  "id": "security-credential-usage",
  "name": "Credential Usage Detected",
  "workflow": "security",
  "trigger": {
    "type": "file_change",
    "conditions": {
      "filePattern": "**/*.{ts,js,json,env}",
      "changeType": "edit",
      "window": 60
    },
    "postCondition": {
      "type": "content_scan",
      "pattern": "password|api[_-]?key|secret|token|credential"
    }
  },
  "action": "queue_to_external_brain",
  "priority": "critical",
  "metadata": {
    "mcp": "security-compliance",
    "suggestedActions": [
      "Scan with scan_for_credentials()",
      "Check if allowlisted",
      "Move to secure secret management"
    ]
  }
}
```

#### Queue Consumption

**Workflow:** Security validation during queue processing

**Processing Logic:**
```javascript
async function validateQueueItemSecurity(queueItem) {
  // Before marking queue item as resolved, scan for security issues

  const projectPath = detectProjectPath(queueItem.context)

  // 1. Scan for credentials
  const credScan = await mcp__security_compliance__scan_for_credentials({
    directoryPath: projectPath,
    scanOptions: {
      includePatterns: ["**/*.{ts,js,json,env}"],
      respectGitignore: true
    }
  })

  if (credScan.findings.length > 0) {
    // Security issue found
    return { status: 'security_issue', findings: credScan.findings }
  }

  // 2. Scan for PHI (if medical project)
  const phiScan = await mcp__security_compliance__scan_for_phi({
    directoryPath: projectPath,
    scanOptions: {
      includePatterns: ["**/*.{ts,js,json}"]
    }
  })

  if (phiScan.findings.length > 0) {
    return { status: 'phi_violation', findings: phiScan.findings }
  }

  // Security validation passed
  return { status: 'secure' }
}
```

**Integration Benefits:**
- Proactive security monitoring
- Automatic credential scanning after fixes
- PHI detection in medical contexts
- Security gate enforcement

---

### 6. mcp-config-manager

**Role:** Registers configuration patterns, validates config changes from queue

**Integration Type:** ✅ Pattern registration + Queue consumption

#### Pattern Registration

**Example Pattern:**
```json
{
  "id": "mcp-config-duplicate-registration",
  "name": "Duplicate MCP Registration",
  "workflow": "troubleshooting",
  "trigger": {
    "type": "file_change",
    "conditions": {
      "filePattern": "**/.mcp.json",
      "changeType": "edit",
      "window": 60
    },
    "postCondition": {
      "type": "custom",
      "script": "./detectors/duplicate-mcp-detector.js"
    }
  },
  "action": "queue_to_external_brain",
  "priority": "high",
  "metadata": {
    "mcp": "mcp-config-manager",
    "domain": "mcp-configuration",
    "suggestedActions": [
      "Run sync_mcp_configs()",
      "Check for duplicates",
      "Validate JSON syntax"
    ]
  }
}
```

#### Queue Consumption

**Workflow:** Configuration validation during queue processing

**Processing Logic:**
```javascript
async function validateQueueItemConfig(queueItem) {
  // After config changes from queue processing, validate

  // 1. Sync and validate all MCP configs
  const sync = await mcp__mcp_config_manager__sync_mcp_configs({
    workspaceRoot: process.env.PROJECT_ROOT
  })

  if (sync.errors.length > 0) {
    return { status: 'config_errors', errors: sync.errors }
  }

  // 2. List all registered MCPs
  const mcps = await mcp__mcp_config_manager__list_mcp_servers()

  // 3. Check for duplicates
  const duplicates = findDuplicates(mcps)
  if (duplicates.length > 0) {
    return { status: 'duplicates_found', duplicates }
  }

  // Configuration validated
  return { status: 'validated', mcps }
}
```

**Integration Benefits:**
- Proactive configuration validation
- Duplicate detection before errors occur
- Automatic config sync after changes
- Prevention of configuration issues

---

## Pattern Registration by MCPs

### How MCPs Register Patterns

Each MCP can extend the pattern registry by providing a pattern definition file:

**Location:**
```
local-instances/tools/workspace-activity-monitor/patterns/
├── learning-optimizer-patterns.json
├── project-management-patterns.json
├── testing-validation-patterns.json
├── security-compliance-patterns.json
└── [mcp-name]-patterns.json
```

### Pattern Definition Template

```json
{
  "mcp": "your-mcp-name",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "your-mcp-pattern-id",
      "name": "Human Readable Pattern Name",
      "version": "1.0.0",
      "workflow": "troubleshooting|documentation|testing|deployment|optimization|security",
      "trigger": {
        "type": "duration|command_sequence|command_count|file_change|error_pattern|composite",
        "conditions": {
          // Type-specific conditions
        }
      },
      "action": "queue_to_external_brain",
      "priority": "critical|high|medium|low",
      "cooldown": 300,
      "metadata": {
        "mcp": "your-mcp-name",
        "domain": "your-domain",
        "checklist": "path/to/checklist.md",
        "suggestedActions": [
          "Action 1 using your MCP",
          "Action 2 using your MCP",
          "Action 3 using your MCP"
        ],
        "description": "What this pattern detects",
        "estimatedTimeToResolve": 10
      }
    }
  ]
}
```

### Registration Process

**Option 1: Static Registration (Recommended)**

1. Create pattern file in `patterns/` directory
2. Background monitor loads on startup
3. Patterns automatically active

**Option 2: Dynamic Registration (Future)**

```javascript
// MCP can register patterns at runtime
await mcp__workspace_activity_monitor__register_pattern({
  pattern: {
    id: "dynamic-pattern-id",
    name: "Dynamic Pattern",
    // ... rest of pattern definition
  }
})
```

### Custom Detectors

For complex detection logic, MCPs can provide custom detector scripts:

```javascript
// patterns/custom-detectors/my-mcp-detector.js
module.exports = function(activity, params) {
  // Custom detection logic
  const relevantActivity = activity.filter(a =>
    a.action === params.actionType &&
    a.context === params.contextMatch
  )

  const detected = relevantActivity.length >= params.threshold

  return {
    matched: detected,
    context: {
      count: relevantActivity.length,
      activities: relevantActivity
    }
  }
}
```

Reference in pattern:
```json
{
  "trigger": {
    "type": "custom",
    "conditions": {
      "customScript": "./custom-detectors/my-mcp-detector.js",
      "params": {
        "actionType": "bash",
        "contextMatch": "my-mcp-operation",
        "threshold": 3
      }
    }
  }
}
```

---

## Queue Consumption by MCPs

### Queue Item Structure

MCPs receive queue items in this format:

```markdown
---
id: 2025-10-29-001
workflow: troubleshooting
pattern_id: your-pattern-id
priority: high
created: 2025-10-29T10:30:00Z
status: pending
estimated_time_to_resolve: 5
---

# Issue Detected: [Pattern Name]

**Pattern:** your-pattern-id (v1.0.0)
**Description:** What was detected
**Context:** Additional context

## Detected Activity

[Activity log excerpt]

## Suggested Actions

1. Action 1 using your MCP
2. Action 2 using your MCP
3. Action 3 using your MCP

**Status:** Needs processing at next checkpoint
```

### Processing at Checkpoints

**Checkpoint 1: /start command**

```javascript
// AI runs this at session start
async function processExternalBrainOnStart() {
  // 1. Check all workflow queues
  const workflows = ['troubleshooting', 'documentation', 'testing', 'deployment']

  for (const workflow of workflows) {
    const summaryPath = `external-brain/${workflow}-queue/SUMMARY.md`

    if (!fileExists(summaryPath)) continue

    const summary = readFile(summaryPath)
    const pendingCount = extractPendingCount(summary)

    if (pendingCount === 0) continue

    console.log(`Processing ${pendingCount} pending ${workflow} items...`)

    // 2. Get pending items sorted by priority
    const items = getPendingItems(workflow)

    // 3. Process each item with appropriate MCP
    for (const item of items) {
      await processQueueItem(item)
    }
  }
}
```

**Checkpoint 2: Task completion**

```javascript
// AI runs this after completing task-executor workflows
async function processExternalBrainAfterTask() {
  // Check queue for new items since task started
  const newItems = getQueueItemsSince(taskStartTime)

  if (newItems.length > 0) {
    console.log(`Processing ${newItems.length} items detected during task...`)

    for (const item of newItems) {
      await processQueueItem(item)
    }
  }
}
```

### MCP-Specific Processing

**Routing Logic:**

```javascript
async function processQueueItem(item) {
  // Route to appropriate MCP based on workflow and metadata

  if (item.metadata.mcp) {
    // Explicit MCP specified
    return await processWith(item.metadata.mcp, item)
  }

  // Infer MCP from workflow
  if (item.workflow === 'troubleshooting') {
    return await processWithLearningOptimizer(item)
  } else if (item.workflow === 'documentation') {
    return await processWithDocumentationMCP(item)
  } else if (item.workflow === 'testing') {
    return await processWithTestingValidation(item)
  } else if (item.workflow === 'security') {
    return await processWithSecurityCompliance(item)
  }

  // Default: create goal with project-management
  return await processWithProjectManagement(item)
}
```

---

## Workflow Orchestration

### Complex Multi-MCP Workflows

Many queue items require multiple MCPs to fully resolve. The project-management MCP orchestrates these workflows.

### Example: Configuration Issue Resolution

```
1. Queue Item Detected: "Configuration Error - MCP Registration Failed"
   ↓
2. AI reads at /start checkpoint
   ↓
3. learning-optimizer tracks issue
   ↓ (if high priority)
4. project-management creates goal
   ↓
5. task-executor creates workflow:
   - Task 1: Fix configuration
   - Task 2: Validate with mcp-config-manager
   - Task 3: Test with testing-validation
   - Task 4: Update checklist if promoted
   ↓
6. AI executes tasks using respective MCPs
   ↓
7. testing-validation validates fix
   ↓
8. security-compliance scans for issues
   ↓
9. Mark queue item as processed → archived/
   ↓
10. Update SUMMARY.md with success
```

### Example: Feature Enhancement from Queue

```
1. Queue Item Detected: "Capability Gap - Missing Export Tool"
   ↓
2. AI reads at checkpoint
   ↓
3. project-management evaluates complexity
   ↓ (complex)
4. spec-driven creates specification
   ↓
5. task-executor creates implementation workflow
   ↓
6. AI implements feature
   ↓
7. testing-validation validates
   ↓
8. AI rolls out to production
   ↓
9. Mark queue item as processed
   ↓
10. learning-optimizer tracks as enhancement
```

---

## Examples & Use Cases

### Use Case 1: Automatic Issue Logging

**Scenario:** AI troubleshoots a configuration error for 12 minutes but forgets to log it.

**Without workspace-activity-monitor:**
- Issue resolved but not logged
- No learning for future builds
- Time wasted on same issue again

**With workspace-activity-monitor:**
```
1. AI troubleshoots (12 min, multiple diagnostics, config change)
   ↓
2. AI logs activity to .workspace-activity.jsonl
   ↓
3. Background monitor detects "troubleshooting-time-threshold" pattern
   ↓
4. Writes to external-brain/troubleshooting-queue/
   ↓
5. AI finishes fix, session ends
   ↓
6. Next session: /start checks queue
   ↓
7. AI sees pending item: "Time Threshold Exceeded - 12 min troubleshooting"
   ↓
8. AI processes with learning-optimizer:
   - Logs to troubleshooting/configuration-issues.md
   - Checks optimization triggers
   - Promotes to checklist if frequency >= 3
   ↓
9. Mark as processed, archive
```

**Result:** Issue logged automatically, no forgetting, continuous improvement.

---

### Use Case 2: Proactive Test Coverage

**Scenario:** AI implements new feature but doesn't write tests.

**Pattern Registered by testing-validation MCP:**
```json
{
  "id": "testing-missing-coverage",
  "workflow": "testing",
  "trigger": {
    "type": "composite",
    "conditions": {
      "operator": "AND",
      "triggers": [
        { "type": "file_change", "conditions": { "filePattern": "**/src/**/*.ts", "changeType": "create" } },
        { "type": "file_change", "conditions": { "filePattern": "**/__tests__/**/*.ts", "changeType": "create", "negate": true } }
      ]
    }
  }
}
```

**Flow:**
```
1. AI creates new file: src/new-feature.ts
   ↓
2. AI logs activity
   ↓
3. Background monitor detects "testing-missing-coverage" pattern
   ↓
4. Writes to external-brain/testing-queue/
   ↓
5. AI completes task, checkpoint triggered
   ↓
6. AI sees pending item: "Missing Test Coverage - new-feature.ts"
   ↓
7. AI processes with testing-validation:
   - Creates __tests__/new-feature.test.ts
   - Runs test suite
   - Validates coverage
   ↓
8. Mark as processed
```

**Result:** Automatic test coverage reminder, no gaps in test suite.

---

### Use Case 3: Security Credential Detection

**Scenario:** AI accidentally adds API key to code.

**Pattern Registered by security-compliance MCP:**
```json
{
  "id": "security-credential-addition",
  "workflow": "security",
  "trigger": {
    "type": "file_change",
    "conditions": { "filePattern": "**/*.{ts,js}", "changeType": "edit" },
    "postCondition": { "type": "content_scan", "pattern": "api[_-]?key|secret|password" }
  },
  "priority": "critical"
}
```

**Flow:**
```
1. AI edits file, adds line: `const apiKey = "sk-123..."`
   ↓
2. AI logs activity
   ↓
3. Background monitor detects "security-credential-addition" pattern
   ↓
4. Writes to external-brain/security-queue/ (CRITICAL priority)
   ↓
5. Next checkpoint (immediate if critical)
   ↓
6. AI sees pending item: "Credential Usage Detected"
   ↓
7. AI processes with security-compliance:
   - Scans file with scan_for_credentials()
   - Removes credential from code
   - Adds to secure secret management
   - Updates .gitignore if needed
   ↓
8. Mark as processed
```

**Result:** Automatic security enforcement, credentials never committed.

---

### Use Case 4: Documentation Sync

**Scenario:** Code changes but docs not updated.

**Pattern Registered by documentation MCP (future):**
```json
{
  "id": "docs-out-of-sync",
  "workflow": "documentation",
  "trigger": {
    "type": "composite",
    "conditions": {
      "operator": "AND",
      "triggers": [
        { "type": "file_change", "conditions": { "filePattern": "**/src/**/*.ts", "window": 3600 } },
        { "type": "file_change", "conditions": { "filePattern": "**/*.md", "window": 3600, "negate": true } }
      ]
    }
  }
}
```

**Flow:**
```
1. AI modifies API endpoint code
   ↓
2. Background monitor detects docs didn't change
   ↓
3. Writes to external-brain/documentation-queue/
   ↓
4. Next checkpoint
   ↓
5. AI sees: "Documentation Out of Sync"
   ↓
6. AI processes:
   - Reviews code changes
   - Identifies impacted docs
   - Updates documentation
   ↓
7. Mark as processed
```

**Result:** Documentation always stays in sync with code.

---

## Implementation Guidelines

### For MCP Developers

**To integrate your MCP with workspace-activity-monitor:**

1. **Identify Patterns Your MCP Should Detect**
   - What activities indicate your MCP should be used?
   - What errors or issues does your MCP help resolve?
   - What proactive checks can your MCP perform?

2. **Define Pattern Specifications**
   - Create `patterns/[your-mcp]-patterns.json`
   - Use appropriate trigger types
   - Set reasonable priorities and cooldowns
   - Include helpful metadata

3. **Implement Queue Processing**
   - Define how your MCP processes queue items
   - What tools does your MCP call?
   - What validation does your MCP perform?
   - What outputs indicate success/failure?

4. **Test Pattern Detection**
   - Simulate activities that should trigger your patterns
   - Verify queue items are created correctly
   - Test queue processing with your MCP
   - Validate end-to-end workflow

5. **Document Integration**
   - Add your MCP to this integration guide
   - Document example workflows
   - Provide troubleshooting tips
   - Include code examples

### For AI Assistants

**To use workspace-activity-monitor effectively:**

1. **Log Activity Consistently**
   - After every significant bash command
   - After every file modification
   - After every error encountered
   - Include context (reason, duration, outcome)

2. **Check Queue at Checkpoints**
   - At /start command (always)
   - After task-executor workflow completion
   - Before major operations (rollout, commit)
   - When explicitly reminded by user

3. **Process Queue Items Thoroughly**
   - Read full queue item context
   - Use suggested actions as starting point
   - Engage appropriate MCPs
   - Validate resolution before archiving

4. **Update Queue Status**
   - Mark items as processed after completion
   - Move to archived/ directory
   - Update SUMMARY.md statistics
   - Track time saved and outcomes

5. **Continuous Improvement**
   - Suggest new patterns when repetitive activities detected
   - Propose optimizations to existing patterns
   - Document lessons learned
   - Update integration guide with new use cases

---

## Future Enhancements

### Phase 1: Core Integrations (Current)
- ✅ learning-optimizer integration
- ✅ project-management integration
- ✅ task-executor integration
- ✅ testing-validation integration
- ✅ security-compliance integration

### Phase 2: Extended Integrations
- [ ] documentation MCP integration
- [ ] git-assistant integration for commit patterns
- [ ] smart-file-organizer for file organization patterns
- [ ] communications MCP for notification patterns

### Phase 3: Advanced Features
- [ ] Dynamic pattern registration via MCP tool
- [ ] Pattern analytics and effectiveness tracking
- [ ] Machine learning for pattern optimization
- [ ] Real-time pattern suggestions
- [ ] Multi-workspace pattern sharing

### Phase 4: Autonomous Workflows
- [ ] Auto-resolution for known patterns
- [ ] Predictive pattern detection
- [ ] Proactive suggestions before issues occur
- [ ] Self-optimizing patterns based on success rates

---

## Related Documents

- **SYSTEM-ARCHITECTURE.md** - Overall system architecture
- **pattern-registry-spec.md** - Pattern registry technical specification
- **WORKSPACE_GUIDE.md** - AI workflow guide
- **troubleshooting/README.md** - Troubleshooting system guide
- **PRODUCTION-FEEDBACK-LOOP.md** - Production feedback loop

---

**Version:** 1.0.0
**Created:** 2025-10-29
**Status:** Active - Core integrations designed
**Next Steps:** Implement Phase 1 integrations during workspace-activity-monitor development
