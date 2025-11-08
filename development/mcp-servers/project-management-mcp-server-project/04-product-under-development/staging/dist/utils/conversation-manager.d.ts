/**
 * Conversation Manager
 *
 * Manages multi-turn conversation state for project setup workflow.
 */
export type ProjectType = 'software' | 'research' | 'business' | 'product';
export type ConstitutionMode = 'quick' | 'deep';
export type ConversationStatus = 'in-progress' | 'ready-to-generate' | 'completed';
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export interface ExtractedInfo {
    problems: string[];
    goals: string[];
    stakeholders: string[];
    resources: {
        team: string[];
        tools: string[];
        technologies: string[];
        budget: string[];
    };
    assets: {
        existing: string[];
        needed: string[];
        external: string[];
    };
    constraints: string[];
    successCriteria: string[];
}
export interface CompletenessCheck {
    overall: number;
    hasProblems: boolean;
    hasStakeholders: boolean;
    hasResources: boolean;
    hasSuccessCriteria: boolean;
}
export interface ConversationState {
    conversationId: string;
    projectPath: string;
    projectName: string;
    projectType: ProjectType;
    constitutionMode: ConstitutionMode;
    startedAt: string;
    lastUpdatedAt: string;
    status: ConversationStatus;
    messages: ConversationMessage[];
    extractedInfo: ExtractedInfo;
    completeness: CompletenessCheck;
}
export interface ProjectMetadata {
    projectName: string;
    projectType: ProjectType;
    constitutionMode: ConstitutionMode;
    initialDescription?: string;
}
export declare class ConversationManager {
    /**
     * Initialize a new conversation
     */
    static initConversation(projectPath: string, metadata: ProjectMetadata): ConversationState;
    /**
     * Load existing conversation from disk
     */
    static loadConversation(projectPath: string, conversationId: string): ConversationState;
    /**
     * Save conversation state to disk
     */
    static saveConversation(state: ConversationState): void;
    /**
     * Append a message to the conversation
     */
    static appendMessage(state: ConversationState, role: 'user' | 'assistant', content: string): void;
    /**
     * Update extracted information
     */
    static updateExtractedInfo(state: ConversationState, newInfo: Partial<ExtractedInfo>): void;
    /**
     * Calculate conversation completeness (0-100%)
     */
    static calculateCompleteness(state: ConversationState): CompletenessCheck;
    /**
     * Determine the next question to ask
     */
    static getNextQuestion(state: ConversationState): string | null;
    /**
     * Check if conversation is ready to generate documents
     */
    static isReadyToGenerate(state: ConversationState): boolean;
    private static generateConversationId;
    private static getSetupDir;
    private static getStatePath;
    private static getFirstQuestion;
    private static generateConversationLog;
}
//# sourceMappingURL=conversation-manager.d.ts.map