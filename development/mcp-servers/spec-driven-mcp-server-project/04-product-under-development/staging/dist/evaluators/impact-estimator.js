/**
 * Impact Estimator
 * Analyzes goal descriptions to estimate potential impact (High/Medium/Low)
 */
export class ImpactEstimator {
    /**
     * Estimate impact based on goal description and context
     */
    static estimate(goalDescription, context, projectType) {
        // Analyze the description for impact indicators
        const desc = goalDescription.toLowerCase();
        const ctx = (context || '').toLowerCase();
        // Estimate people affected
        const peopleAffected = this.estimatePeopleAffected(desc, ctx);
        // Estimate problem severity
        const problemSeverity = this.estimateProblemSeverity(desc);
        // Estimate strategic value
        const strategicValue = this.estimateStrategicValue(desc, projectType);
        // Calculate overall impact score
        const score = this.calculateImpactScore(peopleAffected, problemSeverity, strategicValue);
        // Generate reasoning
        const reasoning = this.generateReasoning(score, peopleAffected, problemSeverity, strategicValue, desc);
        // Estimate confidence
        const confidence = this.estimateConfidence(desc, context);
        return {
            score,
            reasoning,
            factors: {
                people_affected: peopleAffected,
                problem_severity: problemSeverity,
                strategic_value: strategicValue
            },
            confidence
        };
    }
    static estimatePeopleAffected(desc, ctx) {
        const combined = `${desc} ${ctx}`;
        // Look for explicit numbers
        const numberMatch = combined.match(/(\d+)\s*(people|users|staff|employees|team)/i);
        if (numberMatch) {
            return parseInt(numberMatch[1]);
        }
        // Look for qualitative indicators (but not for technical refactoring)
        if (combined.match(/entire.*(?:codebase|system|architecture)|rebuild|refactor/i)) {
            // Technical refactoring doesn't directly affect users
            return 5;
        }
        if (combined.match(/all|everyone|entire|whole organization/i))
            return 100;
        if (combined.match(/most|majority|many/i))
            return 50;
        if (combined.match(/several|some|few/i))
            return 10;
        if (combined.match(/team|department/i))
            return 15;
        // Default estimate
        return 5;
    }
    static estimateProblemSeverity(desc) {
        // High severity keywords
        if (desc.match(/critical|urgent|blocker|blocking|can't|cannot|broken|fails|error|bug|losing|loss/i)) {
            return 'High';
        }
        // Medium severity keywords
        if (desc.match(/need|important|should|improve|slow|inefficient|difficult|pain|frustrat|spend.*(?:time|hours?|minutes?)|currently.*(?:manually|wast)/i)) {
            return 'Medium';
        }
        // Default to Low
        return 'Low';
    }
    static estimateStrategicValue(desc, projectType) {
        // High value keywords
        if (desc.match(/revenue|business|strategic|competitive|market|growth|scale|essential/i)) {
            return 'High';
        }
        // Medium value keywords
        if (desc.match(/efficiency|productivity|quality|user experience|ux|performance|save.*time|automat(?:e|ed|ion)/i)) {
            return 'Medium';
        }
        // Project type considerations
        if (projectType === 'medical' || projectType === 'healthcare') {
            if (desc.match(/patient|phi|hipaa|compliance|safety/i)) {
                return 'High';
            }
        }
        return 'Low';
    }
    static calculateImpactScore(peopleAffected, problemSeverity, strategicValue) {
        // Scoring matrix
        const severityScore = { High: 3, Medium: 2, Low: 1 };
        const valueScore = { High: 3, Medium: 2, Low: 1 };
        const peopleScore = peopleAffected >= 20 ? 3 : peopleAffected >= 10 ? 2 : 1;
        const totalScore = severityScore[problemSeverity] + valueScore[strategicValue] + peopleScore;
        // Convert to High/Medium/Low
        if (totalScore >= 7)
            return 'High';
        if (totalScore >= 5)
            return 'Medium';
        return 'Low';
    }
    static generateReasoning(score, peopleAffected, problemSeverity, strategicValue, desc) {
        const reasons = [];
        // People affected reasoning
        if (peopleAffected >= 20) {
            reasons.push(`Affects ${peopleAffected}+ people/users`);
        }
        else if (peopleAffected >= 10) {
            reasons.push(`Affects ~${peopleAffected} people/users`);
        }
        else {
            reasons.push(`Affects a small group (~${peopleAffected} people)`);
        }
        // Problem severity reasoning
        if (problemSeverity === 'High') {
            reasons.push('Addresses a critical or blocking issue');
        }
        else if (problemSeverity === 'Medium') {
            reasons.push('Solves an important pain point');
        }
        else {
            reasons.push('Nice-to-have improvement');
        }
        // Strategic value reasoning
        if (strategicValue === 'High') {
            reasons.push('High strategic or business value');
        }
        else if (strategicValue === 'Medium') {
            reasons.push('Improves efficiency or quality');
        }
        return `${score} Impact: ${reasons.join('. ')}.`;
    }
    static estimateConfidence(desc, context) {
        // High confidence if we have good context
        if (context && context.length > 50) {
            return 'High';
        }
        // Medium confidence if description is detailed
        if (desc.length > 100) {
            return 'Medium';
        }
        // Low confidence for vague descriptions
        return 'Low';
    }
}
//# sourceMappingURL=impact-estimator.js.map