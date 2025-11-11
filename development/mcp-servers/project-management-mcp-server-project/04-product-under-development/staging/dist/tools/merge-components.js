/**
 * Merge Components Tool
 *
 * Merges multiple components into a single component
 */
import { getComponent, createComponent, moveComponent, logComponentChange, } from '../lib/component-manager.js';
import { propagateComponentChange } from '../lib/propagation-manager.js';
export class MergeComponentsTool {
    static getToolDefinition() {
        return {
            name: 'merge_components',
            description: 'Merge multiple components into a single consolidated component with automatic propagation',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Absolute path to the project directory',
                    },
                    componentNames: {
                        type: 'array',
                        description: 'Names of components to merge',
                        items: { type: 'string' },
                        minItems: 2,
                    },
                    mergedName: {
                        type: 'string',
                        description: 'Name for the new merged component',
                    },
                    mergedDescription: {
                        type: 'string',
                        description: 'Description for the new merged component',
                    },
                    targetStage: {
                        type: 'string',
                        enum: ['EXPLORING', 'FRAMEWORK', 'FINALIZED'],
                        description: 'Stage for merged component (default: EXPLORING)',
                    },
                    keepOriginals: {
                        type: 'boolean',
                        description: 'Keep original components (default: false, archives them)',
                    },
                },
                required: ['projectPath', 'componentNames', 'mergedName', 'mergedDescription'],
            },
        };
    }
    static execute(params) {
        try {
            // Validate all components exist
            const originalComponents = [];
            for (const componentName of params.componentNames) {
                const component = getComponent(params.projectPath, componentName);
                if (!component) {
                    throw new Error(`Component "${componentName}" not found`);
                }
                originalComponents.push(component);
            }
            // Collect all sub-components from original components
            const allSubComponents = [];
            const allDependencies = {
                requires: [],
                requiredBy: [],
                relatedTo: [],
            };
            for (const component of originalComponents) {
                // Collect sub-components
                if (component.subComponents && component.subComponents.length > 0) {
                    allSubComponents.push(...component.subComponents.map((sc) => ({
                        ...sc,
                        description: `${sc.description} (from ${component.name})`,
                    })));
                }
                // Collect dependencies
                if (component.dependencies) {
                    if (component.dependencies.requires) {
                        allDependencies.requires.push(...component.dependencies.requires);
                    }
                    if (component.dependencies.requiredBy) {
                        allDependencies.requiredBy.push(...component.dependencies.requiredBy);
                    }
                    if (component.dependencies.relatedTo) {
                        allDependencies.relatedTo.push(...component.dependencies.relatedTo);
                    }
                }
            }
            // Remove duplicates from dependencies
            allDependencies.requires = [...new Set(allDependencies.requires)];
            allDependencies.requiredBy = [...new Set(allDependencies.requiredBy)];
            allDependencies.relatedTo = [...new Set(allDependencies.relatedTo)];
            const targetStage = params.targetStage || 'EXPLORING';
            // Create merged component
            const mergedComponent = createComponent(params.projectPath, {
                name: params.mergedName,
                stage: targetStage,
                description: params.mergedDescription,
                subComponents: allSubComponents,
                dependencies: allDependencies,
                priority: 'medium',
                notes: `Merged from components: ${params.componentNames.join(', ')}`,
            });
            // Archive original components unless keepOriginals is true
            if (!params.keepOriginals) {
                for (const componentName of params.componentNames) {
                    const component = getComponent(params.projectPath, componentName);
                    if (component) {
                        const moveResult = moveComponent(params.projectPath, componentName, 'ARCHIVED');
                        logComponentChange(params.projectPath, {
                            componentName,
                            action: 'merged',
                            fromStage: component.stage,
                            toStage: 'ARCHIVED',
                            description: `Merged into "${mergedComponent.name}"`,
                        });
                    }
                }
            }
            // Log change for merged component
            logComponentChange(params.projectPath, {
                componentName: mergedComponent.name,
                action: 'created',
                toStage: mergedComponent.stage,
                description: `Created by merging: ${params.componentNames.join(', ')}`,
            });
            // Propagate changes
            if (!params.keepOriginals) {
                for (const componentName of params.componentNames) {
                    propagateComponentChange(params.projectPath, componentName, 'merged', 'FINALIZED', 'ARCHIVED');
                }
            }
            propagateComponentChange(params.projectPath, mergedComponent.name, 'created', undefined, mergedComponent.stage);
            return {
                success: true,
                mergedComponent,
                originalComponents,
                message: `Successfully merged ${params.componentNames.length} components into "${mergedComponent.name}"`,
                propagated: true,
            };
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=merge-components.js.map