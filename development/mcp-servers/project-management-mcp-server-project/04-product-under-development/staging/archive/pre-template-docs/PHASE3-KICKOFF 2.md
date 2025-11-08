---
type: specification
phase: stable
project: ai-planning-mcp-server
tags: [phase-3, kickoff, implementation-guide, dashboard, progress-tracking]
category: mcp-servers
status: completed
priority: high
---

# Phase 3 Kickoff: Discovery, Management & Progress Tracking

**Created:** 2025-10-26
**Status:** Ready to Implement
**Estimated Duration:** 2-3 weeks
**Goal:** Enable idea extraction, goal dashboard, reordering, and progress tracking

---

## Current State (Phases 1-2 Complete)

### What's Working

✅ **Phase 1 Tools (AI Planning MCP v0.2.0)**
- `evaluate_goal` - AI estimates Impact/Effort, suggests tier
- `create_potential_goal` - Creates potential goal markdown files

✅ **Phase 2 Tools**
- `promote_to_selected` - Promotes goals to selected status, updates SELECTED-GOALS.md
- Cross-server integration with Spec-Driven MCP
- Goal context handoff working

✅ **Infrastructure**
- Template rendering system (GoalTemplateRenderer)
- Impact/Effort/Tier evaluators with 100% test accuracy
- File structure: `brainstorming/future-goals/{brainstorming,potential-goals,selected-goals,archive}`
- Both servers build successfully (0 errors)

### File Structure

```
ai-planning-mcp-server/
├── src/
│   ├── server.ts                     # MCP server (3 tools registered)
│   ├── types.ts                      # Shared types
│   │
│   ├── tools/
│   │   ├── evaluate-goal.ts          # ✅ Phase 1
│   │   ├── create-potential-goal.ts  # ✅ Phase 1
│   │   └── promote-to-selected.ts    # ✅ Phase 2
│   │
│   ├── evaluators/
│   │   ├── impact-estimator.ts       # ✅ Phase 1
│   │   ├── effort-estimator.ts       # ✅ Phase 1
│   │   └── tier-suggester.ts         # ✅ Phase 1
│   │
│   ├── templates/goal-workflow/
│   │   ├── potential-goal.md         # ✅ Phase 1
│   │   ├── selected-goal-entry.md    # ✅ Phase 1
│   │   └── selected-goals-index.md   # ✅ Phase 2
│   │
│   └── utils/
│       └── goal-template-renderer.ts # ✅ Phase 1
│
├── package.json                       # v0.2.0
├── tsconfig.json
└── README.md                          # Updated for Phase 2
```

---

## Phase 3 Overview

### Goals

1. **Idea Extraction:** Automatically detect actionable ideas in brainstorming discussions
2. **Dashboard View:** Provide overview of all goals by tier, priority, status
3. **Reordering:** Allow users to change priority order of selected goals
4. **Progress Tracking:** Update goal progress based on task completion

### Tools to Implement (4 total)

1. `extract_ideas` - Scan brainstorming for actionable ideas
2. `view_goals_dashboard` - Overview of all goals
3. `reorder_selected_goals` - Change priority order
4. `update_goal_progress` - Track task completion

### Success Criteria

- ✅ Can extract 5+ ideas from brainstorming with 90%+ accuracy
- ✅ Dashboard shows clear view of all goals by tier/priority
- ✅ Can reorder goals and see updated priority list
- ✅ Progress tracking auto-updates when tasks completed
- ✅ Velocity calculation estimates completion dates

---

## Tool 1: `extract_ideas`

### Purpose
Scan brainstorming discussion markdown file for actionable ideas using AI pattern matching.

### Input Schema

```typescript
interface ExtractIdeasInput {
  projectPath: string;        // Absolute path to project
  filePath?: string;          // Optional: specific file to scan
                              // Default: brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md
  minConfidence?: number;     // Optional: 0-1 confidence threshold (default: 0.6)
}
```

### Output Schema

