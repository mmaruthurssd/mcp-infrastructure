/**
 * Split Component Tool
 *
 * Splits one component into multiple smaller components
 */
import { SplitComponentParams, SplitComponentResult } from '../lib/component-types.js';
export declare class SplitComponentTool {
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
                newComponents: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                                description: string;
                            };
                            description: {
                                type: string;
                                description: string;
                            };
                            subComponents: {
                                type: string;
                                description: string;
                                items: {
                                    type: string;
                                    properties: {
                                        name: {
                                            type: string;
                                        };
                                        description: {
                                            type: string;
                                        };
                                        status: {
                                            type: string;
                                            enum: string[];
                                        };
                                    };
                                    required: string[];
                                };
                            };
                        };
                        required: string[];
                    };
                    minItems: number;
                };
                keepOriginal: {
                    type: string;
                    description: string;
                };
                targetStage: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
    };
    static execute(params: SplitComponentParams): SplitComponentResult;
}
//# sourceMappingURL=split-component.d.ts.map