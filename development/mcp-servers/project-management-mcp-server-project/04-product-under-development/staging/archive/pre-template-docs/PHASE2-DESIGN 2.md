---
type: specification
phase: stable
project: ai-planning-mcp-server
tags: [phase-2, design, promote-to-selected, cross-server-integration]
category: mcp-servers
status: completed
priority: high
---

# Phase 2 Design: promote_to_selected Tool

## Tool Definition

### Tool Name
`promote_to_selected`

### Description
Promote a potential goal to selected status, add it to SELECTED-GOALS.md, and optionally trigger spec-driven workflow.

### Purpose
This tool bridges AI Planning MCP (goal management) with Spec-Driven MCP (feature implementation) by:
1. Moving goals from "potential" to "selected" status
2. Adding them to the project roadmap (SELECTED-GOALS.md)
3. Optionally passing goal context to spec-driven MCP for automatic spec generation

---

## Input Parameters

```typescript
interface PromoteToSelectedInput {
  // Required
  projectPath: string;          // Absolute path to project directory
  potentialGoalFile: string;    // Relative path to potential goal file

  // Goal metadata
  priority: 'High' | 'Medium' | 'Low';
  owner?: string;               // Person/team responsible (optional)
  targetDate?: string;          // YYYY-MM-DD or "Q1 2025" (optional)

  // Workflow control
  generateSpec?: boolean;       // If true, return goal context for sdd_guide (default: false)

  // Optional overrides
  status?: 'Planning' | 'Not Started';  // Default: 'Planning' if generateSpec=true, else 'Not Started'
  nextAction?: string;          // Override default next action
}
```

### Parameter Details

**projectPath**
- Absolute path to the project root
- Example: `/Users/name/projects/my-app`
- Used to locate `brainstorming/future-goals/` directory

**potentialGoalFile**
- Relative path from projectPath to potential goal file
- Example: `brainstorming/future-goals/potential-goals/mobile-app.md`
- Tool will read this file to extract goal details

**priority**
- Required field for roadmap ordering
- Options: `High`, `Medium`, `Low`
- Determines placement in SELECTED-GOALS.md

**owner** (optional)
- Person or team responsible for this goal
- If not provided, defaults to "Unassigned"

**targetDate** (optional)
- Target completion date
- Flexible format: `2025-12-31`, `Q2 2025`, `Dec 2025`
- If not provided, defaults to "TBD"

**generateSpec** (optional, default: false)
- If `true`: Return goal context for spec-driven MCP handoff
- If `false`: Just add to SELECTED-GOALS.md
- When true, automatically sets status to "Planning"

**status** (optional)
- Override default status
- Default: "Planning" if generateSpec=true, "Not Started" otherwise

**nextAction** (optional)
- Override default next action
- Default: "Create formal specification" if generateSpec=true

---

## Output Format

### Success Response

```typescript
interface PromoteToSelectedOutput {
  success: true;
  goalId: string;                // Assigned goal ID (e.g., "01", "02")
  goalName: string;              // Name of the goal
  addedToFile: string;           // Path to SELECTED-GOALS.md

  // Goal context for cross-server handoff (only if generateSpec=true)
  goalContext?: {
    goalId: string;
    goalName: string;
    goalDescription: string;
    impactScore: string;         // High/Medium/Low
    impactReasoning: string;
    effortScore: string;         // High/Medium/Low
    effortReasoning: string;
    tier: string;                // Now/Next/Later/Someday
    priority: string;            // High/Medium/Low
    owner: string;
    targetDate: string;

    // Evaluation questions (if answered in potential goal)
    problem?: string;
    expectedValue?: string;
    effortDetails?: string;
    dependencies?: string;
    risks?: string;
    alternatives?: string;
    decisionCriteria?: string;
  };

  message: string;
  formatted: string;             // Human-readable summary
}
```

### Error Response

```typescript
interface PromoteToSelectedError {
  success: false;
  error: string;
  details?: string;
}
```

---

## Implementation Logic

### Step 1: Validate Input
1. Check projectPath exists
2. Check potentialGoalFile exists at `projectPath/potentialGoalFile`
3. Validate priority is one of High/Medium/Low

### Step 2: Read Potential Goal File
1. Parse markdown file to extract:
   - Goal name (from header)
   - Description
   - Impact score, reasoning
   - Effort score, reasoning
   - Tier
   - Evaluation question answers (if present)

