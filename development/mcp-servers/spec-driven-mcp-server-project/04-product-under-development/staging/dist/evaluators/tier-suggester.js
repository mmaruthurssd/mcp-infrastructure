/**
 * Tier Suggester
 * Combines Impact and Effort estimates to suggest goal tier (Now/Next/Later/Someday)
 */
export class TierSuggester {
    /**
     * Suggest tier based on Impact and Effort estimates
     */
    static suggest(impactEstimate, effortEstimate) {
        const impact = impactEstimate.score;
        const effort = effortEstimate.score;
        // Determine primary tier based on Impact/Effort matrix
        const tier = this.determineTier(impact, effort);
        // Generate reasoning
        const reasoning = this.generateReasoning(tier, impact, effort, impactEstimate, effortEstimate);
        // Calculate confidence
        const confidence = this.calculateConfidence(impactEstimate.confidence, effortEstimate.confidence);
        // Suggest alternative tiers if applicable
        const alternativeTiers = this.suggestAlternatives(tier, impact, effort, impactEstimate, effortEstimate);
        return {
            tier,
            reasoning,
            confidence,
            ...(alternativeTiers.length > 0 && { alternativeTiers })
        };
    }
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
    static determineTier(impact, effort) {
        // Clear-cut cases
        if (impact === 'High' && effort === 'Low')
            return 'Now';
        if (impact === 'High' && effort === 'High')
            return 'Next';
        if (impact === 'Low' && effort === 'Low')
            return 'Later';
        if (impact === 'Low' && effort === 'High')
            return 'Someday';
        // Medium Impact combinations
        if (impact === 'Medium') {
            if (effort === 'Low')
                return 'Now'; // Medium impact, easy to do = worth doing soon
            if (effort === 'Medium')
                return 'Next'; // Balanced effort/value = plan it
            if (effort === 'High')
                return 'Later'; // Medium value, high effort = lower priority
        }
        // High Impact, Medium Effort
        if (impact === 'High' && effort === 'Medium') {
            return 'Now'; // High value, moderate effort = do it soon
        }
        // Low Impact, Medium Effort
        if (impact === 'Low' && effort === 'Medium') {
            return 'Later'; // Low value, moderate effort = nice-to-have
        }
        // Default fallback
        return 'Someday';
    }
    static generateReasoning(tier, impact, effort, impactEstimate, effortEstimate) {
        const reasons = [];
        // Tier-specific reasoning
        switch (tier) {
            case 'Now':
                if (impact === 'High' && effort === 'Low') {
                    reasons.push('Quick win: High impact with low effort');
                }
                else if (impact === 'High' && effort === 'Medium') {
                    reasons.push('High-value opportunity with manageable effort');
                }
                else if (impact === 'Medium' && effort === 'Low') {
                    reasons.push('Easy to implement with meaningful value');
                }
                reasons.push('Recommended to prioritize soon');
                break;
            case 'Next':
                if (impact === 'High' && effort === 'High') {
                    reasons.push('Major project: High impact justifies significant effort');
                }
                else if (impact === 'Medium' && effort === 'Medium') {
                    reasons.push('Balanced project: Moderate value and effort');
                }
                reasons.push('Worth planning carefully before starting');
                break;
            case 'Later':
                if (impact === 'Low' && effort === 'Low') {
                    reasons.push('Nice-to-have: Low effort but limited impact');
                }
                else if (impact === 'Medium' && effort === 'High') {
                    reasons.push('Moderate value but high effort');
                }
                else if (impact === 'Low' && effort === 'Medium') {
                    reasons.push('Limited value with moderate effort');
                }
                reasons.push('Consider when resources are available');
                break;
            case 'Someday':
                if (impact === 'Low' && effort === 'High') {
                    reasons.push('Low ROI: High effort with limited impact');
                }
                else {
                    reasons.push('Needs clearer value proposition');
                }
                reasons.push('Reconsider if priorities or context change');
                break;
        }
        // Add specific impact/effort context
        const impactReason = impactEstimate.reasoning.split(': ')[1] || impactEstimate.reasoning;
        const effortReason = effortEstimate.reasoning.split(': ')[1] || effortEstimate.reasoning;
        return `**${tier} Tier:** ${reasons.join('. ')}.\n\n**Impact:** ${impactReason}\n\n**Effort:** ${effortReason}`;
    }
    static calculateConfidence(impactConfidence, effortConfidence) {
        const confidenceScore = {
            High: 3,
            Medium: 2,
            Low: 1
        };
        const avgScore = (confidenceScore[impactConfidence] + confidenceScore[effortConfidence]) / 2;
        if (avgScore >= 2.5)
            return 'High';
        if (avgScore >= 1.5)
            return 'Medium';
        return 'Low';
    }
    static suggestAlternatives(primaryTier, impact, effort, impactEstimate, effortEstimate) {
        const alternatives = [];
        // Suggest alternatives if confidence is low
        const lowConfidence = impactEstimate.confidence === 'Low' || effortEstimate.confidence === 'Low';
        if (lowConfidence) {
            // If impact is uncertain, suggest what tier it would be if impact were higher/lower
            if (impactEstimate.confidence === 'Low') {
                if (impact === 'Medium') {
                    alternatives.push({
                        tier: 'Now',
                        reason: 'If impact is actually High, this becomes a quick win'
                    });
                    alternatives.push({
                        tier: 'Later',
                        reason: 'If impact is actually Low, this becomes a nice-to-have'
                    });
                }
            }
            // If effort is uncertain, suggest what tier it would be if effort were higher/lower
            if (effortEstimate.confidence === 'Low') {
                if (effort === 'Medium') {
                    if (impact === 'High') {
                        alternatives.push({
                            tier: 'Now',
                            reason: 'If effort is actually Low, this becomes a quick win'
                        });
                        alternatives.push({
                            tier: 'Next',
                            reason: 'If effort is actually High, this is a major project'
                        });
                    }
                }
            }
        }
        // Suggest alternatives for borderline cases
        if (impact === 'Medium' && effort === 'Medium') {
            alternatives.push({
                tier: 'Now',
                reason: 'Could be prioritized if resources are available'
            });
            alternatives.push({
                tier: 'Later',
                reason: 'Could be deferred if higher-priority items exist'
            });
        }
        // Remove duplicates and filter out the primary tier
        return alternatives.filter((alt, index, self) => alt.tier !== primaryTier &&
            index === self.findIndex(a => a.tier === alt.tier));
    }
    /**
     * Complete evaluation combining impact, effort, and tier
     */
    static evaluateGoal(impactEstimate, effortEstimate) {
        const tierSuggestion = this.suggest(impactEstimate, effortEstimate);
        return {
            impact: impactEstimate,
            effort: effortEstimate,
            tier: tierSuggestion
        };
    }
}
//# sourceMappingURL=tier-suggester.js.map