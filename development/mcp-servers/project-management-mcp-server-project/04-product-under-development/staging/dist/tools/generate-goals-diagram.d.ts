/**
 * Generate Goals Diagram Tool
 *
 * Generate a draw.io workflow diagram visualizing goals.
 */
export interface GenerateGoalsDiagramInput {
    projectPath: string;
    diagramType: 'roadmap' | 'kanban' | 'timeline';
    includePotential?: boolean;
    includeArchived?: boolean;
    tier?: 'Now' | 'Next' | 'Later' | 'Someday';
    priority?: 'High' | 'Medium' | 'Low';
    outputPath?: string;
}
export interface GenerateGoalsDiagramOutput {
    success: boolean;
    diagramPath?: string;
    goalsIncluded?: number;
    diagramType?: string;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class GenerateGoalsDiagramTool {
    /**
     * Execute the generate_goals_diagram tool
     */
    static execute(input: GenerateGoalsDiagramInput): GenerateGoalsDiagramOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: GenerateGoalsDiagramOutput): string;
    /**
     * Get MCP tool definition
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                projectPath: {
                    type: string;
                    description: string;
                };
                diagramType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                includePotential: {
                    type: string;
                    description: string;
                };
                includeArchived: {
                    type: string;
                    description: string;
                };
                tier: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                priority: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                outputPath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=generate-goals-diagram.d.ts.map