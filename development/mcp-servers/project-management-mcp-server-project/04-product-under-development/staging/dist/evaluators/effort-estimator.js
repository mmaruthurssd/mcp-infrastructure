/**
 * Effort Estimator
 *
 * Estimates the effort required to complete a goal based on various factors.
 */
export class EffortEstimator {
    /**
     * Estimate effort required for a goal
     */
    static estimate(goalDescription, context, projectType) {
        const description = goalDescription.toLowerCase();
        const contextStr = (context || '').toLowerCase();
        // Analyze keywords for effort signals
        const highEffortKeywords = ['migrate', 'refactor', 'rebuild', 'integrate', 'multiple', 'complex', 'system'];
        const lowEffortKeywords = ['simple', 'quick', 'minor', 'tweak', 'small', 'fix'];
        const hasHighEffort = highEffortKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
        const hasLowEffort = lowEffortKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
        // Estimate dependencies
        let dependenciesCount = 0;
        if (description.includes('after') || description.includes('depends')) {
            dependenciesCount++;
        }
        if (description.includes('integrate') || description.includes('connect')) {
            dependenciesCount += 2;
        }
        if (description.includes('multiple') || description.includes('several')) {
            dependenciesCount++;
        }
        // Determine complexity
        let complexity;
        if (hasHighEffort || dependenciesCount > 2) {
            complexity = 'High';
        }
        else if (hasLowEffort) {
            complexity = 'Low';
        }
        else {
            complexity = 'Medium';
        }
        // Estimate scope clarity
        const hasSpecifics = description.includes('exactly') || description.includes('specifically') ||
            description.match(/\d+/) !== null; // has numbers
        const scopeClarity = hasSpecifics ? 'High' : 'Medium';
        // Determine effort level
        let level;
        let score;
        let timeEstimate;
        const technicalComplexity = complexity; // Same as general complexity
        if (complexity === 'High' || dependenciesCount > 2) {
            level = 'High';
            score = 70 + (dependenciesCount * 5);
            timeEstimate = dependenciesCount > 3 ? '1-2 weeks' : '3-5 days';
        }
        else if (complexity === 'Low' && dependenciesCount === 0) {
            level = 'Low';
            score = 20;
            timeEstimate = '2-4 hours';
        }
        else {
            level = 'Medium';
            score = 40 + (dependenciesCount * 5);
            timeEstimate = dependenciesCount > 1 ? '1-2 days' : '4-8 hours';
        }
        // Cap score at 100
        score = Math.min(score, 100);
        // Determine confidence
        const hasDetailedContext = (goalDescription.length + (context?.length || 0)) > 100;
        const confidence = (hasDetailedContext && scopeClarity === 'High') ? 'Medium' : 'Low';
        const reasoning = `Effort estimated as ${level} (score: ${score}) based on: ${complexity} complexity, ` +
            `${dependenciesCount} dependencies, ${scopeClarity} scope clarity. Estimated time: ${timeEstimate}.`;
        return {
            level,
            score,
            confidence,
            factors: {
                complexity,
                dependencies_count: dependenciesCount,
                scope_clarity: scopeClarity,
                technical_complexity: technicalComplexity,
                time_estimate: timeEstimate
            },
            reasoning
        };
    }
}
//# sourceMappingURL=effort-estimator.js.map