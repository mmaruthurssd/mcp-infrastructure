---
type: specification
phase: stable
project: ai-planning-mcp-server
tags: [phase-4, kickoff, archive, review, learning, retrospective]
category: mcp-servers
status: completed
priority: high
---

# Phase 4 Kickoff: Archive, Review & Learning

**Created:** 2025-10-26
**Status:** Ready to Implement
**Estimated Duration:** 1-2 weeks
**Goal:** Enable goal archiving, proactive health checks, review reports, and learning from completed goals

---

## Current State (Phases 1-3 Complete)

### What's Working

✅ **Phase 1-3 Tools (v0.3.0)**
- Goal evaluation, creation, and promotion (3 tools)
- Idea extraction from brainstorming (1 tool)
- Dashboard views, reordering, progress tracking (3 tools)
- **Total: 7 tools operational**

✅ **Infrastructure**
- Template system, evaluators, scanners, velocity calculator
- Cross-server integration with Spec-Driven MCP
- Alert detection, progress history tracking
- Complete goal lifecycle: brainstorm → potential → selected → in progress

---

## Phase 4 Overview

### Goals

1. **Goal Archiving:** Move completed/shelved goals with retrospectives
2. **Review Checks:** Proactive detection of goals needing review
3. **Review Reports:** Generate comprehensive health reports
4. **Learning System:** Improve Impact/Effort estimates from historical data

### Tools to Implement (3 total)

1. `archive_goal` - Archive completed or shelved goals with retrospectives
2. `check_review_needed` - Detect goals needing periodic review
3. `generate_review_report` - Create goal health reports

### Success Criteria

- ✅ Can archive goals with proper retrospective documentation
- ✅ Automatically detects stale goals and long-running goals
- ✅ Generates actionable review reports with insights
- ✅ Learning system improves estimate accuracy over time
- ✅ All 10 tools (Phases 1-4) work together seamlessly

---

## Tool 1: `archive_goal`

### Purpose
Move completed or shelved goals to archive with retrospective documentation.

### Input Schema

```typescript
interface ArchiveGoalInput {
  projectPath: string;
  goalId: string;           // e.g., "01", "02"

  // Archive type
  archiveType: 'implemented' | 'shelved';

  // Retrospective data
  retrospective: {
    completionDate?: string;        // YYYY-MM-DD (for implemented)
    actualEffort?: string;          // e.g., "2 weeks", "3 months"
    actualImpact?: 'High' | 'Medium' | 'Low';
    lessonsLearned?: string;
    whatWentWell?: string;
    whatCouldImprove?: string;
    wouldDoAgain?: boolean;

    // For shelved goals
    reasonShelved?: string;
    mightRevisit?: boolean;
    alternativesTried?: string;
  };
}
```

### Output Schema

```typescript
interface ArchiveGoalOutput {
  success: boolean;
  goalId: string;
  goalName: string;
  archivedTo: string;          // File path
  removedFrom: string;          // SELECTED-GOALS.md

  // Learning data extracted
  estimateAccuracy?: {
    estimatedImpact: string;
    actualImpact: string;
    estimatedEffort: string;
    actualEffort: string;
    accuracy: 'Accurate' | 'Overestimated' | 'Underestimated';
  };

  message: string;
  formatted: string;
}
```

### Implementation Strategy

**Archive Flow:**
1. Read goal from SELECTED-GOALS.md
2. Extract original estimates (Impact/Effort)
3. Create retrospective file in archive/{implemented|shelved}/
4. Update SELECTED-GOALS.md (move to Completed/Shelved section or remove)
5. Store learning data for estimate improvement
6. Update statistics

**Retrospective Template:**
```markdown
# [Goal Name]

**Archived:** YYYY-MM-DD
**Type:** Implemented / Shelved
**Original Tier:** Now/Next/Later/Someday

## Original Estimates

**Impact:** High/Medium/Low
**Effort:** High/Medium/Low

## Retrospective

### Completion
- **Date:** YYYY-MM-DD
- **Actual Effort:** X weeks/months
- **Actual Impact:** High/Medium/Low

### What Went Well
...

### What Could Be Improved
...

### Lessons Learned
...

### Would Do Again?
Yes/No - Reasoning...

## Learning Data

**Estimate Accuracy:** Accurate/Overestimated/Underestimated
**Effort Variance:** +2 weeks vs estimate
**Impact Variance:** Matched/Higher/Lower than expected
```

