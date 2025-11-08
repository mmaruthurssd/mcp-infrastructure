---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, automation, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Project Constitution: {{projectName}}

**Version:** 1.0
**Created:** {{date}}
**Type:** {{projectType}}

---

## Core Principles

{{#each principles}}
{{add @index 1}}. **{{this.name}}** - {{this.description}}
{{/each}}

---

{{#if deepMode}}
## Decision Framework

When facing tradeoffs, prioritize in this order:

{{#each decisionFramework}}
{{add @index 1}}. {{this}}
{{/each}}

---

## Quality Guidelines

{{#each guidelines}}
- {{this}}
{{/each}}

---
{{/if}}

## Constraints

{{#each constraints}}
- **{{this.type}}:** {{this.description}}
{{/each}}

---

## Success Criteria

{{#each successCriteria}}
- {{this}}
{{/each}}

{{#if ethicsStatement}}
---

## Ethics Statement

{{ethicsStatement}}
{{/if}}

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | {{date}} | Initial constitution created | Project Management MCP |
