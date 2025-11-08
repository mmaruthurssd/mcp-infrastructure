/**
 * Learning & Optimization Layer
 *
 * Tracks execution patterns, learns from successes/failures, and improves
 * parallelization decisions over time.
 */

import {
  ExecuteParallelWorkflowOutput,
  AnalyzeTaskParallelizabilityOutput,
  OptimizeBatchDistributionOutput,
  ExecutionMetrics,
  Conflict,
} from '../types.js';

/**
 * Execution record for learning
 */
export interface ExecutionRecord {
  id: string;
  timestamp: Date;
  taskCount: number;
  agentCount: number;
  optimizationGoal: string;
  executionStrategy: string;

  // Analysis data
  analysis: {
    score: number;
    confidence: number;
    estimatedSpeedup: number;
    riskCount: number;
  };

  // Execution results
  execution: {
    success: boolean;
    actualSpeedup: number;
    duration: number;
    conflictCount: number;
    failureCount: number;
  };

  // Batch distribution
  batchDistribution: {
    batchCount: number;
    loadBalance: number;
    avgBatchSize: number;
  };

  // Outcome classification
  outcome: 'success' | 'partial-success' | 'failure';
  learnings: string[];
}

/**
 * Performance benchmark data
 */
export interface BenchmarkData {
  strategy: string;
  totalExecutions: number;
  successRate: number;
  avgSpeedup: number;
  avgLoadBalance: number;
  avgConflictRate: number;
  bestCaseSpeedup: number;
  worstCaseSpeedup: number;
}

/**
 * Pattern learned from history
 */
export interface LearnedPattern {
  id: string;
  pattern: string;
  confidence: number;
  occurrences: number;
  avgSpeedup: number;
  recommendation: string;
  conditions: {
    taskCountRange?: [number, number];
    agentCountRange?: [number, number];
    scoreRange?: [number, number];
  };
}

/**
 * Learning Optimizer
 */
export class LearningOptimizer {
  private static records: ExecutionRecord[] = [];
  private static patterns: LearnedPattern[] = [];

  /**
   * Record an execution for learning
   */
  static recordExecution(
    analysis: AnalyzeTaskParallelizabilityOutput,
    distribution: OptimizeBatchDistributionOutput,
    execution: ExecuteParallelWorkflowOutput,
    params: {
      taskCount: number;
      agentCount: number;
      optimizationGoal: string;
      executionStrategy: string;
    }
  ): ExecutionRecord {
    const record: ExecutionRecord = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      taskCount: params.taskCount,
      agentCount: params.agentCount,
      optimizationGoal: params.optimizationGoal,
      executionStrategy: params.executionStrategy,

      analysis: {
        score: 0, // Would extract from analysis
        confidence: analysis.confidence,
        estimatedSpeedup: analysis.estimatedSpeedup,
        riskCount: analysis.risks.length,
      },

      execution: {
        success: execution.success,
        actualSpeedup: execution.metrics.actualSpeedup,
        duration: execution.metrics.totalDuration,
        conflictCount: execution.conflicts.length,
        failureCount: execution.metrics.failureCount,
      },

      batchDistribution: {
        batchCount: distribution.batches.length,
        loadBalance: distribution.loadBalance,
        avgBatchSize: params.taskCount / distribution.batches.length,
      },

      outcome: this.classifyOutcome(execution),
      learnings: this.extractLearnings(analysis, execution, params),
    };

    this.records.push(record);

    // Update patterns
    this.updatePatterns(record);

