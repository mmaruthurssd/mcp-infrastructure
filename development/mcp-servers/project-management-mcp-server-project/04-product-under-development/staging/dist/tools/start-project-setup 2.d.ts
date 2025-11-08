/**
 * Start Project Setup Tool
 *
 * Initiate conversational project planning session.
 *
 * UPDATED: Feature 1 - Creates template structure FIRST, then starts conversation.
 */
import { type ProjectType, type ConstitutionMode } from '../utils/conversation-manager.js';
export interface StartProjectSetupInput {
    projectPath: string;
    projectName: string;
    projectType?: ProjectType;
    constitutionMode?: ConstitutionMode;
    initialDescription?: string;
}
export interface StartProjectSetupOutput {
    success: boolean;
    conversationId: string;
    sessionFile: string;
    projectSetupPath: string;
    nextQuestion: string;
    mode: {
        constitutionDepth: ConstitutionMode;
        estimatedTime: string;
        questionsRemaining: number;
    };
    templateStructure?: {
        foldersCreated: number;
        filesCreated: number;
        duration: number;
    };
    message: string;
    formatted: string;
}
export declare class StartProjectSetupTool {
    static execute(input: StartProjectSetupInput): StartProjectSetupOutput;
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
                projectName: {
                    type: string;
                    description: string;
                };
                projectType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                constitutionMode: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                initialDescription: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    private static formatOutput;
}
//# sourceMappingURL=start-project-setup%202.d.ts.map