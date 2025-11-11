/**
 * Conversation Flow Orchestration Tools (Goal 010)
 *
 * Provides intelligent next-step suggestions, workflow phase advancement,
 * and natural conversation flow for the v1.0.0 hierarchical planning system.
 *
 * Tools:
 * - suggest_next_steps: Intelligent recommendations based on project state
 * - get_project_phase: Determine current workflow phase
 * - advance_workflow_phase: Move to next phase with validation
 * - get_conversation_context: Build context for natural conversation
 */
import { z } from 'zod';
declare const SuggestNextStepsSchema: z.ZodObject<{
    projectPath: z.ZodString;
    includeDetails: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxSuggestions: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
declare const GetProjectPhaseSchema: z.ZodObject<{
    projectPath: z.ZodString;
}, z.core.$strip>;
declare const AdvanceWorkflowPhaseSchema: z.ZodObject<{
    projectPath: z.ZodString;
    targetPhase: z.ZodOptional<z.ZodEnum<{
        planning: "planning";
        execution: "execution";
        completion: "completion";
        monitoring: "monitoring";
    }>>;
    force: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
declare const GetConversationContextSchema: z.ZodObject<{
    projectPath: z.ZodString;
    contextType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        overview: "overview";
        detailed: "detailed";
        "specific-entity": "specific-entity";
    }>>>;
    entityId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export interface NextStepSuggestion {
    action: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
    mcpTool?: string;
    prerequisites: string[];
    impact: string;
}
export interface ProjectPhaseInfo {
    currentPhase: 'planning' | 'execution' | 'monitoring' | 'completion';
    phaseProgress: number;
    phaseDescription: string;
    nextPhase: string;
    readinessForNext: number;
    blockers: string[];
    recommendations: string[];
}
export interface ConversationContext {
    projectName: string;
    projectPhase: string;
    overallProgress: number;
    activeComponents: number;
    totalComponents: number;
    activeGoals: number;
    totalGoals: number;
    recentActivity: string[];
    upcomingMilestones: string[];
    currentBlockers: string[];
    suggestedTopics: string[];
}
export declare function suggestNextSteps(params: z.infer<typeof SuggestNextStepsSchema>): Promise<{
    success: boolean;
    suggestions: NextStepSuggestion[];
    projectPhase: "planning" | "execution" | "completion" | "monitoring";
    overallProgress: number;
    nextRecommendedAction: NextStepSuggestion;
    performance: {
        analysisTimeMs: number;
        suggestionsGenerated: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    suggestions?: undefined;
    projectPhase?: undefined;
    overallProgress?: undefined;
    nextRecommendedAction?: undefined;
    performance?: undefined;
}>;
export declare function getProjectPhase(params: z.infer<typeof GetProjectPhaseSchema>): Promise<{
    success: boolean;
    phaseInfo: ProjectPhaseInfo;
    performance: {
        analysisTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    phaseInfo?: undefined;
    performance?: undefined;
}>;
export declare function advanceWorkflowPhase(params: z.infer<typeof AdvanceWorkflowPhaseSchema>): Promise<{
    success: boolean;
    error: string;
    blockers: string[];
    recommendations: string[];
    previousPhase?: undefined;
    newPhase?: undefined;
    transitionActions?: undefined;
    performance?: undefined;
} | {
    success: boolean;
    previousPhase: "planning" | "execution" | "completion" | "monitoring";
    newPhase: "planning" | "execution" | "completion" | "monitoring";
    transitionActions: string[];
    recommendations: string[];
    performance: {
        transitionTimeMs: number;
    };
    error?: undefined;
    blockers?: undefined;
} | {
    success: boolean;
    error: any;
    blockers?: undefined;
    recommendations?: undefined;
    previousPhase?: undefined;
    newPhase?: undefined;
    transitionActions?: undefined;
    performance?: undefined;
}>;
export declare function getConversationContext(params: z.infer<typeof GetConversationContextSchema>): Promise<{
    success: boolean;
    context: ConversationContext;
    performance: {
        buildTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    context?: undefined;
    performance?: undefined;
}>;
export {};
//# sourceMappingURL=conversation-flow-tools.d.ts.map