/**
 * Create Component Tool
 *
 * Creates a new component in the project overview
 */
import { CreateComponentParams, CreateComponentResult } from '../lib/component-types.js';
export declare class CreateComponentTool {
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
                name: {
                    type: string;
                    description: string;
                };
                stage: {
                    type: string;
                    enum: string[];
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
                dependencies: {
                    type: string;
                    description: string;
                    properties: {
                        requires: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        requiredBy: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        relatedTo: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
                priority: {
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
    static execute(params: CreateComponentParams): CreateComponentResult;
}
//# sourceMappingURL=create-component.d.ts.map