```typescript
interface ExtractIdeasOutput {
  success: boolean;
  ideasFound: number;
  ideas: Array<{
    id: string;              // Generated ID: idea-001, idea-002
    text: string;            // The idea text extracted
    context: string;         // Surrounding context (1-2 sentences)
    confidence: number;      // 0-1 confidence score
    location: {
      lineNumber: number;
      sectionHeading?: string;
    };
    suggestedName: string;   // AI-generated short name for the idea
    reasoning: string;       // Why this was detected as actionable
  }>;
  formatted: string;
}
```

### Implementation Strategy

**Pattern Matching Heuristics:**
- Look for imperative verbs: "build", "create", "fix", "implement", "add"
- Look for problem statements: "we need to", "users want", "missing"
- Look for feature mentions: "app for", "system to", "tool that"
- Context: ideas usually in bullet lists or paragraphs after "Ideas:", "Suggestions:"

**Confidence Scoring:**
- High (0.8-1.0): Explicit action items with clear scope
- Medium (0.6-0.79): Implied actions or vague ideas
- Low (0-0.59): Tangential mentions, questions, observations

**File to Create:**
```
src/tools/extract-ideas.ts
```

**Key Functions:**
```typescript
function scanMarkdownForIdeas(content: string): RawIdea[]
function scoreIdeaConfidence(idea: RawIdea): number
function generateIdeaName(ideaText: string): string
```

**Example:**
```markdown
Input (brainstorming file):
---
### Meeting Notes 2025-10-20

We discussed the mobile app. Users are frustrated they can't log mileage on phones.

Ideas:
- Build a React Native app with offline mode
- SMS-based interface for basic logging
- Simple mobile web app

The iOS app would be the most impactful but takes 3 months.
---

Output:
{
  success: true,
  ideasFound: 3,
  ideas: [
    {
      id: "idea-001",
      text: "Build a React Native app with offline mode",
      context: "We discussed the mobile app. Users are frustrated...",
      confidence: 0.85,
      location: { lineNumber: 7, sectionHeading: "Ideas" },
      suggestedName: "React Native Offline App",
      reasoning: "Explicit action item with technical detail"
    },
    // ... idea-002, idea-003
  ]
}
```

---

## Tool 2: `view_goals_dashboard`

### Purpose
Provide comprehensive overview of all goals with filtering, sorting, and alerts.

### Input Schema

```typescript
interface ViewGoalsDashboardInput {
  projectPath: string;

  // Filters (all optional)
  tier?: 'Now' | 'Next' | 'Later' | 'Someday';
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold';
  owner?: string;

  // Sorting
  sortBy?: 'impact' | 'effort' | 'priority' | 'date' | 'progress';

  // Display options
  includeAlerts?: boolean;  // Default: true
  includeStats?: boolean;   // Default: true
}
```

### Output Schema

```typescript
interface ViewGoalsDashboardOutput {
  success: boolean;

  // Goal lists
  potentialGoals: GoalSummary[];
  selectedGoals: GoalSummary[];
  completedGoals: GoalSummary[];
  shelvedGoals: GoalSummary[];

  // Statistics
  stats?: {
    totalPotential: number;
    totalSelected: number;
    totalCompleted: number;
    totalShelved: number;

    byTier: { Now: number; Next: number; Later: number; Someday: number };
    byPriority: { High: number; Medium: number; Low: number };
    byStatus: {
      Planning: number;
      'Not Started': number;
      'In Progress': number;
      Blocked: number;
      'On Hold': number;
    };
  };

  // Alerts
  alerts?: Alert[];

  formatted: string;
}

interface GoalSummary {
  id?: string;              // Goal ID (for selected goals)
  name: string;
  tier: string;
  impactScore: string;
  effortScore: string;
  priority?: string;        // Only for selected goals
  status?: string;          // Only for selected goals
  owner?: string;
  targetDate?: string;
  progress?: number;        // 0-100 percentage
  lastUpdated: string;
  file: string;             // File path
}

interface Alert {
  type: 'stale' | 'blocked' | 'completed' | 'duplicate';
  severity: 'urgent' | 'attention' | 'info';
  goalId?: string;
  goalName: string;
  message: string;
  action: string;           // Recommended action
}
```

