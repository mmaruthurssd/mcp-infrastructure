/**
 * Visualization System Tools (Goal 011)
 *
 * Provides multiple diagram types and output formats for visualizing
 * the hierarchical planning structure.
 *
 * Tools:
 * - generate_hierarchy_tree: Visual tree of project structure
 * - generate_roadmap_timeline: Timeline view with milestones
 * - generate_progress_dashboard: Progress overview across components
 * - generate_dependency_graph: Goal dependencies visualization
 */
import { z } from 'zod';
declare const GenerateHierarchyTreeSchema: z.ZodObject<{
    projectPath: z.ZodString;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        ascii: "ascii";
        drawio: "drawio";
        mermaid: "mermaid";
    }>>;
    maxDepth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    filterStatus: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        all: "all";
        blocked: "blocked";
        completed: "completed";
        active: "active";
    }>>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateRoadmapTimelineSchema: z.ZodObject<{
    projectPath: z.ZodString;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        ascii: "ascii";
        drawio: "drawio";
        mermaid: "mermaid";
    }>>;
    groupBy: z.ZodDefault<z.ZodEnum<{
        component: "component";
        priority: "priority";
        phase: "phase";
    }>>;
    showMilestones: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    timeRange: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        all: "all";
        "current-quarter": "current-quarter";
        "current-year": "current-year";
    }>>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateProgressDashboardSchema: z.ZodObject<{
    projectPath: z.ZodString;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        ascii: "ascii";
        json: "json";
        drawio: "drawio";
        mermaid: "mermaid";
    }>>;
    includeVelocity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeHealth: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const GenerateDependencyGraphSchema: z.ZodObject<{
    projectPath: z.ZodString;
    outputFormat: z.ZodDefault<z.ZodEnum<{
        ascii: "ascii";
        drawio: "drawio";
        mermaid: "mermaid";
    }>>;
    scope: z.ZodDefault<z.ZodEnum<{
        all: "all";
        component: "component";
        "major-goal": "major-goal";
    }>>;
    entityId: z.ZodOptional<z.ZodString>;
    showCriticalPath: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    outputPath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export interface HierarchyNode {
    id: string;
    name: string;
    type: 'project' | 'component' | 'sub-area' | 'major-goal' | 'sub-goal' | 'task-workflow' | 'task';
    progress: number;
    status: string;
    children: HierarchyNode[];
}
export interface TimelineItem {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: string;
    dependencies: string[];
    group: string;
}
export interface DashboardMetrics {
    overallProgress: number;
    componentsTotal: number;
    componentsActive: number;
    componentsCompleted: number;
    goalsTotal: number;
    goalsCompleted: number;
    goalsInProgress: number;
    goalsBlocked: number;
    velocity: number;
    estimatedCompletion: string;
    healthScore: number;
}
export declare function generateHierarchyTree(params: z.infer<typeof GenerateHierarchyTreeSchema>): Promise<{
    success: boolean;
    outputPath: string;
    outputFormat: "ascii" | "drawio" | "mermaid";
    nodesGenerated: number;
    maxDepth: number;
    preview: string;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    outputFormat?: undefined;
    nodesGenerated?: undefined;
    maxDepth?: undefined;
    preview?: undefined;
    performance?: undefined;
}>;
export declare function generateRoadmapTimeline(params: z.infer<typeof GenerateRoadmapTimelineSchema>): Promise<{
    success: boolean;
    outputPath: string;
    outputFormat: "ascii" | "drawio" | "mermaid";
    itemsGenerated: number;
    timeRange: "all" | "current-quarter" | "current-year";
    preview: string;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    outputFormat?: undefined;
    itemsGenerated?: undefined;
    timeRange?: undefined;
    preview?: undefined;
    performance?: undefined;
}>;
export declare function generateProgressDashboard(params: z.infer<typeof GenerateProgressDashboardSchema>): Promise<{
    success: boolean;
    outputPath: string;
    outputFormat: "ascii" | "json" | "drawio" | "mermaid";
    metrics: DashboardMetrics;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    outputFormat?: undefined;
    metrics?: undefined;
    performance?: undefined;
}>;
export declare function generateDependencyGraph(params: z.infer<typeof GenerateDependencyGraphSchema>): Promise<{
    success: boolean;
    outputPath: string;
    outputFormat: "ascii" | "drawio" | "mermaid";
    dependenciesFound: number;
    criticalPathHighlighted: boolean;
    performance: {
        generationTimeMs: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    outputPath?: undefined;
    outputFormat?: undefined;
    dependenciesFound?: undefined;
    criticalPathHighlighted?: undefined;
    performance?: undefined;
}>;
export {};
//# sourceMappingURL=visualization-tools.d.ts.map