/**
 * Move Component Tool
 *
 * Moves component between stages (EXPLORING → FRAMEWORK → FINALIZED → ARCHIVED)
 */
import { MoveComponentParams, MoveComponentResult } from '../lib/component-types.js';
export declare class MoveComponentTool {
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
                toStage: {
                    type: string;
                    enum: string[];
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
    static execute(params: MoveComponentParams): MoveComponentResult;
}
//# sourceMappingURL=move-component.d.ts.map