/**
 * Create Component Tool
 *
 * MCP Tool: Creates component folder structure with COMPONENT-OVERVIEW.md
 *
 * Created: 2025-10-27
 * Goal: 005 - Build Component Management Tools
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================
/**
 * Create component with full folder structure
 */
export async function createComponent(input) {
    const createdFiles = [];
    const createdFolders = [];
    try {
        // Generate component ID (slugified name)
        const componentId = slugify(input.componentName);
        // Define folder structure
        const componentPath = join(input.projectPath, 'components', componentId);
        const subAreasPath = join(componentPath, 'sub-areas');
        const majorGoalsPath = join(componentPath, 'major-goals');
        // Create folders
        await mkdir(componentPath, { recursive: true });
        createdFolders.push(componentPath);
        await mkdir(subAreasPath, { recursive: true });
        createdFolders.push(subAreasPath);
        await mkdir(majorGoalsPath, { recursive: true });
        createdFolders.push(majorGoalsPath);
        // Create sub-area folders if provided
        const subAreas = input.subAreas || [];
        for (const subArea of subAreas) {
            const subAreaId = slugify(subArea);
            const subAreaPath = join(subAreasPath, subAreaId);
            await mkdir(subAreaPath, { recursive: true });
            createdFolders.push(subAreaPath);
        }
        // Create COMPONENT-OVERVIEW.md
        const overviewContent = generateComponentOverview({
            componentId,
            componentName: input.componentName,
            purpose: input.purpose,
            subAreas,
            successCriteria: input.successCriteria || [],
            dependencies: input.dependencies || [],
            risks: input.risks || [],
        });
        const overviewPath = join(componentPath, 'COMPONENT-OVERVIEW.md');
        await writeFile(overviewPath, overviewContent, 'utf-8');
        createdFiles.push(overviewPath);
        // Create Component entity
        const component = {
            id: componentId,
            name: input.componentName,
            description: input.purpose,
            projectId: 'project',
            versionInfo: {
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            subAreas: subAreas.map((sa, idx) => ({
                id: slugify(sa),
                name: sa,
                description: '',
                folderPath: join(subAreasPath, slugify(sa)),
            })),
            majorGoals: [],
            purpose: input.purpose,
            successCriteria: input.successCriteria || [],
            dependencies: [],
            risks: (input.risks || []).map((r, idx) => ({
                id: `risk-${idx + 1}`,
                description: r,
                impact: 'medium',
                probability: 'medium',
                mitigation: 'To be determined',
            })),
            progress: {
                percentage: 0,
                status: 'not-started',
                lastUpdated: new Date().toISOString(),
                completedItems: 0,
                totalItems: 0,
            },
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: 'planning',
            folderPath: componentPath,
            overviewFilePath: overviewPath,
        };
        return {
            success: true,
            component,
            createdFiles,
            createdFolders,
        };
    }
    catch (error) {
        return {
            success: false,
            component: {},
            createdFiles,
            createdFolders,
            error: error.message,
        };
    }
}
function generateComponentOverview(data) {
    const template = `---
type: component-overview
tags: [component, ${data.componentId}, v1.0.0]
---

# Component: ${data.componentName}

**Component ID:** ${data.componentId}
**Created:** ${new Date().toISOString().split('T')[0]}
**Status:** Planning

---

## Purpose

${data.purpose}

---

## Sub-Areas

${data.subAreas.length > 0 ? data.subAreas.map((sa, idx) => `${idx + 1}. **${sa}**`).join('\n') : '*No sub-areas defined yet*'}

---

## Major Goals

*To be created as needed*

Track major goals in the \`major-goals/\` folder.

---

## Success Criteria

${data.successCriteria.length > 0 ? data.successCriteria.map(c => `- ${c}`).join('\n') : '*To be defined*'}

---

## Dependencies

${data.dependencies.length > 0 ? data.dependencies.map(d => `- ${d}`).join('\n') : '*No dependencies identified*'}

---

## Risks

${data.risks.length > 0 ? data.risks.map(r => `- ${r}`).join('\n') : '*No risks identified*'}

---

## Progress

- **Status:** Not Started
- **Completion:** 0%
- **Major Goals:** 0/0
- **Last Updated:** ${new Date().toISOString().split('T')[0]}

---

## Notes

*Add component-specific notes here*

---

**Generated by:** Project Management MCP v1.0.0
`;
    return template;
}
// ============================================================================
// UTILITIES
// ============================================================================
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
//# sourceMappingURL=create-component.js.map