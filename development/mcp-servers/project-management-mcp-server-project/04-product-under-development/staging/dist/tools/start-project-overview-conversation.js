/**
 * Start Project Overview Conversation
 *
 * MCP Tool: Initiates guided conversation for PROJECT OVERVIEW generation
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractProjectType, } from '../utils/information-extraction';
// ============================================================================
// QUESTIONS
// ============================================================================
const QUESTIONS = [
    {
        id: 1,
        phase: 'gathering',
        text: `Let's create your project overview! First, tell me about your project:
- What are you building?
- What problem does it solve?
- Who is it for?

(Feel free to describe it naturally - I'll extract the key details)`,
        extractFields: ['projectName', 'description', 'problemStatement', 'stakeholders'],
    },
    {
        id: 2,
        phase: 'gathering',
        text: `Great! Now, imagine this project is successfully completed. What does success look like?
- What are the key outcomes?
- How will you know it's working?
- What's the ultimate goal?`,
        extractFields: ['vision.missionStatement', 'vision.successCriteria'],
    },
    {
        id: 3,
        phase: 'gathering',
        text: `Let's talk about scope and constraints:
- What's IN scope for this project?
- What's explicitly OUT of scope?
- Any timeline or resource constraints?
- Any risks or concerns?`,
        extractFields: [
            'vision.scope.inScope',
            'vision.scope.outOfScope',
            'constraints.timeline',
            'vision.risks',
        ],
    },
    {
        id: 4,
        phase: 'gathering',
        text: `What resources do you have available, and what do you need?
- Existing assets (code, designs, documentation)
- Team members and their roles
- Tools and technologies you're using
- External dependencies`,
        extractFields: [
            'resources.existingAssets',
            'resources.neededAssets',
            'resources.externalDependencies',
            'constraints.resources.team',
            'constraints.resources.technologies',
        ],
    },
    {
        id: 5,
        phase: 'gathering',
        text: `Do you already have a sense of major components or work areas for this project?
(Skip if not - I can suggest some based on what you've shared)`,
        extractFields: ['components'],
        optional: true,
    },
];
// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================
/**
 * Start PROJECT OVERVIEW conversation
 */
