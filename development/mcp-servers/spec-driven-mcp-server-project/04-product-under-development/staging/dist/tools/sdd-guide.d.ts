/**
 * SDD Guide Tool - Main MCP tool for guided Spec-Driven Development
 */
export declare class SDDGuideTool {
    private orchestrator;
    constructor();
    /**
     * Handle tool invocation
     */
    execute(args: any): Promise<any>;
    /**
     * Start a new SDD workflow
     */
    private handleStart;
    /**
     * Handle user answer
     */
    private handleAnswer;
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                project_path: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                response: {
                    description: string;
                };
                scenario: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                goal_context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
}
//# sourceMappingURL=sdd-guide.d.ts.map