/**
 * Task Analysis Engine
 *
 * Analyzes task structure and determines parallelization opportunities
 */

import {
  AnalyzeTaskParallelizabilityInput,
  AnalyzeTaskParallelizabilityOutput,
  DependencyGraph,
  Batch,
  Risk,
  Task,
  ParallelizationScore,
} from '../types.js';
import { DependencyGraphBuilder } from './dependency-graph-builder.js';
import { BatchOptimizer } from './batch-optimizer.js';

export class TaskAnalysisEngine {
  /**
   * Analyze task for parallelization potential
   */
  static analyze(
    input: AnalyzeTaskParallelizabilityInput
  ): AnalyzeTaskParallelizabilityOutput {
    // Step 1: Validate input
    const subtasks = input.subtasks || [];

    if (subtasks.length === 0) {
      return {
        parallelizable: false,
        confidence: 0,
        reasoning: 'No subtasks provided - cannot parallelize',
        dependencyGraph: { nodes: new Map(), edges: [] },
        suggestedBatches: [],
        estimatedSpeedup: 1.0,
        risks: [],
      };
    }

    if (subtasks.length === 1) {
      return {
        parallelizable: false,
        confidence: 100,
        reasoning: 'Only one subtask - parallelization not beneficial',
        dependencyGraph: { nodes: new Map(), edges: [] },
        suggestedBatches: [
          {
            id: 'batch-1',
            tasks: subtasks,
            estimatedMinutes: subtasks[0].estimatedMinutes || 10,
            dependsOnBatches: [],
          },
        ],
        estimatedSpeedup: 1.0,
        risks: [],
      };
    }

    // Step 2: Build dependency graph
    const graphResult = DependencyGraphBuilder.build({
      tasks: subtasks,
      detectImplicit: true,
    });

    if (graphResult.hasCycles) {
      return {
        parallelizable: false,
        confidence: 100,
        reasoning: `Circular dependencies detected: ${graphResult.cycles?.map((c) => c.join(' → ')).join('; ')}`,
        dependencyGraph: graphResult.graph,
        suggestedBatches: [],
        estimatedSpeedup: 1.0,
        risks: [
          {
            description: 'Circular dependencies prevent parallelization',
            severity: 'critical',
            mitigation: 'Remove circular dependencies before attempting parallelization',
          },
        ],
      };
    }

    // Step 3: Score parallelization potential
    const score = this.scoreParallelizability(subtasks, graphResult.graph);

    // Step 4: Generate batches using topological levels
    const levels = DependencyGraphBuilder.getTopologicalLevels(graphResult.graph);
    const batches: Batch[] = [];

    for (let i = 0; i < levels.length; i++) {
      const levelTasks = levels[i];
      batches.push({
        id: `batch-${i + 1}`,
        tasks: levelTasks,
        estimatedMinutes: Math.max(
          ...levelTasks.map((t) => t.estimatedMinutes || 10)
        ),
        dependsOnBatches: i > 0 ? [`batch-${i}`] : [],
      });
    }

    // Step 5: Calculate speedup
    const sequentialTime = subtasks.reduce(
      (sum, task) => sum + (task.estimatedMinutes || 10),
      0
    );
    const parallelTime = batches.reduce(
      (sum, batch) => sum + batch.estimatedMinutes,
      0
    );
    const estimatedSpeedup = sequentialTime / parallelTime;

    // Step 6: Identify risks
    const risks = this.identifyRisks(subtasks, graphResult.graph, batches);

    // Step 7: Determine if parallelization is worthwhile
    const parallelizable = this.shouldParallelize(
      score,
      estimatedSpeedup,
      subtasks.length,
      risks
    );

    // Step 8: Generate reasoning
    const reasoning = this.generateReasoning(
      parallelizable,
      score,
      estimatedSpeedup,
      levels,
      risks
    );

    return {
      parallelizable,
      confidence: score.confidence,
      reasoning,
      dependencyGraph: graphResult.graph,
      suggestedBatches: batches,
      estimatedSpeedup,
      risks,
    };
  }

