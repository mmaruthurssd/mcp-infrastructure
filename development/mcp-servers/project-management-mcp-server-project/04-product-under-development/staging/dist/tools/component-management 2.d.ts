/**
 * MCP Tool: Component Management
 *
 * Tools for creating, updating, and managing components in hierarchical planning v1.0.0
 */
import { z } from 'zod';
/**
 * MCP Tool: Create Component
 *
 * Create a new component with proper folder structure and metadata
 */
export declare function createComponent(args: {
    projectPath: string;
    componentName: string;
    description: string;
    purpose?: string;
    successCriteria?: string[];
    owner?: string;
    createSubAreas?: string[];
}): Promise<{
    success: boolean;
    componentId: string;
    folderPath?: string;
    createdFiles?: string[];
    error?: string;
}>;
/**
 * MCP Tool: Add Sub-Area to Component
 *
 * Add a sub-area to an existing component
 */
export declare function addSubArea(args: {
    projectPath: string;
    componentId: string;
    subAreaName: string;
    description?: string;
}): Promise<{
    success: boolean;
    subAreaId?: string;
    folderPath?: string;
    error?: string;
}>;
/**
 * MCP Tool: Update Component
 *
 * Update component metadata and overview
 */
export declare function updateComponent(args: {
    projectPath: string;
    componentId: string;
    updates: {
        name?: string;
        description?: string;
        purpose?: string;
        owner?: string;
        successCriteria?: string[];
        status?: 'planning' | 'in-progress' | 'blocked' | 'on-hold' | 'completed';
    };
    changeDescription?: string;
}): Promise<{
    success: boolean;
    updatedFilePath?: string;
    versionInfo?: any;
    error?: string;
}>;
/**
 * MCP Tool: Get Component Health
 *
 * Calculate component health metrics including progress, status, and risks
 */
export declare function getComponentHealth(args: {
    projectPath: string;
    componentId: string;
}): Promise<{
    success: boolean;
    health?: {
        componentId: string;
        componentName: string;
        progress: {
            percentage: number;
            status: string;
            completedGoals: number;
            totalGoals: number;
            breakdown: Record<string, any>;
        };
        risks: {
            level: 'low' | 'medium' | 'high';
            count: number;
            details: string[];
        };
        velocity: {
            goalsPerWeek: number;
            estimatedCompletion: string | null;
        };
        blockers: string[];
    };
    error?: string;
}>;
/**
 * MCP Tool Definitions
 */
export declare const createComponentTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentName: z.ZodString;
        description: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
        owner: z.ZodOptional<z.ZodString>;
        createSubAreas: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
};
export declare const addSubAreaTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
        subAreaName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const updateComponentTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
        updates: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            purpose: z.ZodOptional<z.ZodString>;
            owner: z.ZodOptional<z.ZodString>;
            successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
            status: z.ZodOptional<z.ZodEnum<{
                completed: "completed";
                "in-progress": "in-progress";
                blocked: "blocked";
                "on-hold": "on-hold";
                planning: "planning";
            }>>;
        }, z.core.$strip>;
        changeDescription: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export declare const getComponentHealthTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        projectPath: z.ZodString;
        componentId: z.ZodString;
    }, z.core.$strip>;
};
//# sourceMappingURL=component-management%202.d.ts.map