export async function startProjectOverviewConversation(input) {
    try {
        // Generate conversation ID
        const conversationId = uuidv4();
        // Initialize conversation state
        const state = {
            conversationId,
            projectPath: input.projectPath,
            currentPhase: 'gathering',
            currentQuestion: 1,
            totalQuestions: QUESTIONS.length,
            extracted: {
                projectName: input.projectName,
                description: input.initialDescription,
                projectType: input.initialDescription
                    ? extractProjectType(input.initialDescription)
                    : undefined,
            },
            messages: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        };
        // Add initial description to history if provided
        if (input.initialDescription) {
            state.messages.push({
                role: 'user',
                content: input.initialDescription,
                timestamp: new Date().toISOString(),
            });
        }
        // Save conversation state
        await saveConversationState(input.projectPath, state);
        // Get first question
        const firstQuestion = QUESTIONS[0];
        // Add question to history
        state.messages.push({
            role: 'assistant',
            content: firstQuestion.text,
            timestamp: new Date().toISOString(),
        });
        await saveConversationState(input.projectPath, state);
        return {
            success: true,
            conversationId,
            currentQuestion: {
                questionNumber: 1,
                totalQuestions: QUESTIONS.length,
                questionText: firstQuestion.text,
                phase: 'gathering',
            },
            conversationState: state,
        };
    }
    catch (error) {
        return {
            success: false,
            conversationId: '',
            currentQuestion: {
                questionNumber: 0,
                totalQuestions: 0,
                questionText: '',
                phase: 'gathering',
            },
            conversationState: {},
            error: error.message,
        };
    }
}
export async function continueProjectOverviewConversation(input) {
    try {
        // Load conversation state
        const state = await loadConversationState(input.projectPath, input.conversationId);
        if (!state) {
            throw new Error(`Conversation ${input.conversationId} not found`);
        }
        // Add user response to history
        state.messages.push({
            role: 'user',
            content: input.userResponse,
            timestamp: new Date().toISOString(),
        });
        // Extract information from response
        const currentQuestionData = QUESTIONS[state.currentQuestion - 1];
        await extractInformationFromResponse(state, input.userResponse, currentQuestionData);
        // Move to next question or confirmation
        state.currentQuestion++;
        if (state.currentQuestion > QUESTIONS.length) {
            // All questions answered - move to confirmation
            state.currentPhase = 'confirming';
            state.lastUpdated = new Date().toISOString();
            await saveConversationState(input.projectPath, state);
            const confirmationText = generateConfirmationPreview(state.extracted);
            return {
                success: true,
                conversationId: input.conversationId,
                confirmationPreview: confirmationText,
                conversationComplete: false,
                extractedData: state.extracted,
            };
        }
        // Get next question
        const nextQuestion = QUESTIONS[state.currentQuestion - 1];
        // Add question to history
        state.messages.push({
            role: 'assistant',
            content: nextQuestion.text,
            timestamp: new Date().toISOString(),
        });
        state.lastUpdated = new Date().toISOString();
        await saveConversationState(input.projectPath, state);
        return {
            success: true,
            conversationId: input.conversationId,
            currentQuestion: {
                questionNumber: state.currentQuestion,
                totalQuestions: QUESTIONS.length,
                questionText: nextQuestion.text,
                phase: 'gathering',
            },
            conversationComplete: false,
        };
    }
    catch (error) {
        return {
            success: false,
            conversationId: input.conversationId,
            conversationComplete: false,
            error: error.message,
        };
    }
}
// ============================================================================
// INFORMATION EXTRACTION
// ============================================================================
async function extractInformationFromResponse(state, response, questionData) {
    const text = response.toLowerCase();
    // Import extraction functions
    const { extractProjectName, extractProjectType, extractSuccessCriteria, extractScope, extractTimeline, extractTechnologies, extractRisks, extractResources, suggestComponents, } = await import('../utils/information-extraction');
    // Extract based on question type
    switch (questionData.id) {
        case 1: // Project basics
            if (!state.extracted.projectName) {
                state.extracted.projectName = extractProjectName(response);
            }
            if (!state.extracted.description) {
                state.extracted.description = response.split('\n')[0].trim();
            }
            if (!state.extracted.problemStatement) {
                state.extracted.problemStatement = response;
            }
            if (!state.extracted.projectType) {
                state.extracted.projectType = extractProjectType(response);
            }
            break;
        case 2: // Vision & success
            if (!state.extracted.vision) {
                state.extracted.vision = {};
            }
            if (!state.extracted.vision.missionStatement) {
                // Extract first meaningful sentence as mission
                const sentences = response.split(/[.!?]/);
                state.extracted.vision.missionStatement = sentences[0]?.trim() || response.substring(0, 200);
            }
            const criteria = extractSuccessCriteria(response);
            if (criteria.length > 0) {
                state.extracted.vision.successCriteria = criteria;
            }
            break;
        case 3: // Scope & constraints
            if (!state.extracted.vision) {
                state.extracted.vision = {};
            }
            const scope = extractScope(response);
            if (!state.extracted.vision.scope) {
                state.extracted.vision.scope = scope;
            }
            else {
                if (scope.inScope.length > 0) {
                    state.extracted.vision.scope.inScope = [
                        ...(state.extracted.vision.scope.inScope || []),
                        ...scope.inScope,
                    ];
                }
                if (scope.outOfScope.length > 0) {
                    state.extracted.vision.scope.outOfScope = [
                        ...(state.extracted.vision.scope.outOfScope || []),
                        ...scope.outOfScope,
                    ];
                }
            }
            const timeline = extractTimeline(response);
            if (Object.keys(timeline).length > 0) {
                if (!state.extracted.constraints) {
                    state.extracted.constraints = {};
                }
                state.extracted.constraints.timeline = timeline;
            }
            const risks = extractRisks(response);
            if (risks.length > 0) {
                if (!state.extracted.vision.risks) {
                    state.extracted.vision.risks = [];
                }
                state.extracted.vision.risks = risks;
            }
            break;
        case 4: // Resources
            const resources = extractResources(response);
            if (!state.extracted.resources) {
                state.extracted.resources = {};
            }
            if (resources.existingAssets.length > 0) {
                state.extracted.resources.existingAssets = resources.existingAssets;
            }
            if (resources.neededAssets.length > 0) {
                state.extracted.resources.neededAssets = resources.neededAssets;
            }
            if (resources.externalDependencies.length > 0) {
                state.extracted.resources.externalDependencies = resources.externalDependencies;
            }
            const tech = extractTechnologies(response);
            if (!state.extracted.constraints) {
                state.extracted.constraints = {};
            }
            if (!state.extracted.constraints.resources) {
                state.extracted.constraints.resources = {};
            }
            if (tech.tools.length > 0) {
                state.extracted.constraints.resources.tools = tech.tools;
            }
            if (tech.technologies.length > 0) {
                state.extracted.constraints.resources.technologies = tech.technologies;
            }
            // Extract team info
            if (text.includes('solo') || text.includes('just me')) {
                state.extracted.constraints.resources.team = [
                    { name: 'Solo Developer', role: 'Developer', availability: 'Full-time' },
                ];
            }
            break;
        case 5: // Components
            if (text.includes('skip') || text.includes('not sure') || text.includes('suggest')) {
                // User wants suggestions - use AI to suggest based on project type
                if (state.extracted.projectType) {
                    const suggested = suggestComponents(state.extracted.projectType, state.extracted.description || '');
                    state.extracted.components = suggested;
                }
            }
            else {
                // User provided components - extract them
                const lines = response.split('\n').filter(l => l.trim());
                const components = lines.map((line, idx) => ({
                    name: line.replace(/^[-*•\d.]+/, '').trim(),
                    purpose: 'User-defined component',
                    suggested: false,
                }));
                state.extracted.components = components;
            }
            break;
    }
}
// ============================================================================
// CONFIRMATION PREVIEW
// ============================================================================
function generateConfirmationPreview(extracted) {
    let preview = `Here's what I've captured:\n\n`;
    preview += `**PROJECT OVERVIEW**\n`;
    preview += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    preview += `**PROJECT NAME:** ${extracted.projectName || 'TBD'}\n`;
    preview += `**DESCRIPTION:** ${extracted.description || 'TBD'}\n`;
    preview += `**TYPE:** ${extracted.projectType || 'other'}\n\n`;
    if (extracted.vision) {
        preview += `**VISION:**\n`;
        if (extracted.vision.missionStatement) {
            preview += `• Mission: ${extracted.vision.missionStatement}\n`;
        }
        if (extracted.vision.successCriteria && extracted.vision.successCriteria.length > 0) {
            preview += `• Success Criteria:\n`;
            extracted.vision.successCriteria.forEach(c => {
                preview += `  - ${c}\n`;
            });
        }
        preview += `\n`;
    }
    if (extracted.vision?.scope) {
        preview += `**SCOPE:**\n`;
        if (extracted.vision.scope.inScope && extracted.vision.scope.inScope.length > 0) {
            preview += `• In Scope:\n`;
            extracted.vision.scope.inScope.forEach(item => {
                preview += `  - ${item}\n`;
            });
        }
        if (extracted.vision.scope.outOfScope && extracted.vision.scope.outOfScope.length > 0) {
            preview += `• Out of Scope:\n`;
            extracted.vision.scope.outOfScope.forEach(item => {
                preview += `  - ${item}\n`;
            });
        }
        preview += `\n`;
    }
    if (extracted.constraints) {
        preview += `**CONSTRAINTS:**\n`;
        if (extracted.constraints.timeline?.estimatedDuration) {
            preview += `• Timeline: ${extracted.constraints.timeline.estimatedDuration}\n`;
        }
        if (extracted.constraints.resources?.technologies && extracted.constraints.resources.technologies.length > 0) {
            preview += `• Technologies: ${extracted.constraints.resources.technologies.join(', ')}\n`;
        }
        preview += `\n`;
    }
    if (extracted.components && extracted.components.length > 0) {
        preview += `**COMPONENTS ${extracted.components[0].suggested ? '(AI Suggested)' : ''}:**\n`;
        extracted.components.forEach((c, idx) => {
            preview += `  ${idx + 1}. ${c.name}\n`;
        });
        preview += `\n`;
    }
    preview += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    preview += `Does this look accurate? Reply with:\n`;
    preview += `- "approve" to generate PROJECT OVERVIEW\n`;
    preview += `- "refine [section]" to make changes\n`;
    preview += `- "manual" to edit the file directly\n`;
    return preview;
}
// ============================================================================
// STATE PERSISTENCE
// ============================================================================
async function saveConversationState(projectPath, state) {
    const stateDir = join(projectPath, '.mcp-conversations');
    await mkdir(stateDir, { recursive: true });
    const statePath = join(stateDir, `${state.conversationId}.json`);
    await writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}
async function loadConversationState(projectPath, conversationId) {
    try {
        const { readFile } = await import('fs/promises');
        const statePath = join(projectPath, '.mcp-conversations', `${conversationId}.json`);
        const content = await readFile(statePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=start-project-overview-conversation.js.map