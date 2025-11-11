/**
 * Generate Initial Roadmap Tool
 *
 * Create initial project roadmap with phases and milestones.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ConversationManager } from '../utils/conversation-manager.js';
import { RoadmapBuilder } from '../utils/roadmap-builder.js';
import { ProjectSetupRenderer } from '../utils/project-setup-renderer.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class GenerateInitialRoadmapTool {
    static execute(input) {
        // Load conversation
        const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);
        // Convert extracted goals to GoalSummary format for roadmap builder
        const goalSummaries = input.extractedGoals.map(g => ({
            id: g.id,
            name: g.name,
            tier: g.suggestedTier,
            effort: g.suggestedEffort,
            dependencies: [],
        }));
        // Build roadmap structure
        const roadmap = RoadmapBuilder.buildRoadmap(goalSummaries, input.timeframe);
        // Prepare template data
        const templateData = {
            projectName: state.projectName,
            version: roadmap.version,
            date: new Date().toISOString().split('T')[0],
            duration: roadmap.duration,
            startDate: roadmap.startDate,
            endDate: roadmap.endDate,
            status: roadmap.status,
            phaseCount: roadmap.phaseCount,
            milestoneCount: roadmap.milestoneCount,
            phases: roadmap.phases.map(phase => ({
                ...phase,
                goal: phase.goal || `Complete ${phase.name} phase`,
            })),
        };
        // Render roadmap
        const templatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../templates/project-setup/ROADMAP.md');
        const roadmapContent = ProjectSetupRenderer.render(templatePath, templateData);
        // Save roadmap to 02-goals-and-roadmap/ (template structure)
        const goalsDir = path.join(input.projectPath, '02-goals-and-roadmap');
        if (!fs.existsSync(goalsDir)) {
            fs.mkdirSync(goalsDir, { recursive: true });
        }
        const roadmapPath = path.join(goalsDir, 'ROADMAP.md');
        fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');
        // Format output
        const formatted = this.formatOutput(state.projectName, roadmap, roadmapPath);
        return {
            success: true,
            roadmapPath,
            version: roadmap.version,
            duration: roadmap.duration,
            phases: roadmap.phases.map(p => ({
                number: p.number,
                name: p.name,
                duration: p.duration,
                goalsCount: p.goals.length,
                milestonesCount: p.milestones.length,
            })),
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'generate_initial_roadmap',
            description: 'Generate initial project roadmap with phases and milestones from extracted goals. Groups goals by tier, creates logical phases, and estimates timeline.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to project directory',
                    },
                    conversationId: {
                        type: 'string',
                        description: 'Conversation ID from start_project_setup',
                    },
                    extractedGoals: {
                        type: 'array',
                        description: 'Extracted goals from extract_project_goals',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                suggestedImpact: { type: 'string' },
                                suggestedEffort: { type: 'string' },
                                suggestedTier: { type: 'string' },
                            },
                        },
                    },
                    timeframe: {
                        type: 'string',
                        description: 'Optional timeframe override (e.g., "6 months", "1 year")',
                    },
                },
                required: ['projectPath', 'conversationId', 'extractedGoals'],
            },
        };
    }
    static formatOutput(projectName, roadmap, filePath) {
        let output = '='.repeat(60) + '\n';
        output += '  PROJECT ROADMAP GENERATED\n';
        output += '='.repeat(60) + '\n\n';
        output += `📋 Project: ${projectName}\n`;
        output += `📅 Timeline: ${roadmap.duration} (${roadmap.startDate} - ${roadmap.endDate})\n`;
        output += `📄 File: ${filePath}\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += `🗺️  ROADMAP OVERVIEW:\n\n`;
        for (const phase of roadmap.phases) {
            output += `Phase ${phase.number}: ${phase.name} (${phase.duration})\n`;
            output += `   Goal: ${phase.goal}\n`;
            output += `   Goals: ${phase.goals.length}\n`;
            output += `   Milestones: ${phase.milestones.length}\n`;
            if (phase.milestones.length > 0) {
                output += `   \n`;
                for (const milestone of phase.milestones) {
                    output += `   ${milestone.id}: ${milestone.name}\n`;
                    if (milestone.dependencies.length > 0) {
                        output += `      Dependencies: ${milestone.dependencies.join(', ')}\n`;
                    }
                }
            }
            output += '\n';
        }
        output += '─'.repeat(60) + '\n\n';
        output += `📊 Summary:\n`;
        output += `   • Total Phases: ${roadmap.phaseCount}\n`;
        output += `   • Total Milestones: ${roadmap.milestoneCount}\n`;
        output += `   • Duration: ${roadmap.duration}\n\n`;
        output += '✅ Roadmap saved successfully!\n\n';
        return output;
    }
}
//# sourceMappingURL=generate-initial-roadmap%202.js.map