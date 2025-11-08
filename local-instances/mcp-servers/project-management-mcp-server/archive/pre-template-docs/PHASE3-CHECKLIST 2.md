---
type: reference
phase: stable
project: ai-planning-mcp-server
tags: [phase-3, checklist, quick-reference, implementation]
category: mcp-servers
status: completed
priority: high
---

# Phase 3 Quick Start Checklist

**Goal:** Implement 4 new tools for idea extraction, dashboard, reordering, and progress tracking

---

## Before You Start

### ✅ Verify Current State
```bash
cd ai-planning-mcp-server
npm run build  # Should succeed with 0 errors
git status     # Should be clean or only PHASE3 files uncommitted
```

### ✅ Confirm Files Exist
- [x] `src/tools/evaluate-goal.ts` (Phase 1)
- [x] `src/tools/create-potential-goal.ts` (Phase 1)
- [x] `src/tools/promote-to-selected.ts` (Phase 2)
- [x] `src/utils/goal-template-renderer.ts`
- [x] `src/evaluators/` (impact, effort, tier)
- [x] `src/templates/goal-workflow/` (3 templates)

### ✅ Read Documentation
- [ ] `PHASE3-KICKOFF.md` - Full implementation guide
- [ ] `README.md` - Current state (v0.2.0)
- [ ] `PHASE2-DESIGN.md` - Reference for similar patterns

---

## Implementation Sequence

### Tool 1: `extract_ideas` (Days 1-3)

**Create:**
- [ ] `src/tools/extract-ideas.ts`

**Key Functions:**
```typescript
scanMarkdownForIdeas(content: string): RawIdea[]
scoreIdeaConfidence(idea: RawIdea): number
generateIdeaName(ideaText: string): string
```

**Test:**
```bash
# Create test brainstorming file
# Run extract_ideas tool
# Verify 90%+ accuracy on sample ideas
```

---

### Tool 2: `view_goals_dashboard` (Days 4-6)

**Create:**
- [ ] `src/tools/view-goals-dashboard.ts`
- [ ] `src/utils/goal-scanner.ts`
- [ ] `src/utils/alert-detector.ts`

**Key Functions:**
```typescript
scanPotentialGoals(dir: string): GoalSummary[]
parseSelectedGoals(content: string): GoalSummary[]
detectAlerts(goals: GoalSummary[]): Alert[]
```

**Test:**
```bash
# Create sample goals in potential-goals/ and SELECTED-GOALS.md
# Run view_goals_dashboard
# Verify filtering, sorting, alerts work
```

---

### Tool 3: `reorder_selected_goals` (Days 7-8)

**Create:**
- [ ] `src/tools/reorder-selected-goals.ts`

**Key Functions:**
```typescript
parseSelectedGoals(content: string): Map<string, string>
validateGoalOrder(goalOrder: string[], existingIds: string[]): boolean
rewriteActiveGoalsSection(content: string, orderedEntries: string[]): string
```

**Test:**
```bash
# Create SELECTED-GOALS.md with 3+ goals
# Run reorder_selected_goals with different orders
# Verify order changes persist
```

---

### Tool 4: `update_goal_progress` (Days 9-11)

**Create:**
- [ ] `src/tools/update-goal-progress.ts`
- [ ] `src/utils/velocity-calculator.ts`
- [ ] `src/utils/tasks-parser.ts`

**Key Functions:**
```typescript
calculateProgress(tasksCompleted: number, totalTasks: number): number
parseTasksFile(specPath: string): { completed: number; total: number }
calculateVelocity(progressHistory: ProgressUpdate[]): VelocityEstimate
```

**Test:**
```bash
# Create goal with progress tracking
# Update progress multiple times
# Verify velocity calculation works
```

---

## Registration & Integration (Days 12-13)

### Update Server
- [ ] Edit `src/server.ts`
  - [ ] Import 4 new tools
  - [ ] Add to `ListToolsRequestSchema`
  - [ ] Add 4 case statements in `CallToolRequestSchema`
  - [ ] Update version to `0.3.0`

- [ ] Edit `package.json`
  - [ ] Bump version: `0.2.0` → `0.3.0`