    return record;
  }

  /**
   * Classify execution outcome
   */
  private static classifyOutcome(
    execution: ExecuteParallelWorkflowOutput
  ): 'success' | 'partial-success' | 'failure' {
    if (!execution.success) return 'failure';

    const successRate =
      (execution.metrics.totalTasks - execution.metrics.failureCount) /
      execution.metrics.totalTasks;

    if (successRate >= 0.95) return 'success';
    if (successRate >= 0.7) return 'partial-success';
    return 'failure';
  }

  /**
   * Extract learnings from execution
   */
  private static extractLearnings(
    analysis: AnalyzeTaskParallelizabilityOutput,
    execution: ExecuteParallelWorkflowOutput,
    params: any
  ): string[] {
    const learnings: string[] = [];

    // Learning 1: Speedup accuracy
    const speedupDiff = Math.abs(
      analysis.estimatedSpeedup - execution.metrics.actualSpeedup
    );

    if (speedupDiff > 1.0) {
      learnings.push(
        `Estimated speedup was off by ${speedupDiff.toFixed(1)}x - ` +
        `predicted ${analysis.estimatedSpeedup.toFixed(1)}x, ` +
        `actual ${execution.metrics.actualSpeedup.toFixed(1)}x`
      );
    }

    // Learning 2: Conflict prediction
    if (execution.conflicts.length > 0 && analysis.risks.length === 0) {
      learnings.push(
        `${execution.conflicts.length} conflicts occurred despite low risk assessment - ` +
        `improve implicit dependency detection`
      );
    }

    // Learning 3: Strategy effectiveness
    if (execution.success && execution.metrics.actualSpeedup > 2.0) {
      learnings.push(
        `${params.executionStrategy} strategy with ` +
        `${params.optimizationGoal} goal achieved ${execution.metrics.actualSpeedup.toFixed(1)}x speedup - ` +
        `excellent result for ${params.taskCount} tasks`
      );
    }

    // Learning 4: Failure patterns
    if (execution.metrics.failureCount > 0) {
      const failureRate = execution.metrics.failureCount / execution.metrics.totalTasks;
      learnings.push(
        `${(failureRate * 100).toFixed(0)}% failure rate - ` +
        `consider more conservative strategy or better dependency analysis`
      );
    }

    return learnings;
  }

  /**
   * Update learned patterns
   */
  private static updatePatterns(record: ExecutionRecord): void {
    // Pattern 1: Task count vs speedup
    const taskCountPattern = this.findOrCreatePattern(
      `task-count-${this.getTaskCountBucket(record.taskCount)}`,
      `Tasks in ${this.getTaskCountBucket(record.taskCount)} range`,
      { taskCountRange: this.getTaskCountRange(record.taskCount) }
    );

    this.updatePatternStats(taskCountPattern, record);

    // Pattern 2: Strategy effectiveness
    const strategyPattern = this.findOrCreatePattern(
      `strategy-${record.executionStrategy}-${record.optimizationGoal}`,
      `${record.executionStrategy} execution with ${record.optimizationGoal} optimization`,
      {}
    );

    this.updatePatternStats(strategyPattern, record);

    // Pattern 3: Load balance impact
    if (record.batchDistribution.loadBalance >= 80) {
      const balancePattern = this.findOrCreatePattern(
        'high-load-balance',
        'Well-balanced workload distribution',
        {}
      );

      this.updatePatternStats(balancePattern, record);
    }
  }

  /**
   * Find or create pattern
   */
  private static findOrCreatePattern(
    id: string,
    description: string,
    conditions: any
  ): LearnedPattern {
    let pattern = this.patterns.find(p => p.id === id);

    if (!pattern) {
      pattern = {
        id,
        pattern: description,
        confidence: 0,
        occurrences: 0,
        avgSpeedup: 0,
        recommendation: '',
        conditions,
      };
      this.patterns.push(pattern);
    }

    return pattern;
  }

  /**
   * Update pattern statistics
   */
  private static updatePatternStats(
    pattern: LearnedPattern,
    record: ExecutionRecord
  ): void {
    // Incremental average for speedup
    pattern.avgSpeedup =
      (pattern.avgSpeedup * pattern.occurrences + record.execution.actualSpeedup) /
      (pattern.occurrences + 1);

    pattern.occurrences++;

    // Update confidence (more occurrences = higher confidence, capped at 95)
    pattern.confidence = Math.min(95, pattern.occurrences * 5);

    // Generate recommendation
    if (pattern.avgSpeedup >= 2.5) {
      pattern.recommendation = 'Highly recommended - excellent parallelization results';
    } else if (pattern.avgSpeedup >= 1.5) {
      pattern.recommendation = 'Recommended - good parallelization potential';
    } else if (pattern.avgSpeedup >= 1.2) {
      pattern.recommendation = 'Moderate benefit - consider workload characteristics';
    } else {
      pattern.recommendation = 'Limited benefit - sequential execution may be better';
    }
  }

  /**
   * Get task count bucket
   */
  private static getTaskCountBucket(count: number): string {
    if (count <= 5) return 'small';
    if (count <= 15) return 'medium';
    if (count <= 30) return 'large';
    return 'xlarge';
  }

  /**
   * Get task count range
   */
  private static getTaskCountRange(count: number): [number, number] {
    if (count <= 5) return [1, 5];
    if (count <= 15) return [6, 15];
    if (count <= 30) return [16, 30];
    return [31, 100];
  }

  /**
   * Generate benchmark report
   */
  static generateBenchmark(): BenchmarkData[] {
    const benchmarks: Map<string, BenchmarkData> = new Map();

    // Group by strategy
    for (const record of this.records) {
      const key = `${record.executionStrategy}-${record.optimizationGoal}`;

      if (!benchmarks.has(key)) {
        benchmarks.set(key, {
          strategy: key,
          totalExecutions: 0,
          successRate: 0,
          avgSpeedup: 0,
          avgLoadBalance: 0,
          avgConflictRate: 0,
          bestCaseSpeedup: 0,
          worstCaseSpeedup: Infinity,
        });
      }

      const bench = benchmarks.get(key)!;

      // Update counts
      bench.totalExecutions++;

      // Update averages (incremental)
      const n = bench.totalExecutions;
      bench.avgSpeedup =
        (bench.avgSpeedup * (n - 1) + record.execution.actualSpeedup) / n;
      bench.avgLoadBalance =
        (bench.avgLoadBalance * (n - 1) + record.batchDistribution.loadBalance) / n;

      const conflictRate = record.execution.conflictCount / record.taskCount;
      bench.avgConflictRate =
        (bench.avgConflictRate * (n - 1) + conflictRate) / n;

      // Update success rate
      if (record.outcome === 'success') {
        bench.successRate = (bench.successRate * (n - 1) + 1) / n;
      } else {
        bench.successRate = (bench.successRate * (n - 1)) / n;
      }

      // Update best/worst case
      bench.bestCaseSpeedup = Math.max(
        bench.bestCaseSpeedup,
        record.execution.actualSpeedup
      );
      bench.worstCaseSpeedup = Math.min(
        bench.worstCaseSpeedup,
        record.execution.actualSpeedup
      );
    }

    return Array.from(benchmarks.values());
  }

  /**
   * Get learned patterns
   */
  static getLearnedPatterns(): LearnedPattern[] {
    return this.patterns
      .filter(p => p.occurrences >= 3) // Minimum 3 occurrences
      .sort((a, b) => b.avgSpeedup - a.avgSpeedup);
  }

  /**
   * Suggest improvements based on history
   */
  static suggestImprovements(
    taskCount: number,
    agentCount: number
  ): string[] {
    const suggestions: string[] = [];

    // Find relevant patterns
    const relevantPatterns = this.patterns.filter(p => {
      if (!p.conditions.taskCountRange) return false;
      const [min, max] = p.conditions.taskCountRange;
      return taskCount >= min && taskCount <= max;
    });

    if (relevantPatterns.length === 0) {
      suggestions.push(
        'No historical data for this task count - using default heuristics'
      );
      return suggestions;
    }

    // Find best performing pattern
    const bestPattern = relevantPatterns.reduce((best, p) =>
      p.avgSpeedup > best.avgSpeedup ? p : best
    );

    suggestions.push(
      `Historical data (${bestPattern.occurrences} executions): ` +
      `${bestPattern.pattern} achieved ${bestPattern.avgSpeedup.toFixed(1)}x average speedup`
    );

    suggestions.push(bestPattern.recommendation);

    // Agent count suggestion
    const avgTasksPerAgent = taskCount / agentCount;
    if (avgTasksPerAgent < 2) {
      suggestions.push(
        `Consider reducing agent count - ` +
        `${avgTasksPerAgent.toFixed(1)} tasks per agent may have coordination overhead`
      );
    } else if (avgTasksPerAgent > 10) {
      suggestions.push(
        `Consider increasing agent count - ` +
        `${avgTasksPerAgent.toFixed(1)} tasks per agent may not fully utilize parallelism`
      );
    }

    return suggestions;
  }

  /**
   * Analyze failure patterns
   */
  static analyzeFailures(): {
    totalFailures: number;
    commonPatterns: string[];
    recommendations: string[];
  } {
    const failures = this.records.filter(r => r.outcome === 'failure');

    const commonPatterns: string[] = [];
    const recommendations: string[] = [];

    if (failures.length === 0) {
      return {
        totalFailures: 0,
        commonPatterns: ['No failures recorded'],
        recommendations: ['Continue current approach'],
      };
    }

    // Pattern 1: High conflict rate
    const highConflictFailures = failures.filter(
      f => f.execution.conflictCount > 3
    );

    if (highConflictFailures.length > failures.length * 0.5) {
      commonPatterns.push(
        `${highConflictFailures.length} failures had high conflict counts (>3)`
      );
      recommendations.push(
        'Improve implicit dependency detection to reduce conflicts'
      );
    }

    // Pattern 2: Aggressive strategy failures
    const aggressiveFailures = failures.filter(
      f => f.executionStrategy === 'aggressive'
    );

    if (aggressiveFailures.length > failures.length * 0.6) {
      commonPatterns.push(
        `${aggressiveFailures.length}/${failures.length} failures used aggressive strategy`
      );
      recommendations.push(
        'Consider defaulting to conservative strategy for higher reliability'
      );
    }

    // Pattern 3: Poor load balance
    const unbalancedFailures = failures.filter(
      f => f.batchDistribution.loadBalance < 50
    );

    if (unbalancedFailures.length > failures.length * 0.4) {
      commonPatterns.push(
        `${unbalancedFailures.length} failures had poor load balance (<50/100)`
      );
      recommendations.push(
        'Use balance-load optimization goal for better workload distribution'
      );
    }

    return {
      totalFailures: failures.length,
      commonPatterns,
      recommendations,
    };
  }

  /**
   * Get execution history
   */
  static getExecutionHistory(limit?: number): ExecutionRecord[] {
    const sorted = [...this.records].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Clear history (for testing or reset)
   */
  static clearHistory(): void {
    this.records = [];
    this.patterns = [];
  }

  /**
   * Export data for persistence
   */
  static exportData(): {
    records: ExecutionRecord[];
    patterns: LearnedPattern[];
  } {
    return {
      records: this.records,
      patterns: this.patterns,
    };
  }

  /**
   * Import data from persistence
   */
  static importData(data: {
    records: ExecutionRecord[];
    patterns: LearnedPattern[];
  }): void {
    this.records = data.records.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));
    this.patterns = data.patterns;
  }
}
