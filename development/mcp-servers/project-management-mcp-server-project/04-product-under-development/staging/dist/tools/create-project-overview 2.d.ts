/**
 * MCP Tool: Create PROJECT OVERVIEW
 *
 * Conducts guided conversation to generate comprehensive PROJECT OVERVIEW document
 * for hierarchical planning v1.0.0
 */
import { z } from 'zod';
/**
 * Question flow design for PROJECT OVERVIEW conversation
 *
 * Progressive disclosure approach:
 * - Start with essential questions
 * - Ask follow-ups based on responses
 * - Infer details where possible
 * - Allow users to skip and refine later
 */
export interface ConversationState {
    projectId: string;
    conversationId: string;
    phase: 'essentials' | 'vision' | 'stakeholders' | 'resources' | 'constraints' | 'confirmation';
    questionsAsked: string[];
    extractedData: Partial<ExtractedProjectData>;
    nextQuestion?: QuestionDefinition;
}
export interface QuestionDefinition {
    id: string;
    question: string;
    purpose: string;
    optional: boolean;
    followUps?: string[];
    extractionHints: string[];
}
export interface ExtractedProjectData {
    projectName: string;
    projectType: 'software' | 'research' | 'business' | 'product' | 'other';
    primaryPurpose: string;
    visionStatement: string;
    goals: string[];
    targetAudience: string[];
    keyOutcomes: string[];
    stakeholders: Array<{
        name: string;
        role: string;
        influence: 'High' | 'Medium' | 'Low';
        interest: 'High' | 'Medium' | 'Low';
        concerns?: string[];
    }>;
    team: string[];
    tools: string[];
    technologies: string[];
    budget?: string;
    externalPartners?: string[];
    timeline?: string;
    budgetConstraint?: string;
    resourceConstraints?: string[];
    technicalConstraints?: string[];
    regulatoryConstraints?: string[];
}
/**
 * Question flow definition
 *
 * Organized by phase for progressive disclosure
 */
export declare const QUESTION_FLOW: Record<string, QuestionDefinition>;
/**
 * Get next question based on current state
 */
export declare function getNextQuestion(state: ConversationState): QuestionDefinition | null;
/**
 * Initialize conversation state
 */
export declare function initializeConversation(projectId: string): ConversationState;
/**
 * MCP Tool: Create PROJECT OVERVIEW
 *
 * Starts a guided conversation to generate PROJECT OVERVIEW document
 */
export declare function createProjectOverview(args: {
    projectPath: string;
    initialDescription?: string;
}): Promise<{
    success: boolean;
    conversationId: string;
    question: string;
    phase: string;
    progress: {
        current: number;
        total: number;
    };
}>;
/**
 * MCP Tool: Continue PROJECT OVERVIEW conversation
 *
 * Process user response and return next question
 */
export declare function continueProjectOverviewConversation(args: {
    projectPath: string;
    conversationId: string;
    userResponse: string;
}): Promise<{
    success: boolean;
    question?: string;
    phase: string;
    progress: {
        current: number;
        total: number;
    };
    complete: boolean;
    summary?: string;
}>;
/**
 * MCP Tool: Finalize PROJECT OVERVIEW
 *
 * Generate and save PROJECT OVERVIEW document
 */
export declare function finalizeProjectOverview(args: {
    projectPath: string;
    conversationId: string;
    confirm: boolean;
}): Promise<{
    success: boolean;
    filePath?: string;
    validationResult?: any;
    error?: string;
}>;
/**
 * MCP Tool Definition
 */
export declare const createProjectOverviewTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        initialDescription: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
/**
 * MCP Tool: Continue PROJECT OVERVIEW conversation
 */
export declare const continueProjectOverviewConversationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        conversationId: z.ZodString;
        userResponse: z.ZodString;
    }, z.core.$strip>;
};
/**
 * MCP Tool: Finalize PROJECT OVERVIEW
 */
export declare const finalizeProjectOverviewTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        conversationId: z.ZodString;
        confirm: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
};
/**
 * MCP Tool: Update PROJECT OVERVIEW
 *
 * Update existing PROJECT OVERVIEW with cascade detection and rollback support
 */
export declare function updateProjectOverview(args: {
    projectPath: string;
    updates: Partial<ExtractedProjectData>;
    incrementVersion?: boolean;
    changeDescription?: string;
    dryRun?: boolean;
}): Promise<{
    success: boolean;
    cascadeImpacts?: any[];
    updatedFilePath?: string;
    versionInfo?: any;
    warnings?: string[];
    error?: string;
}>;
/**
 * MCP Tool Definition: Update PROJECT OVERVIEW
 */
export declare const updateProjectOverviewTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        updates: z.ZodObject<{
            projectName: z.ZodOptional<z.ZodString>;
            projectType: z.ZodOptional<z.ZodEnum<{
                product: "product";
                software: "software";
                business: "business";
                research: "research";
                other: "other";
            }>>;
            primaryPurpose: z.ZodOptional<z.ZodString>;
            visionStatement: z.ZodOptional<z.ZodString>;
            goals: z.ZodOptional<z.ZodArray<z.ZodString>>;
            targetAudience: z.ZodOptional<z.ZodArray<z.ZodString>>;
            keyOutcomes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            stakeholders: z.ZodOptional<z.ZodArray<z.ZodAny>>;
            team: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
            technologies: z.ZodOptional<z.ZodArray<z.ZodString>>;
            budget: z.ZodOptional<z.ZodString>;
            timeline: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        incrementVersion: z.ZodDefault<z.ZodBoolean>;
        changeDescription: z.ZodOptional<z.ZodString>;
        dryRun: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
};
/**
 * Suggested component from PROJECT OVERVIEW analysis
 */
export interface SuggestedComponent {
    name: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    suggestedGoals?: string[];
    stakeholders?: string[];
}
/**
 * MCP Tool: Identify Components from PROJECT OVERVIEW
 *
 * Analyze PROJECT OVERVIEW and suggest logical components
 */
export declare function identifyComponentsFromOverview(args: {
    projectPath: string;
    useAI?: boolean;
}): Promise<{
    success: boolean;
    suggestedComponents: SuggestedComponent[];
    reasoning: string;
}>;
/**
 * MCP Tool Definition: Identify Components
 */
export declare const identifyComponentsFromOverviewTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        useAI: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
};
//# sourceMappingURL=create-project-overview%202.d.ts.map