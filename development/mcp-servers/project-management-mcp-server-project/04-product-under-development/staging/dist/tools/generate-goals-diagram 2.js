/**
 * Generate Goals Diagram Tool
 *
 * Generate a draw.io workflow diagram visualizing goals.
 */
import * as fs from 'fs';
import * as path from 'path';
import { generateGoalsDiagram, saveDiagram } from '../utils/diagram-generator.js';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Format output message
 */
function formatOutput(diagramPath, diagramType, goalsIncluded) {
    let output = '═══════════════════════════════════════════════════════\n';
    output += '  GOALS DIAGRAM GENERATED\n';
    output += '═══════════════════════════════════════════════════════\n\n';
    const typeEmoji = {
        roadmap: '🗺️',
        kanban: '📋',
        timeline: '📅',
    };
    output += `${typeEmoji[diagramType] || '📊'} Diagram Type: ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)}\n`;
    output += `📦 Goals Included: ${goalsIncluded}\n`;
    output += `📁 Saved to: ${path.basename(diagramPath)}\n\n`;
    output += '✅ Next steps:\n';
    output += `   1. Open in draw.io: ${diagramPath}\n`;
    output += '   2. Customize layout and styling as needed\n';
    output += '   3. Export to PNG/SVG for sharing\n';
    output += '\n═══════════════════════════════════════════════════════\n';
    return output;
}
/**
 * Count goals in the generated diagram (simplified)
 */
function countGoals(xml) {
    const matches = xml.match(/id="goal-/g);
    return matches ? matches.length : 0;
}
// ============================================================================
// Main Tool Logic
// ============================================================================
export class GenerateGoalsDiagramTool {
    /**
     * Execute the generate_goals_diagram tool
     */
    static execute(input) {
        try {
            // Step 1: Validate input
            if (!fs.existsSync(input.projectPath)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Project path does not exist: ${input.projectPath}`,
                };
            }
            if (!['roadmap', 'kanban', 'timeline'].includes(input.diagramType)) {
                return {
                    success: false,
                    message: 'Error',
                    error: `Invalid diagramType: ${input.diagramType}. Must be 'roadmap', 'kanban', or 'timeline'`,
                };
            }
            // Step 2: Determine output path (template structure)
            const outputPath = input.outputPath || path.join(input.projectPath, '02-goals-and-roadmap', 'workflow-diagrams', `GOALS-${input.diagramType.toUpperCase()}.drawio`);
            // Step 3: Generate diagram XML
            const xml = generateGoalsDiagram(input.projectPath, input.diagramType, {
                includePotential: input.includePotential,
                includeArchived: input.includeArchived,
                tier: input.tier,
                priority: input.priority,
            });
            // Step 4: Save to file
            saveDiagram(xml, outputPath);
            // Step 5: Count goals in diagram
            const goalsIncluded = countGoals(xml);
            // Step 6: Return result
            return {
                success: true,
                diagramPath: outputPath,
                goalsIncluded,
                diagramType: input.diagramType,
                message: `Successfully generated ${input.diagramType} diagram with ${goalsIncluded} goals`,
                formatted: formatOutput(outputPath, input.diagramType, goalsIncluded),
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error',
                error: String(error),
            };
        }
    }
    /**
     * Format the result for display
     */
    static formatResult(result) {
        if (!result.success) {
            return `❌ Error: ${result.error}`;
        }
        return result.formatted || result.message;
    }
    /**
     * Get MCP tool definition
     */
    static getToolDefinition() {
        return {
            name: 'generate_goals_diagram',
            description: 'Generate a draw.io workflow diagram visualizing goals by tier, priority, and status. Supports roadmap, kanban, and timeline layouts.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    diagramType: {
                        type: 'string',
                        enum: ['roadmap', 'kanban', 'timeline'],
                        description: 'Layout style: roadmap (horizontal by tier), kanban (columns), or timeline (Gantt-style)',
                    },
                    includePotential: {
                        type: 'boolean',
                        description: 'Include potential goals (default: false)',
                    },
                    includeArchived: {
                        type: 'boolean',
                        description: 'Include archived goals (default: false)',
                    },
                    tier: {
                        type: 'string',
                        enum: ['Now', 'Next', 'Later', 'Someday'],
                        description: 'Filter by specific tier (optional)',
                    },
                    priority: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Filter by specific priority (optional)',
                    },
                    outputPath: {
                        type: 'string',
                        description: 'Where to save diagram (default: brainstorming/future-goals/GOALS-{TYPE}.drawio)',
                    },
                },
                required: ['projectPath', 'diagramType'],
            },
        };
    }
}
//# sourceMappingURL=generate-goals-diagram%202.js.map