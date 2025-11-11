/**
 * Merge Components Tool
 *
 * Merges multiple components into a single component
 */
import { MergeComponentsParams, MergeComponentsResult } from '../lib/component-types.js';
export declare class MergeComponentsTool {
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
                componentNames: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                    };
                    minItems: number;
                };
                mergedName: {
                    type: string;
                    description: string;
                };
                mergedDescription: {
                    type: string;
                    description: string;
                };
                targetStage: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                keepOriginals: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    static execute(params: MergeComponentsParams): MergeComponentsResult;
}
//# sourceMappingURL=merge-components.d.ts.map