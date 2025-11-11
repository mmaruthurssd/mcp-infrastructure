/**
 * Reorder Selected Goals Tool
 *
 * Changes the priority order of selected goals in SELECTED-GOALS.md
 * and optionally updates priority levels based on position.
 */
export interface ReorderSelectedGoalsInput {
    projectPath: string;
    goalOrder: string[];
    updatePriorities?: boolean;
}
export interface ReorderSelectedGoalsOutput {
    success: boolean;
    reordered?: number;
    beforeOrder?: string[];
    afterOrder?: string[];
    prioritiesUpdated?: boolean;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class ReorderSelectedGoalsTool {
    /**
     * Execute the reorder_selected_goals tool
     */
    static execute(input: ReorderSelectedGoalsInput): ReorderSelectedGoalsOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: ReorderSelectedGoalsOutput): string;
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
                goalOrder: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                updatePriorities: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=reorder-selected-goals%202.d.ts.map