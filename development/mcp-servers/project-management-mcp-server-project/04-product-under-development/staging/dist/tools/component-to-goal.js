/**
 * Component to Goal Tool
 *
 * Converts finalized component to goal in 02-goals-and-roadmap/
 */
import * as fs from 'fs';
import * as path from 'path';
import { getComponent, logComponentChange, moveComponent, } from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
export class ComponentToGoalTool {
    static getToolDefinition() {
        return {
            name: 'component_to_goal',
            description: 'Convert a finalized component to a goal in 02-goals-and-roadmap/ with sub-goals',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    componentName: {
                        type: 'string',
                        description: 'Name of the finalized component to convert',
                    },
                    goalType: {
                        type: 'string',
                        enum: ['feature', 'improvement', 'research', 'custom'],
                        description: 'Type of goal to create (default: feature)',
                    },
                    priority: {
                        type: 'string',
                        enum: ['high', 'medium', 'low'],
                        description: 'Goal priority (default: medium)',
                    },
                    archiveComponent: {
                        type: 'boolean',
                        description: 'Archive the component after conversion (default: true)',
                    },
                },
                required: ['projectPath', 'componentName'],
            },
        };
    }
    static execute(params) {
        try {
            // Get component
            const component = getComponent(params.projectPath, params.componentName);
            if (!component) {
                throw new Error(`Component "${params.componentName}" not found`);
            }
            // Validate component is finalized
            if (component.stage !== 'FINALIZED') {
                throw new Error(`Component must be FINALIZED before converting to goal. Current stage: ${component.stage}`);
            }
            const goalType = params.goalType || 'feature';
            const priority = params.priority || 'medium';
            const archiveComponent = params.archiveComponent !== false; // default true
            // Generate goal ID from component name
            const goalId = component.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            // Create goal directory in potential-goals
            const goalPath = path.join(params.projectPath, '02-goals-and-roadmap', 'potential-goals', goalId);
            if (fs.existsSync(goalPath)) {
                throw new Error(`Goal directory already exists: ${goalPath}`);
            }
            fs.mkdirSync(goalPath, { recursive: true });
            // Generate goal markdown
            const goalMarkdown = generateGoalMarkdown(component, goalType, priority);
            const goalFilePath = path.join(goalPath, 'goal.md');
            fs.writeFileSync(goalFilePath, goalMarkdown, 'utf-8');
            // Archive component if requested
            let archived = false;
            let finalComponent = component;
            if (archiveComponent) {
                const moveResult = moveComponent(params.projectPath, params.componentName, 'ARCHIVED');
                finalComponent = moveResult.component;
                archived = true;
            }
            // Log change
            logComponentChange(params.projectPath, {
                componentName: component.name,
                action: 'converted_to_goal',
                toStage: archived ? 'ARCHIVED' : component.stage,
                description: `Converted to ${goalType} goal: ${goalFilePath}`,
            });
            // Propagate changes (update ROADMAP)
            propagateComponentChange(params.projectPath, component.name, 'converted_to_goal', component.stage, archived ? 'ARCHIVED' : component.stage);
            // Generate next actions
            const nextActions = [
                'Review goal details and priority',
                'Promote to selected goals when ready: use promote_to_selected tool',
                'Generate detailed specification: use prepare_spec_handoff tool',
            ];
            return {
                success: true,
                goalPath: goalFilePath,
                component: finalComponent,
                archived,
                message: `Component "${component.name}" converted to ${goalType} goal successfully`,
                nextActions,
            };
        }
        catch (error) {
            throw error;
        }
    }
}
function generateGoalMarkdown(component, goalType, priority) {
    const today = new Date().toISOString().split('T')[0];
    return `---
type: goal
tags: [${component.name.toLowerCase().replace(/\s+/g, '-')}, goal, component-driven]
status: potential
priority: ${priority}
created: ${today}
goalType: ${goalType}
---

# Goal: ${component.name}

**Priority**: ${priority}
**Goal Type**: ${goalType}
**Status**: Potential
**Created**: ${today}
**Origin**: Converted from component in project-overview-working.md

---

## Description

${component.description}

**Why this matters**: ${component.notes || 'This component is essential for project success'}

---

## Sub-Goals

${(component.subComponents || [])
        .map((sc, i) => `### ${i + 1}. ${sc.name}

${sc.description}

**Status**: ${sc.status || 'pending'}
`)
        .join('\n')}

${component.subComponents && component.subComponents.length === 0
        ? '*(No sub-components defined)*'
        : ''}

---

## Dependencies

**Depends on**:
${component.dependencies?.requires && component.dependencies.requires.length > 0
        ? component.dependencies.requires.map((d) => `- ${d}`).join('\n')
        : '- None'}

**Blocks**:
${component.dependencies?.requiredBy && component.dependencies.requiredBy.length > 0
        ? component.dependencies.requiredBy.map((d) => `- ${d}`).join('\n')
        : '- None'}

**Related to**:
${component.dependencies?.relatedTo && component.dependencies.relatedTo.length > 0
        ? component.dependencies.relatedTo.map((d) => `- ${d}`).join('\n')
        : '- None'}

---

## Success Criteria

- [ ] Component fully implemented
- [ ] All sub-components complete
- [ ] Dependencies satisfied
- [ ] Acceptance criteria met

---

## Implementation Notes

Created from component: ${component.name}
Source: \`01-planning/project-overview-working.md\`
Stage at conversion: ${component.stage}

**Next Steps**:
1. Review and refine goal details
2. Promote to selected goals when ready
3. Generate detailed specification (spec-driven MCP)
4. Create task workflow (task-executor MCP)
5. Begin implementation
`;
}
//# sourceMappingURL=component-to-goal.js.map