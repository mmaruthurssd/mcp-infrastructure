---
type: implementation-plan
tags: [proactive-engagement, workspace-activity-monitor, implementation, roadmap]
created: 2025-10-29
status: active
version: 1.0.0
---

# Workspace Activity Monitor - Implementation Plan

**Purpose:** Comprehensive, actionable plan for implementing the workspace-activity-monitor system

**Target Audience:** AI assistants (primary implementer), developers, project managers

**Related Documents:**
- `SYSTEM-ARCHITECTURE.md` - Overall system architecture (Proactive Engagement Layer)
- `pattern-registry-spec.md` - Technical specification for pattern registry
- `mcp-integration-guide.md` - MCP integration details
- `WORKSPACE_GUIDE.md` - AI workflow guide

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Prerequisites](#prerequisites)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Task Breakdown](#detailed-task-breakdown)
5. [Testing Strategy](#testing-strategy)
6. [Rollout Strategy](#rollout-strategy)
7. [Success Criteria](#success-criteria)
8. [Timeline & Estimates](#timeline--estimates)
9. [Risk Mitigation](#risk-mitigation)
10. [Next Steps](#next-steps)

---

## Executive Summary

### What Are We Building?

A **semi-autonomous background monitoring system** that:
- Detects patterns in AI activity (troubleshooting, testing gaps, security issues, etc.)
- Queues detected patterns to persistent external brain
- Triggers proactive workflows at natural checkpoints (/start, task completion)
- Integrates with existing MCPs for processing
- Enables continuous improvement without relying on AI memory

### Why Is This Important?

**Current Problem:**
- AI forgets to log troubleshooting issues
- Feedback loops require manual activation
- No cross-session persistence of pending actions
- Repetitive issues not prevented automatically

**Solution Impact:**
- Automatic issue logging (0% forgotten)
- Proactive workflow triggering at checkpoints
- Cross-session persistence via external brain queue
- Compounding prevention success rates

### Key Deliverables

1. **Pattern Registry System** - Extensible pattern detection framework
2. **Background Monitor** - Node.js process watching activity log
3. **External Brain Queue** - Persistent file-based queue system
4. **Checkpoint Integration** - /start command and task completion hooks
5. **Troubleshooting Patterns** - Initial 10 patterns for troubleshooting workflow
6. **MCP Integrations** - learning-optimizer, project-management, task-executor

### Success Metrics

- **Pattern Detection Rate:** 95%+ of troubleshooting sessions detected
- **False Positive Rate:** <10% of detections are false positives
- **Processing Rate:** 90%+ of queue items processed at next checkpoint
- **Time Saved:** Measurable reduction in time spent on recurring issues
- **Prevention Success:** 80%+ of promoted issues prevented in future builds

---

## Prerequisites

### Technical Dependencies

**Required:**
- Node.js v18+ (for background monitor)
- npm packages:
  - `chokidar` (file watching)
  - `minimatch` (glob pattern matching)
  - `fs-extra` (enhanced file operations)
- Existing MCP servers:
  - learning-optimizer (v1.0.0+)
  - project-management (v3.0.0+)
  - task-executor (v2.0.0+)

**Optional:**
- testing-validation MCP (v0.1.0+) - For validation patterns
- security-compliance MCP (v1.0.0+) - For security patterns

### Directory Structure

```
local-instances/tools/workspace-activity-monitor/
├── src/
│   ├── pattern-registry.js        (Core pattern registry)
│   ├── pattern-detectors/          (Pattern detection logic)
│   │   ├── duration-detector.js
│   │   ├── command-sequence-detector.js
│   │   ├── command-count-detector.js
│   │   ├── file-change-detector.js
│   │   ├── error-pattern-detector.js
│   │   └── composite-detector.js
│   ├── queue-manager.js            (Queue management)
│   ├── activity-parser.js          (Activity log parsing)
│   ├── monitor.js                  (Main background monitor)
│   └── utils/
│       ├── cooldown-manager.js
│       └── validation.js
├── patterns/
│   ├── troubleshooting-patterns.json  (Initial patterns)
│   └── custom-detectors/               (Custom detection scripts)
├── __tests__/
│   ├── pattern-registry.test.js
│   ├── pattern-detectors.test.js
│   ├── queue-manager.test.js
│   └── integration.test.js
├── docs/
│   ├── SYSTEM-ARCHITECTURE.md (symlink or copy)
│   ├── pattern-registry-spec.md
│   ├── mcp-integration-guide.md
│   └── IMPLEMENTATION-PLAN.md (this file)
├── package.json
├── README.md
└── .gitignore

external-brain/
├── troubleshooting-queue/
│   ├── SUMMARY.md
│   └── archived/
├── documentation-queue/
│   └── archived/
└── testing-queue/
    └── archived/
```

### Knowledge Prerequisites

**AI Assistant Must Understand:**
- Pattern registry specification (pattern-registry-spec.md)
- MCP integration patterns (mcp-integration-guide.md)
- Troubleshooting system (troubleshooting/README.md)
- External brain queue structure
- Checkpoint integration points

---

## Implementation Phases

### Phase Overview

| Phase | Focus | Deliverables | Duration | Dependencies |
|-------|-------|--------------|----------|--------------|
| **Phase 0** | Planning & Setup | Project structure, dependencies | 1-2 hours | None |
| **Phase 1** | Core Infrastructure | Pattern registry, validation, utilities | 4-6 hours | Phase 0 |
| **Phase 2** | Pattern Detectors | 6 detector implementations + tests | 6-8 hours | Phase 1 |
| **Phase 3** | Troubleshooting Patterns | 10 troubleshooting patterns + validation | 3-4 hours | Phase 2 |
| **Phase 4** | Queue System | Queue manager, SUMMARY generation | 4-5 hours | Phase 1, 2 |
| **Phase 5** | Background Monitor | Chokidar watcher, integration | 3-4 hours | Phase 1, 2, 4 |
| **Phase 6** | Checkpoint Integration | /start command, task completion hooks | 4-5 hours | Phase 4, 5 |
| **Phase 7** | Testing & Validation | Unit tests, integration tests, E2E tests | 6-8 hours | All phases |
| **Phase 8** | Documentation & Rollout | Guides, examples, deployment | 2-3 hours | All phases |

**Total Estimated Duration:** 33-45 hours of focused implementation

---

## Detailed Task Breakdown

### Phase 0: Planning & Setup

**Goal:** Prepare project structure and install dependencies

**Tasks:**

1. **Create Project Structure**
   - [ ] Create directory structure (as shown in Prerequisites)
   - [ ] Initialize package.json with dependencies
   - [ ] Create README.md with project overview
   - [ ] Setup .gitignore (node_modules, .DS_Store, etc.)
   - [ ] Create symlinks to architectural docs

2. **Install Dependencies**
   - [ ] `npm install chokidar minimatch fs-extra`
   - [ ] `npm install --save-dev jest @types/node`
   - [ ] Configure jest in package.json
   - [ ] Create test script in package.json

3. **Create External Brain Structure**
   - [ ] Create `external-brain/` directory
   - [ ] Create `troubleshooting-queue/` subdirectory
   - [ ] Create `archived/` subdirectory
   - [ ] Create initial `SUMMARY.md` template
   - [ ] Add to .gitignore: `external-brain/*/!(SUMMARY.md)`

**Success Criteria:**
- ✅ All directories created
- ✅ Dependencies installed without errors
- ✅ Test runner executes (even with no tests)
- ✅ External brain structure exists

**Estimated Duration:** 1-2 hours

---

### Phase 1: Core Infrastructure

**Goal:** Build foundational pattern registry system

**Tasks:**

#### 1.1 Pattern Registry Core (pattern-registry.js)

**File:** `src/pattern-registry.js`

**Requirements:**
- Load patterns from JSON files
- Validate pattern schemas
- Register/unregister patterns
- Get patterns by workflow
- Detect patterns in activity log

**Implementation:**
```javascript
class PatternRegistry {
  constructor() {
    this.patterns = new Map()  // patternId -> Pattern
  }

  // Load patterns from file
  loadPatterns(filePath) {
    const data = fs.readJSONSync(filePath)
    for (const pattern of data.patterns) {
      const validation = validatePattern(pattern)
      if (!validation.valid) {
        throw new Error(`Invalid pattern ${pattern.id}: ${validation.errors.join(', ')}`)
      }
      this.patterns.set(pattern.id, pattern)
    }
  }

  // Register individual pattern
  registerPattern(pattern) {
    const validation = validatePattern(pattern)
    if (!validation.valid) {
      throw new Error(`Invalid pattern: ${validation.errors.join(', ')}`)
    }
    this.patterns.set(pattern.id, pattern)
  }

  // Unregister pattern
  unregisterPattern(patternId) {
    this.patterns.delete(patternId)
  }

  // Get patterns for workflow
  getWorkflowPatterns(workflow) {
    return Array.from(this.patterns.values()).filter(p => p.workflow === workflow)
  }

  // Detect patterns in activity
  detectPatterns(activity) {
    const results = []
    for (const pattern of this.patterns.values()) {
      if (!pattern.enabled) continue
      if (isCooldownActive(pattern)) continue

      const detection = detectPattern(pattern, activity)
      if (detection.matched) {
        results.push({
          pattern,
          context: detection.context,
          timestamp: Date.now()
        })
        setCooldown(pattern.id, pattern.cooldown || 0)
      }
    }
    return sortByPriority(results)
  }
}

module.exports = { PatternRegistry }
```

**Tasks:**
- [ ] Create PatternRegistry class
- [ ] Implement loadPatterns()
- [ ] Implement registerPattern()
- [ ] Implement unregisterPattern()
- [ ] Implement getWorkflowPatterns()
- [ ] Implement detectPatterns()
- [ ] Write unit tests for all methods

#### 1.2 Pattern Validation (src/utils/validation.js)

**Requirements:**
- Validate required fields
- Check ID uniqueness
- Validate trigger type
- Validate conditions for trigger type
- Validate dependencies exist

**Implementation:**
```javascript
function validatePattern(pattern) {
  const errors = []

  // Required fields
  if (!pattern.id) errors.push('Missing required field: id')
  if (!pattern.name) errors.push('Missing required field: name')
  if (!pattern.workflow) errors.push('Missing required field: workflow')
  if (!pattern.trigger) errors.push('Missing required field: trigger')
  if (!pattern.action) errors.push('Missing required field: action')
  if (!pattern.priority) errors.push('Missing required field: priority')

  // Trigger type
  const validTriggerTypes = ['duration', 'command_sequence', 'command_count', 'file_change', 'error_pattern', 'composite', 'custom']
  if (pattern.trigger && !validTriggerTypes.includes(pattern.trigger.type)) {
    errors.push(`Invalid trigger type: ${pattern.trigger.type}`)
  }

  // Priority
  const validPriorities = ['critical', 'high', 'medium', 'low']
  if (pattern.priority && !validPriorities.includes(pattern.priority)) {
    errors.push(`Invalid priority: ${pattern.priority}`)
  }

  // Workflow
  const validWorkflows = ['troubleshooting', 'documentation', 'testing', 'deployment', 'optimization', 'security', 'refactoring', 'custom']
  if (pattern.workflow && !validWorkflows.includes(pattern.workflow)) {
    errors.push(`Invalid workflow: ${pattern.workflow}`)
  }

  return { valid: errors.length === 0, errors }
}

module.exports = { validatePattern }
```

**Tasks:**
- [ ] Create validatePattern()
- [ ] Validate all required fields
- [ ] Validate enums (trigger type, priority, workflow)
- [ ] Write unit tests for validation

#### 1.3 Cooldown Manager (src/utils/cooldown-manager.js)

**Requirements:**
- Track cooldown state per pattern
- Check if cooldown active
- Set cooldown with expiry
- Clean up expired cooldowns

**Implementation:**
```javascript
const cooldowns = new Map()  // patternId -> expiryTimestamp

function isCooldownActive(pattern) {
  const expiry = cooldowns.get(pattern.id)
  if (!expiry) return false

  if (Date.now() < expiry) {
    return true
  } else {
    cooldowns.delete(pattern.id)
    return false
  }
}

function setCooldown(patternId, seconds) {
  if (seconds > 0) {
    cooldowns.set(patternId, Date.now() + (seconds * 1000))
  }
}

function clearCooldown(patternId) {
  cooldowns.delete(patternId)
}

module.exports = { isCooldownActive, setCooldown, clearCooldown }
```

**Tasks:**
- [ ] Create cooldown manager
- [ ] Implement isCooldownActive()
- [ ] Implement setCooldown()
- [ ] Implement clearCooldown()
- [ ] Write unit tests

#### 1.4 Activity Parser (src/activity-parser.js)

**Requirements:**
- Parse .workspace-activity.jsonl
- Read last N lines efficiently
- Filter by time window
- Handle malformed entries gracefully

**Implementation:**
```javascript
const fs = require('fs-extra')
const readline = require('readline')

async function parseRecentActivity(activityLogPath, lookbackSeconds = 300) {
  const lines = await readLastNLines(activityLogPath, 100)
  const activities = lines
    .map(line => {
      try {
        return JSON.parse(line)
      } catch (e) {
        return null
      }
    })
    .filter(a => a !== null)

  const cutoff = Date.now() - (lookbackSeconds * 1000)
  return activities.filter(a => new Date(a.timestamp).getTime() >= cutoff)
}

async function readLastNLines(filePath, n) {
  if (!await fs.pathExists(filePath)) return []

  const lines = []
  const stream = fs.createReadStream(filePath)
  const rl = readline.createInterface({ input: stream })

  for await (const line of rl) {
    lines.push(line)
    if (lines.length > n) lines.shift()
  }

  return lines
}

module.exports = { parseRecentActivity }
```

**Tasks:**
- [ ] Create activity parser
- [ ] Implement parseRecentActivity()
- [ ] Implement readLastNLines()
- [ ] Handle missing/malformed files
- [ ] Write unit tests

**Phase 1 Success Criteria:**
- ✅ PatternRegistry class fully implemented
- ✅ Pattern validation working
- ✅ Cooldown manager functional
- ✅ Activity parser handles edge cases
- ✅ All unit tests passing

**Estimated Duration:** 4-6 hours

---

### Phase 2: Pattern Detectors

**Goal:** Implement all pattern detection types

**Tasks:**

#### 2.1 Duration Detector (src/pattern-detectors/duration-detector.js)

**Requirements:**
- Calculate duration between first and last relevant activity
- Filter by activity type if specified
- Return matched + context

**Implementation:**
```javascript
function detectDuration(pattern, activity) {
  const { threshold, activityType } = pattern.trigger.conditions

  let relevantActivity = activity
  if (activityType === 'troubleshooting') {
    relevantActivity = activity.filter(a =>
      (a.action === 'bash' && a.exitCode !== 0) ||
      (a.action === 'read' && a.file.includes('troubleshooting')) ||
      (a.action === 'edit' && a.reason === 'fix_error')
    )
  }

  if (relevantActivity.length < 2) {
    return { matched: false }
  }

  const first = new Date(relevantActivity[0].timestamp).getTime()
  const last = new Date(relevantActivity[relevantActivity.length - 1].timestamp).getTime()
  const duration = (last - first) / 1000  // seconds

  if (duration >= threshold) {
    return {
      matched: true,
      context: {
        duration,
        activities: relevantActivity,
        startTime: relevantActivity[0].timestamp,
        endTime: relevantActivity[relevantActivity.length - 1].timestamp
      }
    }
  }

  return { matched: false }
}

module.exports = { detectDuration }
```

**Tasks:**
- [ ] Implement detectDuration()
- [ ] Handle activityType filtering
- [ ] Calculate duration correctly
- [ ] Write unit tests

#### 2.2 Command Sequence Detector (src/pattern-detectors/command-sequence-detector.js)

**Requirements:**
- Detect sequence of commands matching patterns
- Support ordered/unordered sequences
- Check within time window

**Tasks:**
- [ ] Implement detectCommandSequence()
- [ ] Support regex patterns for commands
- [ ] Handle ordered vs unordered
- [ ] Check time window
- [ ] Write unit tests

#### 2.3 Command Count Detector (src/pattern-detectors/command-count-detector.js)

**Requirements:**
- Count commands matching pattern
- Within specified time window
- Threshold-based triggering

**Tasks:**
- [ ] Implement detectCommandCount()
- [ ] Support command pattern regex
- [ ] Filter by time window
- [ ] Write unit tests

#### 2.4 File Change Detector (src/pattern-detectors/file-change-detector.js)

**Requirements:**
- Detect file changes matching glob pattern
- Filter by change type (create/edit/delete)
- Optional reason filtering

**Tasks:**
- [ ] Implement detectFileChange()
- [ ] Use minimatch for glob patterns
- [ ] Filter by changeType
- [ ] Filter by reason if specified
- [ ] Write unit tests

#### 2.5 Error Pattern Detector (src/pattern-detectors/error-pattern-detector.js)

**Requirements:**
- Detect error messages in command output
- Support regex patterns
- Count occurrences
- Filter by source (bash/any)

**Tasks:**
- [ ] Implement detectErrorPattern()
- [ ] Search stdout/stderr for patterns
- [ ] Filter by source
- [ ] Count occurrences
- [ ] Write unit tests

#### 2.6 Composite Detector (src/pattern-detectors/composite-detector.js)

**Requirements:**
- Combine multiple sub-triggers
- Support AND/OR operators
- Recursively detect sub-patterns

**Tasks:**
- [ ] Implement detectComposite()
- [ ] Recursively call appropriate detectors
- [ ] Combine results with AND/OR
- [ ] Write unit tests

**Phase 2 Success Criteria:**
- ✅ All 6 detector types implemented
- ✅ Each detector has comprehensive unit tests
- ✅ Edge cases handled (empty activity, malformed data)
- ✅ All tests passing

**Estimated Duration:** 6-8 hours

---

### Phase 3: Troubleshooting Patterns

**Goal:** Create initial set of troubleshooting patterns

**Tasks:**

#### 3.1 Create Pattern Definitions (patterns/troubleshooting-patterns.json)

**Requirements:**
- 10 troubleshooting patterns as specified in pattern-registry-spec.md
- All patterns validated
- Reasonable cooldowns set
- Helpful metadata included

**Patterns to Create:**
1. troubleshooting-time-threshold (duration: 5 min)
2. troubleshooting-multiple-diagnostics (command_count: 3+)
3. troubleshooting-backup-restore (command_sequence)
4. troubleshooting-config-change-after-error (file_change)
5. troubleshooting-build-failure (error_pattern)
6. troubleshooting-test-failure (error_pattern)
7. troubleshooting-multiple-attempts (composite: duration + command_count)
8. troubleshooting-research-required (file_change: docs read)
9. troubleshooting-breaking-change (future)
10. troubleshooting-workaround-applied (future)

**Tasks:**
- [ ] Create troubleshooting-patterns.json
- [ ] Define all 10 patterns with complete metadata
- [ ] Validate JSON syntax
- [ ] Load patterns in registry and verify no errors
- [ ] Test each pattern with simulated activity

#### 3.2 Pattern Testing

**Requirements:**
- Create test activity logs for each pattern
- Verify each pattern triggers correctly
- Verify no false positives
- Document expected vs actual behavior

**Tasks:**
- [ ] Create test activity logs
- [ ] Test each pattern individually
- [ ] Test multiple patterns simultaneously
- [ ] Test cooldown functionality
- [ ] Document any edge cases discovered

**Phase 3 Success Criteria:**
- ✅ All 10 patterns defined and valid
- ✅ Each pattern tested with realistic activity
- ✅ False positive rate <10%
- ✅ Detection accuracy >95%

**Estimated Duration:** 3-4 hours

---

### Phase 4: Queue System

**Goal:** Implement external brain queue management

**Tasks:**

#### 4.1 Queue Manager (src/queue-manager.js)

**Requirements:**
- Write detected patterns to queue files
- Generate queue items from detections
- Update SUMMARY.md
- Archive processed items
- Get pending items sorted by priority

**Implementation:**
```javascript
class QueueManager {
  constructor(queueBasePath = 'external-brain') {
    this.queueBasePath = queueBasePath
  }

  async writeToQueue(detections) {
    for (const detection of detections) {
      const queueDir = path.join(this.queueBasePath, `${detection.pattern.workflow}-queue`)
      await fs.ensureDir(queueDir)

      const queueItem = this.formatQueueItem(detection)
      const filename = `${this.generateId()}-${kebabCase(detection.pattern.name)}.md`
      const filepath = path.join(queueDir, filename)

      await fs.writeFile(filepath, queueItem)
    }

    // Update SUMMARY.md for each workflow
    const workflows = [...new Set(detections.map(d => d.pattern.workflow))]
    for (const workflow of workflows) {
      await this.updateSummary(workflow)
    }
  }

  formatQueueItem(detection) {
    // Format as markdown with YAML frontmatter
    // See pattern-registry-spec.md for format
  }

  async updateSummary(workflow) {
    // Generate SUMMARY.md for workflow queue
    // List pending items by priority
  }

  async archiveItem(workflow, itemId) {
    // Move item to archived/
  }

  async getPendingItems(workflow) {
    // Get all pending items sorted by priority
  }
}

module.exports = { QueueManager }
```

**Tasks:**
- [ ] Create QueueManager class
- [ ] Implement writeToQueue()
- [ ] Implement formatQueueItem()
- [ ] Implement updateSummary()
- [ ] Implement archiveItem()
- [ ] Implement getPendingItems()
- [ ] Write unit tests

#### 4.2 Queue Item Format

**Requirements:**
- YAML frontmatter with metadata
- Markdown body with sections:
  - Issue description
  - Context
  - Detected activity (JSON)
  - Suggested actions
  - Auto-resolution status

**Tasks:**
- [ ] Create queue item template
- [ ] Implement formatQueueItem()
- [ ] Include all required sections
- [ ] Format activity excerpt as JSON
- [ ] Test with various detection types

#### 4.3 SUMMARY.md Generation

**Requirements:**
- Quick overview of pending items
- Grouped by priority
- Statistics (total detected, processed, time saved)
- Processing instructions for AI

**Tasks:**
- [ ] Create SUMMARY template
- [ ] Implement summary generation
- [ ] Calculate statistics
- [ ] Sort items by priority
- [ ] Test with multiple pending items

**Phase 4 Success Criteria:**
- ✅ Queue manager fully functional
- ✅ Queue items formatted correctly
- ✅ SUMMARY.md accurate and helpful
- ✅ Archive mechanism working
- ✅ All unit tests passing

**Estimated Duration:** 4-5 hours

---

### Phase 5: Background Monitor

**Goal:** Create background process to watch activity log

**Tasks:**

#### 5.1 Monitor Core (src/monitor.js)

**Requirements:**
- Watch .workspace-activity.jsonl with chokidar
- Parse recent activity on changes
- Detect patterns using PatternRegistry
- Write to queue using QueueManager
- Error handling and logging

**Implementation:**
```javascript
const chokidar = require('chokidar')
const { PatternRegistry } = require('./pattern-registry')
const { QueueManager } = require('./queue-manager')
const { parseRecentActivity } = require('./activity-parser')

class ActivityMonitor {
  constructor(activityLogPath = '.workspace-activity.jsonl') {
    this.activityLogPath = activityLogPath
    this.registry = new PatternRegistry()
    this.queueManager = new QueueManager()
    this.watcher = null
  }

  loadPatterns() {
    // Load all pattern files
    const patternFiles = fs.readdirSync('patterns')
      .filter(f => f.endsWith('.json'))

    for (const file of patternFiles) {
      this.registry.loadPatterns(path.join('patterns', file))
    }
  }

  async start() {
    console.log(`Starting activity monitor...`)
    console.log(`Watching: ${this.activityLogPath}`)

    this.loadPatterns()
    console.log(`Loaded ${this.registry.patterns.size} patterns`)

    this.watcher = chokidar.watch(this.activityLogPath)
      .on('change', async (path) => {
        await this.processActivity()
      })

    console.log('Monitor running. Press Ctrl+C to stop.')
  }

  async processActivity() {
    try {
      const activity = await parseRecentActivity(this.activityLogPath)
      const detections = this.registry.detectPatterns(activity)

      if (detections.length > 0) {
        console.log(`Detected ${detections.length} patterns`)
        await this.queueManager.writeToQueue(detections)
      }
    } catch (error) {
      console.error('Error processing activity:', error)
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const monitor = new ActivityMonitor()
  monitor.start()

  process.on('SIGINT', () => {
    console.log('Stopping monitor...')
    monitor.stop()
    process.exit(0)
  })
}

module.exports = { ActivityMonitor }
```

**Tasks:**
- [ ] Create ActivityMonitor class
- [ ] Implement loadPatterns()
- [ ] Implement start()
- [ ] Implement processActivity()
- [ ] Implement stop()
- [ ] Add error handling
- [ ] Add logging
- [ ] Test with simulated activity

#### 5.2 Start Script

**Requirements:**
- Easy way to start monitor
- Run in background
- Logging to file

**Tasks:**
- [ ] Create start-monitor.sh script
- [ ] Add npm script: "start": "node src/monitor.js"
- [ ] Document how to start/stop
- [ ] Test starting and stopping

**Phase 5 Success Criteria:**
- ✅ Monitor watches activity log
- ✅ Patterns detected automatically
- ✅ Queue items written correctly
- ✅ Error handling robust
- ✅ Can start/stop easily

**Estimated Duration:** 3-4 hours

---

### Phase 6: Checkpoint Integration

**Goal:** Integrate queue processing into /start command and task completion

**Tasks:**

#### 6.1 Update /start Command

**Requirements:**
- Check external brain for pending items
- Process items with appropriate MCPs
- Mark as processed and archive
- Update SUMMARY

**Location:** `.claude/commands/start.md`

**Implementation:**
```markdown
# /start Command

You are starting a new work session. Follow these steps:

1. **Read workspace guide:**
   - Read /WORKSPACE_GUIDE.md for context

2. **Check external brain for pending items:**
   - Read external-brain/troubleshooting-queue/SUMMARY.md
   - If pending items found:
     - Process each item by priority
     - Use appropriate MCPs (learning-optimizer, project-management, etc.)
     - Mark as processed and move to archived/
     - Update SUMMARY.md

3. **Continue with user request:**
   - Ask user what they'd like to work on
```

**Tasks:**
- [ ] Update /start command to include checkpoint
- [ ] Create helper function to process queue
- [ ] Test with pending queue items
- [ ] Verify items archived after processing

#### 6.2 Task Completion Checkpoint

**Requirements:**
- After task-executor workflow completes
- Check queue for new items detected during task
- Process if any found

**Implementation:**
Add to task-executor completion logic:
```javascript
// After workflow archived
async function checkQueueAfterTask() {
  const newItems = await getQueueItemsSince(taskStartTime)

  if (newItems.length > 0) {
    console.log(`Processing ${newItems.length} items detected during task...`)
    for (const item of newItems) {
      await processQueueItem(item)
    }
  }
}
```

**Tasks:**
- [ ] Add checkpoint to task completion
- [ ] Create getQueueItemsSince() helper
- [ ] Test with simulated queue items
- [ ] Verify processing works

#### 6.3 Queue Processing Logic

**Requirements:**
- Route queue items to appropriate MCPs
- learning-optimizer for troubleshooting
- project-management for complex issues
- task-executor for direct fixes
- Validation with testing-validation and security-compliance

**Implementation:**
```javascript
async function processQueueItem(item) {
  console.log(`Processing queue item: ${item.title}`)

  // Route based on workflow
  if (item.workflow === 'troubleshooting') {
    // Use learning-optimizer
    const result = await mcp__learning_optimizer__track_issue({
      domain: item.metadata.domain,
      title: item.title,
      symptom: extractSymptom(item.context),
      solution: extractSolution(item.context),
      root_cause: analyzeRootCause(item.context),
      prevention: suggestPrevention(item.context),
      context: item.context
    })

    // Check optimization triggers
    const triggers = await mcp__learning_optimizer__check_optimization_triggers({
      domain: item.metadata.domain
    })

    if (triggers.triggered) {
      await mcp__learning_optimizer__optimize_knowledge_base({
        domain: item.metadata.domain
      })
    }
  }

  // Archive item
  await QueueManager.archiveItem(item.workflow, item.id)

  console.log(`✓ Processed: ${item.title}`)
}
```

**Tasks:**
- [ ] Create processQueueItem() function
- [ ] Implement routing logic
- [ ] Add learning-optimizer integration
- [ ] Add project-management integration
- [ ] Add validation integrations
- [ ] Test with various queue items

**Phase 6 Success Criteria:**
- ✅ /start command checks queue
- ✅ Queue items processed with correct MCPs
- ✅ Items archived after processing
- ✅ SUMMARY updated correctly
- ✅ End-to-end flow working

**Estimated Duration:** 4-5 hours

---

### Phase 7: Testing & Validation

**Goal:** Comprehensive test coverage and validation

**Tasks:**

#### 7.1 Unit Tests

**Coverage Requirements:**
- pattern-registry.js (100%)
- All detectors (100%)
- queue-manager.js (100%)
- activity-parser.js (100%)
- Utilities (100%)

**Tasks:**
- [ ] Write tests for PatternRegistry
- [ ] Write tests for each detector
- [ ] Write tests for QueueManager
- [ ] Write tests for ActivityParser
- [ ] Write tests for utilities
- [ ] Achieve >90% code coverage

#### 7.2 Integration Tests

**Scenarios to Test:**
- Activity → Detection → Queue
- Queue → Processing → Archive
- Multiple patterns detected simultaneously
- Cooldown prevents duplicate detections
- Priority sorting works correctly

**Tasks:**
- [ ] Create integration test suite
- [ ] Test activity to queue flow
- [ ] Test queue processing flow
- [ ] Test concurrent pattern detection
- [ ] Test cooldown mechanism
- [ ] Test priority sorting

#### 7.3 End-to-End Tests

**Scenarios:**
1. AI troubleshoots issue → Pattern detected → Queued → /start processes → Learning-optimizer logs
2. AI modifies code → Missing tests detected → Queued → Checkpoint processes → Tests written
3. AI changes config → Security pattern detected → Queued → Immediately processed (critical priority)

**Tasks:**
- [ ] Create E2E test suite
- [ ] Simulate complete workflows
- [ ] Test with real MCPs (if available)
- [ ] Validate queue persistence
- [ ] Test across session restarts

#### 7.4 Performance Tests

**Requirements:**
- Monitor handles large activity logs (10k+ lines)
- Pattern detection completes in <1 second
- Queue writing non-blocking
- No memory leaks

**Tasks:**
- [ ] Create performance test suite
- [ ] Test with large activity logs
- [ ] Benchmark detection speed
- [ ] Test memory usage over time
- [ ] Optimize if needed

**Phase 7 Success Criteria:**
- ✅ >90% unit test coverage
- ✅ All integration tests passing
- ✅ E2E scenarios validated
- ✅ Performance within acceptable limits
- ✅ No critical bugs found

**Estimated Duration:** 6-8 hours

---

### Phase 8: Documentation & Rollout

**Goal:** Complete documentation and deploy to production

**Tasks:**

#### 8.1 Documentation

**Documents to Create/Update:**
1. README.md - Project overview, setup, usage
2. USAGE-GUIDE.md - How to use the system
3. TROUBLESHOOTING.md - Common issues and solutions
4. CONTRIBUTING.md - How to add new patterns/workflows
5. Update WORKSPACE_GUIDE.md - Include checkpoint integration
6. Update SYSTEM-ARCHITECTURE.md - Confirm implementation status

**Tasks:**
- [ ] Write comprehensive README
- [ ] Create usage guide with examples
- [ ] Document troubleshooting tips
- [ ] Create contribution guide
- [ ] Update workspace guide
- [ ] Update system architecture

#### 8.2 Example Patterns

**Requirements:**
- Example patterns for future workflows
- Documentation patterns
- Testing patterns
- Deployment patterns

**Tasks:**
- [ ] Create documentation-patterns-example.json
- [ ] Create testing-patterns-example.json
- [ ] Create deployment-patterns-example.json
- [ ] Document how to create custom patterns

#### 8.3 Rollout

**Steps:**
1. Deploy monitor to local-instances/tools/
2. Start monitor as background process
3. Test with real AI activity
4. Monitor for issues
5. Iterate based on feedback

**Tasks:**
- [ ] Deploy to production location
- [ ] Start monitor in background
- [ ] Simulate AI activity
- [ ] Verify detections occur
- [ ] Process queue at checkpoint
- [ ] Fix any issues found
- [ ] Document lessons learned

**Phase 8 Success Criteria:**
- ✅ Comprehensive documentation
- ✅ Example patterns provided
- ✅ Monitor running in production
- ✅ No critical issues in first week
- ✅ Positive user feedback

**Estimated Duration:** 2-3 hours

---

## Testing Strategy

### Test Pyramid

```
     /\
    /E2E\        ← 10% (End-to-end scenarios)
   /------\
  /  Integ \     ← 20% (Integration tests)
 /----------\
/   Unit     \   ← 70% (Unit tests)
--------------
```

### Unit Testing

**Tools:** Jest

**Coverage Goals:**
- Overall: >90%
- Critical paths: 100%

**What to Test:**
- Pattern validation
- Each detector individually
- Queue formatting
- Activity parsing
- Cooldown management
- Edge cases (empty input, malformed data, etc.)

### Integration Testing

**What to Test:**
- PatternRegistry.detectPatterns() with real activity
- QueueManager.writeToQueue() creates correct files
- ActivityMonitor processes activity and writes queue
- Checkpoint integration with MCPs

### End-to-End Testing

**Scenarios:**
1. **Troubleshooting Issue Logging:**
   - Simulate 12 min troubleshooting session
   - Verify pattern detected
   - Verify queue item created
   - Simulate /start checkpoint
   - Verify learning-optimizer called
   - Verify item archived

2. **Missing Test Coverage:**
   - Create new source file
   - Verify pattern detected
   - Verify queue item created
   - Simulate checkpoint
   - Verify tests written

3. **Security Credential Detection:**
   - Add credential to code
   - Verify pattern detected (critical priority)
   - Verify immediate processing
   - Verify credential removed

### Performance Testing

**Benchmarks:**
- Activity parsing: <100ms for 10k lines
- Pattern detection: <1s for 100 activities
- Queue writing: <50ms per item
- Memory usage: <100MB steady state

---

## Rollout Strategy

### Phase 1: Local Testing (Week 1)

**Goal:** Validate functionality in controlled environment

**Steps:**
1. Deploy to local dev environment
2. Manually simulate activities
3. Verify detections accurate
4. Test queue processing
5. Fix any issues found

**Success Criteria:**
- All tests passing
- No critical bugs
- Detection accuracy >95%

### Phase 2: Shadow Mode (Week 2)

**Goal:** Run alongside normal workflow without affecting operations

**Steps:**
1. Start monitor in production
2. Run for 1 week without processing queue
3. Review detections for false positives
4. Tune patterns as needed
5. Document any issues

**Success Criteria:**
- False positive rate <10%
- No performance degradation
- Patterns catching expected issues

### Phase 3: Assisted Mode (Week 3)

**Goal:** Process queue with AI supervision

**Steps:**
1. Enable checkpoint integration
2. AI processes queue but asks user for confirmation
3. Track success/failure of processing
4. Gather user feedback
5. Iterate on patterns

**Success Criteria:**
- Processing success rate >80%
- Positive user feedback
- No major issues

### Phase 4: Autonomous Mode (Week 4+)

**Goal:** Fully autonomous operation

**Steps:**
1. Enable full autonomy
2. AI processes queue without confirmation
3. Monitor for issues
4. Continuous improvement based on data
5. Expand to new workflows

**Success Criteria:**
- Time saved measurable
- Prevention success rate increasing
- System self-improving

---

## Success Criteria

### Technical Success

- ✅ All patterns detect correctly (>95% accuracy)
- ✅ False positive rate <10%
- ✅ Queue persistence working
- ✅ Checkpoint integration seamless
- ✅ MCP integrations functional
- ✅ Performance acceptable (<1s detection)
- ✅ No critical bugs in first month

### Operational Success

- ✅ Issue logging automatic (0% forgotten)
- ✅ Queue processing >90% at checkpoints
- ✅ Learning-optimizer integration working
- ✅ Patterns promoted to checklists
- ✅ Time saved measurable

### Strategic Success

- ✅ Prevention success rate >80%
- ✅ Recurring issues decreasing
- ✅ Compounding improvements evident
- ✅ Extensible to new workflows
- ✅ Positive AI and user feedback

---

## Timeline & Estimates

### Optimistic Timeline (33 hours)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Setup | 1 hour | None |
| Phase 1: Core | 4 hours | Phase 0 |
| Phase 2: Detectors | 6 hours | Phase 1 |
| Phase 3: Patterns | 3 hours | Phase 2 |
| Phase 4: Queue | 4 hours | Phase 1, 2 |
| Phase 5: Monitor | 3 hours | Phase 1, 2, 4 |
| Phase 6: Integration | 4 hours | Phase 4, 5 |
| Phase 7: Testing | 6 hours | All |
| Phase 8: Docs & Rollout | 2 hours | All |
| **Total** | **33 hours** | |

### Realistic Timeline (45 hours)

Includes debugging, iteration, and unexpected issues:
- **Core Development:** 25 hours (Phases 0-6)
- **Testing & Validation:** 12 hours (Phase 7)
- **Documentation & Rollout:** 8 hours (Phase 8)
- **Buffer for Issues:** +15 hours
- **Total:** 45 hours

### Schedule (Part-Time Work)

Assuming 4-6 hours per day:
- **Week 1:** Phases 0-3 (Core + Detectors + Patterns)
- **Week 2:** Phases 4-5 (Queue + Monitor)
- **Week 3:** Phase 6-7 (Integration + Testing)
- **Week 4:** Phase 8 (Documentation + Rollout)

---

## Risk Mitigation

### Risk 1: Activity Log Format Changes

**Risk:** AI changes how it logs to .workspace-activity.jsonl

**Impact:** High - Monitor breaks

**Mitigation:**
- Document expected activity log format
- Add schema validation to activity parser
- Gracefully handle unknown fields
- Version the activity log format

### Risk 2: Pattern False Positives

**Risk:** Patterns trigger too frequently or incorrectly

**Impact:** Medium - Queue fills with noise

**Mitigation:**
- Start with conservative thresholds
- Implement cooldowns on all patterns
- Monitor false positive rate during shadow mode
- Tune patterns based on data
- Allow disabling individual patterns

### Risk 3: MCP Integration Failures

**Risk:** learning-optimizer or other MCPs unavailable

**Impact:** Medium - Queue processing fails

**Mitigation:**
- Fallback to manual logging if MCP unavailable
- Document manual processing procedures
- Queue persists across sessions
- Retry processing at next checkpoint

### Risk 4: Performance Degradation

**Risk:** Monitor slows down AI operations

**Impact:** High - User experience suffers

**Mitigation:**
- Run monitor as separate process
- Use efficient file watching (chokidar)
- Limit activity parsing to recent entries
- Optimize detection algorithms
- Benchmark during development

### Risk 5: Queue Overflow

**Risk:** Too many patterns detected, queue becomes overwhelming

**Impact:** Medium - AI spends too much time processing queue

**Mitigation:**
- Implement priority-based processing
- Set time limits on queue processing
- Allow deferring low-priority items
- Aggregate similar items
- Monitor queue size

### Risk 6: Pattern Configuration Complexity

**Risk:** Adding new patterns becomes too difficult

**Impact:** Low - Limits extensibility

**Mitigation:**
- Comprehensive documentation
- Pattern templates and examples
- Validation with helpful error messages
- Pattern registry UI (future)

---

## Next Steps

### Immediate (This Session)

1. **Review this implementation plan**
   - Confirm approach with user
   - Adjust timeline if needed
   - Identify any blockers

2. **Begin Phase 0: Setup**
   - Create project structure
   - Install dependencies
   - Setup external brain directories

### Short-Term (Next 1-2 Weeks)

1. **Implement Core Infrastructure (Phases 1-3)**
   - Pattern registry system
   - All detector types
   - Initial troubleshooting patterns

2. **Implement Queue System (Phase 4)**
   - Queue manager
   - Item formatting
   - SUMMARY generation

3. **Build Background Monitor (Phase 5)**
   - Chokidar watcher
   - Integration with registry and queue

### Medium-Term (Weeks 3-4)

1. **Checkpoint Integration (Phase 6)**
   - Update /start command
   - Add task completion hooks
   - Test end-to-end flow

2. **Comprehensive Testing (Phase 7)**
   - Unit tests
   - Integration tests
   - E2E scenarios
   - Performance validation

3. **Documentation & Rollout (Phase 8)**
   - Write all docs
   - Deploy to production
   - Monitor for issues

### Long-Term (Month 2+)

1. **Expand Workflows**
   - Documentation patterns
   - Testing patterns
   - Deployment patterns
   - Security patterns

2. **Advanced Features**
   - Dynamic pattern registration
   - Pattern analytics dashboard
   - ML-based pattern optimization
   - Multi-workspace support

3. **MCP Ecosystem Integration**
   - More MCPs register patterns
   - Collaborative queue processing
   - Cross-MCP workflows
   - Pattern sharing between projects

---

## Appendix

### A. Directory Structure (Complete)

```
operations-workspace/
├── local-instances/tools/workspace-activity-monitor/
│   ├── src/
│   │   ├── pattern-registry.js
│   │   ├── queue-manager.js
│   │   ├── activity-parser.js
│   │   ├── monitor.js
│   │   ├── pattern-detectors/
│   │   │   ├── duration-detector.js
│   │   │   ├── command-sequence-detector.js
│   │   │   ├── command-count-detector.js
│   │   │   ├── file-change-detector.js
│   │   │   ├── error-pattern-detector.js
│   │   │   └── composite-detector.js
│   │   └── utils/
│   │       ├── cooldown-manager.js
│   │       └── validation.js
│   ├── patterns/
│   │   ├── troubleshooting-patterns.json
│   │   ├── documentation-patterns-example.json
│   │   ├── testing-patterns-example.json
│   │   └── custom-detectors/
│   ├── __tests__/
│   │   ├── pattern-registry.test.js
│   │   ├── pattern-detectors.test.js
│   │   ├── queue-manager.test.js
│   │   └── integration.test.js
│   ├── docs/
│   │   ├── pattern-registry-spec.md
│   │   ├── mcp-integration-guide.md
│   │   └── IMPLEMENTATION-PLAN.md
│   ├── package.json
│   ├── README.md
│   └── .gitignore
│
├── external-brain/
│   ├── troubleshooting-queue/
│   │   ├── SUMMARY.md
│   │   └── archived/
│   ├── documentation-queue/
│   │   ├── SUMMARY.md
│   │   └── archived/
│   └── testing-queue/
│       ├── SUMMARY.md
│       └── archived/
│
└── .workspace-activity.jsonl
```

### B. Key Technologies

- **Node.js** v18+ - Runtime environment
- **chokidar** - Efficient file watching
- **minimatch** - Glob pattern matching
- **fs-extra** - Enhanced file operations
- **jest** - Testing framework

### C. Related MCP Servers

- **learning-optimizer** (v1.0.0) - Issue tracking and optimization
- **project-management** (v3.0.0) - Goal management and orchestration
- **task-executor** (v2.0.0) - Task workflow execution
- **testing-validation** (v0.1.0) - Quality gates and validation
- **security-compliance** (v1.0.0) - Security scanning

---

**Version:** 1.0.0
**Created:** 2025-10-29
**Status:** Active - Ready for implementation
**Next Action:** Review with user and begin Phase 0

---

## Sign-Off

This implementation plan has been designed to be:
- ✅ Comprehensive - Covers all aspects of implementation
- ✅ Actionable - Clear tasks with success criteria
- ✅ Realistic - Timeline accounts for debugging and iteration
- ✅ Extensible - Architecture supports future workflows
- ✅ Testable - Comprehensive testing strategy
- ✅ Documented - All decisions and rationale captured

**Ready to proceed with implementation.**

---

## Implementation Decision & Prioritization

**Date:** 2025-10-29
**Decision By:** AI Assistant + User Review

### Review Summary

The implementation plan has been reviewed and validated:

**✅ Design Quality:**
- Comprehensive 8-phase implementation roadmap
- Clear task breakdown with code examples
- Robust testing and rollout strategy
- Extensible architecture supporting future workflows
- Strong MCP integration design

**✅ Feasibility:**
- Realistic timeline: 33-45 hours implementation
- All prerequisites available (Node.js, existing MCPs)
- No blocking technical dependencies
- Incremental rollout strategy minimizes risk

**✅ Strategic Value:**
- Closes critical feedback loop gap (AI forgetting to log issues)
- Enables automatic issue logging (0% forgotten)
- Provides cross-session persistence via external brain
- Supports compounding prevention success rates
- Extensible to any workflow (not just troubleshooting)

### Decision: **DEFER IMPLEMENTATION**

**Rationale:**

While the workspace-activity-monitor design is complete and valuable, implementation will be **deferred** to prioritize the **multi-subagent architecture**.

**Reasons:**

1. **Higher Priority Initiative:** Multi-subagent architecture is the next strategic focus
2. **Current Workarounds Adequate:** Existing feedback loop processes (manual logging, post-resolution checklist) are functional, though not automatic
3. **Design Preserved:** Complete specifications documented and ready for future implementation
4. **No Immediate Blocker:** Current workflow can continue effectively without this system
5. **Better Context After Multi-Subagent:** Subagent architecture may inform better integration patterns for workspace-activity-monitor

### Recommended Implementation Timeline

**When to Implement:**
- **After multi-subagent architecture is complete** and stabilized
- When recurring issues create measurable pain (e.g., 3+ instances of forgotten issue logging)
- When extending to new workflows (documentation, testing, security) becomes priority
- When autonomous AI capabilities become strategic focus

**Estimated Start Date:** 2-4 weeks from now (after multi-subagent work)

### Transition to Multi-Subagent Architecture

**Immediate Next Steps:**

1. **Archive workspace-activity-monitor design:**
   - ✅ All specifications documented (pattern-registry-spec.md, mcp-integration-guide.md, IMPLEMENTATION-PLAN.md)
   - ✅ SYSTEM-ARCHITECTURE.md updated with Proactive Engagement Layer
   - ✅ Design ready for implementation when prioritized

2. **Shift focus to multi-subagent architecture:**
   - Review existing subagent ideas and documentation
   - Define multi-subagent architecture requirements
   - Design subagent orchestration patterns
   - Plan implementation roadmap

3. **Future Integration Opportunity:**
   - Multi-subagent architecture may enable better workspace-activity-monitor integration
   - Subagents could consume external brain queue as workflow trigger
   - Pattern detection could spawn subagents for resolution

### Value Retention

**What We've Achieved:**
- ✅ Identified and documented critical feedback loop gap
- ✅ Designed comprehensive solution architecture
- ✅ Created extensible pattern registry specification
- ✅ Documented MCP integration patterns
- ✅ Produced ready-to-implement plan

**What We're Deferring:**
- Implementation of pattern detectors
- Background monitor development
- Queue system coding
- Checkpoint integration
- Testing and rollout

**What Remains Valuable:**
- Design documents serve as reference architecture
- Pattern concepts applicable to multi-subagent design
- External brain queue concept may inform subagent communication
- Checkpoint integration patterns relevant to any proactive system

### If Urgent Need Arises

**Quick Implementation Path (Minimal Viable Product):**

If feedback loop gap becomes critical before multi-subagent work completes:

1. **Phase 0 + 1 + 4 Only** (~10 hours):
   - Basic pattern registry
   - Simple duration detector only
   - Manual queue system (markdown files in external-brain/)
   - No background monitor (AI manually checks at /start)

2. **Manual Checkpoint Integration** (~2 hours):
   - Update /start command to read external-brain/troubleshooting-queue/
   - Simple processing with learning-optimizer
   - Manual archiving

**Total MVP:** 12 hours vs. 45 hours full implementation

### Status Update

**workspace-activity-monitor:**
- **Status:** Design Complete, Implementation Deferred
- **Priority:** Medium (after multi-subagent architecture)
- **Readiness:** Ready for implementation when prioritized
- **Next Review:** After multi-subagent architecture complete

**Next Initiative:**
- **Focus:** Multi-subagent architecture
- **Status:** Planning phase
- **Priority:** High (immediate)
- **Action:** Begin requirements and design

---

**Decision Finalized:** 2025-10-29
**Approved By:** User
**Next Action:** Transition to multi-subagent architecture planning
