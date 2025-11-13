/**
 * Wrap Up Project Tool
 *
 * Final validation and project archiving with completion report
 */
export interface WrapUpProjectInput {
    projectPath: string;
    skipValidation?: boolean;
    notes?: string;
}
export interface WrapUpProjectResult {
    success: boolean;
    completionReportPath?: string;
    validationPassed: boolean;
    warnings: string[];
    message: string;
    archived?: boolean;
    archivePath?: string;
    completionSummaryPath?: string;
    gitCommit?: string;
}
export declare class WrapUpProjectTool {
    static execute(input: WrapUpProjectInput): WrapUpProjectResult;
    /**
     * Generate completion report
     */
    private static generateCompletionReport;
    /**
     * Calculate duration between two ISO timestamps
     */
    private static calculateDuration;
    /**
     * Get server version
     */
    private static getServerVersion;
    /**
     * Archive implementation project if detected
     */
    private static archiveImplementationProject;
    /**
     * Generate completion summary for archived project
     */
    private static generateCompletionSummary;
    /**
     * Create git commit for archival
     */
    private static createGitCommit;
    /**
     * Log telemetry to workspace-brain
     */
    private static logTelemetry;
    static formatResult(result: WrapUpProjectResult): string;
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
                skipValidation: {
                    type: string;
                    description: string;
                };
                notes: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=wrap-up-project.d.ts.map