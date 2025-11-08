/**
 * Generate Initial Roadmap Tool
 *
 * Create initial project roadmap with phases and milestones.
 */
import type { ExtractedGoal } from './extract-project-goals.js';
export interface GenerateInitialRoadmapInput {
    projectPath: string;
    conversationId: string;
    extractedGoals: ExtractedGoal[];
    timeframe?: string;
}
export interface GenerateInitialRoadmapOutput {
    success: boolean;
    roadmapPath: string;
    version: string;
    duration: string;
    phases: Array<{
        number: number;
        name: string;
        duration: string;
        goalsCount: number;
        milestonesCount: number;
    }>;
    formatted: string;
}
export declare class GenerateInitialRoadmapTool {
    static execute(input: GenerateInitialRoadmapInput): GenerateInitialRoadmapOutput;
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
                timeframe: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static formatOutput;
}
//# sourceMappingURL=generate-initial-roadmap%202.d.ts.map