### Implementation Strategy

**Data Collection:**
1. Scan `potential-goals/` directory for .md files
2. Parse `selected-goals/SELECTED-GOALS.md`
3. Scan `archive/implemented/` and `archive/shelved/`
4. Parse each file to extract metadata

**Alert Detection:**
- **Stale:** Potential goal created >90 days ago, never promoted
- **Blocked:** Selected goal with status "Blocked" for >30 days
- **Completed:** Selected goal with progress=100% but status ≠ Completed
- **Duplicate:** Goals with similar names (Levenshtein distance < 3)

**File to Create:**
```
src/tools/view-goals-dashboard.ts
src/utils/goal-scanner.ts        # Utility to scan goal directories
src/utils/alert-detector.ts      # Utility to detect issues
```

**Example:**
```typescript
Output (formatted):
═══════════════════════════════════════════════════════
  GOALS DASHBOARD
═══════════════════════════════════════════════════════

📊 STATISTICS
   Potential: 5    Selected: 3    Completed: 2    Shelved: 1

   By Tier:  Now: 2  Next: 4  Later: 3  Someday: 1
   By Priority:  High: 2  Medium: 3  Low: 1

🔴 ALERTS (2)
   [URGENT] Goal 02 blocked for 45 days - escalate or shelve?
   [ATTENTION] Goal 05 at 100% progress - mark as completed?

🎯 SELECTED GOALS (In Priority Order)
   01. Mobile App [Next] High Impact/High Effort - In Progress (60%)
       Owner: Sarah  Target: Q2 2025  Updated: 2025-10-20

   02. Fix Save Bug [Now] High Impact/Med Effort - Blocked
       Owner: Alex  Target: ASAP  Updated: 2025-09-15
       ⚠️ BLOCKED: Waiting for database migration

   03. Dark Mode [Later] Low Impact/Low Effort - Not Started
       Owner: Unassigned  Target: TBD  Updated: 2025-10-18
```

---

## Tool 3: `reorder_selected_goals`

### Purpose
Change the priority order of selected goals in SELECTED-GOALS.md.

### Input Schema

```typescript
interface ReorderSelectedGoalsInput {
  projectPath: string;

  // Array of goal IDs in desired order
  goalOrder: string[];      // e.g., ["03", "01", "02"]

  // Optional: also update priorities
  updatePriorities?: boolean;  // Default: false
}
```

### Output Schema

```typescript
interface ReorderSelectedGoalsOutput {
  success: boolean;
  reordered: number;        // Count of goals reordered
  beforeOrder: string[];    // Original order
  afterOrder: string[];     // New order
  message: string;
  formatted: string;
}
```

### Implementation Strategy

**Algorithm:**
1. Parse SELECTED-GOALS.md to extract all goal entries
2. Build map of goalId → entry text
3. Validate all IDs in `goalOrder` exist
4. Rewrite "Active Goals" section in new order
5. Update "Last Updated" timestamp
6. Optionally recalculate priority based on order (top = High, middle = Medium, bottom = Low)

**File to Create:**
```
src/tools/reorder-selected-goals.ts
```

**Key Functions:**
```typescript
function parseSelectedGoals(content: string): Map<string, string>
function validateGoalOrder(goalOrder: string[], existingIds: string[]): boolean
function rewriteActiveGoalsSection(content: string, orderedEntries: string[]): string
```

**Example:**
```typescript
Input:
{
  projectPath: '/path/to/project',
  goalOrder: ["03", "01", "02"],
  updatePriorities: true
}

Before (SELECTED-GOALS.md):
  ### Goal 01: Mobile App [Priority: High]
  ### Goal 02: Fix Bug [Priority: Medium]
  ### Goal 03: Dark Mode [Priority: Low]

After (SELECTED-GOALS.md):
  ### Goal 03: Dark Mode [Priority: High]      # Moved to top
  ### Goal 01: Mobile App [Priority: Medium]   # Moved to middle
  ### Goal 02: Fix Bug [Priority: Low]         # Moved to bottom

Output:
{
  success: true,
  reordered: 3,
  beforeOrder: ["01", "02", "03"],
  afterOrder: ["03", "01", "02"],
  message: "Successfully reordered 3 goals and updated priorities"
}
```

