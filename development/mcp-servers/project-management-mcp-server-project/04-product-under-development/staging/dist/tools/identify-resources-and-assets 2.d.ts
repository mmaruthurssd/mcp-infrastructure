/**
 * Identify Resources and Assets Tool
 *
 * Extract resource inventory and asset list from conversation.
 */
export interface IdentifyResourcesAndAssetsInput {
    projectPath: string;
    conversationId: string;
}
export interface IdentifyResourcesAndAssetsOutput {
    success: boolean;
    resourcesPath: string;
    assetsPath: string;
    resources: {
        team: number;
        tools: number;
        technologies: number;
        budget: number;
    };
    assets: {
        existing: number;
        needed: number;
        external: number;
    };
    formatted: string;
}
export declare class IdentifyResourcesAndAssetsTool {
    static execute(input: IdentifyResourcesAndAssetsInput): IdentifyResourcesAndAssetsOutput;
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
                conversationId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static extractName;
    private static extractRole;
    private static extractAllocation;
    private static extractSkills;
    private static categorizeTools;
    private static categorizeTechnologies;
    private static parseBudgetBreakdown;
    private static extractDuration;
    private static inferAssetType;
    private static inferPriority;
    private static extractProvider;
    private static formatOutput;
}
//# sourceMappingURL=identify-resources-and-assets%202.d.ts.map