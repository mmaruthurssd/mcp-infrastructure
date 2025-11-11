---
type: technical-specification
tags: [pattern-registry, proactive-engagement, extensibility, background-monitoring]
created: 2025-10-29
status: active
version: 1.0.0
---

# Pattern Registry Specification

**Purpose:** Formal specification for the extensible pattern detection system within workspace-activity-monitor

**Audience:** AI assistants, developers implementing pattern detection, workflow designers

**Related Documents:**
- `SYSTEM-ARCHITECTURE.md` - Overall system architecture and Proactive Engagement Layer
- `WORKSPACE_GUIDE.md` - Pattern detection rules for AI assistants
- `troubleshooting/README.md` - Troubleshooting pattern specifics
- `troubleshooting/QUICK-REFERENCE.md` - Quick reference for pattern triggers

---

## Table of Contents

1. [Overview](#overview)
2. [Pattern Schema](#pattern-schema)
3. [Pattern Types](#pattern-types)
4. [Workflow Registration](#workflow-registration)
5. [Pattern Matching Algorithm](#pattern-matching-algorithm)
6. [Priority System](#priority-system)
7. [Extension Points](#extension-points)
8. [Example Patterns](#example-patterns)
9. [Queue Integration](#queue-integration)
10. [Testing & Validation](#testing--validation)

---

## Overview

### What is the Pattern Registry?

The Pattern Registry is an **extensible, pluggable system** for detecting significant events and activities in the workspace that require proactive engagement from AI assistants. It bridges the gap between reactive workflows (AI waits for user) and autonomous workflows (AI acts proactively at natural checkpoints).

### Key Principles

1. **Extensible:** New workflows can register patterns without modifying core code
2. **Non-intrusive:** Detection happens in background, no mid-session interrupts
3. **Persistent:** Detected patterns written to external brain queue, survive sessions
4. **Prioritized:** Multiple patterns can fire, priority determines processing order
5. **Composable:** Patterns can depend on other patterns or combine conditions
6. **Testable:** Pattern detection is deterministic and testable

### Architecture Role

```
Activity Happens (AI uses tools, runs commands, modifies files)
  ↓
AI logs to .workspace-activity.jsonl
  ↓
Background Monitor watches for changes
  ↓
PatternRegistry.detectPatterns(recentActivity) ← THIS SPEC
  ↓
Patterns matched → QueueManager.writeToQueue()
  ↓
External Brain Queue persists alert
  ↓
Next Checkpoint → AI reads queue and processes
```

---

## Pattern Schema

### Core Pattern Definition

All patterns MUST conform to this JSON schema:

```typescript
interface Pattern {
  // Identification
  id: string                    // Unique identifier (kebab-case)
  name: string                  // Human-readable name
  version: string               // Semantic version (e.g., "1.0.0")

  // Workflow Association
  workflow: WorkflowType        // Which workflow this pattern belongs to

  // Trigger Configuration
  trigger: TriggerDefinition    // What activates this pattern

  // Action Configuration
  action: ActionType            // What to do when pattern matches
  priority: Priority            // Processing priority (critical/high/medium/low)

  // Metadata
  metadata: PatternMetadata     // Additional context for processing

  // Optional
  enabled?: boolean             // Default: true
  cooldown?: number             // Seconds before pattern can fire again (default: 0)
  dependencies?: string[]       // Pattern IDs that must fire first (optional)
}
```

### Enumerations

```typescript
type WorkflowType =
  | "troubleshooting"
  | "documentation"
  | "testing"
  | "deployment"
  | "optimization"
  | "security"
  | "refactoring"
  | "custom"                    // For user-defined workflows

type ActionType =
  | "queue_to_external_brain"   // Write to external brain queue
  | "log_only"                  // Log detection but don't queue
  | "trigger_immediately"       // For critical issues (future)

type Priority = "critical" | "high" | "medium" | "low"
```

### Trigger Definition

```typescript
interface TriggerDefinition {
  type: TriggerType
  conditions: TriggerConditions
  lookback?: number             // Seconds to look back in activity log (default: 300)
}

type TriggerType =
  | "duration"                  // Time threshold exceeded
  | "command_sequence"          // Specific sequence of commands
  | "command_count"             // Number of commands of certain type
  | "file_change"               // File modified with specific pattern
  | "error_pattern"             // Error messages matching pattern
  | "composite"                 // Combination of multiple triggers

interface TriggerConditions {
  // Type-specific conditions (see Pattern Types section)
  [key: string]: any
}
```

### Pattern Metadata

```typescript
interface PatternMetadata {
  // Domain (for troubleshooting)
  domain?: string               // auto-detect | mcp-configuration | mcp-build | etc.

  // Checklist reference
  checklist?: string            // Path to checklist (e.g., "troubleshooting/README.md")

  // Suggested actions
  suggestedActions?: string[]   // What AI should do when processing

  // Documentation
  description?: string          // What this pattern detects
  examples?: string[]           // Example scenarios

  // Analytics
  tags?: string[]               // For grouping and filtering
  estimatedTimeToResolve?: number  // Minutes (for time-saved metrics)
}
```

---

## Pattern Types

### 1. Duration Trigger

**Use Case:** Detect when AI spends too long on a single problem

**Schema:**
```typescript
{
  type: "duration",
  conditions: {
    threshold: number          // Seconds
    activityType?: string      // Optional: "troubleshooting" | "research" | "any"
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-time-threshold",
  name: "Time Threshold Exceeded",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "duration",
    conditions: {
      threshold: 300,          // 5 minutes
      activityType: "troubleshooting"
    }
  },
  action: "queue_to_external_brain",
  priority: "high",
  metadata: {
    domain: "auto-detect",
    checklist: "troubleshooting/README.md",
    description: "AI spent >5 minutes troubleshooting one issue",
    estimatedTimeToResolve: 5
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const troubleshootingActions = activity.filter(a =>
  a.action === "bash" && a.exitCode !== 0 ||
  a.action === "read" && a.file.includes("troubleshooting") ||
  a.action === "edit" && a.reason === "fix_error"
)

const duration = last(troubleshootingActions).timestamp - first(troubleshootingActions).timestamp

if (duration >= pattern.trigger.conditions.threshold) {
  return { matched: true, context: { duration, actions: troubleshootingActions } }
}
```

---

### 2. Command Sequence Trigger

**Use Case:** Detect specific sequences that indicate a pattern (e.g., backup → restore)

**Schema:**
```typescript
{
  type: "command_sequence",
  conditions: {
    sequence: string[]         // Array of command patterns (regex supported)
    window: number             // Time window in seconds (default: 600)
    ordered?: boolean          // Must be in exact order? (default: true)
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-backup-restore",
  name: "Backup/Restore Used",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "command_sequence",
    conditions: {
      sequence: ["cp.*\\.backup", "cp.*\\.mcp\\.json"],
      window: 600,
      ordered: false
    }
  },
  action: "queue_to_external_brain",
  priority: "high",
  metadata: {
    domain: "mcp-configuration",
    description: "Backup file was used to recover from error",
    estimatedTimeToResolve: 10
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const commands = activity.filter(a => a.action === "bash").map(a => a.command)
const window = pattern.trigger.conditions.window

for (let i = 0; i < commands.length; i++) {
  const matches = pattern.trigger.conditions.sequence.map(regex =>
    commands.slice(i).find(cmd => new RegExp(regex).test(cmd))
  )

  if (matches.every(m => m) && withinTimeWindow(matches, window)) {
    return { matched: true, context: { commands: matches } }
  }
}
```

---

### 3. Command Count Trigger

**Use Case:** Detect when AI runs many diagnostic commands (indicates investigation)

**Schema:**
```typescript
{
  type: "command_count",
  conditions: {
    commandPattern: string     // Regex pattern
    threshold: number          // Minimum count
    window: number             // Time window in seconds (default: 300)
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-multiple-diagnostics",
  name: "Multiple Diagnostics Run",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "command_count",
    conditions: {
      commandPattern: "^(ls|grep|cat|jq|test|file|stat)",
      threshold: 3,
      window: 300
    }
  },
  action: "queue_to_external_brain",
  priority: "medium",
  metadata: {
    domain: "auto-detect",
    description: "AI ran 3+ diagnostic commands in 5 minutes",
    estimatedTimeToResolve: 5
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const recentCommands = activity.filter(a =>
  a.action === "bash" &&
  a.timestamp >= now() - pattern.trigger.conditions.window
)

const matches = recentCommands.filter(cmd =>
  new RegExp(pattern.trigger.conditions.commandPattern).test(cmd.command)
)

if (matches.length >= pattern.trigger.conditions.threshold) {
  return { matched: true, context: { count: matches.length, commands: matches } }
}
```

---

### 4. File Change Trigger

**Use Case:** Detect when specific files are modified (config changes, docs out of sync)

**Schema:**
```typescript
{
  type: "file_change",
  conditions: {
    filePattern: string        // Glob pattern or regex
    changeType?: string        // "edit" | "create" | "delete" | "any" (default: "any")
    reason?: string            // Reason for change (e.g., "fix_error")
    window?: number            // Time window (default: 60)
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-config-change-after-error",
  name: "Config Changed After Error",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "file_change",
    conditions: {
      filePattern: "**/.mcp.json",
      changeType: "edit",
      reason: "fix_error",
      window: 60
    }
  },
  action: "queue_to_external_brain",
  priority: "high",
  metadata: {
    domain: "mcp-configuration",
    checklist: "MCP-CONFIGURATION-CHECKLIST.md",
    description: "MCP config modified to fix an error",
    estimatedTimeToResolve: 10
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const fileChanges = activity.filter(a =>
  a.action === "edit" &&
  a.timestamp >= now() - pattern.trigger.conditions.window
)

const matches = fileChanges.filter(change =>
  minimatch(change.file, pattern.trigger.conditions.filePattern) &&
  (change.changeType === pattern.trigger.conditions.changeType || pattern.trigger.conditions.changeType === "any") &&
  (!pattern.trigger.conditions.reason || change.reason === pattern.trigger.conditions.reason)
)

if (matches.length > 0) {
  return { matched: true, context: { files: matches } }
}
```

---

### 5. Error Pattern Trigger

**Use Case:** Detect specific error messages or patterns in command output

**Schema:**
```typescript
{
  type: "error_pattern",
  conditions: {
    errorPattern: string       // Regex pattern for error message
    source?: string            // "bash" | "any" (default: "any")
    threshold?: number         // Number of occurrences (default: 1)
    window?: number            // Time window (default: 300)
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-build-failure",
  name: "Build Failure Detected",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "error_pattern",
    conditions: {
      errorPattern: "npm ERR!|Build failed|tsc: error",
      source: "bash",
      threshold: 1,
      window: 300
    }
  },
  action: "queue_to_external_brain",
  priority: "high",
  metadata: {
    domain: "mcp-build",
    checklist: "MCP-BUILD-INTEGRATION-GUIDE.md",
    description: "Build command failed",
    estimatedTimeToResolve: 15
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const bashActions = activity.filter(a =>
  a.action === "bash" &&
  a.exitCode !== 0 &&
  a.timestamp >= now() - pattern.trigger.conditions.window
)

const matches = bashActions.filter(action =>
  new RegExp(pattern.trigger.conditions.errorPattern).test(action.stderr || action.stdout)
)

if (matches.length >= pattern.trigger.conditions.threshold) {
  return { matched: true, context: { errors: matches } }
}
```

---

### 6. Composite Trigger

**Use Case:** Combine multiple conditions (e.g., duration + command count)

**Schema:**
```typescript
{
  type: "composite",
  conditions: {
    operator: "AND" | "OR"     // How to combine sub-triggers
    triggers: TriggerDefinition[]  // Array of sub-triggers
  }
}
```

**Example:**
```javascript
{
  id: "troubleshooting-complex-issue",
  name: "Complex Issue Detected",
  version: "1.0.0",
  workflow: "troubleshooting",
  trigger: {
    type: "composite",
    conditions: {
      operator: "AND",
      triggers: [
        {
          type: "duration",
          conditions: { threshold: 900 }  // 15 minutes
        },
        {
          type: "command_count",
          conditions: {
            commandPattern: "^(npm|tsc|node)",
            threshold: 5,
            window: 900
          }
        }
      ]
    }
  },
  action: "queue_to_external_brain",
  priority: "critical",
  metadata: {
    domain: "auto-detect",
    description: "Complex issue: >15 min troubleshooting + 5+ commands",
    estimatedTimeToResolve: 20
  }
}
```

**Detection Logic:**
```javascript
// Pseudo-code
const subResults = pattern.trigger.conditions.triggers.map(subTrigger =>
  detectPattern({ ...pattern, trigger: subTrigger })
)

const matched = pattern.trigger.conditions.operator === "AND"
  ? subResults.every(r => r.matched)
  : subResults.some(r => r.matched)

if (matched) {
  return { matched: true, context: { subResults } }
}
```

---

## Workflow Registration

### How Workflows Register Patterns

Each workflow can register patterns by providing a pattern definition file:

```
local-instances/tools/workspace-activity-monitor/patterns/
├── troubleshooting-patterns.json      ← Initial implementation
├── documentation-patterns.json         ← Future
├── testing-patterns.json               ← Future
├── deployment-patterns.json            ← Future
├── optimization-patterns.json          ← Future
├── security-patterns.json              ← Future
└── custom/                             ← User-defined patterns
    └── my-custom-patterns.json
```

### Pattern Definition File Format

```json
{
  "workflow": "troubleshooting",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "troubleshooting-time-threshold",
      "name": "Time Threshold Exceeded",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "duration",
        "conditions": {
          "threshold": 300,
          "activityType": "troubleshooting"
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "metadata": {
        "domain": "auto-detect",
        "checklist": "troubleshooting/README.md",
        "description": "AI spent >5 minutes troubleshooting one issue",
        "estimatedTimeToResolve": 5
      }
    }
    // ... more patterns
  ]
}
```

### Registration API

```javascript
// PatternRegistry class
class PatternRegistry {
  // Load patterns from file
  static loadPatterns(filePath: string): void

  // Register individual pattern
  static registerPattern(pattern: Pattern): void

  // Unregister pattern by ID
  static unregisterPattern(patternId: string): void

  // Get all patterns for workflow
  static getWorkflowPatterns(workflow: WorkflowType): Pattern[]

  // Detect patterns in activity log
  static detectPatterns(activity: ActivityLog[]): DetectionResult[]

  // Enable/disable pattern
  static setPatternEnabled(patternId: string, enabled: boolean): void
}
```

### Initialization

```javascript
// monitor.js
const PatternRegistry = require('./pattern-registry');

// Load all pattern files on startup
PatternRegistry.loadPatterns('./patterns/troubleshooting-patterns.json');
PatternRegistry.loadPatterns('./patterns/documentation-patterns.json');
// ... etc
```

---

## Pattern Matching Algorithm

### High-Level Flow

```
1. Activity log updated (.workspace-activity.jsonl)
   ↓
2. Background monitor detects change
   ↓
3. Read recent activity (last N entries or time window)
   ↓
4. For each registered pattern:
   a. Check if pattern is enabled
   b. Check cooldown (has pattern fired recently?)
   c. Check dependencies (required patterns fired?)
   d. Apply trigger detection logic
   e. If matched → Collect context
   ↓
5. Sort matched patterns by priority
   ↓
6. For each matched pattern:
   a. Format queue item
   b. Write to external brain queue
   c. Update cooldown timestamp
   ↓
7. Log detection summary to monitor log
```

### Detection Algorithm (Pseudo-code)

```javascript
function detectPatterns(activity, patterns) {
  const results = []

  for (const pattern of patterns) {
    // Skip disabled patterns
    if (!pattern.enabled) continue

    // Check cooldown
    if (isCooldownActive(pattern)) continue

    // Check dependencies
    if (pattern.dependencies && !allDependenciesMet(pattern.dependencies, results)) {
      continue
    }

    // Apply trigger-specific detection
    const detection = detectTrigger(pattern.trigger, activity)

    if (detection.matched) {
      results.push({
        pattern: pattern,
        context: detection.context,
        timestamp: Date.now(),
        activitySnapshot: activity  // For debugging
      })

      // Update cooldown
      setCooldown(pattern.id, pattern.cooldown || 0)
    }
  }

  // Sort by priority: critical > high > medium > low
  return sortByPriority(results)
}
```

### Activity Log Parsing

```javascript
function parseRecentActivity(activityLogPath, lookback = 300) {
  const lines = readLastNLines(activityLogPath, 100)  // Optimize: don't read entire file
  const activities = lines.map(line => JSON.parse(line))

  const cutoff = Date.now() - (lookback * 1000)
  return activities.filter(a => new Date(a.timestamp).getTime() >= cutoff)
}
```

### Cooldown Management

```javascript
// In-memory cooldown tracking (resets on restart - acceptable)
const cooldowns = new Map()  // patternId -> expiryTimestamp

function isCooldownActive(pattern) {
  const expiry = cooldowns.get(pattern.id)
  if (!expiry) return false

  if (Date.now() < expiry) {
    return true  // Still in cooldown
  } else {
    cooldowns.delete(pattern.id)  // Expired
    return false
  }
}

function setCooldown(patternId, seconds) {
  if (seconds > 0) {
    cooldowns.set(patternId, Date.now() + (seconds * 1000))
  }
}
```

---

## Priority System

### Priority Levels

| Priority | Use Case | Processing Order | Example |
|----------|----------|------------------|---------|
| **critical** | System-breaking issues, data loss risk | 1st | Security breach, data corruption |
| **high** | Significant productivity impact | 2nd | 15+ min troubleshooting, broken builds |
| **medium** | Moderate issues, preventable delays | 3rd | 5-10 min troubleshooting, minor errors |
| **low** | Nice-to-have, optimization opportunities | 4th | Documentation updates, refactoring suggestions |

### Priority-Based Queue Ordering

When multiple patterns match simultaneously:

```javascript
function sortByPriority(detections) {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

  return detections.sort((a, b) => {
    const priorityDiff = priorityOrder[a.pattern.priority] - priorityOrder[b.pattern.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Same priority: sort by timestamp (oldest first)
    return new Date(a.timestamp) - new Date(b.timestamp)
  })
}
```

### Queue Processing Order

At checkpoints, AI processes queue items in priority order:

```markdown
# /start command processing

1. Read external-brain/troubleshooting-queue/SUMMARY.md
2. Parse queue items and sort by priority:
   - critical items first
   - high items second
   - medium items third
   - low items fourth
3. Process each item sequentially
4. Mark as processed → Move to archived/
```

---

## Extension Points

### Adding New Pattern Types

To add a new trigger type (e.g., "ml_inference"):

1. **Define the trigger schema:**
```typescript
interface MLInferenceTrigger extends TriggerDefinition {
  type: "ml_inference"
  conditions: {
    modelThreshold: number      // Confidence threshold
    dataSource: string          // Where to get inference data
  }
}
```

2. **Implement detection logic:**
```javascript
// pattern-detectors/ml-inference-detector.js
function detectMLInference(pattern, activity) {
  const inferenceData = extractInferenceData(activity, pattern.trigger.conditions.dataSource)
  const confidence = runInference(inferenceData)

  if (confidence >= pattern.trigger.conditions.modelThreshold) {
    return { matched: true, context: { confidence, data: inferenceData } }
  }

  return { matched: false }
}
```

3. **Register detector:**
```javascript
// pattern-registry.js
const detectors = {
  duration: detectDuration,
  command_sequence: detectCommandSequence,
  command_count: detectCommandCount,
  file_change: detectFileChange,
  error_pattern: detectErrorPattern,
  composite: detectComposite,
  ml_inference: detectMLInference  // New detector
}
```

4. **Create pattern definition:**
```json
{
  "id": "optimization-slow-command",
  "name": "Slow Command Detected",
  "version": "1.0.0",
  "workflow": "optimization",
  "trigger": {
    "type": "ml_inference",
    "conditions": {
      "modelThreshold": 0.85,
      "dataSource": "command_durations"
    }
  },
  "action": "queue_to_external_brain",
  "priority": "low"
}
```

### Adding New Workflows

To add a new workflow (e.g., "refactoring"):

1. **Update WorkflowType enum:**
```typescript
type WorkflowType =
  | "troubleshooting"
  | "documentation"
  | "testing"
  | "deployment"
  | "optimization"
  | "security"
  | "refactoring"  // New workflow
  | "custom"
```

2. **Create workflow patterns file:**
```
patterns/refactoring-patterns.json
```

3. **Define patterns for workflow:**
```json
{
  "workflow": "refactoring",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "refactoring-code-duplication",
      "name": "Code Duplication Detected",
      "workflow": "refactoring",
      "trigger": { ... },
      "action": "queue_to_external_brain",
      "priority": "low"
    }
  ]
}
```

4. **Create queue directory:**
```bash
mkdir -p external-brain/refactoring-queue
```

5. **Update checkpoint integration:**
```markdown
# /start command
- Read external-brain/troubleshooting-queue/SUMMARY.md
- Read external-brain/refactoring-queue/SUMMARY.md  # New
- Process all pending items
```

### Adding Custom Pattern Conditions

Users can extend pattern conditions with custom logic:

```json
{
  "id": "custom-pattern",
  "trigger": {
    "type": "custom",
    "conditions": {
      "customScript": "./custom-detectors/my-detector.js",
      "params": {
        "threshold": 10,
        "customParam": "value"
      }
    }
  }
}
```

```javascript
// custom-detectors/my-detector.js
module.exports = function(activity, params) {
  // Custom detection logic
  const result = myCustomLogic(activity, params)

  return {
    matched: result > params.threshold,
    context: { result }
  }
}
```

---

## Example Patterns

### Troubleshooting Patterns (Initial Implementation)

Complete pattern definitions for the troubleshooting workflow:

```json
{
  "workflow": "troubleshooting",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "troubleshooting-time-threshold",
      "name": "Time Threshold Exceeded",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "duration",
        "conditions": {
          "threshold": 300,
          "activityType": "troubleshooting"
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 600,
      "metadata": {
        "domain": "auto-detect",
        "checklist": "troubleshooting/README.md",
        "suggestedActions": [
          "Run Post-Resolution Checklist",
          "Log issue to domain file",
          "Check optimization triggers"
        ],
        "description": "AI spent >5 minutes troubleshooting one issue",
        "estimatedTimeToResolve": 5
      }
    },
    {
      "id": "troubleshooting-multiple-diagnostics",
      "name": "Multiple Diagnostics Run",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "command_count",
        "conditions": {
          "commandPattern": "^(ls|grep|cat|jq|test|file|stat|head|tail)",
          "threshold": 3,
          "window": 300
        }
      },
      "action": "queue_to_external_brain",
      "priority": "medium",
      "cooldown": 300,
      "metadata": {
        "domain": "auto-detect",
        "description": "AI ran 3+ diagnostic commands in 5 minutes",
        "estimatedTimeToResolve": 5
      }
    },
    {
      "id": "troubleshooting-backup-restore",
      "name": "Backup/Restore Used",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "command_sequence",
        "conditions": {
          "sequence": ["cp.*\\.backup", "cp.*back to original"],
          "window": 600,
          "ordered": false
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 600,
      "metadata": {
        "domain": "mcp-configuration",
        "description": "Backup file was used to recover from error",
        "estimatedTimeToResolve": 10
      }
    },
    {
      "id": "troubleshooting-config-change-after-error",
      "name": "Config Changed After Error",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "file_change",
        "conditions": {
          "filePattern": "**/{.mcp.json,package.json,tsconfig.json}",
          "changeType": "edit",
          "reason": "fix_error",
          "window": 60
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 300,
      "metadata": {
        "domain": "mcp-configuration",
        "checklist": "MCP-CONFIGURATION-CHECKLIST.md",
        "description": "Configuration file modified to fix an error",
        "estimatedTimeToResolve": 10
      }
    },
    {
      "id": "troubleshooting-build-failure",
      "name": "Build Failure Detected",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "error_pattern",
        "conditions": {
          "errorPattern": "npm ERR!|Build failed|tsc: error|compilation error",
          "source": "bash",
          "threshold": 1,
          "window": 300
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 600,
      "metadata": {
        "domain": "mcp-build",
        "checklist": "MCP-BUILD-INTEGRATION-GUIDE.md",
        "description": "Build command failed",
        "estimatedTimeToResolve": 15
      }
    },
    {
      "id": "troubleshooting-test-failure",
      "name": "Test Failure Detected",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "error_pattern",
        "conditions": {
          "errorPattern": "Test.*failed|FAIL|AssertionError",
          "source": "bash",
          "threshold": 1,
          "window": 300
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 600,
      "metadata": {
        "domain": "mcp-testing",
        "checklist": "ROLLOUT-CHECKLIST.md",
        "description": "Test suite failed",
        "estimatedTimeToResolve": 15
      }
    },
    {
      "id": "troubleshooting-multiple-attempts",
      "name": "Multiple Solution Attempts",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "composite",
        "conditions": {
          "operator": "AND",
          "triggers": [
            {
              "type": "duration",
              "conditions": { "threshold": 600 }
            },
            {
              "type": "command_count",
              "conditions": {
                "commandPattern": "^(npm|node|tsc|build)",
                "threshold": 3,
                "window": 600
              }
            }
          ]
        }
      },
      "action": "queue_to_external_brain",
      "priority": "high",
      "cooldown": 900,
      "metadata": {
        "domain": "auto-detect",
        "description": "Tried 3+ solutions in 10 minutes",
        "estimatedTimeToResolve": 15
      }
    },
    {
      "id": "troubleshooting-research-required",
      "name": "Research Required",
      "version": "1.0.0",
      "workflow": "troubleshooting",
      "trigger": {
        "type": "file_change",
        "conditions": {
          "filePattern": "**/troubleshooting/**/*.md",
          "changeType": "any",
          "window": 300
        }
      },
      "action": "queue_to_external_brain",
      "priority": "medium",
      "cooldown": 300,
      "metadata": {
        "domain": "auto-detect",
        "description": "AI read troubleshooting docs to solve problem",
        "estimatedTimeToResolve": 10
      }
    }
  ]
}
```

### Documentation Patterns (Future)

Example patterns for documentation workflow:

```json
{
  "workflow": "documentation",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "docs-code-changed-without-docs",
      "name": "Code Changed Without Docs Update",
      "version": "1.0.0",
      "workflow": "documentation",
      "trigger": {
        "type": "composite",
        "conditions": {
          "operator": "AND",
          "triggers": [
            {
              "type": "file_change",
              "conditions": {
                "filePattern": "**/src/**/*.{ts,js}",
                "changeType": "edit",
                "window": 3600
              }
            },
            {
              "type": "file_change",
              "conditions": {
                "filePattern": "**/*.md",
                "changeType": "edit",
                "window": 3600,
                "negate": true
              }
            }
          ]
        }
      },
      "action": "queue_to_external_brain",
      "priority": "low",
      "cooldown": 7200,
      "metadata": {
        "checklist": "DOCUMENTATION-CHECKLIST.md",
        "suggestedActions": [
          "Review changed code",
          "Identify impacted documentation",
          "Update relevant docs"
        ],
        "description": "Source code changed but documentation not updated",
        "estimatedTimeToResolve": 10
      }
    }
  ]
}
```

### Testing Patterns (Future)

Example patterns for testing workflow:

```json
{
  "workflow": "testing",
  "version": "1.0.0",
  "patterns": [
    {
      "id": "testing-new-feature-without-tests",
      "name": "New Feature Without Tests",
      "version": "1.0.0",
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
      "cooldown": 3600,
      "metadata": {
        "checklist": "ROLLOUT-CHECKLIST.md",
        "suggestedActions": [
          "Review new feature code",
          "Write unit tests",
          "Run test suite"
        ],
        "description": "New source file created without corresponding test file",
        "estimatedTimeToResolve": 20
      }
    }
  ]
}
```

---

## Queue Integration

### Queue Item Format

When a pattern matches, the detection is written to the external brain queue:

```markdown
---
id: 2025-10-29-001
workflow: troubleshooting
pattern_id: troubleshooting-time-threshold
priority: high
created: 2025-10-29T10:30:00Z
status: pending
estimated_time_to_resolve: 5
---

# Issue Detected: Time Threshold Exceeded

**Pattern:** troubleshooting-time-threshold (v1.0.0)
**Description:** AI spent >5 minutes troubleshooting one issue
**Duration:** 12 minutes 34 seconds

## Context

**Domain:** mcp-configuration (auto-detected)
**Commands Run:** 15 diagnostics
**Files Modified:** .mcp.json, package.json
**Errors:** 3 build failures

## Detected Activity

```json
[
  {
    "timestamp": "2025-10-29T10:18:00Z",
    "action": "bash",
    "command": "npm build",
    "exitCode": 1,
    "duration": 45
  },
  {
    "timestamp": "2025-10-29T10:20:00Z",
    "action": "edit",
    "file": ".mcp.json",
    "reason": "fix_error"
  },
  // ... more activity
]
```

## Suggested Actions

1. Run Post-Resolution Checklist (troubleshooting/README.md)
2. Log issue to domain file: troubleshooting/configuration-issues.md
3. Check optimization triggers with learning-optimizer
4. Update MCP-CONFIGURATION-CHECKLIST.md if high-frequency

## Auto-Resolution Attempt

- [x] Check if learning-optimizer MCP available
- [ ] If not available, manual log required to troubleshooting/configuration-issues.md

**Status:** Needs AI processing at next checkpoint (/start or task completion)
```

### Queue Directory Structure

```
external-brain/
├── troubleshooting-queue/
│   ├── SUMMARY.md                      ← Quick overview for AI
│   ├── 2025-10-29-001-config-error.md  ← Individual queue items
│   ├── 2025-10-29-002-build-failure.md
│   └── archived/                       ← Processed items
│       ├── 2025-10-28-001.md
│       └── 2025-10-28-002.md
│
├── documentation-queue/
│   ├── SUMMARY.md
│   └── archived/
│
└── testing-queue/
    ├── SUMMARY.md
    └── archived/
```

### SUMMARY.md Format

```markdown
# Troubleshooting Queue Summary

**Last Updated:** 2025-10-29T10:35:00Z
**Pending Items:** 2
**Processed Today:** 3

## Pending Items (Priority Order)

### 🔴 High Priority (1 item)

1. **[2025-10-29-001] Time Threshold Exceeded**
   - Pattern: troubleshooting-time-threshold
   - Created: 10:30 AM
   - Duration: 12 min 34 sec
   - Domain: mcp-configuration
   - Est. Time: 5 min

### 🟡 Medium Priority (1 item)

2. **[2025-10-29-002] Multiple Diagnostics Run**
   - Pattern: troubleshooting-multiple-diagnostics
   - Created: 10:32 AM
   - Commands: 8 diagnostics
   - Domain: auto-detect
   - Est. Time: 5 min

## Processing Instructions

At next checkpoint (/start or task completion):

1. Read each pending item (in priority order)
2. Execute suggested actions
3. Mark as processed: Move to archived/
4. Update this SUMMARY.md

## Statistics

- **Total Detected (All Time):** 47
- **Total Processed:** 45
- **Average Resolution Time:** 8 minutes
- **Time Saved (Estimated):** 6 hours 15 minutes
```

### Queue Processing at Checkpoints

```javascript
// Integrated into /start command or task completion

async function processExternalBrainQueue() {
  const workflows = ["troubleshooting", "documentation", "testing"]

  for (const workflow of workflows) {
    const summaryPath = `external-brain/${workflow}-queue/SUMMARY.md`

    if (!fileExists(summaryPath)) continue

    const summary = readFile(summaryPath)
    const pendingCount = extractPendingCount(summary)

    if (pendingCount === 0) continue

    console.log(`Found ${pendingCount} pending ${workflow} items`)

    // Read and process each pending item
    const items = getPendingItems(workflow)

    for (const item of items) {
      console.log(`Processing: ${item.title}`)

      // Execute workflow-specific processing
      if (item.workflow === "troubleshooting") {
        await runPostResolutionChecklist(item)
      } else if (item.workflow === "documentation") {
        await updateDocumentation(item)
      }

      // Mark as processed
      moveToArchived(item)
    }

    // Update SUMMARY.md
    updateSummary(workflow)
  }
}
```

---

## Testing & Validation

### Unit Testing Patterns

Each pattern type should have comprehensive unit tests:

```javascript
// __tests__/pattern-detectors.test.js
describe('Duration Trigger', () => {
  test('should detect when threshold exceeded', () => {
    const pattern = {
      trigger: {
        type: 'duration',
        conditions: { threshold: 300 }
      }
    }

    const activity = [
      { timestamp: '2025-10-29T10:00:00Z', action: 'bash', exitCode: 1 },
      { timestamp: '2025-10-29T10:06:00Z', action: 'bash', exitCode: 0 }
    ]

    const result = detectDuration(pattern, activity)

    expect(result.matched).toBe(true)
    expect(result.context.duration).toBeGreaterThanOrEqual(360)
  })

  test('should not detect when threshold not exceeded', () => {
    const pattern = {
      trigger: {
        type: 'duration',
        conditions: { threshold: 300 }
      }
    }

    const activity = [
      { timestamp: '2025-10-29T10:00:00Z', action: 'bash', exitCode: 1 },
      { timestamp: '2025-10-29T10:03:00Z', action: 'bash', exitCode: 0 }
    ]

    const result = detectDuration(pattern, activity)

    expect(result.matched).toBe(false)
  })
})
```

### Integration Testing

Test end-to-end pattern detection and queue writing:

```javascript
// __tests__/integration.test.js
describe('Pattern Detection Integration', () => {
  beforeEach(() => {
    // Setup test activity log
    fs.writeFileSync('.test-activity.jsonl', '')

    // Setup test queue
    fs.mkdirSync('external-brain/test-queue', { recursive: true })
  })

  test('should detect pattern and write to queue', async () => {
    // Simulate activity
    appendActivity({ action: 'bash', command: 'npm build', exitCode: 1 })
    appendActivity({ action: 'bash', command: 'ls', exitCode: 0 })
    appendActivity({ action: 'bash', command: 'grep error', exitCode: 0 })

    // Trigger pattern detection
    const patterns = PatternRegistry.detectPatterns(readActivity())

    // Write to queue
    await QueueManager.writeToQueue(patterns)

    // Verify queue item created
    const queueFiles = fs.readdirSync('external-brain/test-queue')
    expect(queueFiles.length).toBe(1)

    const queueItem = fs.readFileSync(`external-brain/test-queue/${queueFiles[0]}`, 'utf-8')
    expect(queueItem).toContain('troubleshooting-multiple-diagnostics')
  })
})
```

### Validation Rules

Before registering a pattern, validate:

1. **Required Fields:**
   - id, name, version, workflow, trigger, action, priority present

2. **ID Uniqueness:**
   - Pattern ID must be unique across all patterns

3. **Trigger Type Valid:**
   - Trigger type must be one of the supported types

4. **Conditions Valid:**
   - Trigger conditions match schema for trigger type

5. **Workflow Valid:**
   - Workflow must be a recognized WorkflowType

6. **Action Valid:**
   - Action must be a recognized ActionType

7. **Priority Valid:**
   - Priority must be critical/high/medium/low

8. **Dependencies Exist:**
   - If dependencies specified, all referenced pattern IDs must exist

```javascript
function validatePattern(pattern) {
  const errors = []

  // Required fields
  if (!pattern.id) errors.push('Missing required field: id')
  if (!pattern.name) errors.push('Missing required field: name')
  // ... etc

  // ID uniqueness
  if (PatternRegistry.hasPattern(pattern.id)) {
    errors.push(`Pattern ID already registered: ${pattern.id}`)
  }

  // Trigger type
  const validTriggerTypes = ['duration', 'command_sequence', 'command_count', 'file_change', 'error_pattern', 'composite']
  if (!validTriggerTypes.includes(pattern.trigger.type)) {
    errors.push(`Invalid trigger type: ${pattern.trigger.type}`)
  }

  // Dependencies
  if (pattern.dependencies) {
    for (const depId of pattern.dependencies) {
      if (!PatternRegistry.hasPattern(depId)) {
        errors.push(`Dependency not found: ${depId}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create pattern-registry.js with Pattern and TriggerDefinition types
- [ ] Implement PatternRegistry class (register, unregister, getWorkflowPatterns)
- [ ] Create pattern validation logic
- [ ] Implement activity log parsing utilities
- [ ] Create cooldown management system
- [ ] Write unit tests for core infrastructure

### Phase 2: Pattern Detectors
- [ ] Implement detectDuration()
- [ ] Implement detectCommandSequence()
- [ ] Implement detectCommandCount()
- [ ] Implement detectFileChange()
- [ ] Implement detectErrorPattern()
- [ ] Implement detectComposite()
- [ ] Write unit tests for each detector

### Phase 3: Troubleshooting Patterns
- [ ] Create troubleshooting-patterns.json with all 10 patterns
- [ ] Test each pattern with simulated activity
- [ ] Validate pattern detection accuracy
- [ ] Document any edge cases or limitations

### Phase 4: Queue Integration
- [ ] Create QueueManager class (writeToQueue, updateSummary)
- [ ] Implement queue item formatting
- [ ] Implement SUMMARY.md generation
- [ ] Create external-brain directory structure
- [ ] Write integration tests for queue writing

### Phase 5: Background Monitor
- [ ] Create monitor.js with chokidar watcher
- [ ] Integrate PatternRegistry.detectPatterns()
- [ ] Integrate QueueManager.writeToQueue()
- [ ] Add error handling and logging
- [ ] Test with real activity log

### Phase 6: Checkpoint Integration
- [ ] Update /start command to check external brain
- [ ] Add queue processing logic to checkpoints
- [ ] Implement archive mechanism
- [ ] Test end-to-end flow (activity → detection → queue → checkpoint → processing)

### Phase 7: Documentation & Future Workflows
- [ ] Create pattern definition guide for new workflows
- [ ] Document how to add custom pattern types
- [ ] Create example patterns for documentation workflow
- [ ] Create example patterns for testing workflow
- [ ] Update WORKSPACE_GUIDE.md with checkpoint integration

---

## Related Documents

- **SYSTEM-ARCHITECTURE.md** - Overall system architecture and Proactive Engagement Layer
- **WORKSPACE_GUIDE.md** - AI workflow guide with pattern detection rules
- **troubleshooting/README.md** - Troubleshooting system guide
- **troubleshooting/QUICK-REFERENCE.md** - Quick reference for pattern triggers

---

**Version:** 1.0.0
**Created:** 2025-10-29
**Status:** Active - Design Complete, Implementation Pending
**Next Steps:** Implement Phase 1 (Core Infrastructure)
