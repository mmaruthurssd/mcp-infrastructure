/**
 * Impact Estimator
 *
 * Estimates the impact of a goal based on various factors.
 */
export class ImpactEstimator {
    /**
     * Estimate impact of a goal
     */
    static estimate(goalDescription, context, projectType) {
        const description = goalDescription.toLowerCase();
        const contextStr = (context || '').toLowerCase();
        // Analyze keywords for impact signals
        const highImpactKeywords = ['critical', 'urgent', 'patient', 'security', 'data loss', 'compliance', 'hipaa'];
        const mediumImpactKeywords = ['improve', 'optimize', 'enhance', 'streamline', 'automate'];
        const lowImpactKeywords = ['nice to have', 'cosmetic', 'minor', 'optional'];
        const hasHighImpact = highImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
        const hasMediumImpact = mediumImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
        const hasLowImpact = lowImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
        // Estimate people affected
        let peopleAffected = 5; // default
        if (description.includes('all') || description.includes('everyone')) {
            peopleAffected = 50;
        }
        else if (description.includes('team') || description.includes('staff')) {
            peopleAffected = 10;
        }
        else if (description.includes('one') || description.includes('single')) {
            peopleAffected = 1;
        }
        // Determine impact level
        let level;
        let problemSeverity;
        let businessValue;
        if (hasHighImpact || peopleAffected > 20) {
            level = 'High';
            problemSeverity = 'High';
            businessValue = 'High';
        }
        else if (hasLowImpact || peopleAffected < 3) {
            level = 'Low';
            problemSeverity = 'Low';
            businessValue = 'Low';
        }
        else {
            level = 'Medium';
            problemSeverity = 'Medium';
            businessValue = 'Medium';
        }
        // Determine confidence
        const hasDetailedContext = (goalDescription.length + (context?.length || 0)) > 100;
        const confidence = hasDetailedContext ? 'Medium' : 'Low';
        const reasoning = `Impact estimated as ${level} based on: ${peopleAffected} people affected, ` +
            `${problemSeverity} problem severity, ${businessValue} business value.`;
        return {
            level,
            confidence,
            factors: {
                people_affected: peopleAffected,
                problem_severity: problemSeverity,
                business_value: businessValue
            },
            reasoning
        };
    }
}
//# sourceMappingURL=impact-estimator%202.js.map