/**
 * Tier Suggester
 *
 * Suggests a priority tier (Now/Next/Later/Someday) based on impact and effort estimates.
 */
export class TierSuggester {
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
    static suggest(impactEstimate, effortEstimate) {
        const impact = impactEstimate.level;
        const effort = effortEstimate.level;
        let tier;
        let reasoning;
        // High impact items
        if (impact === 'High') {
            if (effort === 'Low') {
                tier = 'Now';
                reasoning = 'High impact with low effort - quick win opportunity';
            }
            else if (effort === 'Medium') {
                tier = 'Now';
                reasoning = 'High impact justifies medium effort - prioritize soon';
            }
            else {
                tier = 'Next';
                reasoning = 'High impact but high effort - strategic investment for next cycle';
            }
        }
        // Medium impact items
        else if (impact === 'Medium') {
            if (effort === 'Low') {
                tier = 'Next';
                reasoning = 'Medium impact, low effort - good candidate for next cycle';
            }
            else if (effort === 'Medium') {
                tier = 'Later';
                reasoning = 'Medium impact and effort - schedule when capacity allows';
            }
            else {
                tier = 'Later';
                reasoning = 'Medium impact with high effort - deprioritize unless strategic';
            }
        }
        // Low impact items
        else {
            if (effort === 'Low') {
                tier = 'Later';
                reasoning = 'Low impact even with low effort - do when capacity permits';
            }
            else {
                tier = 'Someday';
                reasoning = 'Low impact - consider if truly necessary';
            }
        }
        // Determine confidence based on input confidence
        const impactConfidence = impactEstimate.confidence;
        const effortConfidence = effortEstimate.confidence;
        let confidence;
        if (impactConfidence === 'High' && effortConfidence === 'High') {
            confidence = 'High';
        }
        else if (impactConfidence === 'Low' || effortConfidence === 'Low') {
            confidence = 'Low';
        }
        else {
            confidence = 'Medium';
        }
        // Generate alternative tier suggestions
        const alternativeTiers = [];
        const allTiers = ['Now', 'Next', 'Later', 'Someday'];
        for (const altTier of allTiers) {
            if (altTier !== tier) {
                let altReasoning = '';
                if (altTier === 'Now' && tier !== 'Now') {
                    altReasoning = 'If urgency increases or resources become available';
                }
                else if (altTier === 'Next' && tier !== 'Next') {
                    altReasoning = 'Standard prioritization for next planning cycle';
                }
                else if (altTier === 'Later' && tier !== 'Later') {
                    altReasoning = 'If current priorities take precedence';
                }
                else if (altTier === 'Someday' && tier !== 'Someday') {
                    altReasoning = 'If impact/effort assessment changes unfavorably';
                }
                if (altReasoning) {
                    alternativeTiers.push({ tier: altTier, reasoning: altReasoning });
                }
            }
        }
        return {
            tier,
            confidence,
            reasoning,
            alternativeTiers: alternativeTiers.length > 0 ? alternativeTiers : undefined
        };
    }
}
//# sourceMappingURL=tier-suggester.js.map