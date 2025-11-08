/**
 * Autonomous Classifier
 *
 * Classifies goals for confidence-based autonomy using the Autonomous Deployment Framework.
 * Maps issues to base types (broken/missing/improvement) and calculates confidence scores.
 */
export class AutonomousClassifier {
    workspacePath;
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
    }
    /**
     * Classify a goal for autonomous deployment confidence
     *
     * Base types:
     * - broken: Component exists but not working (fix) - can achieve 0.90+ confidence
     * - missing: Capability doesn't exist (build) - max 0.85 confidence, needs human input
     * - improvement: Works but could be better (enhance) - variable confidence
     */
    async classify(goalDescription, context) {
        const description = goalDescription.toLowerCase();
        const symptom = (context?.symptom || '').toLowerCase();
        // Detect base type from keywords
        let baseType;
        let initialConfidence;
        // Broken (Fix) - errors, failures, not working
        const brokenKeywords = ['fix', 'error', 'broken', 'not working', 'fails', 'crash', 'bug'];
        const isBroken = brokenKeywords.some(kw => description.includes(kw) || symptom.includes(kw));
        // Missing (Build) - create, add, implement
        const missingKeywords = ['create', 'add', 'implement', 'build', 'new'];
        const isMissing = missingKeywords.some(kw => description.includes(kw));
        // Improvement (Enhance) - optimize, improve, better
        const improvementKeywords = ['optimize', 'improve', 'enhance', 'better', 'refactor'];
        const isImprovement = improvementKeywords.some(kw => description.includes(kw));
        if (isBroken) {
            baseType = 'broken';
            initialConfidence = 0.75; // Can go higher with resolution history
        }
        else if (isMissing) {
            baseType = 'missing';
            initialConfidence = 0.60; // Max 0.85, always needs human input
        }
        else if (isImprovement) {
            baseType = 'improvement';
            initialConfidence = 0.65; // Variable based on scope
        }
        else {
            // Default to missing if unclear
            baseType = 'missing';
            initialConfidence = 0.50;
        }
        // Safety checks that reduce confidence
        const safetyChecks = {
            isPhiRelated: this.detectPHI(description, symptom),
            isSecurityRelated: this.detectSecurity(description, symptom),
            isFirstTime: true // Assume first time without resolution history
        };
        // Apply safety multipliers
        let confidence = initialConfidence;
        if (safetyChecks.isSecurityRelated) {
            confidence *= 0.8;
        }
        if (safetyChecks.isPhiRelated) {
            confidence *= 0.7;
        }
        // Determine autonomy level
        const autonomousThreshold = 0.90;
        const assistedThreshold = 0.70;
        let autonomyLevel;
        if (confidence >= autonomousThreshold) {
            autonomyLevel = 'autonomous';
        }
        else if (confidence >= assistedThreshold) {
            autonomyLevel = 'assisted';
        }
        else {
            autonomyLevel = 'manual';
        }
        // Determine issue type and recommended action
        const issueType = baseType === 'broken' ? 'configuration' :
            baseType === 'missing' ? 'infrastructure' :
                'performance';
        const recommendedAction = baseType === 'broken' ? 'Fix and validate' :
            baseType === 'missing' ? 'Design, build, and test' :
                'Analyze, optimize, and benchmark';
        const reasoning = this.buildReasoning(baseType, confidence, autonomyLevel, safetyChecks);
        const classificationReasoning = `Classified as "${baseType}" (${issueType}) because: ${baseType === 'broken' ? 'detected error/failure keywords' :
            baseType === 'missing' ? 'detected creation/addition keywords' :
                'detected optimization/improvement keywords'}`;
        return {
            baseType,
            issueType,
            confidence: Math.round(confidence * 100) / 100,
            autonomyLevel,
            autonomousEligible: autonomyLevel === 'autonomous',
            recommendedAction,
            reasoning,
            classificationReasoning,
            autonomousThreshold,
            assistedThreshold,
            safetyChecks
        };
    }
    detectPHI(description, symptom) {
        const phiKeywords = ['patient', 'phi', 'hipaa', 'medical', 'health'];
        return phiKeywords.some(kw => description.includes(kw) || symptom.includes(kw));
    }
    detectSecurity(description, symptom) {
        const securityKeywords = ['security', 'credential', 'password', 'auth', 'token'];
        return securityKeywords.some(kw => description.includes(kw) || symptom.includes(kw));
    }
    buildReasoning(baseType, confidence, autonomyLevel, safetyChecks) {
        let reasoning = `Classified as "${baseType}" with ${(confidence * 100).toFixed(0)}% confidence. `;
        reasoning += `Autonomy level: ${autonomyLevel}. `;
        if (safetyChecks.isPhiRelated) {
            reasoning += 'PHI-related (confidence reduced). ';
        }
        if (safetyChecks.isSecurityRelated) {
            reasoning += 'Security-related (confidence reduced). ';
        }
        if (safetyChecks.isFirstTime) {
            reasoning += 'First-time pattern (requires approval). ';
        }
        if (autonomyLevel === 'autonomous') {
            reasoning += 'Can deploy without approval.';
        }
        else if (autonomyLevel === 'assisted') {
            reasoning += 'AI suggests, human approves.';
        }
        else {
            reasoning += 'Human-led with AI support.';
        }
        return reasoning;
    }
}
//# sourceMappingURL=autonomous-classifier.js.map