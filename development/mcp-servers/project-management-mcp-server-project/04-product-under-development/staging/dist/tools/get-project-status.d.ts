/**
 * Get Project Status Tool
 *
 * High-level project overview with phase status, goals, and health indicators
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
     */
    private static calculateOverallProgress;
    /**
     * Assess project health
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