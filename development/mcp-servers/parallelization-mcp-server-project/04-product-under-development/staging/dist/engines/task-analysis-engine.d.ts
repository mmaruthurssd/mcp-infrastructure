/**
 * Task Analysis Engine
 *
 * Analyzes task structure and determines parallelization opportunities
 */
import { AnalyzeTaskParallelizabilityInput, AnalyzeTaskParallelizabilityOutput } from '../types.js';
export declare class TaskAnalysisEngine {
    /**
     * Analyze task for parallelization potential
     */
    static analyze(input: AnalyzeTaskParallelizabilityInput): AnalyzeTaskParallelizabilityOutput;
    /**
     * Score parallelization potential (0-100)
     */
    private static scoreParallelizability;
    /**
     * Calculate independence factor (higher = more independent tasks)
     */
    private static calculateIndependence;
    /**
     * Calculate duration value (longer tasks = more value from parallelization)
     */
    private static calculateDurationValue;
    /**
     * Estimate conflict risk (lower = better)
     */
    private static estimateConflictRisk;
    /**
     * Calculate dependency complexity (simpler = higher score)
     */
    private static calculateDependencyComplexity;
    /**
     * Estimate resource contention
     */
    private static estimateResourceContention;
    /**
     * Calculate confidence in analysis
     */
    private static calculateConfidence;
    /**
     * Generate score recommendation
     */
    private static generateScoreRecommendation;
    /**
     * Identify risks
     */
    private static identifyRisks;
    /**
     * Detect duplicate tasks based on description similarity
     */
    private static detectDuplicateTasks;
    /**
     * Determine if parallelization is worthwhile
     */
    private static shouldParallelize;
    /**
     * Generate human-readable reasoning
     */
    private static generateReasoning;
}
//# sourceMappingURL=task-analysis-engine.d.ts.map