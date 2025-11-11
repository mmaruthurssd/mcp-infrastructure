---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, documentation, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# Spec-Driven MCP Server Enhancements (v0.2.0)

**Version**: 0.2.0
**Date**: 2025-10-25
**Inspired by**: Taskmaster AI architecture patterns

---

## Overview

This document describes the enhancements added to the Spec-Driven MCP Server, inspired by Taskmaster AI's approach to task management, complexity analysis, and research integration.

## New Features

### 1. Research Best Practices Tool

**Tool**: `research_best_practices`

Provides structured guidance for researching technical topics and making informed technology decisions.

#### What It Does
- Generates optimized search queries for your research topic
- Identifies key topics to investigate
- Defines evaluation criteria for assessing solutions
- Recommends resource types
- Provides cautionary notes (especially for PHI/HIPAA contexts)

#### Usage
```typescript
research_best_practices({
  topic: "React state management",
  context: "medical practice management system with PHI handling",
  specificQuestions: ["How to handle sensitive data?", "Performance considerations?"],
  constraints: ["must support TypeScript", "HIPAA compliant"]
})
```

#### Output
- **Search Queries**: Optimized queries for web search
- **Key Topics**: Important areas to investigate
- **Evaluation Criteria**: How to assess different solutions
- **Resource Types**: Where to find reliable information
- **Cautionary Notes**: Special considerations (PHI, security, etc.)

#### Healthcare Context
When PHI/HIPAA is detected in the context, the tool automatically adds:
- HIPAA compliance verification queries
- Security and encryption-focused searches
- Audit logging considerations
- Warnings to consult compliance teams

---

### 2. Complexity Analysis System

**Component**: `ComplexityAnalyzer` utility

Automatically scores task complexity on a 1-10 scale based on multiple factors.

#### Complexity Factors
1. **Dependencies** (0-3 points)
   - Each dependency adds 1.5 points
   - High dependency count triggers decomposition recommendations

2. **Unknown Factors** (+2 points)
   - Tasks with unknowns or research requirements
   - Recommendations to prototype first

3. **Research Requirements** (+2 points)
   - Explicit research needed before implementation

4. **Integration Points** (0-2 points)
   - Each external integration adds complexity
   - Triggers adapter pattern recommendations

5. **Testing Scope** (0.5-2.5 points)
   - Unit testing: +0.5
   - Integration testing: +1.5
   - E2E testing: +2.5

6. **PHI Handling** (+1.5 points)
   - Additional complexity for healthcare data
   - Triggers encryption/audit logging reminders

7. **Estimated Hours** (0-2 points)
   - >8 hours: +2 points + decomposition warning
   - >4 hours: +1 point

#### Complexity Levels
- 🟢 **Trivial** (1-2): Simple, straightforward
- 🟡 **Simple** (3-4): Clear path, minimal dependencies
- 🟠 **Moderate** (5-6): Multiple steps, some complexity
- 🔴 **Complex** (7-8): Many dependencies, significant effort
- 🟣 **Very Complex** (9-10): High risk, should decompose

#### Automatic Recommendations
Tasks scoring ≥7 automatically receive:
- Decomposition suggestions
- Team review recommendations
- Risk mitigation strategies

---

### 3. Task Status Tracking

**Component**: `TaskStatusManager` utility
**Tools**: `update_task_status`, `get_task_progress`

Track task execution state throughout implementation.

#### Task Statuses
- **Backlog** `[ ]`: Not started
- **In Progress** `[~]`: Currently working on
- **Done** `[x]`: Completed
- **Blocked** `[!]`: Cannot proceed

#### State File Structure
```json
{
  "featureId": "001",
  "featureName": "Google Sheets Version Control",
  "lastUpdated": "2025-10-25T...",
  "tasks": [
    {
      "id": "1.1",
      "status": "done",
      "startedAt": "2025-10-25T10:00:00Z",
      "completedAt": "2025-10-25T11:30:00Z",
      "notes": "Implemented with caching"
    }
  ],
  "metadata": {
    "totalTasks": 20,
    "completedTasks": 5,
    "inProgressTasks": 2,
    "blockedTasks": 1,
    "percentComplete": 25
  }
}
```

#### State Files Location
```
your-project/
└── specs/
    └── .specify/
        └── state/
            └── 001-tasks.json
            └── 002-tasks.json
```

#### Usage Examples

**Update Task Status**:
```typescript
update_task_status({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1",
  status: "in-progress",
  notes: "Starting implementation"
})
```

**Get Progress**:
```typescript
get_task_progress({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1"  // Optional: omit for all tasks
})
```

**Mark as Blocked**:
```typescript
update_task_status({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "2.3",
  status: "blocked",
  blockedReason: "Waiting for API key from vendor"
})
```

---

### 4. Enhanced Task Template

The `tasks.md` template now includes:

#### Status Tracking Instructions
```markdown
## Progress Tracking

Track task status using the `update_task_status` MCP tool:
update_task_status({
  projectPath: "{{PROJECT_PATH}}",
  featureId: "{{FEATURE_ID}}",
  taskId: "1.1",
  status: "in-progress" | "done" | "blocked"
})
```

#### Complexity Indicators
Each task displays:
```markdown
### [ ] Task 1.1: Implement authentication
**Type**: [S]
**Complexity**: 🟢 3/10 - Simple
**File**: src/auth/login.ts
**Dependencies**: []
**Estimated Effort**: 2 hours

**Complexity Reasoning**:
- 0 dependencies add 0.0 points
- Unit testing scope adds 0.5 points

**Recommendations**:
- Ensure clear acceptance criteria
```

#### Visual Status Symbols
- `[ ]` = Backlog
- `[~]` = In Progress
- `[x]` = Done
- `[!]` = Blocked

