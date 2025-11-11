---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, automation, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

### {{goalId}}. {{goalName}}

**Status:** {{status}}
**Priority:** {{priority}}
**Impact/Effort:** {{impactScore}}/{{effortScore}}
**Owner:** {{owner}}
**Target Date:** {{targetDate}}

**Description:** {{description}}

**Dependencies:**
{{#if dependencies}}
{{dependencies}}
{{else}}
None
{{/if}}

**Blockers:**
{{#if blockers}}
{{blockers}}
{{else}}
None
{{/if}}

**Progress:**
{{#if progress}}
{{progress}}
{{else}}
Not started
{{/if}}

**Next Action:**
{{#if nextAction}}
{{nextAction}}
{{else}}
(Define next action)
{{/if}}

**Files:**
{{#if potentialGoalFile}}
- Potential goal: `{{potentialGoalFile}}`
{{/if}}
{{#if formalPlanFile}}
- Formal plan: `{{formalPlanFile}}`
{{/if}}

**Last Updated:** {{lastUpdated}}

---
