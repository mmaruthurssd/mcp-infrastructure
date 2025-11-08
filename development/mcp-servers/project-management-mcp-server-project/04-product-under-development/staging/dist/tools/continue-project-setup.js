/**
 * Continue Project Setup Tool
 *
 * Continue multi-turn planning conversation.
 */
import { ConversationManager } from '../utils/conversation-manager.js';
import { NLPExtractor } from '../utils/nlp-extractor.js';
// ============================================================================
// Tool Implementation
// ============================================================================
export class ContinueProjectSetupTool {
    static execute(input) {
        // Load conversation state
        const state = ConversationManager.loadConversation(input.projectPath, input.conversationId);
        // Append user response
        ConversationManager.appendMessage(state, 'user', input.userResponse);
        // Extract information from user response
        const extracted = NLPExtractor.extractAll(input.userResponse);
        ConversationManager.updateExtractedInfo(state, extracted);
        // Determine next question or readiness
        const nextQuestion = ConversationManager.getNextQuestion(state);
        const readyToGenerate = ConversationManager.isReadyToGenerate(state);
        // If we have a next question and not ready, add it to conversation
        if (nextQuestion && !readyToGenerate) {
            ConversationManager.appendMessage(state, 'assistant', nextQuestion);
        }
        // Save updated state
        ConversationManager.saveConversation(state);
        // Prepare counts
        const extractedSoFar = {
            goals: state.extractedInfo.goals.length,
            stakeholders: state.extractedInfo.stakeholders.length,
            resources: (state.extractedInfo.resources.team.length +
                state.extractedInfo.resources.tools.length +
                state.extractedInfo.resources.technologies.length +
                state.extractedInfo.resources.budget.length),
            assets: (state.extractedInfo.assets.existing.length +
                state.extractedInfo.assets.needed.length +
                state.extractedInfo.assets.external.length),
            constraints: state.extractedInfo.constraints.length,
        };
        // Format output
        const formatted = this.formatOutput(state, nextQuestion, readyToGenerate, extractedSoFar);
        let message;
        if (readyToGenerate) {
            message = `Conversation ${state.completeness.overall}% complete - ready to generate project documents`;
        }
        else {
            message = `Conversation ${state.completeness.overall}% complete - continue answering questions`;
        }
        return {
            success: true,
            conversationId: state.conversationId,
            nextQuestion: nextQuestion || undefined,
            readyToGenerate,
            extractedSoFar,
            completeness: state.completeness.overall,
            message,
            formatted,
        };
    }
    static getToolDefinition() {
        return {
            name: 'continue_project_setup',
            description: 'Continue the multi-turn project setup conversation. Provide your response to the previous question, and the AI will extract information and ask the next question or indicate readiness to generate documents.',
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
                    userResponse: {
                        type: 'string',
                        description: 'Your answer to the previous question',
                    },
                },
                required: ['projectPath', 'conversationId', 'userResponse'],
            },
        };
    }
    static formatOutput(state, nextQuestion, readyToGenerate, extractedSoFar) {
        let output = '='.repeat(60) + '\n';
        output += '  PROJECT SETUP CONVERSATION\n';
        output += '='.repeat(60) + '\n\n';
        // Progress bar
        const completeness = state.completeness.overall;
        const barLength = 40;
        const filled = Math.round((completeness / 100) * barLength);
        const empty = barLength - filled;
        output += `Progress: [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${completeness}%\n\n`;
        // Extracted info summary
        output += '📊 EXTRACTED INFORMATION:\n';
        output += `   • Goals: ${extractedSoFar.goals}\n`;
        output += `   • Stakeholders: ${extractedSoFar.stakeholders}\n`;
        output += `   • Resources: ${extractedSoFar.resources}\n`;
        output += `   • Assets: ${extractedSoFar.assets}\n`;
        output += `   • Constraints: ${extractedSoFar.constraints}\n\n`;
        // Completeness checklist
        output += '✓ Completeness Checklist:\n';
        output += `   ${state.completeness.hasProblems ? '✅' : '❌'} Problems/opportunities identified\n`;
        output += `   ${state.completeness.hasStakeholders ? '✅' : '❌'} Stakeholders identified\n`;
        output += `   ${state.completeness.hasResources ? '✅' : '❌'} Resources available\n`;
        output += `   ${state.completeness.hasSuccessCriteria ? '✅' : '❌'} Success criteria defined\n\n`;
        output += '─'.repeat(60) + '\n\n';
        if (readyToGenerate) {
            output += '✅ READY TO GENERATE DOCUMENTS\n\n';
            output += 'You have provided enough information! I can now generate:\n';
            output += '   1. Project Constitution (principles, guidelines, constraints)\n';
            output += '   2. Initial Roadmap (phases, milestones)\n';
            output += '   3. Resources Inventory (team, tools, budget)\n';
            output += '   4. Assets List (existing, needed, external)\n';
            output += '   5. Stakeholders Analysis (influence, communication needs)\n\n';
            output += 'Next steps:\n';
            output += '   • Call extract_project_goals to extract goals from conversation\n';
            output += '   • Call generate_project_constitution to create constitution\n';
            output += '   • Call generate_initial_roadmap to create roadmap\n';
            output += '   • Call identify_resources_and_assets to create resource docs\n';
            output += '   • Call identify_stakeholders to create stakeholder analysis\n';
            output += '   • Call finalize_project_setup to complete setup\n\n';
        }
        else if (nextQuestion) {
            output += `📝 NEXT QUESTION:\n\n`;
            output += `${nextQuestion}\n\n`;
            output += `💡 Tip: Feel free to elaborate! More detail = better documents.\n\n`;
        }
        else {
            output += '⚠️  No next question but not quite ready. Please provide more details.\n\n';
        }
        return output;
    }
}
//# sourceMappingURL=continue-project-setup.js.map