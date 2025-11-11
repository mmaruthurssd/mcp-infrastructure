import type { ServiceConfig } from "../types.js";

export interface DependencyGraph {
  nodes: Map<string, ServiceConfig>;
  edges: Map<string, Set<string>>; // service -> dependencies
  reverseEdges: Map<string, Set<string>>; // service -> dependents
}

export interface TopologicalSortResult {
  order: string[];
  batches: string[][]; // Services that can be deployed in parallel
  cycles: string[][];
}

export class DependencyResolver {
  /**
   * Build dependency graph from service configurations
   */
  buildGraph(services: ServiceConfig[]): DependencyGraph {
    const nodes = new Map<string, ServiceConfig>();
    const edges = new Map<string, Set<string>>();
    const reverseEdges = new Map<string, Set<string>>();

    // Initialize nodes
    for (const service of services) {
      nodes.set(service.name, service);
      edges.set(service.name, new Set());
      reverseEdges.set(service.name, new Set());
    }

    // Build edges
    for (const service of services) {
      if (service.dependencies && service.dependencies.length > 0) {
        for (const dep of service.dependencies) {
          // Validate dependency exists
          if (!nodes.has(dep)) {
            throw new Error(
              `Service '${service.name}' depends on '${dep}', but '${dep}' is not in the service list`
            );
          }

          // Add forward edge (service depends on dep)
          edges.get(service.name)!.add(dep);

          // Add reverse edge (dep is required by service)
          reverseEdges.get(dep)!.add(service.name);
        }
      }
    }

    return { nodes, edges, reverseEdges };
  }

  /**
   * Detect circular dependencies using DFS
   */
  detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const dependencies = graph.edges.get(node) || new Set();

      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (dfs(dep)) {
            return true;
          }
        } else if (recStack.has(dep)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(dep);
          const cycle = currentPath.slice(cycleStart);
          cycle.push(dep); // Close the cycle
          cycles.push(cycle);
          return true;
        }
      }

      currentPath.pop();
      recStack.delete(node);
      return false;
    };

    for (const node of graph.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Perform topological sort using Kahn's algorithm
   * Returns deployment order and parallel batches
   */
  topologicalSort(graph: DependencyGraph): TopologicalSortResult {
    // First check for cycles
    const cycles = this.detectCycles(graph);
    if (cycles.length > 0) {
      const cycleDesc = cycles.map((cycle) => cycle.join(" -> ")).join("; ");
      throw new Error(`Circular dependencies detected: ${cycleDesc}`);
    }

    const inDegree = new Map<string, number>();
    const order: string[] = [];
    const batches: string[][] = [];

    // Calculate in-degree for each node
    for (const node of graph.nodes.keys()) {
      inDegree.set(node, (graph.edges.get(node) || new Set()).size);
    }

    // Find all nodes with in-degree 0 (no dependencies)
    let currentBatch = Array.from(graph.nodes.keys()).filter(
      (node) => inDegree.get(node) === 0
    );

    while (currentBatch.length > 0) {
      // Add current batch to result
      batches.push([...currentBatch]);
      order.push(...currentBatch);

      const nextBatch: string[] = [];

      // Process each node in current batch
      for (const node of currentBatch) {
        // Get all services that depend on this node
        const dependents = graph.reverseEdges.get(node) || new Set();

        for (const dependent of dependents) {
          // Decrease in-degree
          const newInDegree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, newInDegree);

          // If in-degree becomes 0, add to next batch
          if (newInDegree === 0) {
            nextBatch.push(dependent);
          }
        }
      }

      currentBatch = nextBatch;
    }

    // Check if all nodes were processed (shouldn't happen if cycle check passed)
    if (order.length !== graph.nodes.size) {
      throw new Error(
        "Topological sort failed: not all services were processed"
      );
    }

    return { order, batches, cycles: [] };
  }

  /**
   * Validate service dependencies
   */
  validateDependencies(services: ServiceConfig[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const serviceNames = new Set(services.map((s) => s.name));

    // Check for duplicate service names
    const nameCounts = new Map<string, number>();
    for (const service of services) {
      nameCounts.set(service.name, (nameCounts.get(service.name) || 0) + 1);
    }

    for (const [name, count] of nameCounts.entries()) {
      if (count > 1) {
        errors.push(`Duplicate service name: '${name}' appears ${count} times`);
      }
    }

    // Check for missing dependencies
    for (const service of services) {
      if (service.dependencies && service.dependencies.length > 0) {
        for (const dep of service.dependencies) {
          if (!serviceNames.has(dep)) {
            errors.push(
              `Service '${service.name}' depends on '${dep}', but '${dep}' is not defined`
            );
          }
        }

        // Check for self-dependencies
        if (service.dependencies.includes(service.name)) {
          errors.push(`Service '${service.name}' has a self-dependency`);
        }
      }
    }

    // Warn about isolated services (no dependencies and no dependents)
    if (services.length > 1) {
      const hasDependencies = new Set(
        services
          .filter((s) => s.dependencies && s.dependencies.length > 0)
          .map((s) => s.name)
      );

      const isDependency = new Set<string>();
      for (const service of services) {
        if (service.dependencies) {
          for (const dep of service.dependencies) {
            isDependency.add(dep);
          }
        }
      }

      for (const service of services) {
        if (
          !hasDependencies.has(service.name) &&
          !isDependency.has(service.name)
        ) {
          warnings.push(
            `Service '${service.name}' has no dependencies and is not a dependency of any other service`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get deployment order based on strategy
   */
  getDeploymentOrder(
    services: ServiceConfig[],
    strategy: "sequential" | "parallel" | "dependency-order"
  ): string[][] {
    switch (strategy) {
      case "sequential":
        // Deploy one at a time in the order given
        return services.map((s) => [s.name]);

      case "parallel":
        // Deploy all at once (ignore dependencies)
        return [services.map((s) => s.name)];

      case "dependency-order":
      default:
        // Use topological sort to determine order
        const graph = this.buildGraph(services);
        const result = this.topologicalSort(graph);
        return result.batches;
    }
  }
}