### Build & Test
```bash
npm run build  # Should succeed
# Test each tool manually
# Test integration: extract → evaluate → create → promote → dashboard → reorder → update progress
```

---

## Documentation (Days 14-15)

### Update README.md
- [ ] Add Phase 3 section
- [ ] Document 4 new tools (input/output examples)
- [ ] Update roadmap: mark Phase 3 complete
- [ ] Update tool count: 3 → 7 tools

### Update MCP-INTEGRATION-PLAN.md
- [ ] Mark Phase 3 tasks complete
- [ ] Add Phase 3 completion summary
- [ ] Update timeline estimate

### Create Examples
- [ ] Create `examples/phase3-workflow.md` with full end-to-end example

---

## Testing Checklist

### Unit Tests (Per Tool)
- [ ] `extract_ideas`: Pattern matching accuracy >90%
- [ ] `view_goals_dashboard`: Filters work correctly
- [ ] `reorder_selected_goals`: Order persists
- [ ] `update_goal_progress`: Velocity calculation correct

### Integration Tests
- [ ] Extract ideas → evaluate → create workflow
- [ ] Dashboard shows all goal states correctly
- [ ] Reorder updates SELECTED-GOALS.md
- [ ] Progress updates trigger velocity calculation

### End-to-End Test
```bash
# Full workflow test
1. Create brainstorming file with 5 ideas
2. extract_ideas → finds 5 ideas
3. evaluate_goal for top 3
4. create_potential_goal for top 3
5. promote_to_selected for all 3
6. view_goals_dashboard → shows 3 selected
7. reorder_selected_goals → change order
8. update_goal_progress for goal 01 → 50%
9. update_goal_progress for goal 01 → 75%
10. view_goals_dashboard → shows progress + velocity estimate
```

---

## Common Patterns from Phase 2

### Tool Structure
```typescript
export class ToolNameTool {
  static execute(input: ToolInput): ToolOutput {
    try {
      // 1. Validate input
      // 2. Read necessary files
      // 3. Process data
      // 4. Update files if needed
      // 5. Return result
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  static formatResult(result: ToolOutput): string {
    // Human-readable formatting
  }

  static getToolDefinition() {
    return {
      name: 'tool_name',
      description: '...',
      inputSchema: { ... }
    };
  }
}
```

### File Operations
```typescript
import * as fs from 'fs';
import * as path from 'path';

// Read file
const content = fs.readFileSync(filePath, 'utf-8');

// Write file
fs.writeFileSync(filePath, content, 'utf-8');

// Create directory if doesn't exist
fs.mkdirSync(dirPath, { recursive: true });

// Check if file exists
if (fs.existsSync(filePath)) { ... }
```

### Markdown Parsing
```typescript
// Extract sections
const sectionMatch = content.match(/##\s+Section Name[\s\S]+?(?=\n##|$)/);

// Extract list items
const items = content.match(/^[-*]\s+(.+)$/gm);

// Extract metadata
const impactMatch = content.match(/\*\*Impact Score:\*\*\s*(\w+)/);
```

---

## Quick Reference: File Locations

### Read from:
- `brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md`
- `brainstorming/future-goals/potential-goals/*.md`
- `brainstorming/future-goals/selected-goals/SELECTED-GOALS.md`
- `specs/*/tasks.md` (for progress tracking)

### Write to:
- `brainstorming/future-goals/selected-goals/SELECTED-GOALS.md` (update progress, reorder)

---

## Success Criteria Summary

Phase 3 is complete when:
- ✅ All 4 tools implemented and working
- ✅ `npm run build` succeeds (0 errors)
- ✅ End-to-end test passes
- ✅ Documentation updated
- ✅ Version bumped to 0.3.0
- ✅ 7 total tools (Phases 1-3) working together

---

## Help & References

- **Full specs:** `PHASE3-KICKOFF.md`
- **Phase 2 reference:** `PHASE2-DESIGN.md`
- **Template system:** `src/utils/goal-template-renderer.ts`
- **Example tool:** `src/tools/promote-to-selected.ts` (most recent, good pattern)

---

**Status:** Ready to start
**Estimated Time:** 2-3 weeks
**Target Version:** 0.3.0
