---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# Task Breakdown: {{FEATURE_NAME}}

**Feature ID**: {{FEATURE_ID}}
**Created**: {{CREATED_DATE}}
**Status**: {{STATUS}}

---

## Progress Tracking

Track task status using the `update_task_status` MCP tool:
```
update_task_status({
  projectPath: "{{PROJECT_PATH}}",
  featureId: "{{FEATURE_ID}}",
  taskId: "1.1",
  status: "in-progress" | "done" | "blocked"
})
```

View progress with `get_task_progress`:
```
get_task_progress({
  projectPath: "{{PROJECT_PATH}}",
  featureId: "{{FEATURE_ID}}"
})
```

---

## Task Execution Guide

### Status Symbols
- **[ ]** = Backlog (not started)
- **[~]** = In Progress
- **[x]** = Done
- **[!]** = Blocked

### Execution Types
- **[P]** = Can be executed in parallel with other [P] tasks in the same group
- **[S]** = Must be executed sequentially (blocks until complete)
- **[TEST]** = Test task (write tests first, then implementation)
- **[VALIDATE]** = Checkpoint validation (verify before proceeding)

### Complexity Levels
- 🟢 **Trivial** (1-2): Simple, straightforward implementation
- 🟡 **Simple** (3-4): Clear path, minimal dependencies
- 🟠 **Moderate** (5-6): Multiple steps, some complexity
- 🔴 **Complex** (7-8): Many dependencies, significant effort
- 🟣 **Very Complex** (9-10): High risk, consider decomposing

### Task Structure
Each task follows this format:
```
[ ] Task ID: Description
Complexity: 🟢 3/10 - Simple
File: path/to/file
Dependencies: [list of task IDs that must complete first]
Estimated Effort: X hours
Validation: How to verify task completion
```

**Complexity Breakdown**: Each task includes:
- Complexity score (1-10) with visual indicator
- Reasoning for the score
- Recommendations for high-complexity tasks (≥7)

---

## Phase 0: Prerequisites & Setup

{{#each PREREQUISITE_TASKS}}
### [ ] Task {{this.id}}: {{this.description}}
**Type**: [S]
{{#if this.complexity}}
**Complexity**: {{this.complexity.emoji}} {{this.complexity.score}}/10 - {{this.complexity.level}}
{{/if}}
**File**: {{this.file}}
**Dependencies**: {{this.dependencies}}
**Validation**: {{this.validation}}
{{/each}}

**[VALIDATE]**: All prerequisites met before proceeding

---

{{#each PHASES}}
## Phase {{this.number}}: {{this.name}}

**Goal**: {{this.goal}}

### Tasks

{{#each this.task_groups}}
#### Group {{this.group_id}}: {{this.group_name}}

{{#each this.tasks}}
### [ ] Task {{this.id}}: {{this.description}}
**Type**: [{{this.type}}]{{#if this.is_test}} [TEST]{{/if}}
{{#if this.complexity}}
**Complexity**: {{this.complexity.emoji}} {{this.complexity.score}}/10 - {{this.complexity.level}}
{{/if}}
**File**: {{this.file}}
**Dependencies**: {{this.dependencies}}
{{#if this.estimated_hours}}
**Estimated Effort**: {{this.estimated_hours}} hours
{{/if}}

**Implementation Notes**:
{{this.notes}}

{{#if this.complexity.reasoning}}
**Complexity Reasoning**:
{{#each this.complexity.reasoning}}
- {{this}}
{{/each}}
{{/if}}

{{#if this.complexity.recommendations}}
**Recommendations**:
{{#each this.complexity.recommendations}}
- {{this}}
{{/each}}
{{/if}}

**Validation**:
{{#each this.validation}}
- {{this}}
{{/each}}

**Acceptance Criteria** (from spec):
{{#each this.acceptance_criteria}}
- {{this}}
{{/each}}

---

{{/each}}

{{#if this.validate}}
**[VALIDATE] Group {{this.group_id}} Checkpoint**:
{{#each this.validation_checks}}
- [ ] {{this}}
{{/each}}

{{/if}}

{{/each}}

**[VALIDATE] Phase {{this.number}} Complete**:
{{#each this.phase_validation}}
- [ ] {{this}}
{{/each}}

---

{{/each}}

## Phase N: Final Integration & Validation

### Integration Tasks

{{#each INTEGRATION_TASKS}}
### [ ] Task {{this.id}}: {{this.description}}
**Type**: [S]
{{#if this.complexity}}
**Complexity**: {{this.complexity.emoji}} {{this.complexity.score}}/10 - {{this.complexity.level}}
{{/if}}
**File**: {{this.file}}
**Dependencies**: {{this.dependencies}}
**Validation**: {{this.validation}}
{{/each}}

### End-to-End Testing

{{#each E2E_TASKS}}
### [ ] Task {{this.id}}: {{this.description}}
**Type**: [TEST]
{{#if this.complexity}}
**Complexity**: {{this.complexity.emoji}} {{this.complexity.score}}/10 - {{this.complexity.level}}
{{/if}}
**Test File**: {{this.test_file}}
**Scenarios**: {{this.scenarios}}
**Validation**: {{this.validation}}
{{/each}}

### Documentation Tasks

{{#each DOCUMENTATION_TASKS}}
### [ ] Task {{this.id}}: {{this.description}}
{{#if this.complexity}}
**Complexity**: {{this.complexity.emoji}} {{this.complexity.score}}/10 - {{this.complexity.level}}
{{/if}}
**File**: {{this.file}}
**Content**: {{this.content_requirements}}
{{/each}}

---

## Final Validation Checklist

### Functional Completeness
{{#each FUNCTIONAL_CHECKS}}
- [ ] {{this}}
{{/each}}

### Quality Gates
{{#each QUALITY_CHECKS}}
- [ ] {{this}}
{{/each}}

### User Story Validation
{{#each USER_STORY_CHECKS}}
- [ ] User Story {{this.id}}: {{this.description}}
  {{#each this.acceptance_criteria}}
  - [ ] {{this}}
  {{/each}}
{{/each}}

### Constitutional Compliance
- [ ] All tests passing (Article I: Testing)
- [ ] Code reviewed (Article II: Quality)
- [ ] Simplicity maintained (Article III: Simplicity)
{{#if PHI_HANDLING}}
- [ ] PHI protection verified (Article IV: PHI)
- [ ] No PHI in logs or debug output
- [ ] Audit logging functional
{{/if}}

### Deployment Readiness
- [ ] All documentation complete
- [ ] Deployment scripts tested
- [ ] Rollback plan validated
- [ ] Monitoring and alerts configured
- [ ] Stakeholder sign-off obtained

---

## Task Execution Summary

**Total Tasks**: {{TOTAL_TASKS}}
**Parallel Groups**: {{PARALLEL_GROUPS}}
**Sequential Tasks**: {{SEQUENTIAL_TASKS}}
**Test Tasks**: {{TEST_TASKS}}
**Estimated Total Effort**: {{TOTAL_EFFORT}}

---

**Document Status**: {{DOCUMENT_STATUS}}
**Last Updated**: {{LAST_UPDATED}}
**Ready for Implementation**: {{READY_STATUS}}
