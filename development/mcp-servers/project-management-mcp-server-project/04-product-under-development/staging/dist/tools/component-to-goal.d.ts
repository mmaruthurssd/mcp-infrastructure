/**
 * Component to Goal Tool
 *
 * Converts finalized component to goal in 02-goals-and-roadmap/
 */
import { ComponentToGoalParams, ComponentToGoalResult } from '../lib/component-types.js';
export declare class ComponentToGoalTool {
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
                componentName: {
                    type: string;
                    description: string;
                };
                goalType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                priority: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                archiveComponent: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    static execute(params: ComponentToGoalParams): ComponentToGoalResult;
}
//# sourceMappingURL=component-to-goal.d.ts.map