/**
 * Start Project Overview Conversation
 *
 * MCP Tool: Initiates guided conversation for PROJECT OVERVIEW generation
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */
import { ExtractedInformation } from '../utils/information-extraction';
export interface StartProjectOverviewConversationInput {
    projectPath: string;
    projectName?: string;
    initialDescription?: string;
}
export interface StartProjectOverviewConversationOutput {
    success: boolean;
    conversationId: string;
    currentQuestion: {
        questionNumber: number;
        totalQuestions: number;
        questionText: string;
        phase: 'gathering' | 'confirming';
    };
    conversationState: ConversationState;
    error?: string;
}
export interface ConversationState {
    conversationId: string;
    projectPath: string;
    currentPhase: 'gathering' | 'confirming' | 'refining' | 'complete';
    currentQuestion: number;
    totalQuestions: number;
    extracted: ExtractedInformation;
    messages: Array<{
        role: 'assistant' | 'user';
        content: string;
        timestamp: string;
    }>;
    createdAt: string;
    lastUpdated: string;
}
/**
 * Start PROJECT OVERVIEW conversation
 */
export declare function startProjectOverviewConversation(input: StartProjectOverviewConversationInput): Promise<StartProjectOverviewConversationOutput>;
/**
 * Continue PROJECT OVERVIEW conversation with user response
 */
export interface ContinueConversationInput {
    projectPath: string;
    conversationId: string;
    userResponse: string;
}
export interface ContinueConversationOutput {
    success: boolean;
    conversationId: string;
    currentQuestion?: {
        questionNumber: number;
        totalQuestions: number;
        questionText: string;
        phase: 'gathering' | 'confirming';
    };
    confirmationPreview?: string;
    conversationComplete: boolean;
    extractedData?: ExtractedInformation;
    error?: string;
}
export declare function continueProjectOverviewConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput>;
//# sourceMappingURL=start-project-overview-conversation.d.ts.map