/**
 * Effort Estimator
 *
 * Estimates the effort required to complete a goal based on various factors.
 */
export interface EffortEstimate {
    level: 'High' | 'Medium' | 'Low';
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    factors: {
        complexity: 'High' | 'Medium' | 'Low';
        dependencies_count: number;
        scope_clarity: 'High' | 'Medium' | 'Low';
        technical_complexity: 'High' | 'Medium' | 'Low';
        time_estimate: string;
    };
    reasoning: string;
}
export declare class EffortEstimator {
    /**
     * Estimate effort required for a goal
     */
    static estimate(goalDescription: string, context?: string, projectType?: string): EffortEstimate;
}
//# sourceMappingURL=effort-estimator.d.ts.map