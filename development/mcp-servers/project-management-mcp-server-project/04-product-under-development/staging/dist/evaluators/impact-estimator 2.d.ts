/**
 * Impact Estimator
 *
 * Estimates the impact of a goal based on various factors.
 */
export interface ImpactEstimate {
    level: 'High' | 'Medium' | 'Low';
    confidence: 'High' | 'Medium' | 'Low';
    factors: {
        people_affected: number;
        problem_severity: 'High' | 'Medium' | 'Low';
        business_value: 'High' | 'Medium' | 'Low';
    };
    reasoning: string;
}
export declare class ImpactEstimator {
    /**
     * Estimate impact of a goal
     */
    static estimate(goalDescription: string, context?: string, projectType?: string): ImpactEstimate;
}
//# sourceMappingURL=impact-estimator%202.d.ts.map