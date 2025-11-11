/**
 * Effort Estimator
 * Analyzes goal descriptions to estimate effort required (High/Medium/Low)
 */
export type EffortScore = 'High' | 'Medium' | 'Low';
export interface EffortFactors {
    time_estimate: string;
    technical_complexity: 'High' | 'Medium' | 'Low';
    dependencies_count: number;
    scope_clarity: 'High' | 'Medium' | 'Low';
}
export interface EffortEstimate {
    score: EffortScore;
    reasoning: string;
    factors: EffortFactors;
    confidence: 'High' | 'Medium' | 'Low';
}
export declare class EffortEstimator {
    /**
     * Estimate effort based on goal description and context
     */
    static estimate(goalDescription: string, context?: string, projectType?: string): EffortEstimate;
    private static estimateTime;
    private static estimateTechnicalComplexity;
    private static estimateDependencies;
    private static estimateScopeClarity;
    private static calculateEffortScore;
    private static generateReasoning;
    private static estimateConfidence;
}
//# sourceMappingURL=effort-estimator.d.ts.map