---

## Tool 4: `update_goal_progress`

### Purpose
Update goal progress based on task completion and calculate velocity.

### Input Schema

```typescript
interface UpdateGoalProgressInput {
  projectPath: string;
  goalId: string;           // e.g., "01", "02"

  // Progress data
  tasksCompleted?: number;  // Optional: count of completed tasks
  totalTasks?: number;      // Optional: total task count
  progress?: number;        // Optional: direct progress % (0-100)

  // Status updates
  status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold' | 'Completed';
  blockers?: string;        // Optional: description of blockers
  nextAction?: string;      // Optional: override next action

  // Auto-calculate from spec-driven tasks.md
  specPath?: string;        // Optional: path to spec directory for auto-calculation
}
```

### Output Schema

```typescript
interface UpdateGoalProgressOutput {
  success: boolean;
  goalId: string;
  goalName: string;

  // Updated values
  previousProgress: number;
  newProgress: number;
  previousStatus: string;
  newStatus: string;

  // Velocity calculation (if enough data)
  velocity?: {
    tasksPerWeek: number;
    estimatedCompletion: string;  // Date string
    confidence: 'Low' | 'Medium' | 'High';
    reasoning: string;
  };

  message: string;
  formatted: string;
}
```

### Implementation Strategy

**Progress Calculation:**
1. If `tasksCompleted` and `totalTasks` provided: `progress = (tasksCompleted / totalTasks) * 100`
2. If `progress` provided directly: use it
3. If `specPath` provided: parse `tasks.md` and count `[x]` vs `[ ]` checkboxes

**Velocity Calculation:**
- Track progress changes over time (store in goal file metadata)
- Calculate: `velocity = (progressChange / daysSinceLastUpdate)`
- Estimate completion: `daysRemaining = (100 - currentProgress) / velocity`
- Confidence based on data points: <3 updates = Low, 3-5 = Medium, >5 = High

**Auto-Status Updates:**
- If progress = 100% → status = "Completed" (unless explicitly set)
- If progress > 0 && status = "Not Started" → status = "In Progress"

**File to Create:**
```
src/tools/update-goal-progress.ts
src/utils/velocity-calculator.ts
src/utils/tasks-parser.ts          # Parse tasks.md checkbox counts
```

**Example:**
```typescript
Input:
{
  projectPath: '/path/to/project',
  goalId: "01",
  tasksCompleted: 12,
  totalTasks: 20
}

Output:
{
  success: true,
  goalId: "01",
  goalName: "Mobile App for Field Staff",
  previousProgress: 45,
  newProgress: 60,
  previousStatus: "In Progress",
  newStatus: "In Progress",
  velocity: {
    tasksPerWeek: 3.5,
    estimatedCompletion: "2025-11-15",
    confidence: "Medium",
    reasoning: "Based on 4 progress updates over 3 weeks"
  },
  message: "Progress updated: 45% → 60% (+15%)"
}
```

---

## Implementation Order

### Week 1: Foundation & Extract Ideas
1. **Day 1-2:** Implement `extract_ideas`
   - Create brainstorming scanner
   - Implement pattern matching heuristics
   - Add confidence scoring
   - Test with sample brainstorming files

2. **Day 3:** Register tool, build, test end-to-end

### Week 2: Dashboard & Reordering
3. **Day 1-3:** Implement `view_goals_dashboard`
   - Create goal scanner utility
   - Implement alert detection
   - Build formatted output
   - Test with various filters

4. **Day 4:** Implement `reorder_selected_goals`
   - Parse/rewrite SELECTED-GOALS.md
   - Add priority auto-update
   - Test reordering scenarios

