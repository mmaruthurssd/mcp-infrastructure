---
type: specification
tags: [handoff-protocol, mcp-communication, v1.0.0, integration]
---

# MCP Handoff Protocol Specification v1.0.0

**Status:** Active
**Version:** 1.0.0
**Last Updated:** 2025-10-27
**Authors:** Project Management MCP Server Team

---

## Executive Summary

The MCP Handoff Protocol defines how Project Management MCP, Spec-Driven MCP, and Task Executor MCP communicate to enable seamless hierarchical planning workflows. This protocol provides formal JSON schemas, error handling, retry logic, and atomic operation guarantees for all inter-MCP communication.

**Key Features:**
- 5 standardized handoff types
- JSON-based payload format
- Automatic validation with Zod schemas
- Retry logic with exponential backoff
- Atomic all-or-nothing operations
- Comprehensive audit trail
- Version-aware for future evolution

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Handoff Types](#handoff-types)
3. [Payload Specifications](#payload-specifications)
4. [Error Handling](#error-handling)
5. [Retry Strategy](#retry-strategy)
6. [Atomic Operations](#atomic-operations)
7. [Audit Trail](#audit-trail)
8. [Implementation Guide](#implementation-guide)
9. [Examples](#examples)

---

## Architecture Overview

### MCP Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│                   Project Management MCP                        │
│  Owns: PROJECT OVERVIEW, Components, Major Goals        │
│  Creates: goal-to-spec handoffs                         │
│  Receives: subgoal-completion, progress-update          │
└─────────────────────────────────────────────────────────┘
                         ↓ goal-to-spec
                         ↑ subgoal-completion
┌─────────────────────────────────────────────────────────┐
│                   Spec-Driven MCP                        │
│  Owns: Sub-Goals, Specifications                        │
│  Creates: spec-to-tasks, subgoal-completion             │
│  Receives: goal-to-spec, task-completion                │
└─────────────────────────────────────────────────────────┘
                         ↓ spec-to-tasks
                         ↑ task-completion
┌─────────────────────────────────────────────────────────┐
│                   Task Executor MCP                      │
│  Owns: Task Workflows, Individual Tasks                 │
│  Creates: task-completion, progress-update              │
│  Receives: spec-to-tasks                                │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Goal Decomposition:** AI Planning → Spec-Driven → Task Executor
2. **Progress Aggregation:** Task Executor → Spec-Driven → AI Planning
3. **Bidirectional Updates:** Progress updates can flow in either direction

---

## Handoff Types

### 1. goal-to-spec (AI Planning → Spec-Driven)

**Purpose:** Decompose a major goal into sub-goals with specifications

**Triggered when:** User promotes a major goal and wants tactical planning

**Payload includes:**
- Major goal context (ID, name, priority, impact, effort)
- Problem statement and expected value
- Success criteria and acceptance criteria
- Dependencies and risks
- Component context
- Target file paths for sub-goals

**Expected outcome:** Spec-Driven creates 3-5 sub-goals with specifications

---

### 2. spec-to-tasks (Spec-Driven → Task Executor)

**Purpose:** Create executable task workflow from a sub-goal specification

**Triggered when:** Spec-Driven has created sub-goal specs and needs execution plan

**Payload includes:**
- Sub-goal identification and parent goal reference
- Specification details (acceptance criteria, deliverables)
- Task guidance (estimated count, complexity)
- Timeframe and urgency
- Target workflow folder path

**Expected outcome:** Task Executor creates workflow with 5-10 tasks

---

### 3. task-completion (Task Executor → Spec-Driven)

**Purpose:** Update sub-goal progress when tasks complete

**Triggered when:** A task or entire workflow is completed

**Payload includes:**
- Workflow identification
- Completion details (which task, completion time)
- Progress update (tasks completed, percentage)
- Verification status
- Deliverables created
- Issues encountered

**Expected outcome:** Spec-Driven updates sub-goal progress, checks if sub-goal complete

---

### 4. subgoal-completion (Spec-Driven → AI Planning)

**Purpose:** Update major goal progress when sub-goal completes

**Triggered when:** A sub-goal and all its workflows are completed

**Payload includes:**
- Sub-goal identification
- Completion details (all criteria met status)
- Major goal progress calculation
- Outcomes (deliverables, success criteria met)
- Quality metrics (tests, code review)

**Expected outcome:** AI Planning updates major goal progress, checks if goal complete

---

### 5. progress-update (Any → Parent)

**Purpose:** General progress update that bubbles up the hierarchy

**Triggered when:** Progress changes at any level

**Payload includes:**
- Entity being updated (type, ID, name)
- Progress snapshot (percentage, status)
- Trigger event (what caused update)
- Propagation info (should bubble up?)

**Expected outcome:** Parent entity updates its aggregated progress

---

## Payload Specifications

### Base Handoff Structure

```typescript
{
  // Protocol metadata
  version: "1.0.0",              // Semantic version
  handoffId: "uuid",             // Unique identifier
  timestamp: "2025-10-27T10:00:00Z", // ISO 8601

  // Routing
  sourceMCP: "ai-planning" | "spec-driven" | "task-executor",
  targetMCP: "ai-planning" | "spec-driven" | "task-executor",
  handoffType: "goal-to-spec" | ...,

  // Context
  context: {
    projectPath: "/absolute/path/to/project",
    projectId: "project-id",
    componentId: "component-id",
    componentName: "Component Name",
    majorGoalId?: "001",
    majorGoalName?: "Goal Name",
    subGoalId?: "1.1",
    workflowId?: "wf-001"
  },

  // Type-specific payload
  payload: { ... },

  // Error handling
  retryAttempt?: 0,
  maxRetries?: 3,
  previousHandoffId?: "uuid"
}
```

### Response Structure

```typescript
{
  handoffId: "uuid",
  receivedAt: "2025-10-27T10:00:01Z",
  success: true | false,
  status: "accepted" | "processing" | "completed" | "failed" | "rejected",

  result?: {
    created: [
      { entityType: "sub-goal", entityId: "1.1", filePath: "..." }
    ],
    updated: [
      { entityType: "major-goal", entityId: "001", changes: ["progress"] }
    ],
    nextSteps: [
      { description: "...", suggestedAction: "..." }
    ]
  },

  error?: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: "...",
    recoverable: true | false,
    suggestedFix?: "..."
  },

  processedBy: "spec-driven",
  processingTime?: 1234
}
```

---

## Error Handling

### Error Classification

**Non-Recoverable Errors (Do NOT retry):**
- `VALIDATION_FAILED` - Schema validation failed
- `SCHEMA_INVALID` - Malformed JSON
- `CONTEXT_MISMATCH` - Context doesn't match project
- `PERMISSION_DENIED` - File system permission error

**Recoverable Errors (SHOULD retry):**
- `FILE_WRITE_ERROR` - Temporary file system issue
- `MCP_UNAVAILABLE` - Target MCP not responding
- `MCP_TIMEOUT` - Operation timed out
- `NETWORK_ERROR` - Network connectivity issue
- `SYSTEM_OVERLOAD` - System temporarily overloaded

### Error Response Format

```json
{
  "code": "MCP_TIMEOUT",
  "message": "Handoff processing timed out after 60 seconds",
  "details": "Spec-Driven MCP did not respond within timeout window",
  "recoverable": true,
  "suggestedFix": "Retry with increased timeout or check MCP health"
}
```

---

## Retry Strategy

### Exponential Backoff Configuration

```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,    // 1 second
  maxDelayMs: 30000,       // 30 seconds
  backoffMultiplier: 2,
  timeoutMs: 60000         // 1 minute per attempt
}
```

### Retry Schedule

| Attempt | Delay (seconds) | Cumulative Time |
|---------|-----------------|-----------------|
| 1       | 0               | 0s              |
| 2       | 1 + jitter      | 1s              |
| 3       | 2 + jitter      | 3s              |
| 4       | 4 + jitter      | 7s              |

**Jitter:** ±10% random variation to prevent thundering herd

### Circuit Breaker

After 5 consecutive failures, circuit opens:
- **OPEN:** Reject immediately, no retry
- **HALF_OPEN:** After 30s timeout, allow test request
- **CLOSED:** If test succeeds, resume normal operation

---

## Atomic Operations

### All-or-Nothing Guarantee

Every handoff operation is atomic:
1. **Begin Transaction:** Create temp directory
2. **Execute Operations:** Write to temp files
3. **Commit:** Atomic rename to final locations
4. **Rollback on Error:** Restore previous state

### Two-Phase Commit

For distributed operations involving multiple MCPs:

**Phase 1: Prepare**
- Ask all participants: "Can you commit?"
- If ANY says no → Abort all
- If ALL say yes → Proceed to Phase 2

**Phase 2: Commit**
- Tell all participants: "Commit now"
- All commit simultaneously
- If failure → Manual intervention required

---

## Audit Trail

### Event Types Logged

1. `handoff_created` - Handoff instantiated
2. `handoff_sent` - Handoff transmitted
3. `handoff_received` - Handoff received by target
4. `handoff_validated` - Schema validation result
5. `handoff_processing` - Processing started
6. `handoff_completed` - Processing finished
7. `handoff_failed` - Processing failed
8. `handoff_retry` - Retry attempt
9. `handoff_rollback` - Transaction rolled back

### Audit Log Format

Stored as NDJSON (newline-delimited JSON) with daily rotation:
- Location: `{projectPath}/.mcp-handoffs/audit/handoff-audit-YYYY-MM-DD.ndjson`
- Retention: 90 days (configurable)
- Buffered writes: 100 entries before flush

### Queryable Metrics

- Handoff success rate
- Average processing time
- Retry rate by handoff type
- Error frequency by code
- Performance trends over time

---

## Implementation Guide

### Sending a Handoff

```typescript
import { createGoalToSpecHandoff, sendHandoff } from './handoff-sender';

// 1. Create handoff
const handoff = createGoalToSpecHandoff(context, payload);

// 2. Log creation
await auditLogger.logHandoffCreated(handoff);

// 3. Send with retry
const result = await sendHandoff(projectPath, handoff);

// 4. Log result
await auditLogger.logHandoffSent(handoff, result);
```

### Receiving a Handoff

```typescript
import { findPendingHandoffs, validateHandoff, createSuccessResponse } from './handoff-receiver';

// 1. Find pending handoffs for this MCP
const pending = await findPendingHandoffs(projectPath, 'spec-driven', 'goal-to-spec');

for (const { filePath, handoff } of pending) {
  // 2. Log receipt
  await auditLogger.logHandoffReceived(handoff);

  // 3. Validate
  const validation = validateHandoff(handoff);
  await auditLogger.logHandoffValidation(handoff, validation);

  if (!validation.valid) {
    const error = createErrorResponse(handoff.handoffId, 'spec-driven', {
      code: 'VALIDATION_FAILED',
      message: validation.errors.join(', '),
      recoverable: false
    });
    await auditLogger.logHandoffCompleted(handoff, error);
    continue;
  }

  // 4. Process
  const result = await processHandoff(handoff);

  // 5. Respond
  const response = createSuccessResponse(handoff.handoffId, 'spec-driven', result);
  await auditLogger.logHandoffCompleted(handoff, response);
}
```

### Using Atomic Operations

```typescript
import { executeAtomicHandoff, AtomicTransaction } from './handoff-atomic';

const result = await executeAtomicHandoff(
  projectPath,
  handoff,
  async (tx: AtomicTransaction) => {
    // All operations are atomic
    await tx.createFile('sub-goals/1.1/SPECIFICATION.md', specContent);
    await tx.createFile('sub-goals/1.2/SPECIFICATION.md', specContent2);
    await tx.updateFile('GOAL-STATUS.md', updatedStatus);

    return { subGoalsCreated: 2 };
  }
);

if (!result.success) {
  // Automatic rollback occurred
  console.error('Handoff failed:', result.error);
}
```

---

## Examples

### Example 1: Goal-to-Spec Handoff

```json
{
  "version": "1.0.0",
  "handoffId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-10-27T14:30:00Z",
  "sourceMCP": "ai-planning",
  "targetMCP": "spec-driven",
  "handoffType": "goal-to-spec",
  "context": {
    "projectPath": "/projects/operations-workspace",
    "projectId": "project-management-mcp",
    "componentId": "data-model-architecture",
    "componentName": "Data Model & Architecture",
    "majorGoalId": "001",
    "majorGoalName": "Design Hierarchical Data Model"
  },
  "payload": {
    "majorGoal": {
      "id": "001",
      "name": "Design Hierarchical Data Model",
      "description": "Create TypeScript interfaces for 7-level hierarchy",
      "priority": "high",
      "tier": "now",
      "impact": "high",
      "effort": "medium"
    },
    "details": {
      "problem": "Need formal data structures for hierarchical planning",
      "expectedValue": "Type-safe interfaces enable robust MCP integration",
      "successCriteria": [
        "All 7 entity types defined",
        "Validation schemas created",
        "Documentation complete"
      ]
    },
    "dependencies": [],
    "risks": [],
    "componentContext": {
      "componentId": "data-model-architecture",
      "componentName": "Data Model & Architecture",
      "componentPurpose": "Foundation for v1.0.0"
    },
    "timeframe": {
      "estimate": "1-2 weeks"
    },
    "targetPaths": {
      "subGoalsFolder": "/projects/operations-workspace/project-management-mcp/goals/001/sub-goals"
    },
    "preferences": {
      "numberOfSubGoals": 3,
      "decompositionStrategy": "sequential",
      "specificationDepth": "comprehensive"
    }
  },
  "maxRetries": 3
}
```

### Example 2: Task Completion Response

```json
{
  "handoffId": "550e8400-e29b-41d4-a716-446655440000",
  "receivedAt": "2025-10-27T14:30:05Z",
  "success": true,
  "status": "completed",
  "result": {
    "created": [
      {
        "entityType": "sub-goal",
        "entityId": "1.1",
        "filePath": "goals/001/sub-goals/1.1/SPECIFICATION.md"
      },
      {
        "entityType": "sub-goal",
        "entityId": "1.2",
        "filePath": "goals/001/sub-goals/1.2/SPECIFICATION.md"
      },
      {
        "entityType": "sub-goal",
        "entityId": "1.3",
        "filePath": "goals/001/sub-goals/1.3/SPECIFICATION.md"
      }
    ],
    "updated": [],
    "nextSteps": [
      {
        "description": "Review generated sub-goal specifications",
        "suggestedAction": "Validate acceptance criteria with stakeholders"
      }
    ]
  },
  "processedBy": "spec-driven",
  "processingTime": 4523
}
```

---

## Version History

### v1.0.0 (2025-10-27)

**Initial Release**
- 5 handoff types defined
- JSON schema specifications
- Validation with Zod
- Retry logic with exponential backoff
- Atomic operations
- Audit trail system
- Comprehensive test suite

### Future Enhancements

**v1.1.0 (Planned)**
- Batch handoff support
- Async/streaming handoffs for large payloads
- Compression for payload optimization
- Enhanced monitoring and alerting

**v2.0.0 (Future)**
- Protocol negotiation (support multiple versions)
- Encrypted handoffs for sensitive data
- Cross-project handoffs
- WebSocket-based real-time updates

---

## References

- [TypeScript Type Definitions](../src/types/handoff-protocol.ts)
- [Zod Validation Schemas](../src/validation/handoff-schemas.ts)
- [Integration Tests](../src/tests/handoff-integration.test.ts)
- [Sender Utilities](../src/utils/handoff-sender.ts)
- [Receiver Utilities](../src/utils/handoff-receiver.ts)
- [Error Handler](../src/utils/handoff-error-handler.ts)
- [Atomic Operations](../src/utils/handoff-atomic.ts)
- [Audit Trail](../src/utils/handoff-audit.ts)

---

**Document Status:** Active
**Next Review:** 2025-11-27
**Maintained By:** Project Management MCP Server Team
