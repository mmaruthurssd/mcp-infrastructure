/**
 * Dependency Graph Builder
 *
 * Builds directed acyclic graph (DAG) from task dependencies
 */

import {
  CreateDependencyGraphInput,
  CreateDependencyGraphOutput,
  DependencyGraph,
  GraphNode,
  GraphEdge,
  ImplicitDependency,
  Task,
} from '../types.js';

export class DependencyGraphBuilder {
  /**
   * Build dependency graph from tasks
   */
  static build(
    input: CreateDependencyGraphInput
  ): CreateDependencyGraphOutput {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: [],
    };

    // Step 1: Add all nodes
    for (const task of input.tasks) {
      graph.nodes.set(task.id, { id: task.id, task });
    }

    // Step 2: Add explicit dependency edges
    for (const task of input.tasks) {
      if (task.dependsOn && task.dependsOn.length > 0) {
        for (const depId of task.dependsOn) {
          // Validate dependency exists
          if (!graph.nodes.has(depId)) {
            console.warn(
              `Warning: Task ${task.id} depends on non-existent task ${depId}`
            );
            continue;
          }

          graph.edges.push({
            from: depId,
            to: task.id,
            type: 'explicit',
          });
        }
      }
    }

    // Step 3: Detect implicit dependencies (if requested)
    const implicitDependencies: ImplicitDependency[] = [];
    if (input.detectImplicit !== false) {
      const implicit = this.detectImplicitDependencies(input.tasks);
      implicitDependencies.push(...implicit);

      // Add implicit dependency edges
      for (const dep of implicit) {
        graph.edges.push({
          from: dep.from,
          to: dep.to,
          type: 'implicit',
          confidence: dep.confidence,
        });
      }
    }

    // Step 4: Compute topological levels for each node
    this.computeTopologicalLevels(graph);

    // Step 5: Detect cycles
    const cycles = this.detectCycles(graph);
    const hasCycles = cycles.length > 0;

    return {
      graph,
      implicitDependencies,
      hasCycles,
      cycles: hasCycles ? cycles : undefined,
    };
  }

  /**
   * Detect implicit dependencies using pattern matching
   */
  private static detectImplicitDependencies(tasks: Task[]): ImplicitDependency[] {
    const implicit: ImplicitDependency[] = [];

    // Pattern matching for common implicit dependencies
    const patterns = [
      {
        regex: /using.*from\s+(\w+)/i,
        confidence: 0.8,
        reason: 'mentions using output from another task',
      },
      {
        regex: /based on\s+(\w+)/i,
        confidence: 0.7,
        reason: 'based on another task',
      },
      {
        regex: /integrate.*with\s+(\w+)/i,
        confidence: 0.9,
        reason: 'integrates with another task',
      },
      {
        regex: /after\s+(\w+)/i,
        confidence: 0.85,
        reason: 'explicitly mentions sequence',
      },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const description = task.description.toLowerCase();

      for (let j = 0; j < tasks.length; j++) {
        if (i === j) continue;

        const otherTask = tasks[j];
        const otherKeywords = this.extractKeywords(otherTask.description);

        // Check if current task description mentions other task
        for (const keyword of otherKeywords) {
          if (description.includes(keyword.toLowerCase())) {
            // Check patterns
            for (const pattern of patterns) {
              if (pattern.regex.test(task.description)) {
                implicit.push({
                  from: otherTask.id,
                  to: task.id,
                  confidence: pattern.confidence,
                  reasoning: pattern.reason,
                });
                break; // Only add once per task pair
              }
            }
          }
        }
      }
    }

    // Remove duplicates and filter low confidence
    return this.deduplicateImplicitDeps(implicit).filter((d) => d.confidence >= 0.6);
  }

  /**
   * Extract keywords from task description
   */
  private static extractKeywords(description: string): string[] {
    // Simple keyword extraction: significant words
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);

    // Filter common words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'from',
      'by',
      'this',
      'that',
      'these',
      'those',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
    ]);

    return words.filter((w) => w.length > 3 && !stopWords.has(w));
  }

  /**
   * Deduplicate implicit dependencies
   */
  private static deduplicateImplicitDeps(
    deps: ImplicitDependency[]
  ): ImplicitDependency[] {
    const seen = new Set<string>();
    const unique: ImplicitDependency[] = [];

    for (const dep of deps) {
      const key = `${dep.from}->${dep.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(dep);
      }
    }

    return unique;
  }

  /**
   * Compute topological levels for all nodes
   */
  private static computeTopologicalLevels(graph: DependencyGraph): void {
    // Use Kahn's algorithm to compute levels
    const inDegree = new Map<string, number>();
    const levels = new Map<string, number>();

    // Initialize in-degrees
    for (const nodeId of graph.nodes.keys()) {
      inDegree.set(nodeId, 0);
      levels.set(nodeId, 0);
    }

    // Count in-degrees
    for (const edge of graph.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Find nodes with zero in-degree (level 0)
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
        levels.set(nodeId, 0);
      }
    }

    // Process nodes level by level
    let currentLevel = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;

      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        const node = graph.nodes.get(nodeId)!;
        node.level = currentLevel;

        // Process outgoing edges
        const outgoingEdges = graph.edges.filter((e) => e.from === nodeId);
        for (const edge of outgoingEdges) {
          const newDegree = (inDegree.get(edge.to) || 0) - 1;
          inDegree.set(edge.to, newDegree);

          if (newDegree === 0) {
            queue.push(edge.to);
            levels.set(edge.to, currentLevel + 1);
          }
        }
      }

      currentLevel++;
    }
  }

  /**
   * Detect cycles using DFS
   */
  private static detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = graph.edges.filter((e) => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, path);
        } else if (recursionStack.has(edge.to)) {
          // Found cycle
          const cycleStart = path.indexOf(edge.to);
          const cycle = path.slice(cycleStart);
          cycle.push(edge.to); // Complete the cycle
          cycles.push(cycle);
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Get topological levels from graph
   */
  static getTopologicalLevels(graph: DependencyGraph): Task[][] {
    const levels: Task[][] = [];
    const maxLevel = Math.max(
      ...Array.from(graph.nodes.values()).map((n) => n.level || 0)
    );

    for (let i = 0; i <= maxLevel; i++) {
      const levelNodes = Array.from(graph.nodes.values())
        .filter((n) => n.level === i)
        .map((n) => n.task);
      levels.push(levelNodes);
    }

    return levels;
  }
}