  /**
   * Score parallelization potential (0-100)
   */
  private static scoreParallelizability(
    tasks: Task[],
    graph: DependencyGraph
  ): ParallelizationScore {
    const factors = {
      independenceFactor: this.calculateIndependence(tasks, graph),
      durationFactor: this.calculateDurationValue(tasks),
      conflictRiskFactor: this.estimateConflictRisk(tasks),
      dependencyComplexityFactor: this.calculateDependencyComplexity(graph),
      resourceContentionFactor: this.estimateResourceContention(tasks),
    };

    // Weighted score
    const weightedScore =
      factors.independenceFactor * 0.3 +
      factors.durationFactor * 0.25 +
      factors.conflictRiskFactor * 0.25 +
      factors.dependencyComplexityFactor * 0.1 +
      factors.resourceContentionFactor * 0.1;

    const confidence = this.calculateConfidence(factors);

    return {
      score: weightedScore,
      confidence,
      factors,
      recommendation: this.generateScoreRecommendation(weightedScore, confidence),
    };
  }

  /**
   * Calculate independence factor (higher = more independent tasks)
   */
  private static calculateIndependence(tasks: Task[], graph: DependencyGraph): number {
    if (tasks.length === 0) return 0;

    const totalEdges = graph.edges.length;
    const maxPossibleEdges = (tasks.length * (tasks.length - 1)) / 2;

    if (maxPossibleEdges === 0) return 100;

    const independenceRatio = 1 - totalEdges / maxPossibleEdges;
    return independenceRatio * 100;
  }

