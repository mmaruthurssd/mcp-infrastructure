/**
 * Archive Goal Tool
 *
 * Archive completed or shelved goals with retrospective documentation.
 */
export interface RetrospectiveData {
    completionDate?: string;
    actualEffort?: string;
    actualImpact?: 'High' | 'Medium' | 'Low';
    lessonsLearned?: string;
    whatWentWell?: string;
    whatCouldImprove?: string;
    wouldDoAgain?: boolean;
    reasonShelved?: string;
    mightRevisit?: boolean;
    alternativesTried?: string;
}
export interface ArchiveGoalInput {
    projectPath: string;
    goalId: string;
    archiveType: 'implemented' | 'shelved';
    retrospective: RetrospectiveData;
}
export interface EstimateAccuracy {
    estimatedImpact: string;
    actualImpact: string;
    estimatedEffort: string;
    actualEffort: string;
    impactAccuracy: 'Accurate' | 'Overestimated' | 'Underestimated';
    effortAccuracy: 'Accurate' | 'Overestimated' | 'Underestimated';
}
export interface ArchiveGoalOutput {
    success: boolean;
    goalId?: string;
    goalName?: string;
    archivedTo?: string;
    removedFrom?: string;
    estimateAccuracy?: EstimateAccuracy;
    message: string;
    formatted?: string;
    error?: string;
}
export declare class ArchiveGoalTool {
    /**
     * Execute the archive_goal tool
     */
    static execute(input: ArchiveGoalInput): ArchiveGoalOutput;
    /**
     * Format the result for display
     */
    static formatResult(result: ArchiveGoalOutput): string;
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
                goalId: {
                    type: string;
                    description: string;
                };
                archiveType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                retrospective: {
                    type: string;
                    description: string;
                    properties: {
                        completionDate: {
                            type: string;
                        };
                        actualEffort: {
                            type: string;
                        };
                        actualImpact: {
                            type: string;
                            enum: string[];
                        };
                        lessonsLearned: {
                            type: string;
                        };
                        whatWentWell: {
                            type: string;
                        };
                        whatCouldImprove: {
                            type: string;
                        };
                        wouldDoAgain: {
                            type: string;
                        };
                        reasonShelved: {
                            type: string;
                        };
                        mightRevisit: {
                            type: string;
                        };
                        alternativesTried: {
                            type: string;
                        };
                    };
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=archive-goal%202.d.ts.map