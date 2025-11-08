/**
 * Detect Conflicts Tool
 *
 * Detects conflicts from parallel agent execution (file-level, semantic, dependency)
 */
import { DetectConflictsInput, DetectConflictsOutput } from '../types.js';
export declare class DetectConflictsTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                agentResults: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            agentId: {
                                type: string;
                                description: string;
                            };
                            taskId: {
                                type: string;
                                description: string;
                            };
                            success: {
                                type: string;
                                description: string;
                            };
                            filesModified: {
                                type: string;
                                items: {
                                    type: string;
                                };
                                description: string;
                            };
                            changes: {
                                type: string;
                                items: {
                                    type: string;
                                    properties: {
                                        file: {
                                            type: string;
                                            description: string;
                                        };
                                        type: {
                                            type: string;
                                            enum: string[];
                                            description: string;
                                        };
                                        content: {
                                            type: string;
                                            description: string;
                                        };
                                    };
                                };
                                description: string;
                            };
                            duration: {
                                type: string;
                                description: string;
                            };
                            error: {
                                type: string;
                                description: string;
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                dependencyGraph: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    /**
     * Execute conflict detection
     */
    static execute(input: DetectConflictsInput): DetectConflictsOutput;
    /**
     * Validate input parameters
     */
    private static validateInput;
}
//# sourceMappingURL=detect-conflicts.d.ts.map