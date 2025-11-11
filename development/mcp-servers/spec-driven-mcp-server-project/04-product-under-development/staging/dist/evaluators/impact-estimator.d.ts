/**
 * Impact Estimator
 * Analyzes goal descriptions to estimate potential impact (High/Medium/Low)
 */
export type ImpactScore = 'High' | 'Medium' | 'Low';
export interface ImpactFactors {
    people_affected: number;
    problem_severity: 'High' | 'Medium' | 'Low';
    strategic_value: 'High' | 'Medium' | 'Low';
}
export interface ImpactEstimate {
    score: ImpactScore;
    reasoning: string;
    factors: ImpactFactors;
    confidence: 'High' | 'Medium' | 'Low';
}
export declare class ImpactEstimator {
    /**
     * Estimate impact based on goal description and context
     */
    static estimate(goalDescription: string, context?: string, projectType?: string): ImpactEstimate;
    private static estimatePeopleAffected;
    private static estimateProblemSeverity;
    private static estimateStrategicValue;
    private static calculateImpactScore;
    private static generateReasoning;
    private static estimateConfidence;
}
//# sourceMappingURL=impact-estimator.d.ts.map