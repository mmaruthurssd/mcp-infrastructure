import type { ServiceConfig } from "../types.js";
export interface DependencyGraph {
    nodes: Map<string, ServiceConfig>;
    edges: Map<string, Set<string>>;
    reverseEdges: Map<string, Set<string>>;
}
export interface TopologicalSortResult {
    order: string[];
    batches: string[][];
    cycles: string[][];
}
export declare class DependencyResolver {
    /**
     * Build dependency graph from service configurations
     */
    buildGraph(services: ServiceConfig[]): DependencyGraph;
    /**
     * Detect circular dependencies using DFS
     */
    detectCycles(graph: DependencyGraph): string[][];
    /**
     * Perform topological sort using Kahn's algorithm
     * Returns deployment order and parallel batches
     */
    topologicalSort(graph: DependencyGraph): TopologicalSortResult;
    /**
     * Validate service dependencies
     */
    validateDependencies(services: ServiceConfig[]): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Get deployment order based on strategy
     */
    getDeploymentOrder(services: ServiceConfig[], strategy: "sequential" | "parallel" | "dependency-order"): string[][];
}
//# sourceMappingURL=dependencyResolver.d.ts.map