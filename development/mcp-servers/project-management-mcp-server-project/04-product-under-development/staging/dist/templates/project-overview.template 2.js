/**
 * PROJECT OVERVIEW template for hierarchical planning v1.0.0
 *
 * Template uses variable placeholders that get replaced during generation
 */
/**
 * Generate PROJECT OVERVIEW markdown content from extracted data
 */
export function generateProjectOverviewContent(data, projectId) {
    const timestamp = new Date().toISOString();
    return `---
type: overview
tags: [project-overview, hierarchical-planning, v1.0.0]
---

# PROJECT OVERVIEW: ${data.projectName}

**Project ID:** ${projectId}
**Type:** ${data.projectType}
**Created:** ${timestamp.split('T')[0]}
**Last Updated:** ${timestamp.split('T')[0]}
**Status:** Planning

---

## Executive Summary

**Project Name:** ${data.projectName}

**Primary Purpose:** ${data.primaryPurpose}

**Project Type:** ${data.projectType}

---

## Vision

### Vision Statement

${data.visionStatement || 'To be defined during planning phase.'}

### Strategic Goals

${formatListItems(data.goals, 'goal')}

### Target Audience

${formatListItems(data.targetAudience, 'audience')}

### Key Outcomes

${formatListItems(data.keyOutcomes, 'outcome')}

---

## Project Scope

### What's In Scope

${data.primaryPurpose ? `- ${data.primaryPurpose}` : '- To be defined during component planning'}
${data.keyOutcomes ? data.keyOutcomes.map(o => `- ${o}`).join('\n') : ''}

### What's Out of Scope

*To be defined during component planning and goal decomposition.*

---

## Stakeholders

${formatStakeholders(data.stakeholders)}

---

## Resources Available

### Team

${formatListItems(data.team, 'team member')}

### Tools & Technologies

${formatListItems(data.tools, 'tool')}
${formatListItems(data.technologies, 'technology')}

### Budget

${data.budget || '*To be defined.*'}

### External Partners

${formatListItems(data.externalPartners, 'partner')}

---

## Constraints

### Timeline Constraints

${data.timeline || '*No specific timeline constraints identified.*'}

### Budget Constraints

${data.budgetConstraint || '*No specific budget constraints identified.*'}

### Resource Constraints

${formatListItems(data.resourceConstraints, 'constraint')}

### Technical Constraints

${formatListItems(data.technicalConstraints, 'constraint')}

### Regulatory/Compliance Constraints

${formatListItems(data.regulatoryConstraints, 'constraint')}

---

## Components (Big Picture)

*Components will be identified through guided component planning or imported from existing goals.*

**Component Identification Methods:**
1. **Guided Planning:** AI-assisted component identification based on project vision and goals
2. **Bottom-Up:** Import existing goals and group into logical components
3. **Hybrid:** Combination of both approaches

**Next Step:** Run component planning workflow to identify major components.

---

## Success Criteria

**This project will be considered successful when:**

${formatListItems(data.keyOutcomes, 'outcome', 'The project delivers value to stakeholders')}

---

## Risks & Mitigation

*Risks will be identified and documented at the component and goal levels.*

---

## Version Control

### Current Version

**Version:** v1
**Last Modified:** ${timestamp}
**Modified By:** Project Management MCP (Conversation-based generation)
**Change Description:** Initial PROJECT OVERVIEW created from guided conversation

### Version History

*Version history will be maintained as the project evolves.*

---

## Next Steps

1. **Component Planning:** Identify major components (Marketing, Engineering, Legal, etc.)
2. **Goal Decomposition:** Break down strategic goals into major goals per component
3. **Resource Allocation:** Assign team members and resources to components
4. **Timeline Planning:** Create detailed timeline with milestones
5. **Risk Assessment:** Identify and document risks at component level

---

## Notes

This PROJECT OVERVIEW was generated through AI-assisted guided conversation on ${timestamp.split('T')[0]}. It serves as the foundation for hierarchical planning and will evolve as the project progresses.

**How to Update:**
- Use \`update_project_overview\` tool for major changes (triggers cascade analysis)
- Edit this file directly for minor clarifications
- Version changes are tracked automatically

---

**Generated:** ${timestamp}
**Tool:** Project Management MCP v1.0.0
**Method:** Conversational extraction with confirmation
`;
}
/**
 * Format list items with fallback
 */
function formatListItems(items, itemType, fallback) {
    if (!items || items.length === 0) {
        return fallback || `*No ${itemType}s identified yet.*`;
    }
    return items.map(item => `- ${item}`).join('\n');
}
/**
 * Format stakeholders section
 */
function formatStakeholders(stakeholders) {
    if (!stakeholders || stakeholders.length === 0) {
        return '*No stakeholders identified yet.*';
    }
    return stakeholders
        .map(s => `
### ${s.name} - ${s.role}

**Influence:** ${s.influence}
**Interest:** ${s.interest}

${s.concerns && s.concerns.length > 0 ? `**Key Concerns:**\n${s.concerns.map(c => `- ${c}`).join('\n')}` : ''}
`)
        .join('\n');
}
/**
 * Convert extracted data to ProjectOverview entity
 */
export function extractedDataToProjectOverview(data, projectId, projectPath) {
    const timestamp = new Date().toISOString();
    return {
        id: projectId,
        name: data.projectName,
        description: data.primaryPurpose,
        versionInfo: {
            version: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
            updatedBy: 'Project Management MCP',
            changeDescription: 'Initial PROJECT OVERVIEW created from guided conversation',
        },
        versionHistory: [
            {
                version: 1,
                date: timestamp,
                changes: ['Initial PROJECT OVERVIEW created'],
            },
        ],
        vision: {
            missionStatement: data.visionStatement || 'To be defined during planning phase.',
            successCriteria: data.keyOutcomes || [],
            scope: {
                inScope: data.goals || [],
                outOfScope: [],
            },
            risks: [],
        },
        constraints: {
            timeline: {
                startDate: undefined,
                targetEndDate: undefined,
                milestones: [],
            },
            budget: data.budgetConstraint ? {
                available: data.budgetConstraint,
                allocated: '0',
            } : undefined,
            resources: {
                team: data.team || [],
                tools: data.tools || [],
                technologies: data.technologies || [],
            },
        },
        stakeholders: (data.stakeholders || []).map(s => ({
            name: s.name,
            role: s.role,
            influence: s.influence.toLowerCase(),
            interest: s.interest.toLowerCase(),
            concerns: s.concerns || [],
            communication: 'To be defined',
        })),
        resources: {
            existingAssets: data.tools || [],
            neededAssets: [],
            externalDependencies: data.externalPartners || [],
        },
        components: [], // Will be populated during component planning
        createdAt: timestamp,
        lastUpdated: timestamp,
        status: 'planning',
        filePath: `${projectPath}/01-planning/PROJECT-OVERVIEW.md`,
    };
}
//# sourceMappingURL=project-overview.template.js.map