---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Project Roadmap: {{projectName}}

**Version:** {{version}}
**Created:** {{date}}
**Timeline:** {{duration}} ({{startDate}} - {{endDate}})
**Status:** {{status}}

---

## Executive Summary

This roadmap outlines the implementation plan for {{projectName}}. The project is divided into {{phaseCount}} phases over {{duration}}, with {{milestoneCount}} major milestones.

**Key Deliverables:**
{{#each phases}}
- Phase {{this.number}}: {{this.name}} ({{this.duration}})
{{/each}}

---

{{#each phases}}
## Phase {{this.number}}: {{this.name}} ({{this.duration}})

**Goal:** {{this.goal}}

### Milestones

{{#each this.milestones}}
**{{this.id}}: {{this.name}} ({{this.deadline}})**
{{#if this.deliverables}}
- Deliverables:
{{#each this.deliverables}}
  - {{this}}
{{/each}}
{{/if}}
{{#if this.goals}}
- Goals: {{#each this.goals}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if this.dependencies}}
- Dependencies: {{#each this.dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{/each}}

---

{{/each}}

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| {{version}} | {{date}} | Initial roadmap created | Project Management MCP |
