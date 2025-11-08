# Autonomous Deployment Framework Integration

This document describes the integration of the **Autonomous Deployment Framework** into the Project Management MCP Server.

## Overview

The Project Management MCP now integrates with the Autonomous Deployment Framework to provide confidence-based issue classification and autonomous deployment recommendations during goal evaluation.

## Integration Points

### 1. Goal Evaluation (`evaluate_goal`)

The `evaluate_goal` tool now includes **optional** autonomous classification when the `workspacePath` parameter is provided.

**Enhanced Parameters:**
- `workspacePath` (optional): Absolute path to workspace root for autonomous classification

**Enhanced Output:**
```typescript
{
  impact: { ... },
  effort: { ... },
  tier: { ... },
  suggestions: [ ... ],
  nextSteps: [ ... ],

  // NEW: Autonomous classification (only when workspacePath provided)
  autonomous?: {
    confidence: 0.85,           // 0-1 confidence score
    eligible: true,             // Whether eligible for autonomous handling
    recommendedAction: "assisted",  // "autonomous" | "assisted" | "manual"
    issueType: "broken",        // "broken" | "missing" | "improvement"
    baseType: "logic-error",    // Specific subtype
    reasoning: "..."            // Explanation of classification
  }
}
```

**Confidence Thresholds:**
- **90%+ (Autonomous):** Can proceed without approval for low-risk changes
- **70-89% (Assisted):** AI suggests solution for human approval
- **<70% (Manual):** Human-led with AI support

**Example Usage:**
```typescript
const result = await evaluateGoal({
  goalDescription: "Fix bug where users cannot save their work",
  context: "Save button throws error when clicked",
  projectType: "medical",
  workspacePath: "/path/to/workspace"  // Enables autonomous classification
});

console.log(result.autonomous);
// {
//   confidence: 0.92,
//   eligible: true,
//   recommendedAction: "autonomous",
//   issueType: "broken",
//   baseType: "logic-error",
//   reasoning: "High confidence - clear symptom with straightforward fix..."
// }
```

### 2. Potential Goal Creation (`create_potential_goal`)

The `create_potential_goal` tool accepts **optional** autonomous classification fields that are displayed in the generated goal file.

**New Optional Parameters:**
- `autonomousConfidence` (number): Confidence score 0-1
- `autonomousEligible` (boolean): Whether eligible for autonomous handling
- `recommendedAction` (string): "autonomous", "assisted", or "manual"
- `issueType` (string): "broken", "missing", or "improvement"
- `baseType` (string): Specific subtype (e.g., "logic-error", "missing-validation")
- `classificationReasoning` (string): Explanation

**Generated Goal File Section:**

When autonomous classification is provided, the potential goal markdown file includes:

```markdown
### Autonomous Deployment Classification

**Issue Type:** broken → logic-error

**Confidence:** 92%

**Recommended Action:** autonomous
- **autonomous** (≥90%): Can proceed without approval
- **assisted** (70-89%): AI suggests solution for your approval
- **manual** (<70%): Human-led with AI support

**Reasoning:** High confidence - clear symptom with straightforward fix. Logic error in validation with test coverage. Low risk.

✅ **Eligible for autonomous deployment** - High confidence in resolution approach.
```

### 3. Workflow Integration

**Recommended Workflow:**

1. **Evaluate Goal** with `workspacePath` to get autonomous classification
2. **Create Potential Goal** with autonomous fields populated from evaluation
3. **Review Classification** in potential goal file
4. **Promote to Selected** when ready
5. **Hand off to spec-driven MCP** for implementation (if enabled)

**Example:**
```typescript
// Step 1: Evaluate with autonomous classification
const evaluation = await evaluateGoal({
  goalDescription: "Fix authentication timeout bug",
  workspacePath: "/workspace/medical-practice"
});

// Step 2: Create potential goal with autonomous data
await createPotentialGoal({
  projectPath: "/workspace/medical-practice",
  goalName: "fix-auth-timeout",
  goalDescription: evaluation.goalDescription,

  // ... standard fields ...

  // Autonomous fields from evaluation
  autonomousConfidence: evaluation.autonomous?.confidence,
  autonomousEligible: evaluation.autonomous?.eligible,
  recommendedAction: evaluation.autonomous?.recommendedAction,
  issueType: evaluation.autonomous?.issueType,
  baseType: evaluation.autonomous?.baseType,
  classificationReasoning: evaluation.autonomous?.reasoning
});

// Step 3: Goal file now includes autonomous classification section
```

## Implementation Details

### Autonomous Classifier

Located in `src/evaluators/autonomous-classifier.ts`, this component:
- Analyzes goal descriptions and context
- Assigns confidence scores based on:
  - Clarity of symptom/problem
  - Availability of test coverage
  - Risk level (PHI, security, production)
  - Complexity of solution space
- Determines eligibility for autonomous handling

### Backward Compatibility

**All autonomous features are OPTIONAL:**
- `evaluate_goal` works exactly as before when `workspacePath` is NOT provided
- `create_potential_goal` works without autonomous fields
- Existing workflows are unaffected

## Framework Reference

The autonomous classification is powered by the **Autonomous Deployment Framework** located at:
```
development/frameworks/autonomous-deployment/
```

This framework provides:
- Issue classification with confidence scoring
- Validation framework (build, test, security checks)
- Deployment pipeline with staging and production support
- Component adapters for MCP servers, tools, and Google Sheets

## Future Enhancements

Potential future integrations:
- Auto-promotion of high-confidence goals to selected
- Integration with spec-driven MCP for automatic spec generation
- Integration with task-executor MCP for automated validation
- Integration with deployment-release MCP for autonomous deployment

## See Also

- `/development/frameworks/autonomous-deployment/README.md` - Framework documentation
- `/local-instances/mcp-servers/task-executor-mcp-server/AUTONOMOUS-INTEGRATION.md` - Task executor integration
- `src/evaluators/autonomous-classifier.ts` - Classifier implementation
