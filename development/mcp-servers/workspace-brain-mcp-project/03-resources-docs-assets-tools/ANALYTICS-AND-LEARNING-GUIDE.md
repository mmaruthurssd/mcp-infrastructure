---
type: guide
tags: [workspace-brain-mcp, analytics, learning, patterns, automation, insights]
---

# Analytics and Learning Guide

**Purpose:** Complete guide to workspace-brain MCP's analytics engine and learning system for insights and continuous improvement.

**Version:** 1.0.0 (Phase 1)
**Last Updated:** 2025-10-31

---

## Table of Contents

1. [Overview](#overview)
2. [Analytics Engine](#analytics-engine)
3. [Learning System](#learning-system)
4. [Automation Opportunities](#automation-opportunities)
5. [Pattern Detection](#pattern-detection)
6. [Preventive Checks](#preventive-checks)
7. [Advanced Analytics](#advanced-analytics)

---

## Overview

### What is Analytics?

The analytics engine transforms raw telemetry into **actionable insights**:

**Input:** Raw event logs (JSONL)
```jsonl
{"id":"uuid","type":"task","timestamp":"2025-10-31T10:00:00Z","data":{...}}
{"id":"uuid","type":"task","timestamp":"2025-10-31T10:15:00Z","data":{...}}
```

**Output:** Insights and recommendations
```markdown
- You completed 42 tasks this week (+15% vs last week)
- Average task duration: 26 minutes
- npm install repeated 8 times → Cache node_modules (save 16 min/week)
- Tool usage: Edit (120), Bash (85), Read (75)
```

### What is Learning?

The learning system captures **reusable knowledge**:

**Input:** Issue resolution experience
```typescript
{
  symptom: "cache_get returns null",
  solution: "Check path resolution logic",
  root_cause: "Category subdirectory not included"
}
```

**Output:** Future prevention and faster resolution
```typescript
// Next time similar issue occurs:
get_similar_patterns("cache retrieval bug")
// → Returns stored solution immediately
```

---

## Analytics Engine

### Weekly Summaries

**Purpose:** Review what you accomplished each week

#### Generate Summary

```typescript
workspace_brain.generate_weekly_summary({
  output_format: "markdown",  // or "json"
  include_sections: ["summary", "patterns", "opportunities"],
  week_start: "2025-10-28"  // Optional, defaults to last Monday
});
```

**Output Location:** `~/workspace-brain/analytics/weekly-summaries/2025-W43.md`

#### Summary Contents

**1. Executive Summary**
```markdown
# Weekly Summary - Week 43, 2025
Period: October 28 - November 3

## Overview
- Total Tasks: 42
- Total Time: 18.5 hours
- Average Duration: 26 minutes per task
- Success Rate: 95% (40 completed, 2 failed)
- Most Productive Day: Wednesday (12 tasks)
```

**2. Task Breakdown**
```markdown
## Task Types
- feature-implementation: 15 tasks (8.5 hours)
- bug-fix: 12 tasks (4.2 hours)
- documentation: 8 tasks (3.5 hours)
- testing: 7 tasks (2.3 hours)
```

**3. Tool Usage**
```markdown
## Top Tools
1. Edit: 120 uses
2. Bash: 85 uses
3. Read: 75 uses
4. git: 50 uses
5. task-executor: 42 uses
```

**4. Patterns Detected**
```markdown
## Detected Patterns
- "npm install" repeated 8 times (16 minutes total)
  → Opportunity: Cache node_modules
  → Potential savings: 80% (12.8 minutes/week)

- "Read → Edit → Bash" sequence appeared 15 times
  → Common workflow: Code editing with testing
  → Consider: Create macro/template
```

**5. Week-over-Week Trends**
```markdown
## Trends
- Tasks: +15% (42 vs 36 last week)
- Time spent: +5% (18.5 vs 17.6 hours)
- Efficiency: +10% (avg duration down from 29 to 26 min)
- Tool diversity: Stable (10 tools both weeks)
- Success rate: +2% (95% vs 93%)
```

#### JSON Output

```typescript
workspace_brain.generate_weekly_summary({
  output_format: "json"
});
```

**Response:**
```json
{
  "week": 43,
  "year": 2025,
  "period": {
    "start": "2025-10-28T00:00:00Z",
    "end": "2025-11-03T23:59:59Z"
  },
  "summary": {
    "total_tasks": 42,
    "total_hours": 18.5,
    "avg_duration_minutes": 26,
    "success_rate": 0.95
  },
  "task_types": {
    "feature-implementation": 15,
    "bug-fix": 12,
    "documentation": 8,
    "testing": 7
  },
  "top_tools": [
    {"tool": "Edit", "count": 120},
    {"tool": "Bash", "count": 85}
  ],
  "patterns": [...],
  "trends": {...}
}
```

---

### Tool Usage Statistics

**Purpose:** Understand which tools are used most frequently

```typescript
workspace_brain.get_tool_usage_stats({
  group_by: "tool",  // or "day", "week"
  include_combinations: true,
  time_range: {
    start: "2025-10-01T00:00:00Z"
  }
});
```

**Response:**
```json
{
  "success": true,
  "tool_stats": [
    {
      "tool_name": "Edit",
      "usage_count": 120,
      "avg_duration_minutes": 15,
      "most_common_context": "feature-implementation"
    },
    {
      "tool_name": "Bash",
      "usage_count": 85,
      "avg_duration_minutes": 5,
      "most_common_context": "testing"
    }
  ],
  "combinations": [
    {
      "tools": ["Read", "Edit"],
      "frequency": 45,
      "avg_sequence_duration": 20
    },
    {
      "tools": ["Edit", "Bash", "git"],
      "frequency": 30,
      "avg_sequence_duration": 25
    }
  ]
}
```

#### Use Cases

**1. Identify most valuable tools**
```typescript
const stats = await get_tool_usage_stats({});
const topTools = stats.tool_stats.slice(0, 5);

// Focus learning on top 5 tools
topTools.forEach(tool => {
  console.log(`Master ${tool.tool_name} - used ${tool.usage_count} times`);
});
```

**2. Detect tool workflows**
```typescript
const stats = await get_tool_usage_stats({
  include_combinations: true
});

// Common sequences
stats.combinations.forEach(combo => {
  if (combo.frequency > 10) {
    console.log(`Common workflow: ${combo.tools.join(" → ")}`);
  }
});
```

**3. Track tool adoption**
```typescript
const thisWeek = await get_tool_usage_stats({
  time_range: { start: "2025-10-28" }
});

const lastWeek = await get_tool_usage_stats({
  time_range: {
    start: "2025-10-21",
    end: "2025-10-27"
  }
});

// Compare: Are we using new MCPs?
```

---

### Event Statistics

**Purpose:** Aggregate metrics across events

#### Count Events

```typescript
workspace_brain.get_event_stats({
  metric: "count",
  filters: {
    event_type: "task"
  },
  group_by: "type"  // or "day", "week", "month"
});
```

**Response:**
```json
{
  "success": true,
  "metric": "count",
  "total": 100,
  "by_group": {
    "task": 75,
    "mcp-usage": 20,
    "workflow": 5
  }
}
```

#### Average Duration

```typescript
workspace_brain.get_event_stats({
  metric: "avg_duration",
  filters: {
    event_type: "task",
    task_type: "bug-fix"
  }
});
```

**Response:**
```json
{
  "success": true,
  "metric": "avg_duration",
  "value": 18.5,
  "unit": "minutes",
  "sample_size": 50
}
```

#### Outcome Distribution

```typescript
workspace_brain.get_event_stats({
  metric: "outcome_distribution",
  filters: {
    event_type: "task"
  }
});
```

**Response:**
```json
{
  "success": true,
  "metric": "outcome_distribution",
  "distribution": {
    "completed": 85,
    "failed": 10,
    "blocked": 5
  },
  "percentages": {
    "completed": 85.0,
    "failed": 10.0,
    "blocked": 5.0
  }
}
```

#### Time-Series Analysis

```typescript
workspace_brain.get_event_stats({
  metric: "count",
  filters: {
    event_type: "task"
  },
  group_by: "day"
});
```

**Response:**
```json
{
  "success": true,
  "metric": "count",
  "by_group": {
    "2025-10-27": 6,
    "2025-10-28": 8,
    "2025-10-29": 9,
    "2025-10-30": 10,
    "2025-10-31": 9
  }
}
```

**Visualization (manual):**
```
Tasks per day:
2025-10-27: ██████ (6)
2025-10-28: ████████ (8)
2025-10-29: █████████ (9)
2025-10-30: ██████████ (10)
2025-10-31: █████████ (9)
```

---

## Learning System

### Recording Patterns

**Purpose:** Capture solutions for future reuse

```typescript
workspace_brain.record_pattern({
  name: string;              // Short pattern name
  category: string;          // "workflow", "bug-fix", "configuration", etc.
  description: string;       // What this pattern solves
  steps: string[];           // How to apply this pattern
  tools_involved: string[];  // Tools needed
  frequency?: number;        // How often you've used this (default: 1)
  notes?: string;            // Additional context
});
```

#### Example: Bug Fix Pattern

```typescript
workspace_brain.record_pattern({
  name: "MCP cache path resolution bug",
  category: "bug-fix",
  description: "Path mismatch between cache write and read operations",
  steps: [
    "Verify file exists at expected path using ls or Read tool",
    "Compare path construction in write vs read functions",
    "Check for category subdirectory handling differences",
    "Add debug logging to trace full path",
    "Test round-trip: write → read → verify"
  ],
  tools_involved: ["Read", "Edit", "Bash", "grep"],
  frequency: 1,
  notes: "Common pattern in file-based caching systems. Always verify path consistency between write and read operations."
});
```

#### Example: Workflow Pattern

```typescript
workspace_brain.record_pattern({
  name: "Standard MCP build and deployment",
  category: "workflow",
  description: "Complete workflow for building and deploying TypeScript MCP servers",
  steps: [
    "Navigate to MCP project directory",
    "Run npm install to install dependencies",
    "Run npm run build to compile TypeScript",
    "Verify build/index.js exists and is recent",
    "Update ~/.claude.json with correct build path",
    "Restart Claude Code to load MCP",
    "Run smoke tests on all tools"
  ],
  tools_involved: ["Bash", "npm", "tsc", "Edit", "Read"],
  frequency: 5,
  notes: "Standard pattern for all TypeScript-based MCPs. Takes ~3-5 minutes per deployment."
});
```

#### Example: Configuration Pattern

```typescript
workspace_brain.record_pattern({
  name: "TypeScript MCP tsconfig.json template",
  category: "configuration",
  description: "Standard TypeScript configuration for Node.js MCP servers",
  steps: [
    'Set "target": "ES2020"',
    'Set "module": "commonjs" for Node.js compatibility',
    'Enable "esModuleInterop": true for better imports',
    'Set "outDir": "build/" for compiled output',
    'Include "src/" directory in compilation',
    'Add "resolveJsonModule": true for JSON imports'
  ],
  tools_involved: ["Edit"],
  frequency: 10,
  notes: "Reusable template for all new MCP servers. Ensures consistent build configuration."
});
```

### Finding Similar Patterns

**Purpose:** Retrieve stored solutions when facing similar issues

```typescript
workspace_brain.get_similar_patterns({
  query: string;                    // Search terms
  category?: string;                // Filter by category
  limit?: number;                   // Max results (default: 5)
  similarity_threshold?: number;    // 0-1, default: 0.6
});
```

#### Example Queries

**Query 1: By keyword**
```typescript
workspace_brain.get_similar_patterns({
  query: "cache not working",
  limit: 5,
  similarity_threshold: 0.5
});
```

**Response:**
```json
{
  "success": true,
  "patterns": [
    {
      "pattern_id": "uuid-1",
      "name": "MCP cache path resolution bug",
      "category": "bug-fix",
      "description": "Path mismatch between cache write and read...",
      "similarity_score": 0.85,
      "steps": [...],
      "tools_involved": ["Read", "Edit", "Bash"]
    },
    {
      "pattern_id": "uuid-2",
      "name": "Cache TTL expiration issue",
      "category": "bug-fix",
      "description": "Expired cache entries not being cleaned up...",
      "similarity_score": 0.72,
      "steps": [...]
    }
  ]
}
```

**Query 2: By category**
```typescript
workspace_brain.get_similar_patterns({
  query: "typescript configuration",
  category: "configuration",
  limit: 3
});
```

**Query 3: High similarity only**
```typescript
workspace_brain.get_similar_patterns({
  query: "MCP build error",
  similarity_threshold: 0.8,  // Only very similar patterns
  limit: 3
});
```

#### Use Cases

**Before troubleshooting:**
```typescript
// Check if we've solved this before
const patterns = await get_similar_patterns({
  query: "MCP not loading in Claude Code"
});

if (patterns.patterns.length > 0) {
  console.log("Found previous solution!");
  console.log(patterns.patterns[0].steps);
}
```

**When creating new project:**
```typescript
// Find configuration templates
const configs = await get_similar_patterns({
  query: "project setup configuration",
  category: "configuration"
});

// Use stored configuration patterns
```

---

## Automation Opportunities

**Purpose:** Detect repetitive tasks that could be automated

```typescript
workspace_brain.get_automation_opportunities({
  min_frequency?: number;      // Minimum occurrences (default: 3)
  min_duration?: number;       // Minimum minutes per occurrence (default: 5)
  sort_by?: string;            // "frequency", "time_savings", "score"
  time_range?: {               // Optional date filter
    start: string;
    end: string;
  }
});
```

### Detection Algorithm

**Criteria for automation opportunity:**
1. **Frequency:** Task repeated ≥3 times
2. **Duration:** Each occurrence takes ≥5 minutes
3. **Consistency:** Similar tool usage patterns
4. **ROI:** Time savings > automation effort

### Example Output

```json
{
  "success": true,
  "opportunities": [
    {
      "task_pattern": "npm install in MCP projects",
      "frequency": 12,
      "avg_duration_minutes": 2,
      "total_time_minutes": 24,
      "potential_savings_percentage": 80,
      "potential_savings_minutes": 19.2,
      "recommendation": "Create shared node_modules cache or use Docker container with pre-installed dependencies",
      "automation_effort": "medium",
      "roi_score": 8.5
    },
    {
      "task_pattern": "TypeScript compilation (npm run build)",
      "frequency": 15,
      "avg_duration_minutes": 1.5,
      "total_time_minutes": 22.5,
      "potential_savings_percentage": 60,
      "potential_savings_minutes": 13.5,
      "recommendation": "Enable watch mode for continuous compilation",
      "automation_effort": "low",
      "roi_score": 9.2
    },
    {
      "task_pattern": "MCP registration in ~/.claude.json",
      "frequency": 8,
      "avg_duration_minutes": 3,
      "total_time_minutes": 24,
      "potential_savings_percentage": 90,
      "potential_savings_minutes": 21.6,
      "recommendation": "Create script to auto-register MCPs after build",
      "automation_effort": "low",
      "roi_score": 9.8
    }
  ],
  "total_potential_savings_hours": 0.91
}
```

### Interpretation

**High ROI opportunities (score ≥8.0):**
- High frequency + easy automation
- Immediate implementation recommended

**Medium ROI opportunities (score 5.0-7.9):**
- Moderate frequency or medium automation effort
- Consider for Phase 2

**Low ROI opportunities (score <5.0):**
- Low frequency or high automation effort
- Deprioritize

### Taking Action

**1. Review recommendations:**
```typescript
const opportunities = await get_automation_opportunities({
  min_frequency: 5,
  sort_by: "roi_score"
});

// Top 3 opportunities by ROI
opportunities.opportunities.slice(0, 3).forEach(opp => {
  console.log(`${opp.task_pattern}: ${opp.recommendation}`);
  console.log(`  Potential savings: ${opp.potential_savings_minutes} min`);
  console.log(`  ROI score: ${opp.roi_score}/10`);
});
```

**2. Implement automation:**
```bash
# Example: Automate npm install caching
# Create shared cache directory
mkdir -p ~/.npm-global-cache

# Update npm config
npm config set cache ~/.npm-global-cache

# Result: 80% faster npm installs
```

**3. Track improvement:**
```typescript
// After implementing automation, log new tasks
workspace_brain.log_event({
  event_type: "task",
  event_data: {
    task_type: "npm-install",
    duration_minutes: 0.4,  // Down from 2 minutes!
    metadata: {
      automation: "npm-cache",
      improvement: "80% faster"
    }
  }
});
```

---

## Pattern Detection

### Automatic Pattern Detection

**Phase 2 feature (planned):** Automatic detection of patterns in telemetry

#### Repetitive Task Detection

```typescript
// Detect: Same task_type repeated with similar tools
{
  pattern_type: "repetitive-task",
  task_type: "npm-install",
  frequency: 12,
  avg_duration: 2,
  recommendation: "Automate or optimize"
}
```

#### Tool Sequence Detection

```typescript
// Detect: Common tool sequences
{
  pattern_type: "tool-sequence",
  sequence: ["Read", "Edit", "Bash", "git"],
  frequency: 25,
  avg_duration: 18,
  recommendation: "Create macro or template"
}
```

#### Time Pattern Detection

```typescript
// Detect: Tasks taking longer over time
{
  pattern_type: "performance-degradation",
  task_type: "feature-implementation",
  trend: "increasing",
  change_percentage: 30,
  recommendation: "Investigate bottlenecks"
}
```

---

## Preventive Checks

**Purpose:** Proactive checks to prevent known issues

```typescript
workspace_brain.get_preventive_checks({
  context?: string;    // "pre-commit", "deployment", "development"
  category?: string;   // Filter by category
});
```

### Built-in Checks

**Response:**
```json
{
  "success": true,
  "checks": [
    {
      "id": "pre-commit-creds",
      "name": "Scan for credentials",
      "description": "Check staged files for exposed API keys, tokens, and passwords",
      "when_to_run": "pre-commit",
      "automated": true,
      "category": "security",
      "command": "security-compliance-mcp scan_for_credentials"
    },
    {
      "id": "pre-commit-phi",
      "name": "Scan for PHI",
      "description": "Check for Protected Health Information in committed files",
      "when_to_run": "pre-commit",
      "automated": true,
      "category": "compliance",
      "command": "security-compliance-mcp scan_for_phi"
    },
    {
      "id": "mcp-build-verify",
      "name": "Verify MCP build output",
      "description": "Check that build/index.js exists and is recent",
      "when_to_run": "deployment",
      "automated": false,
      "category": "workflow",
      "command": "ls -lh build/index.js"
    }
  ]
}
```

### Adding Custom Checks

**Phase 2:** Learning system will promote high-frequency issues to preventive checks

**Example flow:**
1. Issue occurs 3+ times: "MCP not loading - forgot to rebuild"
2. learning-optimizer tracks issue with solution
3. System promotes to preventive check
4. Future: Check runs automatically before MCP deployment

---

## Advanced Analytics

### Custom Queries

**Combine filters for specific insights:**

```typescript
// Q: How long do high-complexity tasks take?
workspace_brain.query_events({
  filters: {
    event_type: "task",
    complexity: { $gte: 8 }  // Complexity ≥ 8
  }
});

const avgDuration = events.reduce((sum, e) =>
  sum + e.data.duration_minutes, 0) / events.length;
```

### Comparative Analysis

**Compare different periods:**

```typescript
// This month vs last month
const thisMonth = await query_events({
  time_range: {
    start: "2025-10-01",
    end: "2025-10-31"
  }
});

const lastMonth = await query_events({
  time_range: {
    start: "2025-09-01",
    end: "2025-09-30"
  }
});

const improvement = {
  tasks: thisMonth.length - lastMonth.length,
  percentage: ((thisMonth.length / lastMonth.length) - 1) * 100
};
```

### Cohort Analysis

**Group by project or workflow:**

```typescript
// Compare different projects
const projects = ["patient-search", "appointment-scheduling", "billing"];

const projectStats = await Promise.all(
  projects.map(async (project) => {
    const events = await query_events({
      filters: {
        workflow_name: { $startsWith: project }
      }
    });

    return {
      project,
      total_tasks: events.length,
      avg_duration: events.reduce(...) / events.length
    };
  })
);
```

---

## Next Steps

### Start Using Analytics
1. Generate your first weekly summary
2. Check for automation opportunities
3. Record patterns as you learn them
4. Query your telemetry data

### Phase 2 Features (Planned)
- Automatic pattern detection
- Machine learning for opportunity detection
- Predictive analytics (forecast task duration)
- Real-time dashboard
- Cross-MCP correlation analysis

### Integration
- Connect with learning-optimizer for unified pattern storage
- Automatic promotion of frequent issues to preventive checks
- Integration with project-management for project-level analytics

---

## References

- **Architecture:** `EXTERNAL-BRAIN-ARCHITECTURE.md`
- **Telemetry:** `TELEMETRY-SYSTEM-GUIDE.md`
- **Integration:** `MCP-INTEGRATION-PATTERNS.md`
- **Usage:** `USAGE-GUIDE.md`
- **External Brain:** `~/workspace-brain/analytics/`
