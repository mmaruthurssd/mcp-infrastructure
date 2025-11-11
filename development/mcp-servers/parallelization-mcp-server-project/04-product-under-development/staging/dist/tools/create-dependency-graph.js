/**
 * Create Dependency Graph Tool
 *
 * Builds a directed acyclic graph (DAG) from task dependencies
 */
import { DependencyGraphBuilder } from '../engines/dependency-graph-builder.js';
export class CreateDependencyGraphTool {
    /**
     * Get tool definition for MCP
     */
    static getToolDefinition() {
        return {
            name: 'create_dependency_graph',
            description: 'Build a dependency graph from subtasks. Detects explicit and implicit dependencies, validates for cycles, and returns topological ordering.',
            inputSchema: {
                type: 'object',
                properties: {
                    tasks: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description: 'Unique task identifier',
                                },
                                description: {
                                    type: 'string',
                                    description: 'Task description',
                                },
                                estimatedMinutes: {
                                    type: 'number',
                                    description: 'Estimated time in minutes (optional)',
                                },
                                dependsOn: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Array of task IDs this task depends on',
                                },
                            },
                            required: ['id', 'description'],
                        },
                        description: 'Array of tasks to build dependency graph from',
                    },
                    detectImplicit: {
                        type: 'boolean',
                        description: 'Whether to detect implicit dependencies using AI analysis (default: true)',
                    },
                },
                required: ['tasks'],
            },
        };
    }
    /**
     * Execute dependency graph creation
     */
    static execute(input) {
        // Validation
        this.validateInput(input);
        try {
            const result = DependencyGraphBuilder.build(input);
            // Serialize Map to plain object for JSON compatibility
            const serializedGraph = {
                nodes: Object.fromEntries(result.graph.nodes),
                edges: result.graph.edges,
            };
            return {
                ...result,
                graph: serializedGraph,
            };
        }
        catch (error) {
            throw new Error(`Graph creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate input parameters
     */
    static validateInput(input) {
        // Validate tasks
        if (!input.tasks || input.tasks.length === 0) {
            throw new Error('tasks array is required and cannot be empty');
        }
        if (input.tasks.length > 100) {
            throw new Error('Maximum 100 tasks allowed (current: ' + input.tasks.length + ')');
        }
        // Validate individual tasks
        const ids = new Set();
        for (let i = 0; i < input.tasks.length; i++) {
            const task = input.tasks[i];
            // Check required fields
            if (!task.id || task.id.trim().length === 0) {
                throw new Error(`Task at index ${i} is missing required field: id`);
            }
            if (!task.description || task.description.trim().length === 0) {
                throw new Error(`Task at index ${i} is missing required field: description`);
            }
            // Check for duplicate IDs
            if (ids.has(task.id)) {
                throw new Error(`Duplicate task ID found: ${task.id}`);
            }
            ids.add(task.id);
            // Validate estimatedMinutes (if provided)
            if (task.estimatedMinutes !== undefined &&
                (task.estimatedMinutes <= 0 || task.estimatedMinutes > 1440)) {
                throw new Error(`Task ${task.id}: estimatedMinutes must be between 1 and 1440 (24 hours)`);
            }
            // Validate dependencies
            if (task.dependsOn) {
                if (!Array.isArray(task.dependsOn)) {
                    throw new Error(`Task ${task.id}: dependsOn must be an array`);
                }
                for (const depId of task.dependsOn) {
                    if (depId === task.id) {
                        throw new Error(`Task ${task.id} cannot depend on itself`);
                    }
                }
            }
        }
        // Validate that all dependency IDs exist
        for (const task of input.tasks) {
            if (task.dependsOn) {
                for (const depId of task.dependsOn) {
                    if (!ids.has(depId)) {
                        throw new Error(`Task ${task.id} depends on non-existent task: ${depId}`);
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=create-dependency-graph.js.map