/**
 * Get Project Status Tool
 *
 * High-level project overview with phase status, goals, and health indicators
 *
 * NOTE: Currently supports project-planning workflow type.
 * Phase names and health assessment are hardcoded for ProjectState structure.
 * Future enhancement: Load phase definitions from workflow configuration.
 */
export interface GetProjectStatusInput {
    projectPath: string;
}
export interface PhaseStatus {
    name: string;
    status: string;
    statusEmoji: string;
    progress: string;
    startedAt?: string;
    completedAt?: string;
}
export interface GetProjectStatusResult {
    success: boolean;
    projectName: string;
    currentPhase: string;
    currentStep: string;
    overallProgress: string;
    phases: PhaseStatus[];
    goals: {
        potential: number;
        selected: number;
        completed: number;
    };
    integrations: {
        specDrivenUsed: boolean;
        activeWorkflows: number;
    };
    health: 'Good' | 'Warning' | 'Blocked';
    healthIndicators: string[];
    message?: string;
}
export declare class GetProjectStatusTool {
    static execute(input: GetProjectStatusInput): GetProjectStatusResult;
    /**
     * Build status for a single phase
     */
    private static buildPhaseStatus;
    /**
     * Calculate overall project progress
     *
     * NOTE: Hardcoded for project-planning workflow phases.
     * For other workflows, phase names should come from configuration.
     */
    private static calculateOverallProgress;
    /**
     * Assess project health
     *
     * NOTE: Health checks are specific to ProjectState structure (goals, integrations).
     * For other workflows, health assessment logic should be configurable.
     */
    private static assessHealth;
    static formatResult(result: GetProjectStatusResult): string;
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
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=get-project-status.d.ts.map