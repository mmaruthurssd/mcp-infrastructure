---
type: reference
phase: stable
project: project-management-mcp-server
tags: [MCP, ai-planning, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Project Stakeholders: {{projectName}}

**Last Updated:** {{date}}

---

## Primary Stakeholders (Direct Impact)

{{#if primaryStakeholders.length}}
{{#each primaryStakeholders}}
### {{this.name}}{{#if this.role}} - {{this.role}}{{/if}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.concerns}}
- **Concerns:** {{#each this.concerns}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}
{{else}}
*No primary stakeholders identified yet*
{{/if}}

---

## Secondary Stakeholders (Indirect Impact)

{{#if secondaryStakeholders.length}}
{{#each secondaryStakeholders}}
### {{this.name}}{{#if this.role}} - {{this.role}}{{/if}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}
{{else}}
*No secondary stakeholders identified yet*
{{/if}}

---

## External Stakeholders

{{#if externalStakeholders.length}}
{{#each externalStakeholders}}
### {{this.name}}{{#if this.role}} - {{this.role}}{{/if}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}
{{else}}
*No external stakeholders identified yet*
{{/if}}

---

## Stakeholder Matrix

{{#if allStakeholders.length}}
| Stakeholder | Influence | Interest | Strategy |
|-------------|-----------|----------|----------|
{{#each allStakeholders}}
| {{this.name}} | {{this.influence}} | {{this.interest}} | {{this.strategy}} |
{{/each}}

**Strategies:**
- **Manage Closely:** High influence, High interest - Weekly updates, active engagement
- **Keep Satisfied:** High influence, Low interest - Keep informed of major decisions
- **Keep Informed:** Low influence, High interest - Regular communication, feedback loops
- **Monitor:** Low influence, Low interest - Minimal communication, status updates only
{{else}}
*No stakeholders identified yet*
{{/if}}