**Files to Create:**
```
src/tools/archive-goal.ts
src/templates/goal-workflow/retrospective-implemented.md
src/templates/goal-workflow/retrospective-shelved.md
```

---

## Tool 2: `check_review_needed`

### Purpose
Proactively detect goals that need review based on various criteria.

### Input Schema

```typescript
interface CheckReviewNeededInput {
  projectPath: string;

  // Optional filters
  checkType?: 'all' | 'selected' | 'potential';

  // Thresholds (optional, use defaults)
  staleDays?: number;          // Default: 90 for potential, 30 for selected
  longRunningDays?: number;    // Default: 60
  noProgressDays?: number;     // Default: 14
}
```

### Output Schema

```typescript
interface CheckReviewNeededOutput {
  success: boolean;
  reviewsNeeded: ReviewItem[];
  summary: {
    total: number;
    byReason: {
      stale: number;
      longRunning: number;
      noProgress: number;
      blocked: number;
      completedNotArchived: number;
    };
  };
  formatted: string;
}

interface ReviewItem {
  goalId?: string;
  goalName: string;
  type: 'potential' | 'selected';
  reason: 'stale' | 'long-running' | 'no-progress' | 'blocked' | 'completed-not-archived';
  daysSince: number;
  lastUpdated: string;
  recommendedAction: string;
  urgency: 'high' | 'medium' | 'low';
}
```

### Implementation Strategy

**Review Criteria:**

1. **Stale Potential Goals**
   - Created >90 days ago
   - Never promoted to selected
   - Action: Review and either promote or shelve

2. **Long-Running Selected Goals**
   - In Progress >60 days
   - Action: Check if scope is too large, needs breaking down

3. **No Progress**
   - No progress updates in 14+ days
   - Status = In Progress
   - Action: Update progress or change status

4. **Blocked Too Long**
   - Status = Blocked >30 days
   - Action: Escalate or shelve

5. **Completed Not Archived**
   - Progress = 100% or Status = Completed
   - Still in active goals
   - Action: Archive with retrospective

**Files to Create:**
```
src/tools/check-review-needed.ts
src/utils/review-detector.ts
```

---

## Tool 3: `generate_review_report`

### Purpose
Generate comprehensive goal health reports for periodic reviews.

### Input Schema

```typescript
interface GenerateReviewReportInput {
  projectPath: string;

  // Report type
  reportType: 'weekly' | 'monthly' | 'quarterly';

  // Optional date range
  startDate?: string;
  endDate?: string;

  // Include sections
  includeSummary?: boolean;      // Default: true
  includeVelocity?: boolean;     // Default: true
  includeAlerts?: boolean;       // Default: true
  includeRecommendations?: boolean;  // Default: true
}
```

### Output Schema

```typescript
interface GenerateReviewReportOutput {
  success: boolean;
  report: {
    period: string;
    generatedDate: string;

    summary: {
      totalGoals: number;
      selected: number;
      potential: number;
      completed: number;
      shelved: number;
    };

    velocity: {
      goalsCompletedThisPeriod: number;
      averageCompletionTime: string;
      trendingUp: boolean;
    };

    alerts: ReviewItem[];

    recommendations: string[];
  };
  formatted: string;
}
```

### Implementation Strategy

**Report Sections:**

1. **Executive Summary**
   - Total goals by status
   - Goals completed this period
   - Goals added this period
   - Overall health score (0-100)

2. **Velocity Metrics**
   - Average completion time
   - Goals completed per month
   - Trend analysis (improving/declining)
   - Estimated backlog completion date

3. **Alerts & Reviews Needed**
   - All items from check_review_needed
   - Prioritized by urgency

4. **Recommendations**
   - Archive completed goals
   - Break down long-running goals
   - Promote high-impact potential goals
   - Shelve low-priority stale goals

