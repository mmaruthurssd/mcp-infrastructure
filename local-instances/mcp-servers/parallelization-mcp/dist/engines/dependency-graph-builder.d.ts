/**
 * Dependency Graph Builder
 *
 * Builds directed acyclic graph (DAG) from task dependencies
 */
import { CreateDependencyGraphInput, CreateDependencyGraphOutput, DependencyGraph, Task } from '../types.js';
export declare class DependencyGraphBuilder {
    /**
     * Build dependency graph from tasks
     */
    static build(input: CreateDependencyGraphInput): CreateDependencyGraphOutput;
    /**
     * Detect implicit dependencies using pattern matching
     */
    private static detectImplicitDependencies;
    /**
     * Extract keywords from task description
     */
    private static extractKeywords;
    /**
     * Deduplicate implicit dependencies
     */
    private static deduplicateImplicitDeps;
    /**
     * Compute topological levels for all nodes
     */
    private static computeTopologicalLevels;
    /**
     * Detect cycles using DFS
     */
    private static detectCycles;
    /**
     * Get topological levels from graph
     */
    static getTopologicalLevels(graph: DependencyGraph): Task[][];
}
//# sourceMappingURL=dependency-graph-builder.d.ts.map