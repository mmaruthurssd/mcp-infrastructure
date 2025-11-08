/**
 * Finalize Project Setup Tool
 *
 * Complete project setup and transition to goal management.
 */
import type { ExtractedGoal } from './extract-project-goals.js';
export interface FinalizeProjectSetupInput {
    projectPath: string;
    conversationId: string;
    extractedGoals: ExtractedGoal[];
    createPotentialGoals?: boolean;
}
export interface FinalizeProjectSetupOutput {
    success: boolean;
    setupComplete: boolean;
    documentsGenerated: {
        constitution: string;
        roadmap: string;
        resources: string;
        assets: string;
        stakeholders: string;
        conversationLog: string;
    };
    initialGoals: {
        created: number;
        goalIds: string[];
        location: string;
    };
    summary: {
        projectName: string;
        projectType: string;
        duration: string;
        phases: number;
        mainGoals: number;
        stakeholders: number;
        budget?: string;
    };
    nextSteps: string[];
    formatted: string;
}
export declare class FinalizeProjectSetupTool {
    static execute(input: FinalizeProjectSetupInput): FinalizeProjectSetupOutput;
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
                extractedGoals: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                            };
                            name: {
                                type: string;
                            };
                            description: {
                                type: string;
                            };
                            suggestedImpact: {
                                type: string;
                            };
                            suggestedEffort: {
                                type: string;
                            };
                            suggestedTier: {
                                type: string;
                            };
                        };
                    };
                };
                createPotentialGoals: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static effortToTimeEstimate;
    private static formatOutput;
}
//# sourceMappingURL=finalize-project-setup%202.d.ts.map