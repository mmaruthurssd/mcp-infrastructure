/**
 * Complexity Analyzer - Scores task complexity based on multiple factors
 *
 * Inspired by Taskmaster AI's complexity analysis system
 */
export class ComplexityAnalyzer {
    /**
     * Calculate complexity score for a task
     */
    static analyze(factors) {
        let score = 1;
        const reasoning = [];
        const recommendations = [];
        // Base complexity from dependencies
        if (factors.dependencies > 0) {
            const depScore = Math.min(factors.dependencies * 1.5, 3);
            score += depScore;
            reasoning.push(`${factors.dependencies} dependencies add ${depScore.toFixed(1)} points`);
            if (factors.dependencies > 3) {
                recommendations.push('Consider breaking this task into smaller subtasks with fewer dependencies');
            }
        }
        // Unknown factors increase complexity significantly
        if (factors.unknownFactors) {
            score += 2;
            reasoning.push('Unknown factors add 2 points');
            recommendations.push('Research and prototype before implementation to reduce unknowns');
        }
        // Research required
        if (factors.requiresResearch) {
            score += 2;
            reasoning.push('Research requirement adds 2 points');
            recommendations.push('Complete research phase before estimating effort');
        }
        // Integration points
        if (factors.integrationPoints > 0) {
            const integrationScore = Math.min(factors.integrationPoints * 1, 2);
            score += integrationScore;
            reasoning.push(`${factors.integrationPoints} integration points add ${integrationScore.toFixed(1)} points`);
            if (factors.integrationPoints > 2) {
                recommendations.push('Consider integration adapters to reduce coupling');
            }
        }
        // Testing scope
        switch (factors.testingScope) {
            case 'unit':
                score += 0.5;
                reasoning.push('Unit testing scope adds 0.5 points');
                break;
            case 'integration':
                score += 1.5;
                reasoning.push('Integration testing scope adds 1.5 points');
                break;
            case 'e2e':
                score += 2.5;
                reasoning.push('E2E testing scope adds 2.5 points');
                recommendations.push('Consider test data setup and teardown requirements');
                break;
        }
        // PHI handling adds complexity
        if (factors.phiHandling) {
            score += 1.5;
            reasoning.push('PHI handling requirements add 1.5 points');
            recommendations.push('Ensure encryption, audit logging, and synthetic test data are in place');
        }
        // Estimated hours (if provided)
        if (factors.estimatedHours) {
            if (factors.estimatedHours > 8) {
                score += 2;
                reasoning.push('Estimated effort >8 hours adds 2 points');
                recommendations.push('Task is too large - decompose into smaller tasks of <8 hours each');
            }
            else if (factors.estimatedHours > 4) {
                score += 1;
                reasoning.push('Estimated effort >4 hours adds 1 point');
            }
        }
        // Cap at 10
        score = Math.min(Math.round(score), 10);
        // Determine level
        const level = this.getComplexityLevel(score);
        // Add level-specific recommendations
        if (score >= 7) {
            recommendations.push('High complexity - strongly consider decomposing into smaller tasks');
            recommendations.push('Review with team before implementation');
        }
        else if (score >= 5) {
            recommendations.push('Moderate complexity - ensure clear acceptance criteria');
        }
        return {
            score,
            level,
            reasoning,
            recommendations
        };
    }
    /**
     * Get complexity level from score
     */
    static getComplexityLevel(score) {
        if (score <= 2)
            return 'trivial';
        if (score <= 4)
            return 'simple';
        if (score <= 6)
            return 'moderate';
        if (score <= 8)
            return 'complex';
        return 'very-complex';
    }
    /**
     * Analyze task description to estimate factors
     */
    static estimateFromDescription(description, context) {
        const lower = description.toLowerCase();
        // Heuristic analysis
        const factors = {
            dependencies: 0,
            unknownFactors: false,
            requiresResearch: false,
            integrationPoints: 0,
            testingScope: 'unit'
        };
        // Check for research indicators
        if (lower.includes('research') || lower.includes('investigate') || lower.includes('explore')) {
            factors.requiresResearch = true;
        }
        // Check for unknown indicators
        if (lower.includes('tbd') || lower.includes('unknown') || lower.includes('determine')) {
            factors.unknownFactors = true;
        }
        // Check for integration indicators
        const integrationKeywords = ['integrate', 'api', 'external', 'third-party', 'service', 'database'];
        factors.integrationPoints = integrationKeywords.filter(kw => lower.includes(kw)).length;
        // Check for testing scope
        if (lower.includes('e2e') || lower.includes('end-to-end')) {
            factors.testingScope = 'e2e';
        }
        else if (lower.includes('integration')) {
            factors.testingScope = 'integration';
        }
        // Check for PHI
        if (context?.PHI_HANDLING || lower.includes('phi') || lower.includes('patient')) {
            factors.phiHandling = true;
        }
        return factors;
    }
    /**
     * Get emoji for complexity level
     */
    static getComplexityEmoji(level) {
        switch (level) {
            case 'trivial': return '🟢';
            case 'simple': return '🟡';
            case 'moderate': return '🟠';
            case 'complex': return '🔴';
            case 'very-complex': return '🟣';
        }
    }
}
//# sourceMappingURL=complexity-analyzer.js.map