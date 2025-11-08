/**
 * Start Project Setup Tool
 *
 * Initiate conversational project planning session.
 *
 * UPDATED: Feature 1 - Creates template structure FIRST, then starts conversation.
 */
import { ConversationManager } from '../utils/conversation-manager.js';
import { TemplateStructureCreator } from '../utils/template-structure-creator.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class StartProjectSetupTool {
    static execute(input) {
        const projectType = input.projectType || 'software';
        const constitutionMode = input.constitutionMode || 'quick';
        // ========================================================================
        // STEP 1: Create template structure FIRST (Feature 1: Structure-First)
        // ========================================================================
        const structureResult = TemplateStructureCreator.create(input.projectPath, {
            projectName: input.projectName,
            projectType,
            includeRootFiles: true,
            includePlaceholders: true,
        });
        if (!structureResult.success) {
            return {
                success: false,
                conversationId: '',
                sessionFile: '',
                projectSetupPath: '',
                nextQuestion: '',
                mode: {
                    constitutionDepth: constitutionMode,
                    estimatedTime: '',
                    questionsRemaining: 0,
                },
                message: `Failed to create template structure: ${structureResult.message}`,
                formatted: `❌ ERROR: ${structureResult.message}`,
            };
        }
        // ========================================================================
        // STEP 2: Initialize conversation (after structure exists)
        // ========================================================================
        const state = ConversationManager.initConversation(input.projectPath, {
            projectName: input.projectName,
            projectType,
            constitutionMode,
            initialDescription: input.initialDescription,
        });
        // Determine estimated time and questions
        const estimatedTime = constitutionMode === 'quick' ? '5-10 minutes' : '15-20 minutes';
        const questionsRemaining = constitutionMode === 'quick' ? 4 : 6;
        // Format output (include structure creation info)
        const formatted = this.formatOutput(state, estimatedTime, questionsRemaining, structureResult);
        return {
            success: true,
            conversationId: state.conversationId,
            sessionFile: `${input.projectPath}/project-setup/conversation-state.json`,
            projectSetupPath: `${input.projectPath}/project-setup`,
            nextQuestion: state.messages[state.messages.length - 1].content,
            mode: {
                constitutionDepth: constitutionMode,
                estimatedTime,
                questionsRemaining,
            },
            templateStructure: {
                foldersCreated: structureResult.foldersCreated.length,
                filesCreated: structureResult.filesCreated.length,
                duration: structureResult.duration,
            },
            message: `Project setup started for ${input.projectName} (structure created in ${structureResult.duration}ms)`,
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'start_project_setup',
            description: 'Initiate a conversational project planning session to gather requirements, goals, stakeholders, resources, and constraints. This is the first step in setting up a new project.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to project directory',
                    },
                    projectName: {
                        type: 'string',
                        description: 'Name of the project',
                    },
                    projectType: {
                        type: 'string',
                        enum: ['software', 'research', 'business', 'product'],
                        description: 'Type of project (default: software)',
                    },
                    constitutionMode: {
                        type: 'string',
                        enum: ['quick', 'deep'],
                        description: 'Constitution generation mode - quick (5 min, 3-5 principles) or deep (15 min, comprehensive framework). Default: quick',
                    },
                    initialDescription: {
                        type: 'string',
                        description: 'Optional initial description to seed the conversation',
                    },
                },
                required: ['projectPath', 'projectName'],
            },
        };
    }
    static formatOutput(state, estimatedTime, questionsRemaining, structureResult) {
        let output = '='.repeat(60) + '\n';
        output += '  PROJECT SETUP STARTED\n';
        output += '='.repeat(60) + '\n\n';
        // Show structure creation results
        if (structureResult) {
            output += `✅ Template Structure Created\n`;
            output += `   • ${structureResult.foldersCreated.length} folders created\n`;
            output += `   • ${structureResult.filesCreated.length} files created\n`;
            output += `   • Completed in ${structureResult.duration}ms\n\n`;
            output += '─'.repeat(60) + '\n\n';
        }
        output += `📋 Project: ${state.projectName}\n`;
        output += `🏗️  Type: ${state.projectType}\n`;
        output += `⚙️  Mode: ${state.constitutionMode} (${estimatedTime})\n`;
        output += `💬 Conversation ID: ${state.conversationId}\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += `📝 FIRST QUESTION:\n\n`;
        output += `${state.messages[state.messages.length - 1].content}\n\n`;
        output += '─'.repeat(60) + '\n\n';
        output += `ℹ️  What to expect:\n`;
        output += `   • ${questionsRemaining} guiding questions\n`;
        output += `   • Open discussion encouraged\n`;
        output += `   • Takes approximately ${estimatedTime}\n`;
        output += `   • AI extracts goals, stakeholders, resources automatically\n\n`;
        output += `💡 Tip: Be conversational! The more context you provide, the better\n`;
        output += `   the AI can generate your project constitution and roadmap.\n\n`;
        output += `📂 Project Structure: Check your project folder - all 8 numbered\n`;
        output += `   folders and root files (README, EVENT-LOG, NEXT-STEPS, etc.) are ready!\n\n`;
        return output;
    }
}
//# sourceMappingURL=start-project-setup%202.js.map