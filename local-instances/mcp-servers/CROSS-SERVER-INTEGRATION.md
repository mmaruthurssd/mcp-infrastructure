---
type: guide
phase: stable
project: project-management-mcp-server, spec-driven-mcp-server
tags: [cross-server, integration, workflow, ai-planning, spec-driven, goal-management]
category: mcp-servers
status: completed
priority: high
---

# Cross-Server Integration Guide

**Project Management MCP ↔ Spec-Driven MCP Integration**

This document explains how the Project Management MCP Server and Spec-Driven MCP Server work together to provide a seamless workflow from goal evaluation to feature implementation.

---

## Overview

### Two Servers, One Workflow

**Project Management MCP Server** (Project Management)
- Purpose: "What should we build?"
- Tools: Goal evaluation, selection, prioritization, tracking
- Output: SELECTED-GOALS.md (project roadmap)

**Spec-Driven MCP Server** (Feature Implementation)
- Purpose: "How do we build this?"
- Tools: Constitution, specification, plan, tasks generation
- Output: Constitution, spec, plan, tasks files

### Integration Flow

```
1. BRAINSTORM → Evaluate → Create Potential Goal (Project Management MCP)
   ↓
2. PROMOTE TO SELECTED (Project Management MCP)
   - Adds goal to SELECTED-GOALS.md
   - Returns goalContext object
   ↓
3. GENERATE SPEC (Spec-Driven MCP)
   - Receives goalContext from Project Management MCP
   - Uses goal data to enhance spec generation
   - Creates constitution/spec/plan/tasks
   ↓
4. IMPLEMENT → Archive (Project Management MCP tracks progress)
```

---

## Phase 2 Implementation (Current)

### What's Working

✅ **promote_to_selected Tool** (Project Management MCP)
- Promotes potential goals to selected status
- Adds to SELECTED-GOALS.md
- Returns goalContext for cross-server handoff

✅ **sdd_guide Tool** (Spec-Driven MCP)
- Accepts optional goal_context parameter
- Stores goal data in template context
- Displays goal information in setup message

✅ **Goal Context Data Structure**
```typescript
interface GoalContext {
  goalId: string;            // e.g., "03"
  goalName: string;          // e.g., "Mobile App for Field Staff"
  goalDescription: string;
  impactScore: string;       // High/Medium/Low
  impactReasoning: string;
  effortScore: string;       // High/Medium/Low
  effortReasoning: string;
  tier: string;              // Now/Next/Later/Someday
  priority: string;          // High/Medium/Low
  owner: string;
  targetDate: string;

  // Evaluation questions (if answered)
  problem?: string;
  expectedValue?: string;
  effortDetails?: string;
  dependencies?: string;
  risks?: string;
  alternatives?: string;
  decisionCriteria?: string;
}
```

### What's Pending (Future Phases)

⏳ **Advanced Question Customization** (Phase 2.5 or 3)
- Pre-fill answers from goal context
- Skip redundant questions
- Customize question hints based on goal data

⏳ **Automated Template Enhancement** (Phase 3)
- Include goal context sections in constitution
- Reference goal ID in spec metadata
- Auto-generate success criteria from expected value

---

## Usage Examples

### Example 1: Basic Workflow (Manual Handoff)

**Step 1: Evaluate and Create Potential Goal**

```typescript
// Project Management MCP: Evaluate goal
await callTool({
  name: 'evaluate_goal',
  arguments: {
    goalDescription: 'Build mobile app for field staff mileage logging',
    context: 'Medical practice management system',
    projectType: 'software'
  }
});

// Result: High Impact, High Effort, "Next" tier

// Project Management MCP: Create potential goal
await callTool({
  name: 'create_potential_goal',
  arguments: {
    projectPath: '/path/to/project',
    goalName: 'Mobile App for Field Staff',
    goalDescription: 'Build React Native app with offline mode',
    // ... include evaluation results
  }
});
```

**Step 2: Promote to Selected**

```typescript
// Project Management MCP: Promote goal
const promoteResult = await callTool({
  name: 'promote_to_selected',
  arguments: {
    projectPath: '/path/to/project',
    potentialGoalFile: 'brainstorming/future-goals/potential-goals/mobile-app.md',
    priority: 'High',
    owner: 'Sarah',
    targetDate: 'Q2 2025',
    generateSpec: false  // Manual handoff
  }
});

// Result:
// - Goal 03 added to SELECTED-GOALS.md
// - Status: Not Started
```

**Step 3: Generate Spec (Separate Call)**

```typescript
// Spec-Driven MCP: Start workflow
await callTool({
  name: 'sdd_guide',
  arguments: {
    action: 'start',
    projectPath: '/path/to/project',
    description: 'Mobile app for field staff mileage logging',
    scenario: 'add-feature'
    // No goal_context - manual workflow
  }
});
```

---

### Example 2: Integrated Workflow (Automatic Handoff)

**Step 1: Evaluate and Create** (same as above)

**Step 2: Promote with Spec Generation**

```typescript
// Project Management MCP: Promote with spec generation
const promoteResult = await callTool({
  name: 'promote_to_selected',
  arguments: {
    projectPath: '/path/to/project',
    potentialGoalFile: 'brainstorming/future-goals/potential-goals/mobile-app.md',
    priority: 'High',
    owner: 'Sarah',
    targetDate: 'Q2 2025',
    generateSpec: true  // KEY: Request goal context
  }
});

// Result includes goalContext:
{
  success: true,
  goalId: "03",
  goalName: "Mobile App for Field Staff",
  goalContext: {
    goalId: "03",
    goalName: "Mobile App for Field Staff",
    goalDescription: "Build React Native app with offline mode for mileage logging",
    impactScore: "High",
    impactReasoning: "Saves 25 field staff 30 min/day each ($97K/year)",
    effortScore: "High",
    effortReasoning: "8-12 weeks, React Native, offline sync complexity",
    tier: "Next",
    priority: "High",
    owner: "Sarah",
    targetDate: "Q2 2025",
    problem: "Field staff can't use desktop interface on phones",
    expectedValue: "$97K/year time savings, improved data accuracy",
    dependencies: "REST API to BigQuery for data sync",
    risks: "Offline sync complexity, mobile app store deployment"
  }
}
```

