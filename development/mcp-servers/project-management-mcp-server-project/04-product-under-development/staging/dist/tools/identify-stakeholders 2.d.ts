/**
 * Identify Stakeholders Tool
 *
 * Extract and categorize stakeholders from conversation.
 */
export interface IdentifyStakeholdersInput {
    projectPath: string;
    conversationId: string;
}
export interface Stakeholder {
    name: string;
    role?: string;
    type: 'primary' | 'secondary' | 'external';
    influence: 'high' | 'medium' | 'low';
    interest: 'high' | 'medium' | 'low';
    concerns?: string[];
    communicationNeeds?: string;
}
export interface IdentifyStakeholdersOutput {
    success: boolean;
    stakeholdersPath: string;
    stakeholders: Stakeholder[];
    matrix: {
        manageClosely: number;
        keepSatisfied: number;
        keepInformed: number;
        monitor: number;
    };
    formatted: string;
}
export declare class IdentifyStakeholdersTool {
    static execute(input: IdentifyStakeholdersInput): IdentifyStakeholdersOutput;
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
    private static deduplicateStakeholders;
    private static categorizeStakeholder;
    private static assessInfluence;
    private static assessInterest;
    private static identifyConcerns;
    private static determineCommunication;
    private static getStrategy;
    private static inferStakeholderType;
    private static formatOutput;
}
//# sourceMappingURL=identify-stakeholders%202.d.ts.map