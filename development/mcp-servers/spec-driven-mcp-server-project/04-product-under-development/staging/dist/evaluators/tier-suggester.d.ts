/**
 * Tier Suggester
 * Combines Impact and Effort estimates to suggest goal tier (Now/Next/Later/Someday)
 */
import { ImpactEstimate } from './impact-estimator.js';
import { EffortEstimate } from './effort-estimator.js';
export type GoalTier = 'Now' | 'Next' | 'Later' | 'Someday';
export interface TierSuggestion {
    tier: GoalTier;
    reasoning: string;
    confidence: 'High' | 'Medium' | 'Low';
    alternativeTiers?: {
        tier: GoalTier;
        reason: string;
    }[];
}
export interface GoalEvaluation {
    impact: ImpactEstimate;
    effort: EffortEstimate;
    tier: TierSuggestion;
}
export declare class TierSuggester {
    /**
     * Suggest tier based on Impact and Effort estimates
     */
    static suggest(impactEstimate: ImpactEstimate, effortEstimate: EffortEstimate): TierSuggestion;
    /**
     * Determine tier based on Impact/Effort matrix
     *
     * Matrix:
     * - High Impact, Low Effort = NOW (quick wins)
     * - High Impact, High Effort = NEXT (major projects)
     * - Low Impact, Low Effort = LATER (nice-to-haves)
     * - Low Impact, High Effort = SOMEDAY (not worth it)
     * - Medium combinations = contextual
     */
    private static determineTier;
    private static generateReasoning;
    private static calculateConfidence;
    private static suggestAlternatives;
    /**
     * Complete evaluation combining impact, effort, and tier
     */
    static evaluateGoal(impactEstimate: ImpactEstimate, effortEstimate: EffortEstimate): GoalEvaluation;
}
//# sourceMappingURL=tier-suggester.d.ts.map