**Step 3: Pass Goal Context to Spec-Driven MCP**

```typescript
// Spec-Driven MCP: Start workflow with goal context
await callTool({
  name: 'sdd_guide',
  arguments: {
    action: 'start',
    projectPath: '/path/to/project',
    description: 'Mobile app for field staff mileage logging',
    scenario: 'add-feature',
    goal_context: promoteResult.goalContext  // PASS CONTEXT
  }
});

// Result:
// "Starting Spec-Driven Development for Goal 03: Mobile App for Field Staff!
//
//  Scenario detected: Adding Feature to Existing Project
//  Goal Impact/Effort: High/High (Tier: Next)
//
//  I'll create specs in: /path/to/project/specs
//
//  Is this correct?"
```

**Step 4: Continue Workflow**

The workflow proceeds normally, but with goal context stored in the state:
- Goal ID, name, description available in templates
- Impact/Effort scores available as template variables
- Risk, dependencies, expected value can be referenced

---

## Technical Details

### Goal Context Storage

When goal_context is provided to sdd_guide, it's stored in the workflow state's template context:

```typescript
// In orchestrator.ts: start() method
if (goalContext) {
  state.templateContext.GOAL_CONTEXT = goalContext;
  state.templateContext.GOAL_ID = goalContext.goalId || '';
  state.templateContext.GOAL_NAME = goalContext.goalName || '';
  state.templateContext.GOAL_DESCRIPTION = goalContext.goalDescription || '';
  state.templateContext.IMPACT_SCORE = goalContext.impactScore || '';
  state.templateContext.EFFORT_SCORE = goalContext.effortScore || '';
  state.templateContext.TIER = goalContext.tier || '';
}
```

These variables are available in all spec-driven templates (constitution, spec, plan, tasks).

### Template Variable Usage

Templates can reference goal context using SCREAMING_SNAKE_CASE variables:

```markdown
# Specification: {{FEATURE_NAME}}

**Goal ID:** {{GOAL_ID}}
**Goal:** {{GOAL_NAME}}
**Impact/Effort:** {{IMPACT_SCORE}}/{{EFFORT_SCORE}} (Tier: {{TIER}})

## Description

{{GOAL_DESCRIPTION}}

## Expected Value

{{GOAL_CONTEXT.expectedValue}}

## Known Dependencies

{{GOAL_CONTEXT.dependencies}}

## Identified Risks

{{GOAL_CONTEXT.risks}}
```

---

## File Structure After Integration

```
project/
├── brainstorming/
│   └── future-goals/
│       ├── potential-goals/
│       │   └── mobile-app.md  ← Created by Project Management MCP
│       └── selected-goals/
│           └── SELECTED-GOALS.md  ← Updated by promote_to_selected
│
└── specs/
    └── 003-mobile-app/  ← Created by Spec-Driven MCP
        ├── constitution.md  ← Includes goal context
        ├── spec.md          ← Includes goal ID, impact/effort
        ├── plan.md
        └── tasks.md
```

---

## Benefits of Cross-Server Integration

1. **Seamless Handoff:** Goal evaluation data flows into spec generation
2. **Reduced Redundancy:** Don't re-answer questions already answered in goal evaluation
3. **Traceability:** Spec files reference goal IDs for easy tracking
4. **Context Preservation:** Impact/effort reasoning informs implementation planning
5. **Roadmap Alignment:** SELECTED-GOALS.md connects to specs/ directory

---

## Future Enhancements (Phase 3+)

### 1. Bi-Directional Updates
- Update SELECTED-GOALS.md status when spec-driven workflow completes
- Link from SELECTED-GOALS.md to generated spec files

### 2. Progress Tracking Integration
- Spec-Driven MCP's update_task_status updates Project Management MCP's goal progress
- Automatic velocity calculation based on task completion

### 3. Advanced Question Skipping
- If goal context includes "problem", skip "What problem does this solve?" in spec-driven
- If goal context includes "dependencies", pre-fill technical dependencies question

### 4. Template Enhancements
- Auto-generate success criteria from goal's expectedValue
- Include impact/effort matrix visualization in spec
- Reference tier (Now/Next/Later/Someday) in planning timeline

---

## Troubleshooting

### Issue: goalContext not appearing in spec files

**Cause:** Template doesn't reference goal context variables
**Solution:** Add variables to template (e.g., {{GOAL_ID}}, {{GOAL_NAME}})

### Issue: "Unknown tool: promote_to_selected"

**Cause:** Project Management MCP server not configured or not running
**Solution:** Add ai-planning MCP to `.mcp.json` and restart Claude Code

### Issue: Goal context passed but not used in questions

**Status:** Expected behavior in Phase 2
**Future:** Phase 3 will add question customization based on goal context

---

## Version History

**Phase 2 (2025-10-25):** Cross-server integration complete
- promote_to_selected returns goalContext
- sdd_guide accepts goal_context parameter
- Goal data stored in template context

**Phase 1 (2025-10-25):** Initial tools
- evaluate_goal (Project Management MCP)
- create_potential_goal (Project Management MCP)
- sdd_guide (Spec-Driven MCP) - without goal context support

---

**Status:** Phase 2 Complete ✅
**Next:** Phase 3 - Advanced question customization and bi-directional updates
