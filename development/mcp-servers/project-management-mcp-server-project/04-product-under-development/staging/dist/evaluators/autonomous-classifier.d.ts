/**
 * Autonomous Classifier
 *
 * Classifies goals for confidence-based autonomy using the Autonomous Deployment Framework.
 * Maps issues to base types (broken/missing/improvement) and calculates confidence scores.
 */
export interface AutonomousClassification {
    baseType: 'broken' | 'missing' | 'improvement';
    issueType: string;
    confidence: number;
    autonomyLevel: 'autonomous' | 'assisted' | 'manual';
    autonomousEligible: boolean;
    recommendedAction: string;
    reasoning: string;
    classificationReasoning: string;
    autonomousThreshold: number;
    assistedThreshold: number;
    safetyChecks?: {
        isPhiRelated: boolean;
        isSecurityRelated: boolean;
        isFirstTime: boolean;
    };
}
export declare class AutonomousClassifier {
    private workspacePath;
    constructor(workspacePath: string);
    /**
     * Classify a goal for autonomous deployment confidence
     *
     * Base types:
     * - broken: Component exists but not working (fix) - can achieve 0.90+ confidence
     * - missing: Capability doesn't exist (build) - max 0.85 confidence, needs human input
     * - improvement: Works but could be better (enhance) - variable confidence
     */
    classify(goalDescription: string, context?: {
        component?: string;
        symptom?: string;
    }): Promise<AutonomousClassification>;
    private detectPHI;
    private detectSecurity;
    private buildReasoning;
}
//# sourceMappingURL=autonomous-classifier.d.ts.map