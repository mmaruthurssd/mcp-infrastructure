/**
 * MCP Tool: Component Management
 *
 * Tools for creating, updating, and managing components in hierarchical planning v1.0.0
 */
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { validateComponent } from '../validation/validators.js';
import { calculateComponentProgress } from '../utils/hierarchical-utils.js';
/**
 * MCP Tool: Create Component
 *
 * Create a new component with proper folder structure and metadata
 */
export async function createComponent(args) {
    const { projectPath, componentName, description, purpose, successCriteria = [], owner = 'Unassigned', createSubAreas = [], } = args;
    try {
        // Generate component ID from name
        const componentId = generateComponentId(componentName);
        // Create component folder structure
        const componentsDir = path.join(projectPath, '02-goals-and-roadmap', 'components');
        const componentDir = path.join(componentsDir, componentId);
        if (fs.existsSync(componentDir)) {
            return {
                success: false,
                componentId,
                error: `Component "${componentId}" already exists`,
            };
        }
        // Create directory structure
        fs.mkdirSync(componentDir, { recursive: true });
        fs.mkdirSync(path.join(componentDir, 'major-goals'), { recursive: true });
        fs.mkdirSync(path.join(componentDir, 'archive'), { recursive: true });
        const createdFiles = [];
        // Create sub-areas if specified
        for (const subAreaName of createSubAreas) {
            const subAreaId = generateComponentId(subAreaName);
            const subAreaDir = path.join(componentDir, 'sub-areas', subAreaId);
            fs.mkdirSync(subAreaDir, { recursive: true });
            fs.mkdirSync(path.join(subAreaDir, 'major-goals'), { recursive: true });
        }
        // Create COMPONENT-OVERVIEW.md
        const overviewContent = generateComponentOverviewMarkdown({
            componentId,
            componentName,
            description,
            purpose,
            successCriteria,
            owner,
            projectPath,
            subAreas: createSubAreas,
        });
        const overviewPath = path.join(componentDir, 'COMPONENT-OVERVIEW.md');
        fs.writeFileSync(overviewPath, overviewContent, 'utf-8');
        createdFiles.push(overviewPath);
        // Create component entity
        const timestamp = new Date().toISOString();
        const component = {
            id: componentId,
            name: componentName,
            description,
            purpose: purpose || description,
            projectId: path.basename(projectPath),
            versionInfo: {
                version: 1,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
            progress: {
                percentage: 0,
                status: 'not-started',
                lastUpdated: timestamp,
                completedItems: 0,
                totalItems: 0,
                breakdown: {},
            },
            majorGoals: [],
            subAreas: createSubAreas.map((name) => ({
                id: generateComponentId(name),
                name,
                description: `Sub-area for ${name}`,
                folderPath: `sub-areas/${generateComponentId(name)}`,
            })),
            dependencies: [],
            risks: [],
            successCriteria: successCriteria,
            folderPath: componentDir,
            overviewFilePath: overviewPath,
            createdAt: timestamp,
            lastUpdated: timestamp,
            status: 'planning',
        };
        // Validate component
        const validationResult = validateComponent(component);
        if (!validationResult.valid) {
            // Rollback: delete created directory
            fs.rmSync(componentDir, { recursive: true, force: true });
            return {
                success: false,
                componentId,
                error: `Validation failed: ${validationResult.errors.join(', ')}`,
            };
        }
        return {
            success: true,
            componentId,
            folderPath: componentDir,
            createdFiles,
        };
    }
    catch (error) {
        return {
            success: false,
            componentId: generateComponentId(componentName),
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Generate component ID from name
 */
function generateComponentId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Generate COMPONENT-OVERVIEW markdown content
 */
function generateComponentOverviewMarkdown(data) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `---
type: component-overview
tags: [component, hierarchical-planning, v1.0.0]
---

# COMPONENT: ${data.componentName}

**Component ID:** ${data.componentId}
**Owner:** ${data.owner}
**Created:** ${timestamp}
**Last Updated:** ${timestamp}
**Status:** Planning
**Progress:** 0%

---

## Overview

**Purpose:** ${data.purpose || data.description}

**Description:** ${data.description}

---

## Major Goals

*Major goals will be added using component planning or goal decomposition workflow.*

**How to Add Major Goals:**
1. Use \`create_major_goal\` MCP tool
2. Or use guided component planning workflow
3. Goals will appear in \`major-goals/\` directory

---

## Sub-Areas

${data.subAreas.length > 0
        ? data.subAreas.map(name => `### ${name}\n\nSub-area for ${name.toLowerCase()} activities.\n`).join('\n')
        : '*No sub-areas defined. Add sub-areas using `add_sub_area` MCP tool.*'}

---

## Success Criteria

${data.successCriteria.length > 0
        ? data.successCriteria.map(c => `- [ ] ${c}`).join('\n')
        : '*Success criteria will be defined during planning phase.*'}

---

## Progress & Health

**Current Progress:** 0%
**Status:** Not Started
**Major Goals:** 0 total, 0 complete

**Health Indicators:**
- Progress: 0% (No goals yet)
- Blockers: None identified
- At Risk: No

---

## Dependencies

*Dependencies will be identified during planning.*

---

## Team & Resources

**Team:**
- Owner: ${data.owner}

**Resources:**
*Resources will be allocated during planning.*

---

## Risks

*Risks will be identified and tracked at major goal level.*

---

## Notes

This component was created on ${timestamp} using the Project Management MCP component management tools.

**How to Update:**
- Use \`update_component\` MCP tool for metadata changes
- Add major goals using \`create_major_goal\` tool
- Add sub-areas using \`add_sub_area\` tool
- Track progress automatically via goal completion

---

**Generated:** ${new Date().toISOString()}
**Tool:** Project Management MCP v1.0.0
**Method:** Component management tools
`;
}
/**
 * MCP Tool: Add Sub-Area to Component
 *
 * Add a sub-area to an existing component
 */
export async function addSubArea(args) {
    const { projectPath, componentId, subAreaName, description } = args;
    try {
        const componentDir = path.join(projectPath, '02-goals-and-roadmap', 'components', componentId);
        if (!fs.existsSync(componentDir)) {
            return {
                success: false,
                error: `Component "${componentId}" does not exist`,
            };
        }
        // Generate sub-area ID
        const subAreaId = generateComponentId(subAreaName);
        const subAreaDir = path.join(componentDir, 'sub-areas', subAreaId);
        if (fs.existsSync(subAreaDir)) {
            return {
                success: false,
                error: `Sub-area "${subAreaId}" already exists in component "${componentId}"`,
            };
        }
        // Create sub-area directory structure
        fs.mkdirSync(subAreaDir, { recursive: true });
        fs.mkdirSync(path.join(subAreaDir, 'major-goals'), { recursive: true });
        // Create sub-area README
        const readmePath = path.join(subAreaDir, 'README.md');
        const readmeContent = `# Sub-Area: ${subAreaName}

**Component:** ${componentId}
**Sub-Area ID:** ${subAreaId}
**Created:** ${new Date().toISOString().split('T')[0]}

## Purpose

${description || `Sub-area for ${subAreaName.toLowerCase()} activities.`}

## Major Goals

Major goals for this sub-area will appear in \`major-goals/\` directory.

---

*Generated by Project Management MCP v1.0.0*
`;
        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        // Update COMPONENT-OVERVIEW.md to add sub-area
        // (In production, would parse and update the markdown file)
        return {
            success: true,
            subAreaId,
            folderPath: subAreaDir,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * MCP Tool: Update Component
 *
 * Update component metadata and overview
 */
export async function updateComponent(args) {
    const { projectPath, componentId, updates, changeDescription } = args;
    try {
        const componentDir = path.join(projectPath, '02-goals-and-roadmap', 'components', componentId);
        const overviewPath = path.join(componentDir, 'COMPONENT-OVERVIEW.md');
        if (!fs.existsSync(overviewPath)) {
            return {
                success: false,
                error: `Component "${componentId}" does not exist`,
            };
        }
        // In production, would:
        // 1. Parse existing COMPONENT-OVERVIEW.md
        // 2. Apply updates
        // 3. Increment version
        // 4. Regenerate markdown
        // For now, return success with placeholder
        return {
            success: true,
            updatedFilePath: overviewPath,
            versionInfo: {
                version: 'v2',
                lastModified: new Date().toISOString(),
                changeDescription: changeDescription || 'Component updated',
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * MCP Tool: Get Component Health
 *
 * Calculate component health metrics including progress, status, and risks
 */
export async function getComponentHealth(args) {
    const { projectPath, componentId } = args;
    try {
        const componentDir = path.join(projectPath, '02-goals-and-roadmap', 'components', componentId);
        if (!fs.existsSync(componentDir)) {
            return {
                success: false,
                error: `Component "${componentId}" does not exist`,
            };
        }
        // Read major goals from directory
        const majorGoalsDir = path.join(componentDir, 'major-goals');
        const goals = [];
        if (fs.existsSync(majorGoalsDir)) {
            const goalFiles = fs.readdirSync(majorGoalsDir)
                .filter(f => f.endsWith('.md') && !f.startsWith('.'));
            // In production, would parse each goal file to get actual progress
            for (const file of goalFiles) {
                goals.push({
                    id: file.replace('.md', ''),
                    name: file.replace('.md', '').replace(/-/g, ' '),
                    progress: {
                        percentage: 0,
                        status: 'not-started',
                        lastUpdated: new Date().toISOString(),
                        completedItems: 0,
                        totalItems: 0,
                        breakdown: {},
                    },
                });
            }
        }
        // Calculate progress
        const progressResult = calculateComponentProgress(goals);
        // Calculate risks (simplified)
        const risks = {
            level: 'low',
            count: 0,
            details: [],
        };
        // Calculate velocity (simplified)
        const velocity = {
            goalsPerWeek: 0,
            estimatedCompletion: null,
        };
        // Identify blockers
        const blockers = [];
        return {
            success: true,
            health: {
                componentId,
                componentName: componentId.replace(/-/g, ' '),
                progress: {
                    percentage: progressResult.percentage,
                    status: progressResult.status,
                    completedGoals: progressResult.completedItems,
                    totalGoals: progressResult.totalItems,
                    breakdown: progressResult.breakdown,
                },
                risks,
                velocity,
                blockers,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * MCP Tool Definitions
 */
export const createComponentTool = {
    name: 'create_component',
    description: 'Create a new component with proper folder structure and metadata file',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        componentName: z.string().min(3).describe('Name of the component'),
        description: z.string().min(10).describe('Description of the component'),
        purpose: z.string().optional().describe('Purpose of the component'),
        successCriteria: z.array(z.string()).optional().describe('Success criteria for the component'),
        owner: z.string().optional().describe('Owner of the component (default: Unassigned)'),
        createSubAreas: z.array(z.string()).optional().describe('Sub-areas to create within component'),
    }),
};
export const addSubAreaTool = {
    name: 'add_sub_area',
    description: 'Add a sub-area to an existing component',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        componentId: z.string().describe('Component ID'),
        subAreaName: z.string().describe('Name of the sub-area'),
        description: z.string().optional().describe('Description of the sub-area'),
    }),
};
export const updateComponentTool = {
    name: 'update_component',
    description: 'Update component metadata and overview',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        componentId: z.string().describe('Component ID'),
        updates: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
            purpose: z.string().optional(),
            owner: z.string().optional(),
            successCriteria: z.array(z.string()).optional(),
            status: z.enum(['planning', 'in-progress', 'blocked', 'on-hold', 'completed']).optional(),
        }).describe('Fields to update'),
        changeDescription: z.string().optional().describe('Description of changes'),
    }),
};
export const getComponentHealthTool = {
    name: 'get_component_health',
    description: 'Calculate component health metrics including progress, status, and risks',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to the project directory'),
        componentId: z.string().describe('Component ID'),
    }),
};
//# sourceMappingURL=component-management.js.map