  /**
   * Calculate duration value (longer tasks = more value from parallelization)
   */
  private static calculateDurationValue(tasks: Task[]): number {
    const avgMinutes =
      tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 10), 0) / tasks.length;

    // Normalize: 5 min = 0, 60 min = 100
    return Math.min(100, Math.max(0, ((avgMinutes - 5) / 55) * 100));
  }

  /**
   * Estimate conflict risk (lower = better)
   */
  private static estimateConflictRisk(tasks: Task[]): number {
    // Heuristic: longer task descriptions = more complex = higher conflict risk
    const avgDescLength =
      tasks.reduce((sum, t) => sum + t.description.length, 0) / tasks.length;

    // Normalize: 20 chars = 100 (low risk), 200 chars = 0 (high risk)
    const riskScore = Math.max(0, Math.min(100, ((200 - avgDescLength) / 180) * 100));
    return riskScore;
  }

  /**
   * Calculate dependency complexity (simpler = higher score)
   */
  private static calculateDependencyComplexity(graph: DependencyGraph): number {
    const levels = DependencyGraphBuilder.getTopologicalLevels(graph);

    // More levels = more sequential = lower score
    // 1 level = 100, 10+ levels = 0
    return Math.max(0, Math.min(100, ((11 - levels.length) / 10) * 100));
  }

  /**
   * Estimate resource contention
   */
  private static estimateResourceContention(tasks: Task[]): number {
    // Check if tasks mention shared resources
    const resourceKeywords = ['database', 'api', 'file', 'config', 'shared', 'global'];
    let contentionCount = 0;

    for (const task of tasks) {
      const desc = task.description.toLowerCase();
      for (const keyword of resourceKeywords) {
        if (desc.includes(keyword)) {
          contentionCount++;
          break;
        }
      }
    }

    const contentionRatio = contentionCount / tasks.length;
    return (1 - contentionRatio) * 100; // Lower contention = higher score
  }

  /**
   * Calculate confidence in analysis
   */
  private static calculateConfidence(factors: any): number {
    // Confidence is high when factors are consistent
    const values = Object.values(factors) as number[];
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    // stdDev 0 = 100% confidence, stdDev 50 = 0% confidence
    return Math.max(0, Math.min(100, ((50 - stdDev) / 50) * 100));
  }

  /**
   * Generate score recommendation
   */
  private static generateScoreRecommendation(score: number, confidence: number): string {
    if (score >= 80) return 'Highly recommended - excellent parallelization candidate';
    if (score >= 60) return 'Recommended - good parallelization potential';
    if (score >= 40) return 'Moderate - some parallelization benefit possible';
    if (score >= 20) return 'Limited - minimal parallelization benefit';
    return 'Not recommended - sequential execution preferred';
  }

  /**
   * Identify risks
   */
  private static identifyRisks(
    tasks: Task[],
    graph: DependencyGraph,
    batches: Batch[]
  ): Risk[] {
    const risks: Risk[] = [];

    // Risk 1: Duplicate tasks
    const duplicates = this.detectDuplicateTasks(tasks);
    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((d) => `Tasks ${d.ids.join(', ')}: "${d.description}"`)
        .join('; ');
      risks.push({
        description: `${duplicates.length} duplicate task(s) detected - ${duplicateList}`,
        severity: 'medium',
        mitigation: 'Review and consolidate duplicate tasks to avoid redundant work',
      });
    }

    // Risk 2: Implicit dependencies
    const implicitEdges = graph.edges.filter((e) => e.type === 'implicit');
    if (implicitEdges.length > 0) {
      risks.push({
        description: `${implicitEdges.length} implicit dependencies detected - may cause conflicts`,
        severity: 'medium',
        mitigation: 'Review task descriptions to confirm dependencies are correct',
      });
    }

    // Risk 3: Large batches
    const largeBatches = batches.filter((b) => b.tasks.length > 10);
    if (largeBatches.length > 0) {
      risks.push({
        description: `${largeBatches.length} batches have >10 tasks - coordination overhead may be high`,
        severity: 'low',
        mitigation: 'Consider breaking large batches into sub-batches',
      });
    }

    // Risk 4: Unbalanced batches
    const minTime = Math.min(...batches.map((b) => b.estimatedMinutes));
    const maxTime = Math.max(...batches.map((b) => b.estimatedMinutes));
    if (maxTime > minTime * 3) {
      risks.push({
        description: 'Unbalanced batch sizes may cause idle agents',
        severity: 'low',
        mitigation: 'Consider rebalancing task distribution',
      });
    }

    return risks;
  }

  /**
   * Detect duplicate tasks based on description similarity
   */
  private static detectDuplicateTasks(
    tasks: Task[]
  ): Array<{ ids: string[]; description: string }> {
    const duplicates: Array<{ ids: string[]; description: string }> = [];
    const seen = new Map<string, string[]>(); // normalized description -> task IDs

    for (const task of tasks) {
      // Normalize description for comparison
      const normalized = task.description
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s]/g, ''); // Remove punctuation

      if (seen.has(normalized)) {
        // Duplicate found
        seen.get(normalized)!.push(task.id);
      } else {
        seen.set(normalized, [task.id]);
      }
    }

    // Collect all duplicates
    for (const [description, ids] of seen.entries()) {
      if (ids.length > 1) {
        // Find original description (not normalized)
        const originalTask = tasks.find((t) => ids.includes(t.id))!;
        duplicates.push({
          ids,
          description: originalTask.description,
        });
      }
    }

    return duplicates;
  }

  /**
   * Determine if parallelization is worthwhile
   */
  private static shouldParallelize(
    score: ParallelizationScore,
    estimatedSpeedup: number,
    taskCount: number,
    risks: Risk[]
  ): boolean {
    // Don't parallelize if:
    // 1. Score is too low (<40)
    // 2. Speedup is minimal (<1.5x)
    // 3. Too few tasks (<3)
    // 4. Critical risks exist

    if (score.score < 40) return false;
    if (estimatedSpeedup < 1.5) return false;
    if (taskCount < 3) return false;
    if (risks.some((r) => r.severity === 'critical')) return false;

    return true;
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(
    parallelizable: boolean,
    score: ParallelizationScore,
    estimatedSpeedup: number,
    levels: Task[][],
    risks: Risk[]
  ): string {
    if (!parallelizable) {
      if (score.score < 40) {
        return `Parallelization not recommended (score: ${score.score.toFixed(0)}/100). ${score.recommendation}. Sequential execution is more appropriate.`;
      }
      if (estimatedSpeedup < 1.5) {
        return `Minimal speedup expected (${estimatedSpeedup.toFixed(1)}x). Coordination overhead would negate benefits.`;
      }
    }

    const parts: string[] = [];

    // Summary
    parts.push(
      `Parallelization recommended with ${estimatedSpeedup.toFixed(1)}x estimated speedup`
    );

    // Level breakdown
    if (levels.length > 1) {
      parts.push(
        `Tasks can be organized into ${levels.length} parallel batches based on dependencies`
      );
    } else {
      parts.push(`All tasks are independent and can run fully in parallel`);
    }

    // Key factors
    const topFactors = Object.entries(score.factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    if (topFactors.length > 0) {
      parts.push(
        `Strongest factors: ${topFactors.map(([name, value]) => `${name} (${(value as number).toFixed(0)}/100)`).join(', ')}`
      );
    }

    // Risks
    if (risks.length > 0) {
      const highRisks = risks.filter((r) => r.severity === 'high' || r.severity === 'critical');
      if (highRisks.length > 0) {
        parts.push(`⚠️  ${highRisks.length} high-priority risks identified`);
      }
    }

    return parts.join('. ') + '.';
  }
}