### Step 3: Assign Goal ID
1. Read SELECTED-GOALS.md (create if doesn't exist)
2. Parse existing goal IDs from "Active Goals" section
3. Assign next sequential ID (e.g., if Goal 03 exists, assign "04")
4. Format: Two-digit padded (01, 02, ... 10, 11, ...)

### Step 4: Generate Selected Goal Entry
1. Use `selected-goal-entry.md` template
2. Populate with:
   - goalId (assigned ID)
   - goalName (from potential goal)
   - status (Planning or Not Started)
   - priority (from input)
   - impactScore, effortScore (from potential goal)
   - owner (from input or "Unassigned")
   - targetDate (from input or "TBD")
   - description (from potential goal)
   - dependencies (from potential goal or "None")
   - blockers ("None")
   - progress ("Not started")
   - nextAction (from input or default)
   - potentialGoalFile (relative path)
   - lastUpdated (today's date)

### Step 5: Update SELECTED-GOALS.md
1. Insert new goal entry at end of "Active Goals" section
2. Update "Last Updated" timestamp at top
3. Update statistics (Total Active Goals count)
4. Update "By Priority" counts
5. Update "By Status" counts

### Step 6: Build Goal Context (if generateSpec=true)
1. Extract all relevant information from potential goal
2. Structure as goalContext object
3. Return in output for handoff to spec-driven MCP

### Step 7: Return Result
1. Format success message
2. Include goal ID and file path
3. Include goalContext if generateSpec=true

---

## Cross-Server Integration

### Goal Context Handoff

When `generateSpec=true`, the tool returns a `goalContext` object that can be passed to spec-driven MCP's `sdd_guide` tool.

**AI Planning MCP Flow:**
```typescript
// User: "Promote mobile app goal and generate spec"

// 1. AI calls promote_to_selected
const result = await callTool({
  name: 'promote_to_selected',
  arguments: {
    projectPath: '/path/to/project',
    potentialGoalFile: 'brainstorming/future-goals/potential-goals/mobile-app.md',
    priority: 'High',
    owner: 'Sarah',
    generateSpec: true  // KEY: Request goal context
  }
});

// 2. Result includes goalContext
{
  success: true,
  goalId: "03",
  goalName: "Mobile App for Field Staff",
  goalContext: {
    goalId: "03",
    goalName: "Mobile App for Field Staff",
    goalDescription: "Build React Native app for mileage logging",
    impactScore: "High",
    impactReasoning: "Saves 25 field staff 30 min/day each",
    effortScore: "High",
    effortReasoning: "8-12 weeks, React Native, offline sync complexity",
    tier: "Next",
    priority: "High",
    owner: "Sarah",
    problem: "Field staff can't use desktop interface on phones",
    expectedValue: "$97K/year time savings",
    dependencies: "REST API to BigQuery",
    risks: "Offline sync complexity, mobile app deployment"
  }
}

// 3. AI then calls spec-driven MCP with goal context
const specResult = await callTool({
  name: 'sdd_guide',
  arguments: {
    action: 'start',
    projectPath: '/path/to/project',
    scenario: 'add-feature',
    goalContext: result.goalContext  // PASS CONTEXT
  }
});
```

**Spec-Driven MCP sdd_guide Enhancement:**
When `goalContext` is provided, sdd_guide should:
1. Use goal information to pre-fill context
2. Skip or simplify redundant questions
3. Use Impact/Effort reasoning in constitution
4. Reference goal ID in spec metadata

---

## Example Usage

### Scenario 1: Simple Promotion (No Spec Generation)

**Input:**
```json
{
  "projectPath": "/Users/me/projects/medical-practice",
  "potentialGoalFile": "brainstorming/future-goals/potential-goals/dark-mode.md",
  "priority": "Low",
  "owner": "Alex"
}
```

**Output:**
```json
{
  "success": true,
  "goalId": "05",
  "goalName": "Add Dark Mode Feature",
  "addedToFile": "/Users/me/projects/medical-practice/brainstorming/future-goals/selected-goals/SELECTED-GOALS.md",
  "message": "Successfully promoted goal to selected status",
  "formatted": "✅ Goal 05: Add Dark Mode Feature\n   Status: Not Started\n   Priority: Low\n   Added to: SELECTED-GOALS.md"
}
```

### Scenario 2: Promotion with Spec Generation

**Input:**
```json
{
  "projectPath": "/Users/me/projects/medical-practice",
  "potentialGoalFile": "brainstorming/future-goals/potential-goals/mobile-app.md",
  "priority": "High",
  "owner": "Sarah",
  "targetDate": "Q2 2025",
  "generateSpec": true
}
```

**Output:**
```json
{
  "success": true,
  "goalId": "03",
  "goalName": "Mobile App for Field Staff",
  "addedToFile": "/Users/me/projects/medical-practice/brainstorming/future-goals/selected-goals/SELECTED-GOALS.md",
  "goalContext": {
    "goalId": "03",
    "goalName": "Mobile App for Field Staff",
    "goalDescription": "Build React Native app with offline mode for mileage logging",
    "impactScore": "High",
    "impactReasoning": "Saves 25 field staff 30 min/day each ($97K/year)",
    "effortScore": "High",
    "effortReasoning": "8-12 weeks, React Native, offline sync complexity",
    "tier": "Next",
    "priority": "High",
    "owner": "Sarah",
    "targetDate": "Q2 2025",
    "problem": "Field staff can't use desktop interface on phones, need real-time mileage logging",
    "expectedValue": "$97K/year time savings, improved data accuracy",
    "dependencies": "REST API to BigQuery for data sync",
    "risks": "Offline sync complexity, mobile app store deployment"
  },
  "message": "Successfully promoted goal and prepared for spec generation",
  "formatted": "✅ Goal 03: Mobile App for Field Staff\n   Status: Planning\n   Priority: High\n   Owner: Sarah\n   Target: Q2 2025\n   \n   📋 Goal context ready for spec-driven workflow\n   Next: Call sdd_guide with goalContext to generate specification"
}
```

---

## File Structure Impact

### Before Promotion
```
project/
└── brainstorming/
    └── future-goals/
        ├── potential-goals/
        │   └── mobile-app.md  ← Goal here
        └── selected-goals/
            └── SELECTED-GOALS.md  ← Empty or has other goals
```

### After Promotion
```
project/
└── brainstorming/
    └── future-goals/
        ├── potential-goals/
        │   └── mobile-app.md  ← Still here (not deleted)
        └── selected-goals/
            └── SELECTED-GOALS.md  ← Updated with Goal 03
```

**Note:** Potential goal file is NOT deleted. It remains as historical record of evaluation.

---

## Error Handling

### Error Cases

1. **Project path not found**
   - Error: `Project path does not exist: /path/to/project`
   - Solution: Check projectPath is correct

2. **Potential goal file not found**
   - Error: `Potential goal file not found: brainstorming/future-goals/potential-goals/mobile-app.md`
   - Solution: Check file path is correct and file exists

3. **Invalid priority**
   - Error: `Invalid priority: Critical. Must be High, Medium, or Low`
   - Solution: Use one of the valid priority values

4. **Malformed potential goal file**
   - Error: `Could not parse potential goal file: Missing Impact section`
   - Solution: Ensure potential goal was created with create_potential_goal tool

5. **SELECTED-GOALS.md is corrupted**
   - Error: `Could not parse SELECTED-GOALS.md: Invalid format`
   - Solution: Manually fix or regenerate from template

---

## Testing Strategy

### Unit Tests

1. Test goal ID assignment (sequential, padded)
2. Test template rendering with various inputs
3. Test markdown parsing of potential goal files
4. Test SELECTED-GOALS.md updating (insertion, stats)

### Integration Tests

1. Promote goal without spec generation
2. Promote goal with spec generation
3. Promote multiple goals in sequence (ID increment)
4. Handle missing optional fields gracefully

### End-to-End Test

1. Create potential goal with `create_potential_goal`
2. Promote to selected with `promote_to_selected`
3. Verify SELECTED-GOALS.md updated correctly
4. If generateSpec=true, verify goalContext is complete and valid

---

## Dependencies

### Required Modules
- `goal-template-renderer.ts` - Template rendering
- Node.js `fs` - File system operations
- Node.js `path` - Path manipulation

### Required Templates
- `selected-goal-entry.md` - Template for goal entry
- SELECTED-GOALS.md structure (created if doesn't exist)

### External Dependencies
- None (tool is self-contained in AI Planning MCP)

---

## Phase 2 Integration Checklist

- [ ] Implement `promote_to_selected` tool
- [ ] Register in AI Planning MCP server
- [ ] Test with existing potential goals
- [ ] Update Spec-Driven MCP `sdd_guide` to accept `goalContext` parameter
- [ ] Test cross-server workflow (promote → spec generation)
- [ ] Document integration pattern
- [ ] Update READMEs

---

**Status:** Design Complete - Ready for Implementation
**Next:** Implement PromoteToSelectedTool class in `src/tools/promote-to-selected.ts`
