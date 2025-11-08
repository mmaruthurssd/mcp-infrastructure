/**
 * Effort Estimator
 * Analyzes goal descriptions to estimate effort required (High/Medium/Low)
 */
export class EffortEstimator {
    /**
     * Estimate effort based on goal description and context
     */
    static estimate(goalDescription, context, projectType) {
        // Analyze the description for effort indicators
        const desc = goalDescription.toLowerCase();
        const ctx = (context || '').toLowerCase();
        // Estimate time
        const timeEstimate = this.estimateTime(desc, ctx);
        // Estimate technical complexity
        const technicalComplexity = this.estimateTechnicalComplexity(desc, projectType);
        // Count dependencies
        const dependenciesCount = this.estimateDependencies(desc, ctx);
        // Estimate scope clarity
        const scopeClarity = this.estimateScopeClarity(desc, context);
        // Calculate overall effort score
        const score = this.calculateEffortScore(timeEstimate, technicalComplexity, dependenciesCount, scopeClarity);
        // Generate reasoning
        const reasoning = this.generateReasoning(score, timeEstimate, technicalComplexity, dependenciesCount, scopeClarity, desc);
        // Estimate confidence
        const confidence = this.estimateConfidence(desc, context);
        return {
            score,
            reasoning,
            factors: {
                time_estimate: timeEstimate,
                technical_complexity: technicalComplexity,
                dependencies_count: dependenciesCount,
                scope_clarity: scopeClarity
            },
            confidence
        };
    }
    static estimateTime(desc, ctx) {
        const combined = `${desc} ${ctx}`;
        // Look for explicit time mentions
        if (combined.match(/(\d+)\s*(hours?|hrs?)/i)) {
            const match = combined.match(/(\d+)\s*(hours?|hrs?)/i);
            return `${match[1]} hours`;
        }
        if (combined.match(/(\d+)\s*(days?)/i)) {
            const match = combined.match(/(\d+)\s*(days?)/i);
            return `${match[1]} days`;
        }
        if (combined.match(/(\d+)\s*(weeks?)/i)) {
            const match = combined.match(/(\d+)\s*(weeks?)/i);
            return `${match[1]} weeks`;
        }
        if (combined.match(/(\d+)\s*(months?)/i)) {
            const match = combined.match(/(\d+)\s*(months?)/i);
            return `${match[1]} months`;
        }
        // Infer from complexity keywords
        if (combined.match(/quick|simple|easy|small|minor|trivial/i)) {
            return '1-2 hours';
        }
        if (combined.match(/moderate|medium|standard|typical/i)) {
            return '1-3 days';
        }
        // Large project indicators
        if (combined.match(/mobile app|ios.*android|cross[- ]platform|hipaa.*compliance.*encryption|rebuild.*codebase|microservices/i)) {
            return '2-4 months';
        }
        if (combined.match(/complex|large|major|significant|full.*(?:app|system|platform)/i)) {
            return '1-2 months';
        }
        if (combined.match(/massive|complete|entire|overhaul|rebuild/i)) {
            return '2-4 months';
        }
        // Default estimate based on scope indicators
        if (combined.match(/add|create|build|implement/i)) {
            return '3-5 days';
        }
        if (combined.match(/fix|update|modify|change/i)) {
            return '1-2 days';
        }
        return '2-5 days';
    }
    static estimateTechnicalComplexity(desc, projectType) {
        // High complexity keywords
        if (desc.match(/algorithm|machine learning|ai|architecture|database migration|integration|security|encryption|real-time|scalability/i)) {
            return 'High';
        }
        // Medium complexity keywords
        if (desc.match(/api|backend|frontend|authentication|validation|testing|deployment|optimization/i)) {
            return 'Medium';
        }
        // High complexity for certain project types
        if (projectType === 'medical' || projectType === 'healthcare') {
            if (desc.match(/phi|hipaa|compliance|patient data|ehr|fhir/i)) {
                return 'High';
            }
        }
        // Low complexity keywords
        if (desc.match(/ui|styling|text|copy|content|documentation|config/i)) {
            return 'Low';
        }
        return 'Medium';
    }
    static estimateDependencies(desc, ctx) {
        const combined = `${desc} ${ctx}`;
        let count = 0;
        // Look for explicit dependency mentions
        const dependencyMatch = combined.match(/(\d+)\s*(dependencies|dependency|depends on)/i);
        if (dependencyMatch) {
            return parseInt(dependencyMatch[1]);
        }
        // Count dependency indicators
        if (combined.match(/requires?|needs?|depends on|blocked by|waiting for/i)) {
            count += 1;
        }
        // Note: API integration is counted as just one dependency, not multiple
        if (combined.match(/integrat(e|ion).*(?:with|api)|connect.*(?:to|with)|sync.*(?:with|to)/i)) {
            count += 1;
        }
        if (combined.match(/database.*migration|infrastructure.*change|platform.*switch/i)) {
            count += 1;
        }
        if (combined.match(/approval|stakeholder.*buy[- ]in|compliance.*review/i)) {
            count += 1;
        }
        return count;
    }
    static estimateScopeClarity(desc, context) {
        const descLength = desc.length;
        const ctxLength = (context || '').length;
        // High clarity if detailed description
        if (descLength > 200 || ctxLength > 100) {
            // Check for specific details
            if (desc.match(/specifically|exactly|must|will|should|requirements?|spec/i)) {
                return 'High';
            }
            return 'Medium';
        }
        // Low clarity indicators
        if (desc.match(/maybe|possibly|might|could|explore|investigate|research|tbd|unclear|figure out/i)) {
            return 'Low';
        }
        // Medium clarity if some details present
        if (descLength > 50) {
            return 'Medium';
        }
        // Default to Low for vague descriptions
        return 'Low';
    }
    static calculateEffortScore(timeEstimate, technicalComplexity, dependenciesCount, scopeClarity) {
        // Scoring matrix
        const complexityScore = { High: 3, Medium: 2, Low: 1 };
        const clarityScore = { High: 0, Medium: 1, Low: 2 }; // Less clarity = more effort
        // Time score
        let timeScore = 1;
        if (timeEstimate.match(/month/i))
            timeScore = 3;
        else if (timeEstimate.match(/week/i))
            timeScore = 2;
        else if (timeEstimate.match(/day/i)) {
            const days = parseInt(timeEstimate.match(/(\d+)/)?.[1] || '1');
            timeScore = days >= 3 ? 2 : 1;
        }
        // Dependencies score
        const depsScore = dependenciesCount >= 3 ? 3 : dependenciesCount >= 1 ? 2 : 1;
        const totalScore = timeScore + complexityScore[technicalComplexity] + depsScore + clarityScore[scopeClarity];
        // Convert to High/Medium/Low
        if (totalScore >= 8)
            return 'High';
        if (totalScore >= 5)
            return 'Medium';
        return 'Low';
    }
    static generateReasoning(score, timeEstimate, technicalComplexity, dependenciesCount, scopeClarity, desc) {
        const reasons = [];
        // Time reasoning
        reasons.push(`Estimated time: ${timeEstimate}`);
        // Complexity reasoning
        if (technicalComplexity === 'High') {
            reasons.push('High technical complexity');
        }
        else if (technicalComplexity === 'Medium') {
            reasons.push('Moderate technical complexity');
        }
        else {
            reasons.push('Low technical complexity');
        }
        // Dependencies reasoning
        if (dependenciesCount >= 3) {
            reasons.push(`Multiple dependencies (${dependenciesCount}+)`);
        }
        else if (dependenciesCount >= 1) {
            reasons.push(`Some dependencies (~${dependenciesCount})`);
        }
        else {
            reasons.push('Few or no dependencies');
        }
        // Scope clarity reasoning
        if (scopeClarity === 'Low') {
            reasons.push('Unclear scope (may require discovery)');
        }
        else if (scopeClarity === 'Medium') {
            reasons.push('Moderately clear scope');
        }
        else {
            reasons.push('Well-defined scope');
        }
        return `${score} Effort: ${reasons.join('. ')}.`;
    }
    static estimateConfidence(desc, context) {
        // High confidence if we have good context and time estimate
        if (context && context.length > 50 && desc.match(/\d+\s*(hours?|days?|weeks?|months?)/i)) {
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
//# sourceMappingURL=effort-estimator.js.map