5. **Top Performers**
   - Goals completed on time
   - Quick wins achieved
   - High-impact goals delivered

**Report Format:**
```markdown
# Goal Review Report - [Period]

**Generated:** YYYY-MM-DD
**Period:** [Weekly/Monthly/Quarterly]

## Executive Summary

📊 **Goal Overview**
- Total Goals: 15
- Selected: 5 (3 in progress, 2 planning)
- Potential: 8
- Completed This Period: 2
- Shelved This Period: 1

🎯 **Health Score: 85/100** (Healthy)

## Velocity Metrics

📈 **Completion Rate**
- Goals Completed: 2 this month (vs 1.5 average)
- Average Time to Complete: 3.2 weeks
- Trend: ↗️ Improving (15% faster than last period)

⏱️ **Estimated Backlog Completion**
- At current velocity: 8 weeks
- Confidence: Medium

## Alerts & Actions Needed

🔴 **High Priority (3)**
1. Goal 02 - Blocked for 45 days → Escalate or shelve
2. Goal 05 - 100% complete → Archive with retrospective
3. Goal 08 - No progress for 21 days → Update or re-prioritize

⚠️ **Medium Priority (2)**
...

## Recommendations

1. ✅ Archive 2 completed goals (05, 07)
2. 🔄 Break down Goal 03 (running 75 days, only 40% complete)
3. ⬆️ Promote "Mobile App" from potential (high impact)
4. 📦 Shelve 3 stale potential goals (>120 days old)

## Top Performers

🏆 **Delivered This Period**
- Goal 04: Dark Mode Feature (on time, high satisfaction)
- Goal 07: Timesheet Automation (2 weeks early!)
```

**Files to Create:**
```
src/tools/generate-review-report.ts
src/utils/report-generator.ts
src/utils/health-score-calculator.ts
```

---

## Implementation Order

### Week 1: Archive & Learning (Days 1-4)

1. **Day 1-2:** Implement `archive_goal`
   - Create retrospective templates
   - Implement archive logic
   - Extract learning data
   - Test with completed and shelved goals

2. **Day 3-4:** Learning system foundation
   - Store estimate accuracy data
   - Build historical comparison
   - Test learning data extraction

### Week 2: Review & Reporting (Days 5-10)

3. **Day 5-6:** Implement `check_review_needed`
   - Create review detector utility
   - Implement all detection criteria
   - Test with various scenarios

4. **Day 7-9:** Implement `generate_review_report`
   - Create report generator utility
   - Implement health score calculator
   - Build all report sections
   - Test report generation

5. **Day 10:** Integration & cleanup
   - Register all tools
   - Build and test end-to-end
   - Update documentation
   - Bump version to 0.4.0

---

## Files to Create

### New Tools (3 files)
```
src/tools/archive-goal.ts
src/tools/check-review-needed.ts
src/tools/generate-review-report.ts
```

### New Utilities (3 files)
```
src/utils/review-detector.ts
src/utils/report-generator.ts
src/utils/health-score-calculator.ts
```

### New Templates (2 files)
```
src/templates/goal-workflow/retrospective-implemented.md
src/templates/goal-workflow/retrospective-shelved.md
```

### Files to Modify
```
src/server.ts                  # Register 3 new tools
package.json                   # Bump version to 0.4.0
README.md                      # Document Phase 4 tools
```

---

## Success Metrics

**Phase 4 Complete When:**
- ✅ Can archive goals with comprehensive retrospectives
- ✅ Proactively detects goals needing attention
- ✅ Generates actionable review reports
- ✅ Learning system tracks estimate accuracy
- ✅ All 10 tools (Phases 1-4) working together
- ✅ User feedback: "The system helps me stay on top of goal management"

---

## Next Steps (Phase 5 Preview)

After Phase 4, we'll implement:
- `generate_workflow_diagram` - Create draw.io workflow diagrams
- `update_workflow_diagram` - Update existing diagrams
- Visual goal roadmap generation
- Timeline/Gantt chart generation

---

**Status:** Ready for Implementation
**Version Target:** 0.4.0
**Created:** 2025-10-26