5. **Day 5:** Register tools, build, test

### Week 3: Progress Tracking & Polish
6. **Day 1-2:** Implement `update_goal_progress`
   - Create velocity calculator
   - Add tasks.md parser
   - Implement auto-status updates

7. **Day 3:** Integration testing
   - Test full workflow: extract → evaluate → create → promote → track progress
   - Test cross-tool interactions

8. **Day 4-5:** Documentation & cleanup
   - Update README.md
   - Update MCP-INTEGRATION-PLAN.md
   - Create usage examples

---

## Files to Create

### New Tools (4 files)
```
src/tools/extract-ideas.ts
src/tools/view-goals-dashboard.ts
src/tools/reorder-selected-goals.ts
src/tools/update-goal-progress.ts
```

### New Utilities (4 files)
```
src/utils/goal-scanner.ts           # Scan goal directories
src/utils/alert-detector.ts         # Detect stale/blocked goals
src/utils/velocity-calculator.ts    # Track progress velocity
src/utils/tasks-parser.ts           # Parse tasks.md checkboxes
```

### Files to Modify
```
src/server.ts                       # Register 4 new tools
package.json                        # Bump version to 0.3.0
README.md                           # Document Phase 3 tools
```

---

## Testing Strategy

### Unit Tests
- Extract ideas pattern matching accuracy
- Goal scanner directory traversal
- Alert detection logic
- Velocity calculation edge cases
- Tasks.md checkbox parsing

### Integration Tests
- Extract ideas → evaluate → create potential goal
- View dashboard with various filters
- Reorder goals and verify SELECTED-GOALS.md
- Update progress and check velocity calculation

### End-to-End Test
```
1. Create brainstorming file with 5 ideas
2. extract_ideas → should find 5 ideas
3. evaluate_goal for each idea
4. create_potential_goal for top 3
5. promote_to_selected for all 3
6. view_goals_dashboard → should show 3 selected
7. reorder_selected_goals
8. update_goal_progress for goal 01
9. view_goals_dashboard → should show updated progress
```

---

## Dependencies & Integration Points

### Internal Dependencies
- `GoalTemplateRenderer` (already exists)
- SELECTED-GOALS.md format (defined in Phase 2)
- Potential goal file format (defined in Phase 1)

### External Dependencies
- Node.js fs/path modules
- No new npm packages required

### Integration with Other Tools
- `extract_ideas` → feeds into `evaluate_goal` workflow
- `update_goal_progress` → can auto-read from spec-driven MCP's tasks.md
- `view_goals_dashboard` → shows results of all other tools

---

## Success Metrics

**Phase 3 Complete When:**
- ✅ Can extract 5+ ideas from brainstorming with 90%+ accuracy
- ✅ Dashboard shows clear view of all goals by tier/priority
- ✅ Can reorder goals and see updated priority list
- ✅ Progress tracking auto-updates when tasks completed
- ✅ Velocity calculation estimates completion dates within ±20% accuracy
- ✅ All 7 tools (Phases 1-3) build and work together
- ✅ User feedback: "I can see what's important and track progress effortlessly"

---

## Next Steps (Phase 4 Preview)

After Phase 3, we'll implement:
- `archive_goal` - Move completed/shelved goals with retrospectives
- `check_review_needed` - Proactive goal health checks
- `generate_review_report` - Monthly/quarterly reports
- Learning system: improve Impact/Effort estimates from archived goals

---

## Reference Documentation

- **Phase 1-2 Implementation:** See `README.md`, `PHASE2-DESIGN.md`
- **Cross-Server Integration:** See `CROSS-SERVER-INTEGRATION.md`
- **MCP Integration Plan:** See `templates-and-patterns/.../MCP-INTEGRATION-PLAN.md`
- **Template System:** See `src/utils/goal-template-renderer.ts`

---

**Status:** Ready for Implementation
**Version Target:** 0.3.0
**Created:** 2025-10-26
**Last Updated:** 2025-10-26
