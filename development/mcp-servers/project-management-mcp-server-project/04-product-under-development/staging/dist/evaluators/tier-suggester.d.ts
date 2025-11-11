/**
 * Tier Suggester
 *
 * Suggests a priority tier (Now/Next/Later/Someday) based on impact and effort estimates.
 */
import { ImpactEstimate } from './impact-estimator.js';
import { EffortEstimate } from './effort-estimator.js';
export interface GoalEvaluation {
    impact: ImpactEstimate;
    effort: EffortEstimate;
    tier: {
        tier: string;
        confidence: string;
        reasoning: string;
        alternativeTiers?: Array<{
            tier: string;
            reasoning: string;
        }>;
    };
}
export declare class TierSuggester {
    /**
     * Suggest a tier based on impact and effort
     *
     * Logic:
     * - High Impact + Low Effort = Now (quick wins)
     * - High Impact + Medium Effort = Now/Next
     * - High Impact + High Effort = Next (strategic)
     * - Medium Impact + Low Effort = Next
     * - Medium Impact + Medium Effort = Next/Later
     * - Low Impact = Later/Someday
     */
    static suggest(impactEstimate: ImpactEstimate, effortEstimate: EffortEstimate): {
        tier: string;
        confidence: string;
        reasoning: string;
        alternativeTiers?: Array<{
            tier: string;
            reasoning: string;
        }>;
    };
}
//# sourceMappingURL=tier-suggester.d.ts.map