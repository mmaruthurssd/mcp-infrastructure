---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Project Resources: {{projectName}}

**Last Updated:** {{date}}

---

## Team

{{#if team.length}}
| Name | Role | Allocation | Skills |
|------|------|------------|--------|
{{#each team}}
| {{this.name}} | {{this.role}} | {{this.allocation}} | {{this.skills}} |
{{/each}}
{{else}}
*No team members specified yet*
{{/if}}

---

## Tools & Platforms

{{#if tools.length}}
{{#each toolCategories}}
### {{this.category}}
{{#each this.tools}}
- {{this}}
{{/each}}

{{/each}}
{{else}}
*No tools specified yet*
{{/if}}

---

## Technologies

{{#if technologies.length}}
{{#each techStacks}}
### {{this.category}}
{{#each this.technologies}}
- {{this}}
{{/each}}

{{/each}}
{{else}}
*No technologies specified yet*
{{/if}}

---

## Budget

{{#if budget.total}}
**Total:** {{budget.total}}

{{#if budget.breakdown}}
| Category | Amount | Notes |
|----------|--------|-------|
{{#each budget.breakdown}}
| {{this.category}} | {{this.amount}} | {{this.notes}} |
{{/each}}
{{/if}}
{{else}}
*No budget specified yet*
{{/if}}

---

## Timeline

{{#if timeline.duration}}
**Total Duration:** {{timeline.duration}}

{{#if timeline.milestones}}
{{#each timeline.milestones}}
- {{this}}
{{/each}}
{{/if}}
{{else}}
*No timeline specified yet*
{{/if}}
