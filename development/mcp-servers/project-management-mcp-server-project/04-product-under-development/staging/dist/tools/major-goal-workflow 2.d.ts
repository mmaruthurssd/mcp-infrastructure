/**
 * MCP Tool: Major Goal Workflow
 *
 * Tools for creating, managing, and handing off major goals in hierarchical planning v1.0.0
 * Integrates with Spec-Driven MCP for sub-goal decomposition
 */
import { z } from 'zod';
import type { MCPHandoffContext } from '../types/hierarchical-entities.js';
/**
 * MCP Tool: Create Major Goal
 *
 * Create a new major goal in a component or sub-area
 */
export declare function createMajorGoal(args: {
    projectPath: string;
    componentId: string;
    subAreaId?: string;
    goalName: string;
    description: string;
    purpose: string;
    successCriteria?: string[];
    estimatedEffort?: string;
    priority?: 'Critical' | 'High' | 'Medium' | 'Low';
    owner?: string;
    targetDate?: string;
}): Promise<{
    success: boolean;
    goalId?: string;
    filePath?: string;
    handoffReady?: boolean;
    handoffContext?: MCPHandoffContext;
    error?: string;
}>;
/**
 * MCP Tool: Promote to Major Goal
 *
 * Promote a brainstorming idea or potential goal to a major goal
 */
export declare function promoteToMajorGoal(args: {
    projectPath: string;
    componentId: string;
    subAreaId?: string;
    sourceType: 'brainstorming' | 'potential-goal' | 'direct';
    sourcePath?: string;
    goalName: string;
    description: string;
    purpose: string;
    successCriteria?: string[];
    estimatedEffort?: string;
    priority?: 'Critical' | 'High' | 'Medium' | 'Low';
    owner?: string;
    targetDate?: string;
    additionalNotes?: string;
}): Promise<{
    success: boolean;
    goalId?: string;
    filePath?: string;
    handoffReady?: boolean;
    handoffContext?: MCPHandoffContext;
    sourceMarked?: boolean;
    error?: string;
}>;
/**
 * MCP Tool: Handoff to Spec-Driven MCP
 *
 * Prepare handoff context for Spec-Driven MCP to decompose major goal
 */
export declare function handoffToSpecDriven(args: {
    projectPath: string;
    goalId: string;
    componentId: string;
    subAreaId?: string;
    additionalContext?: string;
}): Promise<{
    success: boolean;
    handoffContext?: MCPHandoffContext;
    error?: string;
}>;
/**
 * MCP Tool: Update Major Goal Progress
 *
 * Aggregate progress from sub-goals
 */
export declare function updateMajorGoalProgress(args: {
    projectPath: string;
    goalId: string;
    componentId: string;
    subAreaId?: string;
}): Promise<{
    success: boolean;
    progress?: {
        percentage: number;
        status: string;
        completedSubGoals: number;
        totalSubGoals: number;
        breakdown: Record<string, any>;
    };
    error?: string;
}>;
/**
 * MCP Tool: Get Major Goal Status
 *
 * Get detailed status view of a major goal
 */
export declare function getMajorGoalStatus(args: {
    projectPath: string;
    goalId: string;
    componentId: string;
    subAreaId?: string;
}): Promise<{
    success: boolean;
    status?: {
        goalId: string;
        goalName: string;
        description: string;
        purpose: string;
        progress: {
            percentage: number;
            status: string;
            completedSubGoals: number;
            totalSubGoals: number;
        };
        priority: string;
        owner: string;
        targetDate: string;
        subGoals: Array<{
            id: string;
            name: string;
            status: string;
            progress: number;
        }>;
        risks: Array<{
            description: string;
            severity: string;
            mitigation: string;
        }>;
        blockers: string[];
    };
    error?: string;
}>;
/**
 * MCP Tool Definitions
 */
export declare const createMajorGoalTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
        subAreaId: z.ZodOptional<z.ZodString>;
        goalName: z.ZodString;
        description: z.ZodString;
        purpose: z.ZodString;
        successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
        estimatedEffort: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<{
            High: "High";
            Medium: "Medium";
            Critical: "Critical";
            Low: "Low";
        }>>;
        owner: z.ZodOptional<z.ZodString>;
        targetDate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const promoteToMajorGoalTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
        subAreaId: z.ZodOptional<z.ZodString>;
        sourceType: z.ZodEnum<{
            brainstorming: "brainstorming";
            "potential-goal": "potential-goal";
            direct: "direct";
        }>;
        sourcePath: z.ZodOptional<z.ZodString>;
        goalName: z.ZodString;
        description: z.ZodString;
        purpose: z.ZodString;
        successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
        estimatedEffort: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<{
            High: "High";
            Medium: "Medium";
            Critical: "Critical";
            Low: "Low";
        }>>;
        owner: z.ZodOptional<z.ZodString>;
        targetDate: z.ZodOptional<z.ZodString>;
        additionalNotes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const handoffToSpecDrivenTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        goalId: z.ZodString;
        componentId: z.ZodString;
        subAreaId: z.ZodOptional<z.ZodString>;
        additionalContext: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const updateMajorGoalProgressTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        goalId: z.ZodString;
        componentId: z.ZodString;
        subAreaId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const getMajorGoalStatusTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        goalId: z.ZodString;
        componentId: z.ZodString;
        subAreaId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
//# sourceMappingURL=major-goal-workflow%202.d.ts.map