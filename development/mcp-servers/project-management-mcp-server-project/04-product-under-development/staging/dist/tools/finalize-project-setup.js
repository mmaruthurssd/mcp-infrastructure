/**
 * Finalize Project Setup Tool
 *
 * Complete project setup and transition to goal management.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ConversationManager } from '../utils/conversation-manager.js';
import { CreatePotentialGoalTool } from './create-potential-goal.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class FinalizeProjectSetupTool {
    static execute(input) {
        const createGoals = input.createPotentialGoals !== false; // Default true
        // Load conversation
        const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);
        // Mark conversation as completed
        state.status = 'completed';
        ConversationManager.saveConversation(state);
        // Validate all required documents exist in template structure
        const documentsGenerated = {
            constitution: path.join(input.projectPath, '01-planning', 'CONSTITUTION.md'),
            roadmap: path.join(input.projectPath, '02-goals-and-roadmap', 'ROADMAP.md'),
            resources: path.join(input.projectPath, '03-resources-docs-assets-tools', 'RESOURCE-INDEX.md'),
            assets: path.join(input.projectPath, '03-resources-docs-assets-tools', 'RESOURCE-INDEX.md'), // Same file
            stakeholders: path.join(input.projectPath, '03-resources-docs-assets-tools', 'STAKEHOLDERS.md'),
            conversationLog: path.join(input.projectPath, 'project-setup', 'conversation-log.md'),
        };
        // Check which documents exist
        const missingDocs = [];
        for (const [name, filePath] of Object.entries(documentsGenerated)) {
            if (!fs.existsSync(filePath)) {
                missingDocs.push(name);
            }
        }
        if (missingDocs.length > 0) {
            throw new Error(`Missing required documents: ${missingDocs.join(', ')}. Please generate them before finalizing.`);
        }
        // Create potential goal files in core goals (template structure)
        const potentialGoalsDir = path.join(input.projectPath, '02-goals-and-roadmap', 'potential-goals');
        if (!fs.existsSync(potentialGoalsDir)) {
            fs.mkdirSync(potentialGoalsDir, { recursive: true });
        }
        const goalIds = [];
        if (createGoals && input.extractedGoals.length > 0) {
            for (const goal of input.extractedGoals) {
                try {
                    const result = CreatePotentialGoalTool.execute({
                        projectPath: input.projectPath,
                        goalName: goal.name,
                        goalDescription: goal.description,
                        impactScore: goal.suggestedImpact,
                        impactReasoning: `Extracted from project setup conversation. ${goal.extractedFrom}`,
                        peopleAffected: 10, // Default placeholder
                        problemSeverity: goal.suggestedImpact,
                        strategicValue: goal.suggestedImpact,
                        impactConfidence: 'Medium',
                        effortScore: goal.suggestedEffort,
                        effortReasoning: `Estimated based on goal description and project context`,
                        timeEstimate: this.effortToTimeEstimate(goal.suggestedEffort),
                        technicalComplexity: goal.suggestedEffort,
                        dependenciesCount: 0,
                        scopeClarity: 'Medium',
                        effortConfidence: 'Medium',
                        suggestedTier: goal.suggestedTier,
                    });
                    if (result.success) {
                        goalIds.push(result.fileName);
                    }
                }
                catch (error) {
                    // Continue even if one goal fails
                    console.error(`Failed to create goal ${goal.name}:`, error);
                }
            }
        }
        // Parse roadmap to extract summary info
        const roadmapContent = fs.readFileSync(documentsGenerated.roadmap, 'utf-8');
        const phasesMatch = roadmapContent.match(/## Phase (\d+):/g);
        const phases = phasesMatch ? phasesMatch.length : 0;
        const durationMatch = roadmapContent.match(/\*\*Timeline:\*\*\s+([^(\n]+)/);
        const duration = durationMatch ? durationMatch[1].trim() : 'Unknown';
        // Parse resources for budget
        const resourcesContent = fs.readFileSync(documentsGenerated.resources, 'utf-8');
        const budgetMatch = resourcesContent.match(/\*\*Total:\*\*\s+(.+)/);
        const budget = budgetMatch ? budgetMatch[1].trim() : undefined;
        // Count stakeholders
        const stakeholdersContent = fs.readFileSync(documentsGenerated.stakeholders, 'utf-8');
        const stakeholderMatches = stakeholdersContent.match(/###\s+/g);
        const stakeholders = stakeholderMatches ? stakeholderMatches.length : 0;
        // Prepare summary
        const summary = {
            projectName: state.projectName,
            projectType: state.projectType,
            duration,
            phases,
            mainGoals: input.extractedGoals.length,
            stakeholders,
            budget,
        };
        // Define next steps
        const nextSteps = [
            'Review CONSTITUTION.md in 01-planning/',
            'Review ROADMAP.md in 02-goals-and-roadmap/',
            'Review potential goals in 02-goals-and-roadmap/potential-goals/',
            'Use view_goals_dashboard to see all potential goals',
            'Use promote_to_selected to move important goals to selected status',
            'Begin goal implementation workflow',
        ];
        // Format output
        const formatted = this.formatOutput(summary, documentsGenerated, goalIds.length, nextSteps);
        return {
            success: true,
            setupComplete: true,
            documentsGenerated,
            initialGoals: {
                created: goalIds.length,
                goalIds,
                location: potentialGoalsDir,
            },
            summary,
            nextSteps,
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'finalize_project_setup',
            description: 'Complete the project setup process by validating all generated documents and optionally creating initial potential goal files. This is the final step before transitioning to goal management.',
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
                        description: 'Extracted goals from extract_project_goals (will create potential goal files)',
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
                    createPotentialGoals: {
                        type: 'boolean',
                        description: 'Whether to create potential goal files (default: true)',
                    },
                },
                required: ['projectPath', 'conversationId', 'extractedGoals'],
            },
        };
    }
    static effortToTimeEstimate(effortScore) {
        const effortMap = {
            'Very Low': '1-2 days',
            'Low': '3-5 days',
            'Medium': '1-2 weeks',
            'High': '2-4 weeks',
            'Very High': '1-2 months',
        };
        return effortMap[effortScore] || '1-2 weeks';
    }
    static formatOutput(summary, documents, goalsCreated, nextSteps) {
        let output = '='.repeat(60) + '\n';
        output += '  PROJECT SETUP COMPLETE! 🎉\n';
        output += '='.repeat(60) + '\n\n';
        output += `📋 Project: ${summary.projectName}\n`;
        output += `🏗️  Type: ${summary.projectType}\n`;
        output += `📅 Duration: ${summary.duration}\n`;
        output += `📊 Phases: ${summary.phases}\n`;
        output += `🎯 Goals Identified: ${summary.mainGoals}\n`;
        output += `👥 Stakeholders: ${summary.stakeholders}\n`;
        if (summary.budget) {
            output += `💰 Budget: ${summary.budget}\n`;
        }
        output += '\n';
        output += '─'.repeat(60) + '\n\n';
        output += '📄 GENERATED DOCUMENTS:\n\n';
        output += `   ✅ CONSTITUTION.md - Project principles and guidelines\n`;
        output += `   ✅ ROADMAP.md - ${summary.phases}-phase implementation plan\n`;
        output += `   ✅ RESOURCES.md - Team, tools, budget inventory\n`;
        output += `   ✅ ASSETS.md - Existing and needed assets\n`;
        output += `   ✅ STAKEHOLDERS.md - Stakeholder analysis and matrix\n`;
        output += `   ✅ conversation-log.md - Complete planning conversation\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += `🎯 INITIAL GOALS CREATED: ${goalsCreated}\n\n`;
        if (goalsCreated > 0) {
            output += `   All goals saved as potential goals in:\n`;
            output += `   02-goals-and-roadmap/potential-goals/\n\n`;
            output += `   These goals are ready for prioritization and refinement.\n\n`;
        }
        output += '─'.repeat(60) + '\n\n';
        output += '📌 NEXT STEPS:\n\n';
        for (let i = 0; i < nextSteps.length; i++) {
            output += `   ${i + 1}. ${nextSteps[i]}\n`;
        }
        output += '\n';
        output += '─'.repeat(60) + '\n\n';
        output += '🚀 PROJECT SETUP COMPLETE!\n\n';
        output += 'Your project is now ready for goal management.\n';
        output += 'Use the goal management tools to prioritize and track progress.\n\n';
        output += '💡 Recommended workflow:\n';
        output += '   1. Review CONSTITUTION.md in 01-planning/\n';
        output += '   2. Review ROADMAP.md in 02-goals-and-roadmap/\n';
        output += '   3. Run view_goals_dashboard to see your potential goals\n';
        output += '   4. Promote top-priority goals with promote_to_selected\n';
        output += '   5. For each selected goal, use Spec-Driven MCP\n\n';
        return output;
    }
}
//# sourceMappingURL=finalize-project-setup.js.map