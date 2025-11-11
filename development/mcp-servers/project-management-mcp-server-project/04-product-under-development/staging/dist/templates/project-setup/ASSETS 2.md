---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, automation, documentation, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Project Assets: {{projectName}}

**Last Updated:** {{date}}

---

## Existing Assets

{{#if existingAssets.length}}
{{#each existingAssets}}
### {{this.name}}
- **Type:** {{this.type}}
- **Description:** {{this.description}}
{{#if this.location}}
- **Location:** {{this.location}}
{{/if}}

{{/each}}
{{else}}
*No existing assets documented yet*
{{/if}}

---

## Needed Assets

{{#if neededAssets.length}}
{{#each neededAssets}}
### {{this.name}} ({{this.priority}} priority)
- **Type:** {{this.type}}
- **Description:** {{this.description}}

{{/each}}
{{else}}
*No needed assets identified yet*
{{/if}}

---

## External Dependencies

{{#if externalDependencies.length}}
{{#each externalDependencies}}
### {{this.name}}
- **Provider:** {{this.provider}}
{{#if this.cost}}
- **Cost:** {{this.cost}}
{{/if}}
{{#if this.setupTime}}
- **Setup Time:** {{this.setupTime}}
{{/if}}
{{#if this.notes}}
- **Notes:** {{this.notes}}
{{/if}}

{{/each}}
{{else}}
*No external dependencies identified yet*
{{/if}}
