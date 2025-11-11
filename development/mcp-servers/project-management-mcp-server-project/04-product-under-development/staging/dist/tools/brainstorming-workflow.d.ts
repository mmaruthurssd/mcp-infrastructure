/**
 * Brainstorming Workflow Tools
 *
 * MCP Tools for structured brainstorming when direction is uncertain
 * Supports exploration, idea capture, decision tracking, and promotion to major goals
 *
 * Created: 2025-10-28
 * Goal: 009 - Create Brainstorming Workflow Framework
 */
import { z } from 'zod';
export interface BrainstormingSession {
    id: string;
    title: string;
    problem: string;
    context?: string;
    componentId?: string;
    subAreaId?: string;
    createdAt: string;
    lastUpdated: string;
    status: 'active' | 'decided' | 'archived';
    ideasCount: number;
    decisionsCount: number;
    folderPath: string;
}
export interface BrainstormingIdea {
    id: string;
    sessionId: string;
    title: string;
    description: string;
    approach: string;
    pros: string[];
    cons: string[];
    research?: string;
    estimatedEffort?: string;
    feasibility?: 'high' | 'medium' | 'low';
    createdAt: string;
    status: 'exploring' | 'researched' | 'selected' | 'rejected';
}
export interface BrainstormingDecision {
    id: string;
    sessionId: string;
    selectedIdeas: string[];
    rejectedIdeas: string[];
    rationale: string;
    tradeoffs: string;
    nextSteps: string[];
    decidedAt: string;
    decidedBy?: string;
}
export declare function startBrainstormingSession(args: {
    projectPath: string;
    title: string;
    problem: string;
    context?: string;
    componentId?: string;
    subAreaId?: string;
}): Promise<{
    success: boolean;
    session?: BrainstormingSession;
    sessionPath?: string;
    error?: string;
}>;
export declare function addBrainstormingIdea(args: {
    projectPath: string;
    sessionId: string;
    title: string;
    description: string;
    approach: string;
    pros?: string[];
    cons?: string[];
    research?: string;
    estimatedEffort?: string;
    feasibility?: 'high' | 'medium' | 'low';
}): Promise<{
    success: boolean;
    idea?: BrainstormingIdea;
    ideaPath?: string;
    error?: string;
}>;
export declare function recordBrainstormingDecision(args: {
    projectPath: string;
    sessionId: string;
    selectedIdeas: string[];
    rejectedIdeas?: string[];
    rationale: string;
    tradeoffs?: string;
    nextSteps?: string[];
    decidedBy?: string;
}): Promise<{
    success: boolean;
    decision?: BrainstormingDecision;
    decisionPath?: string;
    error?: string;
}>;
export declare function getBrainstormingSession(args: {
    projectPath: string;
    sessionId: string;
}): Promise<{
    success: boolean;
    session?: {
        id: string;
        title: string;
        problem: string;
        status: string;
        ideasCount: number;
        decisionsCount: number;
        ideas: Array<{
            id: string;
            title: string;
            status: string;
        }>;
        decisions: Array<{
            id: string;
            selectedIdeas: string[];
            date: string;
        }>;
    };
    error?: string;
}>;
export declare const startBrainstormingSessionTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        title: z.ZodString;
        problem: z.ZodString;
        context: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        subAreaId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const addBrainstormingIdeaTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        sessionId: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        approach: z.ZodString;
        pros: z.ZodOptional<z.ZodArray<z.ZodString>>;
        cons: z.ZodOptional<z.ZodArray<z.ZodString>>;
        research: z.ZodOptional<z.ZodString>;
        estimatedEffort: z.ZodOptional<z.ZodString>;
        feasibility: z.ZodOptional<z.ZodEnum<{
            high: "high";
            medium: "medium";
            low: "low";
        }>>;
    }, z.core.$strip>;
};
export declare const recordBrainstormingDecisionTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        sessionId: z.ZodString;
        selectedIdeas: z.ZodArray<z.ZodString>;
        rejectedIdeas: z.ZodOptional<z.ZodArray<z.ZodString>>;
        rationale: z.ZodString;
        tradeoffs: z.ZodOptional<z.ZodString>;
        nextSteps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        decidedBy: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const getBrainstormingSessionTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        sessionId: z.ZodString;
    }, z.core.$strip>;
};
//# sourceMappingURL=brainstorming-workflow.d.ts.map