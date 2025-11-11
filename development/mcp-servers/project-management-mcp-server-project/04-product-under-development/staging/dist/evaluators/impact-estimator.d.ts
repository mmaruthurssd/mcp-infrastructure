/**
 * Impact Estimator
 *
 * Estimates the impact of a goal based on various factors.
 */
export interface ImpactEstimate {
    level: 'High' | 'Medium' | 'Low';
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    factors: {
        people_affected: number;
        problem_severity: 'High' | 'Medium' | 'Low';
        business_value: 'High' | 'Medium' | 'Low';
        strategic_value: 'High' | 'Medium' | 'Low';
    };
    reasoning: string;
}
export declare class ImpactEstimator {
    /**
     * Estimate impact of a goal
     */
    static estimate(goalDescription: string, context?: string, projectType?: string): ImpactEstimate;
}
//# sourceMappingURL=impact-estimator.d.ts.map