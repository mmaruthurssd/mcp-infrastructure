/**
 * Get Next Steps Tool
 *
 * Analyzes project state and suggests next actions with ready-to-execute tool calls
 *
 * NOTE: Currently supports project-planning workflow type.
 * StateDetector and progress calculation are coupled to ProjectState structure.
 * Future enhancement: Make these components workflow-agnostic via configuration.
 */
export interface GetNextStepsInput {
    projectPath: string;
    maxSuggestions?: number;
    skipSync?: boolean;
}
export interface NextStepSuggestion {
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    tool: string;
    params: any;
    ruleId: string;
}
export interface GetNextStepsResult {
    success: boolean;
    currentPhase: string;
    currentStep: string;
    progress: string;
    nextActions: NextStepSuggestion[];
    blockers: string[];
    warnings: string[];
    syncedChanges?: string[];
    message?: string;
}
export declare class GetNextStepsTool {
    static execute(input: GetNextStepsInput): GetNextStepsResult;
    /**
     * Convert rule match to suggestion with priority categorization
     */
    private static matchToSuggestion;
    /**
     * Calculate overall progress percentage
     *
     * NOTE: Hardcoded for project-planning workflow phases.
     * To support other workflows, phase names should come from workflow configuration.
     */
    private static calculateProgress;
    /**
     * Detect project blockers
     *
     * NOTE: ProjectState-specific - checks goals and integrations fields.
     * For other workflows, blocker detection logic would need to be configured.
     */
    private static detectBlockers;
    /**
     * Detect warnings
     *
     * NOTE: ProjectState-specific - checks goals and integrations fields.
     * For other workflows, warning detection logic would need to be configured.
     */
    private static detectWarnings;
    static formatResult(result: GetNextStepsResult): string;
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
                maxSuggestions: {
                    type: string;
                    description: string;
                };
                skipSync: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=get-next-steps.d.ts.map