#### Complexity Emojis
- 🟢 = Trivial/Simple
- 🟡 = Simple
- 🟠 = Moderate
- 🔴 = Complex
- 🟣 = Very Complex

---

## Architecture Decisions

### Why Not Full Taskmaster Integration?

**Decision**: Implement concepts selectively, not full system

**Rationale**:
1. **Different Philosophy**: Spec-driven creates specifications first; Taskmaster assumes PRD exists
2. **Healthcare Focus**: Our PHI/HIPAA features are domain-specific
3. **Workflow Integration**: Our guided questionnaire approach differs from Taskmaster's document parsing
4. **Avoid Redundancy**: Two task management systems would conflict

### Components Adopted

✅ **Complexity Analysis**: Automated scoring helps identify high-risk tasks
✅ **Research Integration**: Structured research guidance for technology decisions
✅ **Task Status Tracking**: Active execution monitoring
✅ **Multi-factor Scoring**: Dependencies, unknowns, testing scope, PHI handling

### Components Not Adopted

❌ **Multi-Model Strategy**: Not needed yet (using Claude via MCP)
❌ **PRD Parsing**: We generate specs interactively
❌ **Web Search Integration**: Guidance-based approach simpler to maintain

---

## Usage Workflow

### 1. Create Specification (Existing)
```typescript
sdd_guide({
  action: "start",
  projectPath: "/path/to/project",
  description: "Patient visit tracker"
})
```

### 2. Research Technology Decisions (NEW)
```typescript
research_best_practices({
  topic: "PostgreSQL connection pooling",
  context: "medical practice with PHI data",
  constraints: ["HIPAA compliant", "high availability"]
})
```

### 3. Review Task Complexity (NEW)
After task generation, review complexity scores:
- 🟢🟡 Tasks (1-4): Proceed
- 🟠 Tasks (5-6): Review carefully
- 🔴🟣 Tasks (7-10): Decompose or get team review

### 4. Track Implementation (NEW)
```typescript
// Start working
update_task_status({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1",
  status: "in-progress"
})

// Complete task
update_task_status({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1",
  status: "done",
  notes: "Implemented with tests passing"
})

// Check progress
get_task_progress({
  projectPath: "/path/to/project",
  featureId: "001"
})
```

---

## Benefits

### For Solo Developers
- **Complexity warnings** prevent overly ambitious tasks
- **Progress tracking** maintains momentum
- **Research guidance** speeds up technology evaluation

### For Teams
- **Complexity transparency** aids sprint planning
- **Status visibility** improves coordination
- **Standardized research** ensures consistent decisions

### For Healthcare Projects
- **PHI-aware complexity** accounts for compliance overhead
- **Compliance reminders** in research recommendations
- **Audit trail** via task status history

---

## Future Enhancements

### Potential Additions
- [ ] **Multi-model support**: Research, main, fallback models
- [ ] **Automated complexity estimation**: ML-based scoring refinement
- [ ] **Integration with CI/CD**: Auto-update task status from test results
- [ ] **Complexity heatmaps**: Visualize risky areas of implementation
- [ ] **Time tracking**: Actual vs estimated effort analysis
- [ ] **Dependency graph**: Visual task dependencies

### Research Tool Enhancements
- [ ] **Live web search**: Integrate with search APIs
- [ ] **Cached results**: Store research findings
- [ ] **Decision records**: Track technology choices with rationale

---

## Migration from v0.1.0

### No Breaking Changes
All v0.1.0 workflows continue to work unchanged.

### New Features Are Opt-In
- Task status tracking requires explicit tool calls
- Complexity analysis runs automatically but doesn't block workflow
- Research tool is standalone, doesn't affect spec generation

### Template Changes
- Existing specs unaffected
- New specs include complexity and status tracking sections
- Old specs can be regenerated to gain new features

---

## Technical Details

### New Files Created
```
src/
├── utils/
│   ├── complexity-analyzer.ts       # Complexity scoring engine
│   └── task-status-manager.ts       # Task state persistence
└── tools/
    ├── research-best-practices.ts   # Research guidance tool
    ├── update-task-status.ts        # Status update tool
    └── get-task-progress.ts         # Progress query tool
```

### Updated Files
```
src/
├── server.ts                        # Added new tool handlers
├── types.ts                         # Added complexity & status types
├── workflows/orchestrator.ts        # Added PROJECT_PATH to context
└── templates/base/tasks.md          # Enhanced with complexity & status
```

### Dependencies
No new dependencies added. All features use Node.js built-ins.

---

## Comparison: Spec-Driven vs Taskmaster

| Feature | Spec-Driven MCP | Taskmaster AI |
|---------|-----------------|---------------|
| **Philosophy** | Specification-first (WHAT/WHY → HOW) | Task-first (PRD → breakdown) |
| **Workflow** | Interactive questionnaire | Document parsing |
| **Complexity** | ✅ Automated with PHI awareness | ✅ Automated scoring |
| **Research** | ✅ Guidance-based | ✅ Live web search (Perplexity) |
| **Task Tracking** | ✅ Status with timestamps | ✅ Status with dependencies |
| **Healthcare** | ✅ Built-in PHI/HIPAA | ❌ Generic |
| **Multi-model** | ❌ Single model | ✅ Main/research/fallback |
| **Artifacts** | Constitution, Spec, Plan, Tasks | PRD, Tasks, Reports |

---

## Credits

**Enhancements inspired by**: [Taskmaster AI](https://github.com/eyaltoledano/claude-task-master)

**Original concept**: [GitHub Spec-Kit](https://github.com/github/spec-kit)

**Healthcare adaptations**: Custom for medical practice workflows
